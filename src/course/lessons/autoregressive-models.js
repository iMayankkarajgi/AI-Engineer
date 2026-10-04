export default {
  id: "autoregressive-models",
  minutes: 27,
  hook: "Why does ChatGPT type its answer one word at a time instead of showing the whole reply at once?",
  summary: "An autoregressive model generates a sequence one piece at a time, and each new piece is predicted from all the pieces before it. The chain rule of probability says this is a complete way to describe any sequence, which is why GPT-style language models use it. It needs a causal mask during training, benefits hugely from a KV cache during generation, and is accurate but inherently sequential and therefore slow for long outputs.",
  sections: [
    {
      id: "what-is-autoregressive",
      title: "What is an Autoregressive Model?",
      blocks: [
        { type: "p", text: "An **autoregressive model** produces a sequence step by step, where every new element is predicted from the elements it has already produced. The word comes from statistics: **auto** means “self” and **regressive** means “predicting a value from other values”. So: a model that predicts from *its own* earlier outputs." },
        { type: "p", text: "The idea is older than deep learning. Classic time-series models, written AR(p), forecast tomorrow's temperature as a weighted sum of the last p days. Modern language models apply the same principle to **tokens** (words or word pieces): given “The cat”, predict the next token; append it; predict again." },
        { type: "callout", tone: "analogy", title: "Think of it like writing with a pen", text: "When we write a sentence by hand we cannot jump to the end first. We write a word, re-read what we have, and decide the next word. We never erase earlier words. An autoregressive model writes exactly like that: left to right, each choice based on everything already on the page." },
        { type: "p", text: "Throughout this lesson we use a tiny vocabulary: `<s>` (start), `the`, `cat`, `dog`, `sat`, `ran` and `</s>` (end). Our toy model will generate short sentences such as “the cat sat”." },
      ],
    },
    {
      id: "chain-rule",
      title: "The Chain Rule of Probability",
      blocks: [
        { type: "p", text: "Why is predicting one token at a time a *valid* way to model language, and not just a convenient trick? Because of the **chain rule of probability**. It says that the probability of a whole sequence can always be written as a product of conditional probabilities, one per position:" },
        { type: "formula", expr: "P(x₁, x₂, …, xₙ) = P(x₁) · P(x₂ | x₁) · P(x₃ | x₁, x₂) · … = ∏ₜ P(xₜ | x₍<t₎)", where: [["xₜ", "the token at position t"], ["x₍<t₎", "all tokens before position t (the context or prefix)"], ["P(xₜ | x₍<t₎)", "the probability of token xₜ given everything before it"], ["∏", "multiply the terms for t = 1 to n"]], caption: "This is an exact identity, not an approximation. Any distribution over sequences can be factored this way." },
        { type: "p", text: "So if a model can answer one question well, “given this prefix, how likely is each next token?”, it can describe the probability of any full sentence and generate sentences too. That is the entire job of a GPT-style model." },
        { type: "p", text: "**Small numbers.** Suppose our model says P(the | `<s>`) = 1.0, P(cat | the) = 0.6, P(sat | cat) = 0.7 and P(`</s>` | sat) = 1.0. Then P(“the cat sat”) = 1.0 × 0.6 × 0.7 × 1.0 = **0.42**. And P(“the dog ran”) = 1.0 × 0.4 × 0.8 × 1.0 = 0.32." },
        { type: "check", question: "Using the same numbers plus P(ran | cat) = 0.3, what is P(“the cat ran”)? Do the four sentences the cat/dog sat/ran add up to 1?", answer: "P(the cat ran) = 1.0 × 0.6 × 0.3 × 1.0 = 0.18. With P(sat | dog) = 0.2, P(the dog sat) = 0.08. Total: 0.42 + 0.18 + 0.08 + 0.32 = 1.00. Because each step's probabilities sum to 1, the whole tree of sentences sums to 1 as well." },
        { type: "deeper", title: "Why real systems add log probabilities", blocks: [
          { type: "p", text: "Multiplying hundreds of numbers below 1 quickly gives values so tiny that a computer rounds them to zero (underflow). So in practice we work with **log probabilities**: log P(sequence) = ∑ₜ log P(xₜ | x₍<t₎). Products become sums, which are numerically safe." },
          { type: "p", text: "Training minimises the average **negative log-likelihood** −(1/n) ∑ₜ log P(xₜ | x₍<t₎), which is the same as the cross-entropy loss. **Perplexity** is just exp of that average; a perplexity of 10 roughly means the model is as unsure as if it were choosing among 10 equally likely tokens at each step." },
        ] },
      ],
    },
    {
      id: "generation-loop",
      title: "The Generation Loop",
      blocks: [
        { type: "p", text: "Generation turns the chain rule into a loop. The model never outputs a whole sentence; it outputs a probability distribution for one next token. A small piece of code around the model, the **decoding loop**, does the rest." },
        { type: "flow", title: "One turn of the autoregressive loop", loop: true, nodes: [
          { label: "Context", detail: "Start with the prompt (or just the start token). This is everything generated so far." },
          { label: "Predict", detail: "Run the model on the context. It returns a probability for every token in the vocabulary." },
          { label: "Pick", detail: "Choose one token: greedy (highest probability) or sampled (random, weighted by probability, often with temperature, top-k or top-p)." },
          { label: "Append", detail: "Add the chosen token to the end of the context. Earlier tokens are never changed." },
          { label: "Stop?", detail: "If the token is the end marker or we reached the length limit, stop. Otherwise go round again with the longer context." },
        ] },
        { type: "p", text: "The **pick** step is called the **decoding strategy**. **Greedy decoding** always takes the top token: fast and repeatable, but it can be dull and can get stuck repeating phrases. **Sampling** picks randomly in proportion to the probabilities. **Top-k** keeps only the k most likely tokens before sampling, and **top-p** (nucleus sampling) keeps the smallest set whose probabilities add up to p. **Beam search** keeps several candidate sequences in parallel and is common in translation." },
        { type: "viz", name: "top-k-top-p", caption: "Adjust k and p to see which next-token candidates survive and how their probabilities are renormalised before one is sampled." },
      ],
    },
    {
      id: "numeric-example",
      title: "Step-by-Step Numeric Example in Code",
      blocks: [
        { type: "p", text: "Here is a complete autoregressive generator with a hand-written probability table. To keep it readable, our toy model only looks at the *last* token. A real LLM looks at the whole context, but the loop around it is identical." },
        { type: "code", lang: "python", title: "autoregressive_toy.py", code: `import numpy as np

vocab = ["<s>", "the", "cat", "dog", "sat", "ran", "</s>"]
ix = {w: i for i, w in enumerate(vocab)}

# A toy "model": P(next | last token). A real LLM conditions on ALL previous
# tokens, but the generation loop around it is exactly the same.
P = np.zeros((7, 7))
P[ix["<s>"],  [ix["the"]]]                = [1.0]
P[ix["the"],  [ix["cat"], ix["dog"]]]     = [0.6, 0.4]
P[ix["cat"],  [ix["sat"], ix["ran"]]]     = [0.7, 0.3]
P[ix["dog"],  [ix["sat"], ix["ran"]]]     = [0.2, 0.8]
P[ix["sat"],  [ix["</s>"]]]               = [1.0]
P[ix["ran"],  [ix["</s>"]]]               = [1.0]

# 1. Chain rule: P(sentence) = product of each next-token probability
def sentence_prob(words):
    seq = ["<s>"] + words + ["</s>"]
    p = 1.0
    for prev, nxt in zip(seq, seq[1:]):
        step = P[ix[prev], ix[nxt]]
        print(f"  P({nxt:5s}| ...{prev:4s}) = {step:.1f}")
        p *= step
    return p

print("P('the cat sat') =", round(sentence_prob(["the", "cat", "sat"]), 3))

# 2. The generation loop: predict -> pick -> append -> repeat
def generate(greedy=True, seed=0):
    rng = np.random.default_rng(seed)
    seq = ["<s>"]
    while seq[-1] != "</s>":
        probs = P[ix[seq[-1]]]
        nxt = probs.argmax() if greedy else rng.choice(7, p=probs)
        seq.append(vocab[nxt])
    return " ".join(seq[1:-1])

print("greedy :", generate(greedy=True))
print("sampled:", [generate(greedy=False, seed=s) for s in range(4)])`, output: `  P(the  | ...<s> ) = 1.0
  P(cat  | ...the ) = 0.6
  P(sat  | ...cat ) = 0.7
  P(</s> | ...sat ) = 1.0
P('the cat sat') = 0.42
greedy : the cat sat
sampled: ['the cat sat', 'the dog sat', 'the cat ran', 'the cat ran']`,
          walkthrough: [
            { lines: [3, 4], note: "A seven-token vocabulary and a lookup from token to row/column number." },
            { lines: [6, 14], note: "The “model”: row = previous token, columns = probability of each next token. Each row sums to 1." },
            { lines: [16, 24], note: "The chain rule: walk through the sentence and multiply each next-token probability. The print shows every factor." },
            { lines: [26, 26], note: "1.0 × 0.6 × 0.7 × 1.0 = 0.42, matching our hand calculation." },
            { lines: [28, 36], note: "The generation loop: look up the distribution for the last token, pick (argmax for greedy, random choice for sampling), append, stop at `</s>`." },
            { lines: [38, 39], note: "Greedy always gives the single most likely path. Sampling with different seeds gives different sentences, in proportion to their probability." },
          ] },
        { type: "p", text: "Notice two things. First, greedy decoding returned “the cat sat”, the most likely sentence here, but greedy is *not* guaranteed to find the most likely sentence in general, because a low-probability early token can lead to very high-probability later tokens. Second, sampling produced “the cat ran” twice in four tries even though it has only an 18% chance: randomness is lumpy in small samples." },
      ],
    },
    {
      id: "why-gpt-is-autoregressive",
      title: "Why GPT-style Models are Autoregressive",
      blocks: [
        { type: "p", text: "GPT stands for **Generative Pre-trained Transformer**. It is trained on one objective: **next-token prediction** on huge amounts of text. That objective is exactly the chain rule, so the trained model is autoregressive by construction." },
        { type: "list", items: [
          "**Free labels**: every position in every text is a training example (the label is simply the next token), so no human labelling is needed.",
          "**One model, many tasks**: answering, translating, summarising and coding can all be phrased as “continue this text”.",
          "**Exact likelihood**: we can compute how probable any text is, which makes training stable and evaluation easy.",
          "**Natural streaming**: tokens can be shown to the user as soon as they are produced.",
        ] },
        { type: "p", text: "A subtle but important point: **training is parallel, generation is sequential**. During training we already know the whole sentence, so we feed the true tokens in and ask the model to predict *every* next token at once. This is called **teacher forcing**. During generation we do not know the future, so we must produce one token, feed it back, and run again." },
        { type: "check", question: "If training already predicts all positions in parallel, why can't generation do the same?", answer: "In training the inputs at each position are the real tokens from the data, which we have in advance. In generation, the input at position t+1 is the token the model has just chosen at position t, which does not exist until that step finishes. The dependency forces a sequential loop." },
      ],
    },
    {
      id: "causal-masking",
      title: "Why Autoregressive Models Need Causal Masking",
      blocks: [
        { type: "p", text: "A Transformer lets every token look at other tokens through **attention**. If, during teacher-forced training, the token at position 2 could look at position 3, it could simply read the answer it is supposed to predict. The model would learn to cheat and would be useless at generation time, when the future does not exist yet." },
        { type: "p", text: "The fix is a **causal mask**: before the attention softmax, every score where a token would look at a *later* position is set to −∞. After softmax those weights become exactly 0. Each position can only use itself and the past, which matches the chain-rule term P(xₜ | x₍<t₎)." },
        { type: "matrix", title: "Causal attention pattern for “the cat sat”", rows: ["the", "cat", "sat"], cols: ["the", "cat", "sat"], values: [[1, null, null], [0.4, 0.6, null], [0.2, 0.5, 0.3]], format: "pct", caption: "Illustrative weights. Rows are the token doing the looking; empty cells are masked (future tokens). Every row still sums to 100%." },
        { type: "viz", name: "causal-mask", caption: "Watch the score matrix fill row by row while the upper triangle is masked to −∞ before softmax." },
      ],
    },
    {
      id: "kv-cache",
      title: "The Connection with KV Cache",
      blocks: [
        { type: "p", text: "Inside attention, each token is turned into a **query**, a **key** and a **value** vector. Because of the causal mask, the key and value of an earlier token never change when new tokens are appended: token 5 cannot see token 6, so its vectors are the same at step 6, 7, 8 and onward." },
        { type: "p", text: "A naive loop would recompute keys and values for the whole prefix at every step, wasting work that grows with the square of the length. The **KV cache** stores each token's keys and values the first time they are computed. At each new step the model only computes the new token's query, key and value, appends the new key and value to the cache, and attends over the cache." },
        { type: "steps", title: "Generating with a KV cache", items: [
          { title: "Prefill", text: "Process the whole prompt in one parallel pass and store the keys and values of every prompt token in the cache, for every layer." },
          { title: "Decode one token", text: "Feed only the newest token. Compute its query, key and value." },
          { title: "Append", text: "Add the new key and value to the cache. The cache grows by one entry per layer." },
          { title: "Attend", text: "Compare the new query against all cached keys and mix the cached values to get the output, then predict the next token." },
          { title: "Repeat", text: "Loop until the end token. The cost per step stays roughly proportional to the context length instead of re-running the whole prefix." },
        ] },
        { type: "viz", name: "kv-cache", caption: "Step through decoding and watch keys and values append per token; use the calculator to see how cache memory grows with layers, heads and context." },
        { type: "callout", tone: "tip", title: "The trade-off", text: "The KV cache trades memory for speed. For long contexts and many simultaneous users, the cache can take more GPU memory than the model weights, which is why techniques like grouped-query attention and paged attention exist (covered in later lessons)." },
      ],
    },
    {
      id: "ar-vs-non-ar",
      title: "Autoregressive vs Non-Autoregressive Generation",
      blocks: [
        { type: "p", text: "A **non-autoregressive** model produces many or all output tokens at the same time, without waiting for each previous token. The idea was studied heavily for machine translation from 2018 onward. **Diffusion models**, the leading approach for images, are another alternative: they start from noise and refine the *whole* output over a fixed number of steps. Researchers have also built diffusion-style text models, and some have been released, but as of 2026 the strongest general-purpose language models are still autoregressive." },
        { type: "compare", title: "Two ways to generate a sequence",
          options: [
            { name: "Autoregressive", summary: "One token at a time, each conditioned on all previous tokens.", pros: ["Exact, simple training objective (next-token prediction)", "High quality and coherence", "Streams output naturally"], cons: ["Sequential: n tokens need n model runs", "Errors early on are carried forward", "Cannot revise earlier tokens"], bestFor: "General text generation, chat, code" },
            { name: "Non-autoregressive / parallel", summary: "Predicts many positions at once, possibly refined over a few passes.", pros: ["Much faster for long outputs", "Can revise any position during refinement"], cons: ["Tokens chosen independently can clash (repeated or missing words)", "Usually needs extra tricks to match quality", "Often needs the output length decided up front"], bestFor: "Images (diffusion), speed-critical translation, research on fast text generation" },
          ],
          rows: [
            ["Model calls for n tokens", "n (one per token)", "A fixed number of passes, often far fewer than n"],
            ["Dependency between outputs", "Fully modelled via the chain rule", "Partly or approximately modelled"],
            ["Typical text quality (2026)", "State of the art", "Improving; generally behind"],
          ],
          verdict: "Autoregressive remains the default for language. Speed-ups like speculative decoding keep the autoregressive guarantee while checking several tokens per expensive model call." },
      ],
    },
    {
      id: "popular-models",
      title: "Popular Autoregressive Models we should know",
      blocks: [
        { type: "table", caption: "Well-known autoregressive models. All generate their output one token (or one sample) at a time.", head: ["Model family", "Made by", "What it generates"], rows: [
          ["GPT series (GPT-2, GPT-3, GPT-4 and later)", "OpenAI", "Text and code; later versions are multimodal"],
          ["Llama", "Meta", "Text and code; open weights"],
          ["Claude", "Anthropic", "Text and code; reads images"],
          ["Gemini", "Google", "Text and code; multimodal"],
          ["Mistral, Qwen, DeepSeek", "Mistral AI, Alibaba, DeepSeek", "Text and code; many open-weight versions"],
          ["PixelCNN / PixelRNN (2016)", "DeepMind", "Images, one pixel at a time"],
          ["WaveNet (2016)", "DeepMind", "Raw audio, one sample at a time"],
        ] },
        { type: "callout", tone: "note", title: "What varies by vendor", text: "Companies do not always publish architecture details for closed models. What is public and consistent is that these chat models produce text token by token, which is why responses stream." },
      ],
    },
    {
      id: "worked-example-greedy-trap",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "We said greedy decoding is not guaranteed to find the most likely sentence. Here is a case small enough to check by hand. We use a new toy model with two-word sentences (illustrative numbers). The first word is `the` (0.6) or `a` (0.4). After `the` comes `cat` (0.55) or `dog` (0.45). After `a` comes `bird` (0.9) or `fish` (0.1)." },
        { type: "table", caption: "All four sentences of the toy model. The probabilities add up to 1.", head: ["Sentence", "Factors", "Probability"], rows: [
          ["the cat", "0.6 × 0.55", "0.33"],
          ["the dog", "0.6 × 0.45", "0.27"],
          ["a bird", "0.4 × 0.9", "0.36"],
          ["a fish", "0.4 × 0.1", "0.04"],
        ] },
        { type: "steps", title: "Greedy versus a wider search", items: [
          { title: "Greedy, step 1", text: "Greedy looks only at the first word. `the` has 0.6 and `a` has 0.4, so it commits to `the`. It can never undo this." },
          { title: "Greedy, step 2", text: "After `the`, the best word is `cat` (0.55). Greedy returns “the cat” with probability 0.33." },
          { title: "The real winner", text: "The table shows “a bird” has 0.36. It starts with the less likely first word, but the second word is almost certain, so the product ends up higher." },
          { title: "Beam search with 2 beams", text: "Keep the two best prefixes instead of one: `the` (0.6) and `a` (0.4). Extend both and score all four sentences. Now “a bird” (0.36) is found." },
          { title: "The price", text: "Two beams mean about twice the model work per step. And on real models beams can still miss the best sentence, because the tree is far too large to search fully." },
        ] },
        { type: "p", text: "The lesson: a choice that looks best right now can close off a better path later. This is why decoding is a search problem and not a simple lookup. It also shows that the most likely *sentence* and the most likely *next token* are different questions." },
        { type: "callout", tone: "note", title: "Most likely is not always best", text: "For chat, we usually do not want the single most likely text anyway. It tends to be short and bland. That is why sampling is the common default for open-ended writing, while greedy or beam search suits tasks with one right answer." },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will score two finished replies the way real systems do: with log probabilities instead of products. We will also see the exact moment a plain product breaks, and compute perplexity by hand." },
        { type: "code", lang: "python", title: "practice_log_probs.py", code: `import math

# Next-token probabilities a model gave at each step of two replies (illustrative)
fluent = [0.9, 0.6, 0.7, 0.8, 0.95]
odd = [0.9, 0.05, 0.3, 0.1, 0.95]

def score(step_probs):
    # Chain rule in log space: add logs instead of multiplying probabilities
    log_p = sum(math.log(p) for p in step_probs)
    avg_nll = -log_p / len(step_probs)   # average negative log-likelihood
    return log_p, math.exp(avg_nll)      # perplexity = exp(average NLL)

for name, probs in [("fluent", fluent), ("odd", odd)]:
    log_p, ppl = score(probs)
    print(f"{name:6s} P = {math.exp(log_p):.5f}  log P = {log_p:7.3f}  perplexity = {ppl:.2f}")

# Why logs? A long text multiplies many small numbers.
long_text = [0.1] * 400
product = 1.0
for p in long_text:
    product *= p
print("product of 400 steps:", product)
print("sum of 400 log steps:", round(sum(math.log(p) for p in long_text), 1))
print("perplexity          :", round(score(long_text)[1], 2))`, output: `fluent P = 0.28728  log P =  -1.247  perplexity = 1.28
odd    P = 0.00128  log P =  -6.659  perplexity = 3.79
product of 400 steps: 0.0
sum of 400 log steps: -921.0
perplexity          : 10.0`,
          walkthrough: [
            { lines: [3, 5], note: "Each list holds the probability the model gave to the token that was actually written, one number per step. The second reply has three surprising tokens." },
            { lines: [7, 11], note: "Add the logs of the step probabilities. Divide by the number of steps and flip the sign to get the average loss, then take exp to get perplexity." },
            { lines: [13, 15], note: "Score both replies. exp(log P) gives back the plain product, so we can see both views agree." },
            { lines: [17, 24], note: "A 400-token text where every step has probability 0.1. The product underflows to 0.0, but the sum of logs is a normal number." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Change the `0.05` in `odd` to `0.5`. Predict first: will the perplexity of `odd` fall below 2?",
          "Change `[0.1] * 400` to `[0.1] * 300`. Predict: does the product still print `0.0`, and does the perplexity change?",
          "Append one more `0.95` to `fluent`. Predict: does log P go up or down, and does perplexity go up or down?",
        ] },
        { type: "check", question: "The long text has 400 tokens and the fluent reply has 5, yet we can compare their perplexities (10.0 and 1.28). Why can we not compare their log P values (−921.0 and −1.247) in the same way?", answer: "log P is a sum over all steps, so it gets more negative as a text gets longer, even when every step is predicted well. Perplexity is built from the *average* per step, so length is divided out. To compare texts of different lengths we need the per-token view." },
        { type: "check", question: "A perplexity of 10.0 came out for the text where every step had probability 0.1. Why exactly 10?", answer: "The average negative log-likelihood is −log(0.1) = log(10), and exp(log(10)) = 10. It matches the meaning of perplexity: the model is as unsure as if it picked evenly among 10 tokens at every step, and a probability of 0.1 is exactly a one-in-ten guess." },
      ],
    },
    {
      id: "pros-cons-summary",
      title: "Pros, Cons and Quick Summary",
      blocks: [
        { type: "list", items: [
          "**Pro – principled**: the chain rule makes the model a complete probability distribution over sequences.",
          "**Pro – simple, scalable training**: next-token prediction on raw text, fully parallel thanks to teacher forcing and causal masks.",
          "**Pro – flexible**: any task that can be phrased as text continuation works.",
          "**Con – latency**: generation time grows with output length; each token waits for the previous one.",
          "**Con – error accumulation**: one bad token becomes part of the context and can steer the rest of the answer off course. Training only ever sees real prefixes, while generation sees the model's own, which is called **exposure bias**.",
          "**Con – no going back**: the model cannot edit what it already wrote, which is one reason “think step by step” prompting and reasoning tokens help.",
        ] },
        { type: "callout", tone: "warn", title: "Common misconception", text: "“The model plans the whole answer, then types it out slowly for effect.” No. Each token is a fresh prediction from the text so far. Streaming is not a show; the later words genuinely do not exist yet. (The model's internal states can still encode information about where the text is heading, but the output is committed one token at a time.)" },
        { type: "p", text: "**Quick summary.** Autoregressive models factor a sequence with the chain rule and generate it in a loop: predict, pick, append, repeat. Training is parallel with teacher forcing and a causal mask; generation is sequential and accelerated by a KV cache. This design powers essentially all popular LLMs today." },
      ],
    },
  ],
  quiz: [
    { q: "What does the chain rule of probability let an autoregressive model do?", options: ["Approximate a sentence's probability by averaging the frequencies of its tokens", "Write a sequence's exact probability as a product of next-token probabilities", "Generate all tokens of a sentence in parallel instead of one at a time", "Compute each token's probability without looking at the earlier tokens"], answer: 1, explain: "P(x₁…xₙ) = ∏ P(xₜ | x₍<t₎) is an exact identity, so predicting the next token well is enough to model whole sequences. It is not an average, and it implies sequential, not parallel, generation." },
    { q: "With P(the | <s>) = 1.0, P(dog | the) = 0.4, P(ran | dog) = 0.8 and P(</s> | ran) = 1.0, what is P(“the dog ran”)?", options: ["0.32", "2.2", "0.8", "0.4"], answer: 0, explain: "Multiply the factors: 1.0 × 0.4 × 0.8 × 1.0 = 0.32. Adding them (2.2) is wrong because probabilities of successive events multiply, and 0.8 or 0.4 use only one factor." },
    { q: "We train a Transformer language model but forget the causal mask. Training loss drops to nearly zero, yet generation is garbage. Why?", options: ["The KV cache was too small to hold the keys of the full training sequence", "The temperature was set too high, so the training targets became too random", "Each position could see the token it had to predict, so it learned to copy", "Without the mask the model loses all positional information about tokens"], answer: 2, explain: "Without the mask, attention can read future tokens during teacher-forced training, so predicting the next token becomes copying. At generation time the future is not available and the shortcut fails. Temperature and KV cache are inference settings and do not cause this." },
    { q: "How does a KV cache speed up autoregressive generation?", options: ["It caches entire previous answers and returns them whenever a question repeats", "It lets the model emit several tokens per step without verifying any of them", "It drops the causal mask so the whole sequence is processed together in a single pass", "It reuses the unchanging keys and values of past tokens, computing only the newest"], answer: 3, explain: "Thanks to the causal mask, earlier tokens' keys and values stay the same as the sequence grows, so they are stored and reused. Caching whole answers is a different idea (response caching), and multi-token guessing is speculative decoding." },
    { q: "Compared with a non-autoregressive model, what is the main drawback of an autoregressive model?", options: ["It cannot compute an exact probability for a whole sentence that it generates", "Generation is sequential: n output tokens need n model steps, so it is slow", "It needs labelled data for every task before it can generate useful text", "It cannot be trained in parallel on GPUs because of its causal mask"], answer: 1, explain: "Latency grows with output length because each token waits for the previous one. Autoregressive models compute exact probabilities, learn from unlabelled text, and train in parallel with teacher forcing, so the other options are false." },
  ],
  takeaways: [
    "Autoregressive = each new token is predicted from all previous tokens, then fed back in.",
    "The chain rule makes this exact: P(sequence) = ∏ P(xₜ | x₍<t₎).",
    "Training is parallel (teacher forcing + causal mask); generation is a sequential predict–pick–append loop.",
    "The KV cache reuses unchanging keys and values of past tokens to make each step cheap.",
    "Strengths: simple objective, high quality, streaming. Weaknesses: latency and error accumulation.",
  ],
  terms: [
    { term: "Autoregressive model", def: "A model that generates a sequence one element at a time, each conditioned on the elements before it." },
    { term: "Chain rule of probability", def: "The identity that a joint probability equals the product of each element's probability given the previous ones." },
    { term: "Teacher forcing", def: "Training by feeding the true previous tokens as input and predicting every next token in parallel." },
    { term: "Causal mask", def: "A mask that blocks attention to future positions so each token only uses itself and the past." },
    { term: "KV cache", def: "Stored keys and values of already-processed tokens, reused at each generation step." },
    { term: "Greedy decoding", def: "Always picking the most probable next token." },
    { term: "Exposure bias", def: "The gap between training on true prefixes and generating from the model's own, possibly flawed, prefixes." },
  ],
};
