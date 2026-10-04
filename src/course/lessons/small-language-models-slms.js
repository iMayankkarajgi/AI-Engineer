export default {
  id: 'small-language-models-slms',
  minutes: 25,
  hook: 'When would a 3-billion-parameter model on a phone beat a frontier model in a data centre?',
  summary: 'Small Language Models (SLMs) are language models with roughly a few hundred million to around ten billion parameters, small enough to run cheaply, quickly and often on a single device. They stay capable thanks to high-quality and synthetic training data, distillation from larger models, long training, pruning and quantization. They shine for focused, high-volume, private or offline tasks; large models remain better for broad knowledge and hard multi-step reasoning.',
  sections: [
    {
      id: 'slm-definition',
      title: 'SLM = Small + Language Model',
      blocks: [
        { type: 'p', text: 'The name says it all: a **Small Language Model (SLM)** is a language model built to be small. It uses the same kind of architecture as the big chat models (usually a decoder-only Transformer) but with far fewer **parameters**, the learned numbers inside the network. Fewer parameters means less memory, less compute per token, lower cost and lower latency.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like vehicles', text: 'A cargo ship (a frontier LLM) can carry anything anywhere, but you would not use one to deliver a pizza. A scooter (an SLM) cannot carry a container, but for short, frequent, specific trips it is faster, cheaper and goes where the ship cannot, like a narrow street or your pocket.' },
        { type: 'p', text: 'Running example for this lesson: a bank wants to classify customer messages ("card lost", "dispute a charge", "update address") and draft short replies, millions of times a day, ideally on its own servers for privacy. We will keep asking: SLM or LLM?' },
      ],
    },
    {
      id: 'what-is-lm',
      title: 'What is a language model?',
      blocks: [
        { type: 'p', text: 'A **language model** assigns probabilities to text. Given some tokens, it predicts a probability for every possible next token. Generating text means repeatedly sampling a next token and appending it. Everything else (answering questions, summarising, classifying) is built on top of that one skill, through training and prompting.' },
        { type: 'viz', name: 'temperature', caption: 'A language model\'s output is a probability distribution over next tokens; drag the temperature to see how sampling changes. SLMs and LLMs both work this way.' },
      ],
    },
    {
      id: 'what-counts-as-small',
      title: 'What counts as "small"?',
      blocks: [
        { type: 'p', text: 'There is no official cut-off, and the line keeps moving as hardware improves. In 2026 most people use "SLM" for models from about **100 million to about 10 billion parameters**, with some including models up to roughly 15B. A more practical definition: **a model small enough to run on a single consumer device or a single modest GPU**, often after quantization.' },
        { type: 'chart', kind: 'hbar', title: 'The size spectrum (parameters, log-ish groups)', xLabel: 'Billions of parameters', unit: 'B', labels: ['Tiny (SmolLM2-135M)', 'Phone class (Llama 3.2 1B)', 'Phone/laptop (Phi-3-mini 3.8B)', 'Laptop/1 GPU (Llama 3.1 8B)', 'Mid (Gemma 3 27B)', 'Large dense (Llama 3.1 70B)', 'Frontier MoE (DeepSeek-V3 671B)'], series: [ { name: 'Parameters', values: [0.135, 1.2, 3.8, 8, 27, 70, 671] } ], caption: 'Published parameter counts. The first four are typical SLMs; the boundary around 10B is a convention, not a rule.' },
        { type: 'p', text: 'Size alone does not decide what a model costs to run. **Precision** matters too: a 3.8B model needs about 7.6 GB in 16-bit floats but under 2 GB at 4-bit quantization. That is why "small" is often discussed together with quantization.' },
      ],
    },
    {
      id: 'popular-slms',
      title: 'Popular SLMs we should know',
      blocks: [
        { type: 'table', caption: 'Some widely used open small-model families (sizes as published)', head: ['Family', 'Maker', 'Small sizes', 'Known for'], rows: [
          ['Phi (Phi-3, Phi-4-mini)', 'Microsoft', '3.8B', 'Heavy use of curated and synthetic "textbook-quality" data'],
          ['Gemma 2 / Gemma 3', 'Google', '1B, 2B, 4B, 9B, 12B', 'Small models trained with distillation from larger ones'],
          ['Llama 3.2', 'Meta', '1B, 3B', 'On-device use; built with pruning and distillation from larger Llamas'],
          ['Qwen2.5 / Qwen3', 'Alibaba', '0.5B to 8B', 'Strong multilingual and coding ability for the size'],
          ['SmolLM2', 'Hugging Face', '135M, 360M, 1.7B', 'Fully open, very small models'],
          ['Ministral / Mistral 7B', 'Mistral AI', '3B, 7B, 8B', 'Efficient attention (GQA, sliding window in Mistral 7B)'],
        ] },
        { type: 'p', text: 'Phone makers also ship their own on-device models, for example Apple\'s on-device foundation model of about 3B parameters and Google\'s Gemini Nano on Android. New versions appear every few months, so check current leaderboards before choosing.' },
      ],
    },
    {
      id: 'how-slms-stay-capable',
      title: 'How SLMs stay capable despite being small',
      blocks: [
        { type: 'p', text: 'A 2026 3B model often beats much larger models from a few years earlier. Five techniques explain most of that progress:' },
        { type: 'steps', title: 'The SLM toolkit', items: [
          { title: 'Better data', text: 'Filter the web hard and add synthetic, textbook-style data written by larger models. Microsoft\'s Phi work showed data quality can substitute for a lot of size.' },
          { title: 'Train far longer', text: 'Chinchilla suggested ~20 tokens per parameter for compute-optimal training, but SLMs are deliberately "over-trained" on trillions of tokens (Llama 3 8B saw about 15T tokens) because a small model that is cheap to serve is worth the extra training cost.' },
          { title: 'Distil from a teacher', text: '**Knowledge distillation** trains the small student to match a large teacher\'s full probability distribution over next tokens, which carries much more information than the single correct token.' },
          { title: 'Prune', text: '**Pruning** removes less important layers, heads or neurons from a bigger trained model, then retrains briefly, often with distillation. Llama 3.2 1B and 3B were made this way from larger Llama models.' },
          { title: 'Quantize and specialise', text: 'Store weights in 8 or 4 bits for deployment, and fine-tune (often with LoRA) on the narrow task, where a small model can match a large one.' },
        ] },
        { type: 'deeper', title: 'Why distillation gives more signal', blocks: [
          { type: 'p', text: 'With normal training, the target for "The capital of France is ___" is just "Paris" (a one-hot vector). A teacher might output Paris 0.92, Lyon 0.02, a 0.01... These **soft labels** tell the student which wrong answers are "less wrong", effectively teaching relationships between tokens. The student minimises the KL divergence `KL(p_teacher ‖ p_student)` over tokens, usually mixed with the normal loss.' },
        ] },
      ],
    },
    {
      id: 'why-slms-matter',
      title: 'Why SLMs matter',
      blocks: [
        { type: 'list', items: [
          '**Cost:** fewer parameters means fewer FLOPs per token and smaller GPUs; at millions of requests per day, this can cut serving cost by an order of magnitude or more.',
          '**Latency:** decoding is usually limited by memory bandwidth, so reading 2 GB of weights per token is far faster than reading 140 GB.',
          '**Privacy and compliance:** the model can run on-premises or on the user\'s device, so sensitive data never leaves it.',
          '**Offline and edge:** phones, cars, factory devices and laptops without reliable internet.',
          '**Control:** easy to fine-tune, version and audit your own model.',
          '**Energy:** less compute per request.',
        ] },
        { type: 'code', lang: 'python', title: 'will_it_fit.py', code: `# Will a model fit on a device? Weights only, plus ~20% headroom for KV cache and runtime.
BYTES = {"FP16": 2.0, "INT8": 1.0, "INT4": 0.5}
DEVICES = {"phone (8 GB, ~4 GB free)": 4, "laptop GPU (8 GB)": 8, "server GPU (80 GB)": 80}
models = {"0.5B": 0.5e9, "1.5B": 1.5e9, "3.8B": 3.8e9, "8B": 8e9, "70B": 70e9}

def footprint_gb(params, precision):
    return params * BYTES[precision] * 1.2 / 1e9      # 20% headroom

print(f"{'model':>6} {'FP16 GB':>8} {'INT4 GB':>8}  smallest device that fits (INT4)")
for name, p in models.items():
    fp16, int4 = footprint_gb(p, "FP16"), footprint_gb(p, "INT4")
    fits = next((d for d, cap in DEVICES.items() if int4 <= cap), "needs several GPUs")
    print(f"{name:>6} {fp16:8.1f} {int4:8.1f}  {fits}")

# Rough decode speed when memory-bandwidth bound: tokens/s ~ bandwidth / bytes read per token
bandwidth_gbs = 100                                    # e.g. a laptop-class memory system
for name in ["1.5B", "8B", "70B"]:
    gb_per_token = models[name] * BYTES["INT4"] / 1e9
    print(f"{name}: ~{bandwidth_gbs / gb_per_token:5.0f} tokens/s upper bound at {bandwidth_gbs} GB/s")`, output: ` model  FP16 GB  INT4 GB  smallest device that fits (INT4)
  0.5B      1.2      0.3  phone (8 GB, ~4 GB free)
  1.5B      3.6      0.9  phone (8 GB, ~4 GB free)
  3.8B      9.1      2.3  phone (8 GB, ~4 GB free)
    8B     19.2      4.8  laptop GPU (8 GB)
   70B    168.0     42.0  server GPU (80 GB)
1.5B: ~  133 tokens/s upper bound at 100 GB/s
8B: ~   25 tokens/s upper bound at 100 GB/s
70B: ~    3 tokens/s upper bound at 100 GB/s`,
          walkthrough: [
            { lines: [1, 4], note: 'Bytes per parameter for three precisions, some device memory budgets (illustrative), and model sizes.' },
            { lines: [6, 7], note: 'Memory ≈ parameters × bytes per parameter, plus 20% headroom for the KV cache and runtime. A rough rule of thumb, not an exact figure.' },
            { lines: [9, 13], note: 'For each model, find the smallest device whose budget fits the INT4 version. A 3.8B model fits a phone; 70B needs a data-centre GPU even at 4 bits.' },
            { lines: [15, 19], note: 'Each generated token reads all weights once, so speed is capped near bandwidth ÷ model bytes. Smaller models are proportionally faster.' },
          ] },
        { type: 'check', question: 'Using the rule in the code, about how much memory does a 3.8B model need at INT8, and would it fit in a phone with 4 GB free?', answer: '3.8B × 1 byte × 1.2 ≈ 4.6 GB, which does not fit in 4 GB. At INT4 it needs about 2.3 GB and fits. Precision can decide whether a model runs on a device at all.' },
      ],
    },
    {
      id: 'slm-vs-llm',
      title: 'SLM vs LLM',
      blocks: [
        { type: 'compare', title: 'Small vs large language models', options: [
          { name: 'SLM (~0.1B–10B)', summary: 'Compact model for focused tasks, cheap and fast.', pros: ['Low cost per request', 'Low latency', 'Runs on device or on-prem', 'Easy to fine-tune'], cons: ['Less world knowledge', 'Weaker at long multi-step reasoning', 'More sensitive to prompt wording'], bestFor: 'High-volume, narrow, private or offline tasks' },
          { name: 'LLM (tens of B to 1T+)', summary: 'General-purpose model with broad knowledge and strong reasoning.', pros: ['Broad knowledge', 'Best on hard and open-ended tasks', 'Handles new tasks from instructions alone'], cons: ['Expensive to serve', 'Higher latency', 'Usually needs a cloud API or many GPUs'], bestFor: 'Complex reasoning, open-ended assistants, rare or varied tasks' },
        ], rows: [
          ['Typical hardware', 'Phone, laptop, 1 GPU', 'Multi-GPU servers'],
          ['Cost per 1M tokens', 'Very low', 'Higher'],
          ['Fine-tuning effort', 'Hours on one GPU', 'Large clusters or vendor services'],
          ['Failure mode', 'Misses facts, shallow reasoning', 'Cost and latency'],
        ], verdict: 'Use the smallest model that meets your quality bar on your own evaluation set, and escalate to a large model only for the cases that need it.' },
      ],
    },
    {
      id: 'use-cases',
      title: 'Where SLMs shine: use cases',
      blocks: [
        { type: 'list', items: [
          '**Classification and routing:** intent detection, ticket triage, spam or toxicity filtering. Our bank\'s message categories fit perfectly.',
          '**Extraction:** pulling names, dates, amounts or product codes into JSON.',
          '**On-device assistants:** autocomplete, smart replies, summarising notifications, offline translation.',
          '**RAG answerers:** when retrieval supplies the facts, a small model only needs to read and rephrase them.',
          '**Agent sub-steps:** cheap models handle routine tool calls while a larger model plans.',
          '**Draft models for speculative decoding:** a small model proposes tokens that a large model verifies.',
        ] },
        { type: 'viz', name: 'llm-routing', caption: 'Easy queries go to a small model and hard ones to a large model; move the threshold to trade cost against quality.' },
        { type: 'callout', tone: 'example', title: 'The bank, decided', text: 'Fine-tune a 3–8B model on a few thousand labelled messages for classification and short templated replies, run it on the bank\'s own GPUs, and route the rare complex complaints (legal disputes, multi-issue letters) to a large model with human review.' },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'Trade-offs of SLMs',
      blocks: [
        { type: 'list', items: [
          '**Less knowledge:** fewer parameters store fewer facts, so SLMs hallucinate more on knowledge questions unless given the facts (RAG).',
          '**Shallower reasoning:** long, multi-step problems degrade faster, though small reasoning-tuned models have narrowed the gap on maths.',
          '**Narrower generalisation:** a fine-tuned SLM can be excellent on its task and poor just outside it.',
          '**Context limits in practice:** even if long context is supported, small devices may lack memory for a big KV cache.',
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistake', text: 'Judging an SLM by public benchmarks or by a few hand-typed prompts. Benchmarks may not resemble your task, and some models are tuned towards them. Build a test set of real examples from your domain and measure accuracy, latency and cost for both an SLM and an LLM before deciding.' },
      ],
    },
    {
      id: 'when-to-pick',
      title: 'When to pick an SLM',
      blocks: [
        { type: 'list', ordered: true, items: [
          'The task is **narrow and well defined** (classify, extract, rewrite, short answers).',
          'Volume is **high** or latency must be **low** (interactive, real-time).',
          'Data must **stay on the device or premises**, or the app must work **offline**.',
          'You can **supply knowledge** through retrieval or fine-tuning instead of relying on the model\'s memory.',
          'Your evaluation shows the SLM meets the quality bar. If not, try fine-tuning, then a bigger SLM, then routing hard cases to an LLM.',
        ] },
        { type: 'check', question: 'A startup wants a creative writing partner that discusses any topic in depth and keeps a long novel consistent. Is an SLM the right first choice?', answer: 'Probably not. The task is broad, open-ended and needs wide knowledge and long, coherent reasoning, which are LLM strengths. An SLM might still help with sub-tasks such as fixing grammar or autocomplete.' },
      ],
    },
    {
      id: 'worked-example-escalation-cost',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: "The advice “use an SLM and escalate hard cases” only pays off if few cases escalate. Let us put numbers on the bank example. All figures here are illustrative: 1,000,000 messages a day, an SLM call costs 1 unit, an LLM call costs 20 units." },
        { type: 'steps', title: "Costing a cascade", items: [
          { title: "Baseline", text: "Send everything to the LLM: 1,000,000 × 20 = 20,000,000 units a day." },
          { title: "SLM first", text: "Every message goes through the SLM once: 1,000,000 × 1 = 1,000,000 units. This part is paid whatever happens next." },
          { title: "Escalate the unsure ones", text: "Say the SLM is unsure about 10% of messages. Those 100,000 go to the LLM: 100,000 × 20 = 2,000,000 units." },
          { title: "Add up", text: "1,000,000 + 2,000,000 = 3,000,000 units, which is 15% of the baseline." },
          { title: "Find the break-even", text: "The cascade costs 1 + 20 × e units per message, where e is the escalation rate. It equals the baseline of 20 when e = 0.95. Above 95% escalation the SLM is pure overhead." },
        ] },
        { type: 'table', caption: "Daily cost of the cascade at different escalation rates (illustrative units)", head: ['Escalation rate', 'SLM cost', 'LLM cost', 'Total', 'Share of all-LLM cost'], rows: [
          ['0%', '1,000,000', '0', '1,000,000', '5%'],
          ['10%', '1,000,000', '2,000,000', '3,000,000', '15%'],
          ['30%', '1,000,000', '6,000,000', '7,000,000', '35%'],
          ['100%', '1,000,000', '20,000,000', '21,000,000', '105%'],
        ] },
        { type: 'p', text: "Two things to watch in practice. First, the escalation rate is set by our confidence threshold, so a stricter threshold raises cost. Second, cost is only half of the picture: we also need the accuracy of the cases the SLM keeps. If the SLM is confidently wrong on many of them, a low escalation rate is a warning sign, not a success." },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: "We will try knowledge distillation at the smallest possible scale. A “student” with four logits learns the answer to “The capital of France is ___” twice: once from a hard one-hot label, once from a teacher's soft probabilities. Then we compare what each student knows about the wrong answers." },
        { type: 'code', lang: 'python', title: 'practice_distillation.py', code: `import math

def softmax(z):
    e = [math.exp(x - max(z)) for x in z]
    return [x / sum(e) for x in e]

def kl(p, q):
    # KL(p || q): how far the student q is from the teacher p (0 = identical)
    return sum(pi * math.log(pi / qi) for pi, qi in zip(p, q) if pi > 0)

tokens = ["Paris", "Lyon", "London", "banana"]
teacher = softmax([5.0, 2.0, 1.5, -3.0])      # illustrative teacher logits
hard = [1.0, 0.0, 0.0, 0.0]                   # one-hot label: only "Paris" counts

def train(target, steps=200, lr=0.5):
    z = [0.0] * 4                             # the student starts knowing nothing
    for _ in range(steps):
        q = softmax(z)
        # gradient of cross-entropy with respect to the logits is (q - target)
        z = [zi - lr * (qi - ti) for zi, qi, ti in zip(z, q, target)]
    return softmax(z)

print("teacher    ", " ".join(f"{t}={p:.3f}" for t, p in zip(tokens, teacher)))
for name, target in [("hard label", hard), ("soft labels", teacher)]:
    q = train(target)
    print(f"{name:11s}", " ".join(f"{t}={p:.3f}" for t, p in zip(tokens, q)),
          f"| KL to teacher={kl(teacher, q):.4f}")`, output: `teacher     Paris=0.926 Lyon=0.046 London=0.028 banana=0.000
hard label  Paris=0.992 Lyon=0.003 London=0.003 banana=0.003 | KL to teacher=0.1350
soft labels Paris=0.924 Lyon=0.044 London=0.026 banana=0.007 | KL to teacher=0.0055`,
          walkthrough: [
            { lines: [3, 9], note: "Two helpers: softmax turns logits into probabilities, and KL divergence measures how far the student's distribution is from the teacher's." },
            { lines: [11, 13], note: "Four candidate tokens. The teacher prefers Paris but also knows that Lyon and London are far more plausible than banana. The hard label only says Paris." },
            { lines: [15, 21], note: "A student with four logits, trained by gradient descent on cross-entropy. For this loss the gradient is simply the student's probabilities minus the target." },
            { lines: [23, 27], note: "Train once per target and print. The hard-label student gives all three wrong answers the same 0.003. The soft-label student ranks them like the teacher and ends about 25 times closer in KL." },
          ] },
        { type: 'p', text: "Now change it:" },
        { type: 'list', items: [
          "Cut `steps` from `200` to `20`. Predict which student is further from its target after so few updates, and check the KL values.",
          "Change the teacher logits to `[5.0, 4.5, 1.5, -3.0]`, a teacher that is unsure between Paris and Lyon. Predict the soft-label student's top two probabilities.",
          "Soften the teacher: divide every teacher logit by `2` before the softmax (a temperature of 2). Predict whether the probabilities of Lyon and London go up or down.",
        ] },
        { type: 'check', question: "The hard-label student gives Lyon, London and banana exactly the same probability. What knowledge is it missing, and why could the hard label never teach it?", answer: "It does not know that Lyon and London are “less wrong” than banana. A one-hot target carries no ranking among wrong answers: the gradient pushes every wrong logit down by the same rule, so they stay equal. The teacher's soft probabilities carry that ranking, which is the extra signal distillation gives." },
        { type: 'check', question: "The soft-label student ends with KL = 0.0055, not 0, and gives banana 0.007 where the teacher gives almost 0. Why?", answer: "It started from equal logits and had only 200 updates. Matching a probability near zero needs a very negative logit, and the gradient for that token gets tiny as its probability shrinks, so the last bit of the gap closes slowly. More steps would push the KL closer to 0." },
      ],
    },
    {
      id: 'quick-summary',
      title: 'Quick summary',
      blocks: [
        { type: 'list', items: [
          'SLMs are the same kind of model as LLMs, just with roughly 0.1–10B parameters.',
          'Good data, long training, distillation, pruning and quantization keep them surprisingly capable.',
          'They win on cost, latency, privacy and offline use; LLMs win on breadth and hard reasoning.',
          'Pick the smallest model that passes your own evaluation, and route hard cases upward.',
        ] },
      ],
    },
  ],
  quiz: [
    { q: 'Which description best matches a Small Language Model in 2026?', options: ['A rule-based chatbot that uses no neural network at all', 'A Transformer LM of about 0.1–10B parameters', 'Any model whose context window is under 4K tokens', 'A model trained to understand just one language'], answer: 1, explain: 'SLMs are ordinary neural language models, just small enough to run on one device or a modest GPU. Context size and language count do not define them.' },
    { q: 'Using about 0.5 bytes per parameter plus 20% headroom, how much memory does an 8B model need at INT4?', options: ['About 4.8 GB', 'About 19 GB', 'About 0.8 GB', 'About 9.6 GB'], answer: 0, explain: '8B × 0.5 bytes = 4 GB, × 1.2 = 4.8 GB. 19 GB is the FP16 figure.' },
    { q: 'What is knowledge distillation?', options: ['Removing layers or heads from a trained model, then retraining', 'Storing each weight in fewer bits to save memory at inference', 'Training a student to match a teacher\'s output probabilities', 'Filtering web text so only high-quality pages remain for training'], answer: 2, explain: 'Distillation transfers the teacher\'s soft labels to the student. The other options describe pruning, quantization and data filtering.' },
    { q: 'Our team must tag 5 million tickets a day into 12 categories, and tickets cannot leave our servers. What is the most sensible approach?', options: ['Send every ticket to the largest frontier model API available', 'Self-host a fine-tuned SLM and escalate low-confidence tickets', 'Run a full frontier-size model on a single office laptop', 'Train a brand-new 70B model from scratch for this one task'], answer: 1, explain: 'High volume, a narrow task and privacy all point to a self-hosted, fine-tuned SLM with an escalation path.' },
    { q: 'A colleague says "Our 3B model scored well on a public benchmark, so it will match a frontier model for our legal-advice bot." What is the best response?', options: ['Agreed; public benchmark scores always transfer to new tasks', 'Test on real legal cases; it needs broad knowledge and reasoning', 'Small models cannot be evaluated, so we must trust the benchmark', 'Only the parameter count matters, so 3B is clearly not enough'], answer: 1, explain: 'SLMs have less knowledge and shallower reasoning, and public benchmarks can mislead. Measure on your own data, and consider an LLM or RAG.' },
  ],
  takeaways: [
    'An SLM is a normal language model with roughly 0.1–10B parameters; the boundary is a convention.',
    'Data quality, long training, distillation, pruning and quantization keep small models capable.',
    'Memory ≈ parameters × bytes per parameter; quantization often decides if a model fits a device.',
    'SLMs win on cost, latency, privacy and offline use; LLMs win on knowledge and hard reasoning.',
    'Choose by evaluating on your own data, and route hard cases to a larger model.',
  ],
  terms: [
    { term: 'Small Language Model (SLM)', def: 'A language model small enough (about 0.1–10B parameters) to run cheaply on one device or modest GPU.' },
    { term: 'Parameter', def: 'A learned number inside a neural network.' },
    { term: 'Knowledge distillation', def: 'Training a small student model to imitate a larger teacher\'s output distributions.' },
    { term: 'Pruning', def: 'Removing less important parts of a trained model, then retraining briefly.' },
    { term: 'Quantization', def: 'Storing weights with fewer bits (e.g. 8 or 4) to save memory and speed up inference.' },
    { term: 'On-device inference', def: 'Running the model directly on a phone, laptop or edge device instead of a server.' },
  ],
};
