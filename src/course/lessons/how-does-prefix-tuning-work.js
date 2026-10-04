export default {
  id: 'how-does-prefix-tuning-work',
  minutes: 19,
  hook: 'Can we teach a frozen language model a new task by training nothing but a handful of invisible “words” placed in front of every input?',
  summary: 'Prefix tuning keeps every weight of a pretrained model frozen and learns a short sequence of continuous vectors, the prefix, that is prepended to the keys and values at every attention layer. Real tokens attend to this prefix, which steers the model toward the task. Only around 0.1% of the parameters are trained, and one model can serve many tasks by swapping prefixes.',
  sections: [
    {
      id: 'what-is-an-llm',
      title: 'What is a large language model? (a quick refresher)',
      blocks: [
        { type: 'p', text: 'A **large language model (LLM)** is a neural network trained to predict the next **token** (a word or word piece) given the tokens before it. Most modern LLMs are **Transformers**: a stack of identical layers, each containing **self-attention** and a feed-forward network.' },
        { type: 'p', text: 'Inside self-attention, every token produces three vectors: a **query** (what am I looking for?), a **key** (what do I offer?), and a **value** (the information I pass on). A token compares its query with all keys, turns the scores into weights with softmax, and takes a weighted sum of the values. Prefix tuning works by adding extra keys and values to this mechanism, so keep that picture in mind.' },
        { type: 'viz', name: 'attention-heatmap', caption: 'Click a token to see where it attends. Prefix tuning adds extra, learned columns to the left of this map that every token can attend to.' },
      ],
    },
    {
      id: 'the-problem',
      title: 'The problem: why full fine-tuning is expensive',
      blocks: [
        { type: 'p', text: 'Full fine-tuning updates every weight. For each task we pay for gradients and optimizer state on all parameters during training, and we store a complete new copy of the model afterwards. If our company wants ten tasks (summarise tickets, write product descriptions, convert tables to text...), that is ten full models.' },
        { type: 'p', text: 'Running example for this lesson: our bike-rental shop wants a model that turns a structured booking record such as `bike: e-bike | days: 3 | pickup: Station B` into a friendly confirmation sentence. This is a classic **table-to-text** task, the kind prefix tuning was first tested on.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like briefing a translator', text: 'We do not retrain an expert translator for every client. We hand them a short brief before each job: “legal tone, British spelling, short sentences”. The expert is unchanged; the brief steers them. Prefix tuning learns the ideal brief, except the brief is written in numbers the model understands directly, not in words.' },
      ],
    },
    {
      id: 'what-is-prefix-tuning',
      title: 'What is prefix tuning?',
      blocks: [
        { type: 'p', text: '**Prefix tuning** was introduced by Xiang Lisa Li and Percy Liang in 2021. It freezes all model weights and learns a short, task-specific sequence of vectors that is placed *before* the real input at every layer. The name splits nicely:' },
        { type: 'list', items: [
          '**Prefix**: a few extra positions in front of the input sequence, like a preface before a book.',
          '**Tuning**: those positions hold trainable numbers, adjusted with gradient descent while the model stays fixed.',
        ] },
        { type: 'p', text: 'The model then generates as usual. Because every real token can attend to the prefix positions, the prefix acts like a hidden instruction that shapes every layer’s computation.' },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How prefix tuning works',
      blocks: [
        { type: 'steps', title: 'From frozen model to task-specific behaviour', items: [
          { title: 'Freeze the model', text: 'All pretrained weights are locked. No gradients are stored for them.' },
          { title: 'Create the prefix', text: 'For each layer, create L trainable key vectors and L trainable value vectors (L is the prefix length, e.g. 10 or 20).' },
          { title: 'Prepend to attention', text: 'At every layer, the prefix keys and values are placed before the keys and values computed from real tokens.' },
          { title: 'Real tokens attend to the prefix', text: 'Each real token’s query scores the prefix keys too, so part of its output comes from the prefix values.' },
          { title: 'Train on task data', text: 'Compute the normal next-token loss on the target text and backpropagate. Gradients flow through the frozen model into the prefix only.' },
          { title: 'Save and swap', text: 'Store the prefix per task. At serving time, load the prefix for the task the request needs.' },
        ] },
        { type: 'flow', title: 'One attention layer with a prefix', nodes: [
          { label: 'Prefix K, V', detail: 'L learned key and value vectors for this layer. Not produced by any token; they are free parameters.' },
          { label: 'Token K, V', detail: 'Keys and values computed by the frozen layer from the real input tokens.' },
          { label: 'Concatenate', detail: 'Keys become [prefix keys; token keys], values become [prefix values; token values].' },
          { label: 'Attention', detail: 'softmax(q·Kᵀ / √d) over all positions; weight that lands on the prefix pulls in prefix values.' },
          { label: 'Output', detail: 'A steered hidden state passed to the next layer, which has its own prefix.' },
        ] },
        { type: 'formula', expr: 'head = softmax( q · [P_k ; K]ᵀ / √d ) · [P_v ; V]', where: [
          ['q', 'query of the current real token'],
          ['K, V', 'keys and values from real tokens (frozen computation)'],
          ['P_k, P_v', 'trainable prefix keys and values for this layer'],
          ['[ ; ]', 'stacking the prefix rows on top of the token rows'],
        ], caption: 'The only change to attention: extra rows in front.' },
      ],
    },
    {
      id: 'not-real-words',
      title: 'The prefix is not real words',
      blocks: [
        { type: 'p', text: 'A natural question: why not just write a good instruction in text? That is **prompt engineering**, and the words must come from the vocabulary. Each word maps to a fixed embedding, so we can only choose among existing points in embedding space.' },
        { type: 'p', text: 'Prefix vectors are **continuous**: any numbers are allowed, so they can sit between or far away from real word embeddings. This is why the prefix is sometimes called a **soft prompt** (as opposed to a hard prompt of real tokens). It is far more expressive than any sequence of words, but it is also not human-readable. If we look up the nearest real words to a learned prefix vector, the result is usually meaningless.' },
        { type: 'check', question: 'Could we print a trained prefix as a sentence and paste it into ChatGPT-style prompts to get the same effect?', answer: 'No. The prefix is a set of continuous vectors (and, in prefix tuning, per-layer keys and values) that do not correspond to tokens. It only works inside the exact model it was trained with, injected at the activation level.' },
      ],
    },
    {
      id: 'where-and-how-trained',
      title: 'Where the prefix is added and how it is trained',
      blocks: [
        { type: 'p', text: '**Where:** in prefix tuning the prefix is added at *every* Transformer layer, as extra key and value activations. This is the key difference from prompt tuning (below), which adds vectors only at the input embedding layer. Deeper placement gives the prefix direct influence on every layer’s attention. For decoder-only models like GPT-2 the prefix goes before the input; for encoder-decoder models like BART the authors added prefixes to both the encoder and decoder.' },
        { type: 'p', text: '**How:** training is ordinary supervised learning. Feed the booking record, compute the cross-entropy loss on the target sentence, backpropagate. Gradients pass through the frozen layers and stop at the prefix, which is the only thing updated.' },
        { type: 'deeper', title: 'The reparameterisation trick', blocks: [
          { type: 'p', text: 'Li and Liang reported that optimising the prefix vectors directly was unstable and sensitive to learning rate. Their fix: learn a smaller matrix P′ and produce the prefix through a small feed-forward network, P = MLP(P′). After training, they compute P once and throw the MLP away, so only the prefix is stored. Libraries such as Hugging Face PEFT expose this as a `prefix_projection` option.' },
          { type: 'p', text: 'They also found initialising the prefix from the activations of real words (for example task-related words) helped, especially when data was small.' },
        ] },
        { type: 'p', text: 'Below is a self-contained numpy demo of one attention layer. The real tokens’ keys and values are frozen. We train only two prefix positions to steer the layer’s output toward a target vector. We use finite differences for gradients so the code stays short.' },
        { type: 'code', lang: 'python', title: 'prefix_attention.py', code: `import numpy as np
rng = np.random.default_rng(7)
d, n_tok, n_prefix = 8, 5, 2

# Frozen keys/values computed from the real input tokens (one attention layer)
K = rng.normal(size=(n_tok, d))
V = rng.normal(size=(n_tok, d))
q = rng.normal(size=d)                     # query of the token being generated
target = np.ones(d)                        # output we want the layer to move toward

# Trainable prefix: 2 virtual key/value vectors (not real words)
P_k = rng.normal(scale=0.1, size=(n_prefix, d))
P_v = rng.normal(scale=0.1, size=(n_prefix, d))

def attend(P_k, P_v):
    keys, vals = np.vstack([P_k, K]), np.vstack([P_v, V])   # prefix goes first
    s = keys @ q / np.sqrt(d)
    w = np.exp(s - s.max()); w /= w.sum()
    return w @ vals, w

out, w = attend(P_k, P_v)
print(f"before: weight on prefix {w[:n_prefix].sum():.3f}  "
      f"distance to target {np.linalg.norm(out - target):.3f}")

lr, eps = 0.5, 1e-5
for step in range(200):                    # gradient by finite differences
    for P in (P_k, P_v):
        g = np.zeros_like(P)
        for idx in np.ndindex(P.shape):
            P[idx] += eps; up = np.linalg.norm(attend(P_k, P_v)[0] - target)
            P[idx] -= 2 * eps; dn = np.linalg.norm(attend(P_k, P_v)[0] - target)
            P[idx] += eps; g[idx] = (up - dn) / (2 * eps)
        P -= lr * g                        # only the prefix changes

out, w = attend(P_k, P_v)
print(f"after:  weight on prefix {w[:n_prefix].sum():.3f}  "
      f"distance to target {np.linalg.norm(out - target):.3f}")
print("frozen K, V unchanged; trainable numbers:", P_k.size + P_v.size)`, output: `before: weight on prefix 0.247  distance to target 2.800
after:  weight on prefix 0.560  distance to target 0.010
frozen K, V unchanged; trainable numbers: 32`, walkthrough: [
          { lines: [5, 9], note: 'The frozen part: keys and values that the pretrained layer computed from real tokens, plus the current query.' },
          { lines: [11, 13], note: 'The only trainable parameters: two prefix keys and two prefix values.' },
          { lines: [15, 19], note: 'Attention with the prefix stacked in front. Softmax spreads weight over prefix and real positions.' },
          { lines: [25, 33], note: 'Training loop. We estimate gradients numerically for each prefix number and update only P_k and P_v; K and V are never touched.' },
          { lines: [35, 38], note: 'The query now puts more weight on the prefix, and the output lands almost exactly on the target. 32 numbers steered the frozen layer.' },
        ] },
      ],
    },
    {
      id: 'how-small',
      title: 'How small is the prefix really?',
      blocks: [
        { type: 'p', text: 'Count it: each layer stores L key vectors and L value vectors of size d. So the prefix has `layers × 2 × L × d` numbers.' },
        { type: 'list', items: [
          'GPT-2 Medium (24 layers, d = 1024, about 345M parameters) with L = 10: `24 × 2 × 10 × 1024 = 491,520`, about 0.14% of the model.',
          'A 7B model with 32 layers and d = 4096, L = 20: `32 × 2 × 20 × 4096 = 5,242,880`, about 0.07%.',
        ] },
        { type: 'p', text: 'Li and Liang described their prefixes as roughly 0.1% of the model’s parameters, a 1000× reduction in per-task storage compared to saving a fine-tuned copy.' },
        { type: 'chart', kind: 'hbar', title: 'Per-task storage for a 345M-parameter model', xLabel: 'Parameters stored per task', labels: ['Full fine-tune copy', 'Prefix (L=10, 24 layers)'], series: [ { name: 'Parameters', values: [345000000, 491520] } ], caption: 'Computed from the formula above (GPT-2 Medium size, approximate total).' },
        { type: 'tabs', items: [
          { label: 'With Hugging Face PEFT', blocks: [
            { type: 'code', lang: 'python', title: 'peft_prefix.py (needs transformers + peft, not run here)', code: `from transformers import AutoModelForCausalLM
from peft import PrefixTuningConfig, get_peft_model, TaskType

model = AutoModelForCausalLM.from_pretrained("gpt2-medium")
config = PrefixTuningConfig(task_type=TaskType.CAUSAL_LM,
                            num_virtual_tokens=10)   # prefix length L
model = get_peft_model(model, config)               # base weights frozen
model.print_trainable_parameters()                  # tiny share of the total
# ...then train with a normal training loop or the Trainer`, walkthrough: [
              { lines: [4, 4], note: 'Load the frozen base model.' },
              { lines: [5, 7], note: 'Wrap it with a prefix of 10 virtual tokens per layer. PEFT handles injecting the prefix keys and values.' },
              { lines: [8, 8], note: 'Prints how many parameters are trainable versus total.' },
            ] },
          ] },
          { label: 'Plain English', blocks: [
            { type: 'p', text: 'Load the model, ask the library to add 10 virtual positions per layer and freeze everything else, then train as usual. The saved result is just the prefix.' },
          ] },
        ] },
      ],
    },
    {
      id: 'comparisons',
      title: 'Prefix tuning vs full fine-tuning vs prompt tuning',
      blocks: [
        { type: 'p', text: '**Prompt tuning** (Lester, Al-Rfou and Constant, 2021) is a simpler cousin: it learns soft vectors only at the *input embedding layer*, not at every layer. It has even fewer parameters, and its authors found it becomes competitive with full fine-tuning mainly for very large models (around 10 billion parameters and up), while lagging on smaller ones. Later work, P-Tuning v2, went back to adding prompts at every layer, essentially prefix tuning, to work well across model sizes.' },
        { type: 'compare', title: 'Three ways to adapt a frozen or unfrozen model', options: [
          { name: 'Full fine-tuning', summary: 'Update every weight.', pros: ['Highest capacity', 'No extra sequence length'], cons: ['Full model copy per task', 'Most memory'], bestFor: 'Big data, big shifts, big budget' },
          { name: 'Prefix tuning', summary: 'Learn key/value vectors at every layer; model frozen.', pros: ['~0.1% parameters', 'One model, many tasks', 'Strong in low-data settings in the original study'], cons: ['Uses up L positions of context', 'Training can be unstable without reparameterisation'], bestFor: 'Generation tasks with many variants on one shared model' },
          { name: 'Prompt tuning', summary: 'Learn vectors only at the input embedding layer.', pros: ['Even fewer parameters', 'Very simple to implement'], cons: ['Weaker on smaller models', 'Influence only enters at the bottom layer'], bestFor: 'Very large models with many tasks' },
        ], rows: [
          ['Where it acts', 'All weights', 'Keys/values at every layer', 'Input embeddings only'],
          ['Trainable share', '100%', '≈0.1%', 'Often under 0.01%'],
          ['Base model', 'Changed', 'Frozen', 'Frozen'],
        ], verdict: 'For most new projects LoRA is the default PEFT choice today, but prefix tuning remains a clear and useful idea, and it is supported in common PEFT libraries.' },
        { type: 'check', question: 'In the original paper, prefix tuning matched or beat fine-tuning most clearly in which setting: lots of training data or very little?', answer: 'Very little. Li and Liang reported that prefix tuning was comparable to fine-tuning with full data and tended to outperform it in low-data settings, likely because it changes far fewer parameters and so overfits less.' },
      ],
    },
    {
      id: 'pros-cons-uses',
      title: 'Advantages, limitations, and where it is used',
      blocks: [
        { type: 'list', items: [
          '**Advantage: tiny per-task storage.** Save a few hundred thousand to a few million numbers per task instead of a whole model.',
          '**Advantage: modular serving.** A single frozen model in memory can mix requests for different tasks in one batch, each with its own prefix.',
          '**Advantage: no forgetting of the base.** The model weights never change, so general abilities are untouched when the prefix is removed.',
          '**Limitation: context cost.** The prefix occupies L positions in every layer’s attention, slightly increasing compute and reducing usable context.',
          '**Limitation: training sensitivity.** Results depend on prefix length, initialisation and learning rate; the reparameterisation MLP helps.',
          '**Limitation: capacity.** For tasks needing large changes, LoRA or full fine-tuning usually does better.',
        ] },
        { type: 'callout', tone: 'example', title: 'Where it is used', text: 'Prefix tuning was evaluated on table-to-text generation with GPT-2 and on summarisation with BART. Today it appears mostly in research, in PEFT libraries as one option among many, and as the conceptual ancestor of soft-prompt methods. In industry, LoRA has become the more common choice for adapting LLMs.' },
        { type: 'callout', tone: 'warn', title: 'Common mistake', text: 'Treating a longer prefix as always better. Very long prefixes add compute and can make training less stable without improving results. Start small (around 10–20) and measure on a validation set.' },
      ],
    },
  ],
  quiz: [
    { q: 'What exactly is trained in prefix tuning?', options: ['All of the model’s weights, but only on the first few tokens of each input', 'Short continuous key/value vectors prepended at every attention layer', 'New tokens added to the tokenizer’s vocabulary to act as task words', 'A new output layer trained on top of the frozen model’s final layer'], answer: 1, explain: 'Prefix tuning learns prefix keys and values per layer while the model stays frozen. It does not touch the tokenizer or add a classification head.' },
    { q: 'A model has 24 layers and hidden size 1024. With prefix length 10, how many prefix numbers are trained?', options: ['10,240', '245,760', '491,520', '983,040'], answer: 2, explain: 'layers × 2 (keys and values) × L × d = 24 × 2 × 10 × 1024 = 491,520. 245,760 forgets that both keys and values are stored.' },
    { q: 'What is the main difference between prefix tuning and prompt tuning?', options: ['Prompt tuning adds soft vectors only at the input; prefix tuning adds them at every layer', 'Prompt tuning updates all of the model’s weights, whereas prefix tuning keeps every weight frozen', 'Prefix tuning prepends real word tokens, while prompt tuning learns continuous vectors', 'They are the same method; the two names come from different research groups'], answer: 0, explain: 'Both freeze the model and learn soft vectors, but prompt tuning injects them only at the input, while prefix tuning injects keys/values at every layer.' },
    { q: 'We want one frozen model in production serving ten different generation tasks, each tuned on a few hundred examples. Why is prefix tuning a reasonable fit?', options: ['It produces ten separate full fine-tuned models, one dedicated to each task', 'Each task needs only a small prefix, swapped per request on the same frozen model', 'It removes the need for task training data, so no examples have to be collected or labelled', 'It enlarges the model’s context window, leaving more room for all ten tasks'], answer: 1, explain: 'Each task is a small prefix; the shared model stays frozen and requests pick their prefix. It still needs task data, and it actually uses up some context rather than enlarging it.' },
    { q: 'A colleague says: "The learned prefix is just a clever English instruction; we can read it and reuse it as a normal prompt." What is wrong?', options: ['Nothing; the prefix is stored as ordinary text tokens that anyone can read', 'The prefix is stored as images, not text, so it has to be captioned first', 'The prefix only exists during training and is thrown away before deployment', 'It is continuous vectors with no matching words, usable only inside its own trained model'], answer: 3, explain: 'Prefix vectors are free-valued activations, not tokens, so they are not human-readable or portable as text. They are kept after training; only the optional reparameterisation MLP is discarded.' },
  ],
  takeaways: [
    'Prefix tuning freezes the model and learns trainable key/value vectors prepended at every layer.',
    'Real tokens attend to the prefix, which steers the model like a hidden, learned instruction.',
    'The prefix is continuous, not words, so it is more expressive than a text prompt but not readable.',
    'Size is layers × 2 × L × d, typically around 0.1% of the model.',
    'Prompt tuning acts only at the input layer; LoRA is the more common PEFT choice today.',
  ],
  terms: [
    { term: 'Prefix', def: 'Learned key/value vectors placed before the real tokens at each attention layer.' },
    { term: 'Soft prompt', def: 'A prompt made of trainable continuous vectors instead of real tokens.' },
    { term: 'Prompt tuning', def: 'Learning soft vectors only at the input embedding layer of a frozen model.' },
    { term: 'Key and value', def: 'Vectors each position offers in attention: the key is matched against queries, the value is passed on.' },
    { term: 'Reparameterisation', def: 'Producing the prefix through a small MLP during training for stability, then keeping only the result.' },
    { term: 'Prefix length (L)', def: 'The number of virtual positions in the prefix.' },
  ],
};
