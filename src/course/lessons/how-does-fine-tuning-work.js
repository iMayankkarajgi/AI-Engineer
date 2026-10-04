export default {
  id: 'how-does-fine-tuning-work',
  minutes: 18,
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
