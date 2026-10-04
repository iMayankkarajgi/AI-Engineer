export default {
  id: 'how-does-fine-tuning-work',
  minutes: 23,
  hook: 'A model that has read half the internet still does not know how your support team answers a refund question, so how do we teach it that without starting from scratch?',
  summary: 'Fine-tuning takes a model that is already trained (pretrained) and continues training it on a small, focused dataset so it behaves the way our task needs. We reuse everything the model already knows and only nudge its weights. We can nudge all weights (full fine-tuning) or train a tiny add-on such as LoRA, which is far cheaper.',
  sections: [
    {
      id: 'what-is-fine-tuning',
      title: 'What is fine-tuning?',
      blocks: [
        { type: 'p', text: 'A **model** is a big function with millions or billions of adjustable numbers called **weights** (or parameters). **Training** means adjusting those weights so the model’s outputs match examples. **Pretraining** is the first, huge training run: a large language model (LLM) reads trillions of tokens of general text and learns grammar, facts, and reasoning patterns. The result is a **base model** or **pretrained model**.' },
        { type: 'p', text: '**Fine-tuning** is a second, much smaller training run that *starts from the pretrained weights* and continues training on a dataset for one job. Instead of learning language from zero, the model only has to learn the difference between what it already does and what we want.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like hiring an experienced chef', text: 'We do not teach a trained chef how to hold a knife. We hand them our restaurant’s recipe book and let them cook our menu for a week. Their general skill stays; they pick up our specific dishes and house style. Pretraining is culinary school; fine-tuning is the first week at our restaurant.' },
        { type: 'p', text: 'Our running example in this lesson: a **support chatbot for a bike-rental shop**. A general LLM can chat, but it does not know our refund rules, our friendly-but-short tone, or that it must always end with a booking link. We will fine-tune it on a few thousand past support conversations written the way we like.' },
      ],
    },
    {
      id: 'why-fine-tune',
      title: 'Why do we need fine-tuning?',
      blocks: [
        { type: 'p', text: 'Pretrained models are generalists. They are good at many things and perfect at none of ours. There are three cheaper tools we should try first, and fine-tuning is for what they cannot fix:' },
        { type: 'list', items: [
          '**Prompting** (writing clear instructions and examples in the input) changes behaviour for one request but costs tokens every time and can be ignored by the model.',
          '**RAG** (retrieval-augmented generation: fetching documents and pasting them into the prompt) gives the model fresh *facts*, but does not change its *style* or skills.',
          '**Fine-tuning** changes the weights, so the new behaviour is built in: a consistent format, tone, domain vocabulary, or a narrow skill like classifying tickets.',
        ] },
        { type: 'p', text: 'Typical wins from fine-tuning: shorter prompts (the instructions are “baked in”), more reliable output format (for example always valid JSON), better accuracy on a narrow task, and the chance to replace a big expensive model with a smaller fine-tuned one that is just as good *on our task*.' },
        { type: 'check', question: 'Our shop changes its prices every month. Should we fine-tune the prices into the model?', answer: 'No. Prices are fast-changing facts. Fine-tuned knowledge is frozen in the weights and goes stale; we would need to retrain monthly. Put prices in a database and fetch them with RAG or a tool call. Fine-tune for stable things like tone, format, and how to handle a refund conversation.' },
      ],
    },
    {
      id: 'step-by-step',
      title: 'How fine-tuning works, step by step',
      blocks: [
        { type: 'p', text: 'Fine-tuning uses the same machinery as ordinary training: a **loss function** (a number that measures how wrong the model is), **gradients** (for each weight, the direction that reduces the loss), and an **optimizer** (the rule that moves the weights, usually Adam or AdamW). The differences are where we start and how gently we move.' },
        { type: 'steps', title: 'One fine-tuning run', items: [
          { title: 'Pick a base model', text: 'Choose a pretrained model whose size and licence fit our budget. For chat tasks we usually start from an instruction-tuned variant, not the raw base model.' },
          { title: 'Build the dataset', text: 'Collect input → ideal-output pairs, e.g. a customer message → the reply our best agent would write. Format them with the model’s chat template. Split off a validation set the model never trains on.' },
          { title: 'Load the pretrained weights', text: 'Training starts from these weights, not from random numbers. This is the whole point: we inherit the model’s knowledge.' },
          { title: 'Forward pass and loss', text: 'Feed a batch of examples, let the model predict the next token of the ideal reply, and compute cross-entropy loss. Usually the loss is computed only on the reply tokens, not on the prompt.' },
          { title: 'Backward pass and small update', text: 'Compute gradients and update weights with a small learning rate (often 10–100× smaller than in pretraining) so we adjust rather than overwrite.' },
          { title: 'Evaluate and stop early', text: 'After each epoch (one pass over the data), check validation loss and some real conversations. Stop when validation stops improving; usually 1–3 epochs.' },
        ] },
        { type: 'flow', title: 'The fine-tuning loop', loop: true, nodes: [
          { label: 'Batch of examples', detail: 'A few customer messages paired with the ideal replies.' },
          { label: 'Forward pass', detail: 'The model, starting from pretrained weights, predicts the reply token by token.' },
          { label: 'Loss', detail: 'Cross-entropy: how surprised the model was by each correct token.' },
          { label: 'Gradients', detail: 'Backpropagation computes ∂Loss/∂w for every trainable weight.' },
          { label: 'Small update', detail: 'w ← w − η · gradient, with a small learning rate η so we do not erase old knowledge.' },
        ] },
        { type: 'viz', name: 'gradient-descent', caption: 'Each update is one step downhill on the loss. Try a large learning rate: in fine-tuning, overshooting is how a model “forgets” what it knew.' },
      ],
    },
    {
      id: 'worked-example',
      title: 'A simple worked example with numbers',
      blocks: [
        { type: 'p', text: 'Let us shrink the idea to one weight so we can follow the arithmetic. Suppose a pretrained model has a weight `w = 2.0` and, for an input `x = 1`, predicts `ŷ = w · x = 2.0`. Our task wants the answer `y = 3.0`.' },
        { type: 'list', ordered: true, items: [
          'Loss (squared error): `L = (ŷ − y)² = (2.0 − 3.0)² = 1.0`.',
          'Gradient: `∂L/∂w = 2 · (ŷ − y) · x = 2 · (−1.0) · 1 = −2.0`. Negative means “increase w”.',
          'Update with learning rate `η = 0.1`: `w ← 2.0 − 0.1 · (−2.0) = 2.2`.',
          'New prediction `2.2`, new loss `(2.2 − 3.0)² = 0.64`. Lower than 1.0, so we moved the right way.',
        ] },
        { type: 'p', text: 'A real LLM does exactly this for billions of weights at once. Below is a slightly bigger, runnable version: a tiny “pretrained” classifier (a 4×3 weight matrix) adapted to a new task with only 60 examples. Notice it already starts at decent accuracy, because the pretrained weights are close to what the task needs.' },
        { type: 'code', lang: 'python', title: 'fine_tune_tiny.py', code: `import numpy as np
rng = np.random.default_rng(0)

# "Pretrained" model: a linear layer that already knows a general task
W_pre = rng.normal(size=(4, 3))            # 4 input features -> 3 classes

# Small task-specific dataset: 60 labelled examples for OUR task
X = rng.normal(size=(60, 4))
W_task = W_pre + rng.normal(scale=0.8, size=(4, 3))   # the task differs a bit
y = (X @ W_task).argmax(axis=1)

def softmax(z):
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

def loss_acc(W):
    p = softmax(X @ W)
    loss = -np.log(p[np.arange(len(y)), y]).mean()   # cross-entropy
    return loss, (p.argmax(axis=1) == y).mean()

W = W_pre.copy()                          # start FROM the pretrained weights
lr = 0.5                                  # small steps, few epochs
for epoch in range(31):
    p = softmax(X @ W)
    p[np.arange(len(y)), y] -= 1           # dLoss/dlogits for cross-entropy
    W -= lr * X.T @ p / len(y)             # gradient step on every weight
    if epoch % 10 == 0:
        l, a = loss_acc(W)
        print(f"epoch {epoch:2d}  loss {l:.3f}  accuracy {a:.0%}")

print("weights moved by", round(float(np.abs(W - W_pre).mean()), 3), "on average")`, output: `epoch  0  loss 0.513  accuracy 85%
epoch 10  loss 0.370  accuracy 92%
epoch 20  loss 0.310  accuracy 95%
epoch 30  loss 0.274  accuracy 97%
weights moved by 0.459 on average`, walkthrough: [
          { lines: [4, 5], note: 'Pretend these weights came from pretraining. In an LLM this would be billions of numbers loaded from a checkpoint.' },
          { lines: [7, 10], note: 'Our small task dataset. The “true” task is close to, but not the same as, what the pretrained model does, which is the typical fine-tuning situation.' },
          { lines: [12, 20], note: 'Softmax turns scores into probabilities; cross-entropy loss and accuracy measure how well the model fits our task.' },
          { lines: [22, 23], note: 'The key line of fine-tuning: copy the pretrained weights as the starting point instead of random initialisation.' },
          { lines: [24, 30], note: 'Ordinary gradient descent. Every weight is trainable here, so this is full fine-tuning in miniature.' },
          { lines: [32, 32], note: 'The weights moved only moderately; the model was adapted, not rebuilt.' },
        ] },
        { type: 'chart', kind: 'line', title: 'Our tiny fine-tuning run', xLabel: 'Epoch', yLabel: 'Accuracy (%)', series: [ { name: 'Accuracy', points: [[0, 85], [10, 92], [20, 95], [30, 97]] } ], caption: 'Values from the code output above. The model starts high because it inherits pretrained knowledge.' },
      ],
    },
    {
      id: 'full-vs-lora',
      title: 'Full fine-tuning vs LoRA',
      blocks: [
        { type: 'p', text: '**Full fine-tuning** updates every weight. That is powerful but expensive. With the Adam optimizer in mixed precision, a common rule of thumb is about **16 bytes of GPU memory per parameter** (2 for the weight, 2 for its gradient, and about 12 for the optimizer’s fp32 copy and two running averages), before counting activations. For a 7-billion-parameter model that is roughly 7 × 16 ≈ 112 GB, more than a single 80 GB GPU.' },
        { type: 'p', text: '**Parameter-efficient fine-tuning (PEFT)** freezes the original weights and trains only a small number of new ones. The most popular PEFT method is **LoRA (Low-Rank Adaptation)**: next to a frozen weight matrix `W`, it adds two thin matrices `B` and `A` and learns only those. The layer computes `W·x + B·A·x`. For a 4096 × 4096 matrix (about 16.8 million weights), rank-8 LoRA trains `2 × 4096 × 8 = 65,536` numbers, about 0.4%. The next lesson covers LoRA in depth.' },
        { type: 'compare', title: 'Full fine-tuning vs LoRA', options: [
          { name: 'Full fine-tuning', summary: 'Every weight is trainable.', pros: ['Highest ceiling when data is large and different from pretraining', 'No extra pieces at inference time'], cons: ['Needs many GPUs for big models', 'One full-size copy of the model per task', 'Higher risk of forgetting general skills'], bestFor: 'Big budgets, large datasets, deep domain shifts (e.g. a new language)' },
          { name: 'LoRA', summary: 'Base weights frozen; small low-rank adapters are trained.', pros: ['Often a fraction of the memory', 'Adapters are megabytes, so we can keep one per customer or task', 'Usually close to full fine-tuning quality on narrow tasks'], cons: ['Slightly lower ceiling on very large shifts', 'Extra hyperparameters (rank, alpha, which layers)'], bestFor: 'Most practical fine-tuning of LLMs on one or a few GPUs' },
        ], rows: [
          ['Trainable weights', '100%', 'Often under 1%'],
          ['Optimizer memory', 'For all weights', 'Only for adapters'],
          ['Saved artifact', 'Whole model (GBs)', 'Adapter (MBs)'],
          ['Forgetting risk', 'Higher', 'Lower (base frozen)'],
        ], verdict: 'Start with LoRA. Move to full fine-tuning only if LoRA plateaus and you have the data and hardware to justify it.' },
        { type: 'chart', kind: 'bar', title: 'Trainable numbers for one 4096 × 4096 weight matrix', yLabel: 'Trainable parameters', labels: ['Full', 'LoRA r=64', 'LoRA r=16', 'LoRA r=8'], series: [ { name: 'Parameters', values: [16777216, 524288, 131072, 65536] } ], caption: 'Exact counts: full = 4096², LoRA = 2 × 4096 × r.' },
      ],
    },
    {
      id: 'when-to-use',
      title: 'When to use fine-tuning (and when not to)',
      blocks: [
        { type: 'p', text: 'A simple decision order works well in practice: **prompt first, then RAG, then fine-tune**. Each step is more expensive and slower to change than the one before.' },
        { type: 'table', caption: 'What problem are we actually solving?', head: ['Symptom', 'Better tool', 'Why'], rows: [
          ['Model lacks our latest documents or prices', 'RAG', 'Facts change; retrieval stays fresh without retraining'],
          ['Model ignores our output format half the time', 'Fine-tuning', 'Format becomes a learned habit'],
          ['Tone is wrong (too long, too formal)', 'Fine-tuning (or a better prompt first)', 'Style is learned well from examples'],
          ['Big model is too slow or costly', 'Fine-tune a smaller model', 'A small specialist can match a big generalist on one task'],
          ['Task is new and we have 20 examples', 'Prompting with few-shot examples', 'Too little data to fine-tune safely'],
        ] },
        { type: 'callout', tone: 'example', title: 'Real-world uses', text: 'Common fine-tuning jobs: ticket classification and routing, extraction of fields into strict JSON, writing in a brand voice, code completion for an internal codebase’s conventions, medical or legal summarisation styles, and distilling a big model’s behaviour into a small one for cheap serving. Hosted APIs from several vendors and open-source tools (for example Hugging Face `transformers` with `peft`) offer fine-tuning; exact options vary by vendor.' },
      ],
    },
    {
      id: 'tips',
      title: 'Tips before we fine-tune',
      blocks: [
        { type: 'list', items: [
          '**Quality beats quantity.** A few hundred to a few thousand clean, consistent examples often beat a large noisy set. Every bad example teaches a bad habit.',
          '**Match the real inputs.** Training data should look like what users will actually send, including typos and short questions.',
          '**Use a validation set and a baseline.** Measure the base model with a good prompt first, so we know whether fine-tuning really helped.',
          '**Keep the learning rate small and epochs few.** Too much training memorises the dataset (overfitting) and erodes general skills.',
          '**Use the model’s chat template.** Formatting mismatches between training and serving quietly hurt quality.',
          '**Test general skills afterwards.** Check that the model still handles off-topic but reasonable questions politely.',
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistake: catastrophic forgetting', text: 'Training too long or with a high learning rate can make the model great at our task and noticeably worse at everything else. This is called catastrophic forgetting. Remedies: fewer epochs, lower learning rate, LoRA instead of full updates, and mixing in some general data.' },
        { type: 'check', question: 'Training loss keeps falling, but validation loss started rising after epoch 2. What is happening and what should we do?', answer: 'The model is overfitting: memorising the training examples instead of learning the general pattern. Stop at the epoch with the best validation loss (early stopping), add more varied data, or lower the learning rate.' },
      ],
    },
    {
      id: 'spotting-mistakes',
      title: 'Common mistakes and how to spot them',
      blocks: [
        { type: 'p', text: 'A fine-tuning run rarely fails with an error message. It fails quietly, and the loss curves and a few sample outputs are our only clues. Before we read the curves, it helps to know how long the run really is. Take our bike-rental bot with **1,000 training examples**, a **batch size of 8** and **3 epochs** (illustrative numbers).' },
        { type: 'steps', title: 'Sizing the run with small numbers', items: [
          { title: 'Steps per epoch', text: 'One epoch shows every example once. 1,000 examples ÷ 8 per batch = **125 update steps** per epoch.' },
          { title: 'Total steps', text: '3 epochs × 125 = **375 updates**. That is all the “learning” there is. If the learning rate is too small, 375 tiny nudges may change almost nothing.' },
          { title: 'Hold some data back', text: 'We keep 100 of the 1,000 examples as a validation set and never train on them. Now an epoch is 900 ÷ 8 ≈ 113 steps, and we have an honest number to watch.' },
          { title: 'Decide when to look', text: 'We measure validation loss every 50 steps. That gives about 7 checkpoints, enough to see a trend and to pick the best one.' },
        ] },
        { type: 'p', text: 'With that picture in mind, each failure has a recognisable shape:' },
        { type: 'table', caption: 'Reading a fine-tuning run', head: ['What we see', 'Likely cause', 'What to try'], rows: [
          ['Training loss barely moves from step 1', 'Learning rate too small, or the weights we meant to train are frozen', 'Count the trainable parameters; raise the learning rate in small jumps'],
          ['Loss jumps up or becomes `nan`', 'Learning rate too large, so updates overshoot', 'Lower the learning rate; add a short warm-up'],
          ['Training loss near zero after a few steps', 'The same examples repeat, or the answer leaks into the input', 'Remove duplicates; print one formatted example and read it'],
          ['Validation looks great, real users see poor answers', 'Validation data is too similar to training data and unlike real traffic', 'Build the validation set from real, recent user messages'],
          ['Task answers improve, everyday answers get worse', 'Too many steps or too large a learning rate', 'Use an earlier checkpoint; keep a small general test set'],
        ] },
        { type: 'p', text: 'One habit catches most of these early: before the full run, train on just **10 examples** for a few dozen steps. The loss should fall close to zero. If it does not, something in the data format or the training setup is broken, and no amount of extra data will fix it.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will fine-tune the smallest possible “model”: two weights. It starts out perfect at a general skill, and we fine-tune it on 20 examples of a slightly different task. We watch two numbers at once: the loss on our task, and the loss on the old general skill.' },
        { type: 'code', lang: 'python', title: 'practice_fine_tuning.py', code: `import numpy as np
rng = np.random.default_rng(0)

# General skill: y = 2*x1 + 1*x2. The "pretrained" weights already solve it.
X_gen = rng.normal(size=(200, 2))
y_gen = X_gen @ np.array([2.0, 1.0])
w_pre = np.array([2.0, 1.0])

# Our small task: only 20 examples, and its rule is a bit different.
X_task = rng.normal(size=(20, 2))
y_task = X_task @ np.array([2.0, 3.0])

def mse(w, X, y):
    return float(np.mean((X @ w - y) ** 2))

def fine_tune(lr, steps):
    w = w_pre.copy()                      # start from the pretrained weights
    for _ in range(steps):
        grad = 2 * X_task.T @ (X_task @ w - y_task) / len(y_task)
        w -= lr * grad                    # one small nudge toward the task
    return w

print("setting              task loss  general loss")
print(f"no fine-tuning       {mse(w_pre, X_task, y_task):9.3g}  {mse(w_pre, X_gen, y_gen):12.3g}")
for lr, steps in [(0.01, 20), (0.1, 5), (0.1, 100), (1.2, 20)]:
    w = fine_tune(lr, steps)
    name = f"lr={lr} steps={steps}"
    print(f"{name:<20} {mse(w, X_task, y_task):9.3g}  {mse(w, X_gen, y_gen):12.3g}")`, output: `setting              task loss  general loss
no fine-tuning            5.02             0
lr=0.01 steps=20          1.55         0.658
lr=0.1 steps=5           0.361          2.08
lr=0.1 steps=100      8.34e-12          4.06
lr=1.2 steps=20       2.84e+22      1.42e+22`,
          walkthrough: [
            { lines: [4, 7], note: 'The general skill and the “pretrained” weights that already solve it, so the general loss starts at 0.' },
            { lines: [9, 11], note: 'Our small task: 20 examples whose rule differs in the second weight (3 instead of 1).' },
            { lines: [16, 21], note: 'Fine-tuning: start from the pretrained weights and take small gradient steps on the task data only.' },
            { lines: [23, 28], note: 'Try four settings. The last one uses a learning rate that is far too large, and the loss explodes.' },
          ] },
        { type: 'p', text: 'Read the table top to bottom. The more we fit the task, the more the general loss grows. That is forgetting, in two weights.' },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Change the task rule on line 11 from `[2.0, 3.0]` to `[2.0, 1.2]`, much closer to the pretrained weights. Predict first: will the general loss after 100 steps be higher or lower than 4.06?',
          'Add the setting `(0.5, 20)` to the list on line 25. Predict: does it converge like `lr=0.1`, or blow up like `lr=1.2`?',
          'Freeze the first weight by adding `grad[0] = 0` after line 19. Predict: can the task loss still reach zero, and why does this particular task allow it?',
        ] },
        { type: 'check', question: 'In the output, `lr=0.1 steps=100` has the best task loss and the worst general loss among the runs that did not blow up. If our bot must also keep its general skills, which row would we ship, and what extra data would help us decide?', answer: 'Probably `lr=0.1 steps=5` or a point near it: it removes most of the task loss (5.02 → 0.361) while roughly halving the damage to the general skill (2.08 instead of 4.06). To decide properly we need a validation set for the task *and* a small general test set, and we pick the checkpoint with the best balance. Training loss alone would always tell us to train longer.' },
        { type: 'check', question: 'The `lr=1.2` run ends with a huge loss on both tasks. A teammate suggests training for more steps to recover. Will that work?', answer: 'No. Each step overshoots the minimum by more than the previous one, so the weights move further away every time. More steps make it worse. The fix is a smaller learning rate, restarted from the pretrained weights, because the current weights are already ruined.' },
      ],
    },
    {
      id: 'summary',
      title: 'Summary',
      blocks: [
        { type: 'p', text: 'Fine-tuning is continued training from pretrained weights on a small, task-specific dataset. It changes *behaviour* (format, tone, narrow skills) reliably, while RAG is the better tool for changing *facts*. Full fine-tuning updates everything and costs the most; LoRA and other PEFT methods freeze the base and train a tiny add-on, which is how most teams fine-tune LLMs today. The craft is mostly in the data: clean examples, a held-out validation set, a small learning rate, and a check that general skills survive.' },
      ],
    },
  ],
  quiz: [
    { q: 'What makes fine-tuning different from training a model from scratch?', options: ['It uses a special loss function designed for small datasets', 'It starts from pretrained weights and keeps training on task data', 'It leaves the weights unchanged and learns a better prompt instead', 'It must retrain only the final layer, with every other layer frozen'], answer: 1, explain: 'Fine-tuning reuses pretrained weights as the starting point. It uses ordinary losses like cross-entropy, it does change weights (unlike prompting), and it can update all layers or adapters, not only the last layer.' },
    { q: 'Our support bot gives correct answers but keeps writing long, formal paragraphs, and our prompt instructions do not fix it. Which tool fits best?', options: ['RAG over our help-centre articles so answers follow their wording', 'Raising the temperature so replies sound more casual and varied', 'Fine-tuning on examples written in our short, friendly style', 'Pretraining a new model from scratch on our website’s text'], answer: 2, explain: 'Style and format are behaviours, which fine-tuning teaches well. RAG adds facts, not style; temperature changes randomness; pretraining from scratch is wildly more expensive than needed.' },
    { q: 'In the one-weight example, w = 2.0, x = 1, target y = 3.0, loss (ŷ − y)², learning rate 0.1. What is w after one gradient step?', options: ['1.8', '2.1', '2.2', '3.0'], answer: 2, explain: 'Gradient = 2·(2.0 − 3.0)·1 = −2.0, so w ← 2.0 − 0.1·(−2.0) = 2.2. 1.8 is what you get if you add instead of subtract the step.' },
    { q: 'Which statement correctly compares full fine-tuning and LoRA?', options: ['LoRA freezes base weights and trains small low-rank matrices, cutting optimizer memory', 'LoRA trains every weight but in lower precision, which is where its memory savings come from', 'Full fine-tuning saves only a small adapter file, while LoRA must save the whole model', 'They use the same training memory; LoRA’s only benefit is faster inference afterwards'], answer: 0, explain: 'LoRA freezes W and learns B and A. Optimizer state is needed only for those few parameters, and the saved artifact is a small adapter. The other options reverse or misstate the trade-off.' },
    { q: 'A teammate says: "Fine-tuning is the best way to keep the bot updated with this month’s prices." What is wrong with this?', options: ['Nothing; fine-tuning is the standard, cheapest way to keep fresh facts in the model', 'Facts baked into weights go stale; changing prices are better fetched at query time via RAG', 'Fine-tuning cannot change any facts at all; it only adjusts the tokenizer and vocabulary', 'Prices are numbers, and LLMs cannot be fine-tuned on numeric data of any kind'], answer: 1, explain: 'Fine-tuning bakes information into weights, which goes stale and requires retraining. Retrieval keeps facts fresh. Fine-tuning can influence facts, so “cannot change any facts” overstates it.' },
  ],
  takeaways: [
    'Fine-tuning continues training from pretrained weights on a small task dataset.',
    'Use it to change behaviour (format, tone, narrow skills); use RAG for fresh facts.',
    'Small learning rate, few epochs and a validation set prevent overfitting and forgetting.',
    'Full fine-tuning updates everything and is costly; LoRA trains under ~1% of weights.',
    'Try prompting first, then RAG, then fine-tuning.',
  ],
  terms: [
    { term: 'Pretrained model', def: 'A model already trained on a large general dataset, used as the starting point.' },
    { term: 'Fine-tuning', def: 'Continued training of a pretrained model on a smaller, task-specific dataset.' },
    { term: 'Epoch', def: 'One full pass over the training dataset.' },
    { term: 'Learning rate', def: 'How big each weight update step is; kept small during fine-tuning.' },
    { term: 'PEFT', def: 'Parameter-efficient fine-tuning: freezing the base model and training a small number of new weights.' },
    { term: 'Catastrophic forgetting', def: 'Losing previously learned skills when training on new data.' },
    { term: 'Overfitting', def: 'Memorising training examples so performance on new data gets worse.' },
  ],
};
