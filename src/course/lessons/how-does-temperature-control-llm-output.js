export default {
  id: 'how-does-temperature-control-llm-output',
  minutes: 23,
  hook: 'Ask the same chatbot the same question twice and you may get two different answers. One small number, the temperature, decides how much that happens.',
  summary: 'An LLM produces a score (logit) for every possible next token; softmax turns those scores into probabilities and one token is sampled. Temperature divides the logits before softmax: below 1 it sharpens the distribution toward the top token (focused, repeatable output), above 1 it flattens it (varied, riskier output). Temperature 0 is treated as always picking the top token. Choosing it well depends on the task.',
  sections: [
    {
      id: 'what-is-temperature',
      title: 'What is temperature in LLMs?',
      blocks: [
        { type: 'p', text: '**Temperature** is a setting, usually a number between 0 and 2, that controls how random an LLM\'s word choices are. It does not change what the model knows or the probabilities it computes internally; it changes **how we pick** from those probabilities. Low temperature makes the model stick to its most likely choices. High temperature makes it take more chances.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a restaurant regular', text: 'A diner with a favourite dish. At **low temperature** they order their favourite almost every time. At **temperature 1** they mostly order the favourite but sometimes try the second or third choice, in proportion to how much they like them. At **high temperature** they pick almost at random from the menu, including dishes they do not really like. The menu (the model\'s preferences) never changed; only their willingness to explore did.' },
        { type: 'p', text: 'Our running example: a support chatbot finishing the sentence **"The weather today is ..."** with candidate next words *sunny*, *rainy*, *cloudy*, *cold* and *purple*.' },
      ],
    },
    {
      id: 'how-llm-picks',
      title: 'How does an LLM pick the next token?',
      blocks: [
        { type: 'p', text: 'An LLM writes text one **token** (a word or piece of a word) at a time. For each step, the last layer outputs one number for **every** token in its vocabulary, often 100,000 or more. These raw numbers are called **logits**. A higher logit means the model thinks that token fits better. Logits can be any real number, positive or negative, and they do not add up to anything in particular.' },
        { type: 'flow', title: 'One generation step', nodes: [
          { label: 'Context', detail: '"The weather today is" is fed through the model.' },
          { label: 'Logits', detail: 'One raw score per vocabulary token: sunny 4.0, rainy 3.0, cloudy 2.5, cold 2.0, purple −1.0, ... (illustrative).' },
          { label: '÷ temperature', detail: 'Every logit is divided by T. This is the only place temperature acts.' },
          { label: 'Softmax', detail: 'Scores become probabilities that are positive and sum to 1.' },
          { label: 'Sample', detail: 'Draw one token at random according to those probabilities, append it, and repeat.' },
        ] },
      ],
    },
    {
      id: 'scores-to-probabilities',
      title: 'From scores to probabilities',
      blocks: [
        { type: 'p', text: 'To sample we need probabilities, so the logits go through **softmax**: raise e (about 2.718) to each logit, then divide by the total. Exponentiating makes everything positive and exaggerates gaps; dividing by the total makes the results sum to 1.' },
        { type: 'formula', expr: 'pᵢ = e^(zᵢ / T) / ∑ⱼ e^(zⱼ / T)', where: [
          ['zᵢ', 'the logit of token i'],
          ['T', 'the temperature (T = 1 is plain softmax)'],
          ['pᵢ', 'the probability of choosing token i'],
        ], caption: 'Softmax with temperature.' },
        { type: 'p', text: 'At T = 1 with our logits [4.0, 3.0, 2.5, 2.0, −1.0]: subtracting the largest (4.0) gives [0, −1, −1.5, −2, −5]. Exponentiating gives about [1, 0.368, 0.223, 0.135, 0.007], which sum to 1.733. Dividing gives probabilities **[0.58, 0.21, 0.13, 0.08, 0.004]**. So "sunny" is chosen 58% of the time and "purple" about 0.4%.' },
      ],
    },
    {
      id: 'where-temperature-comes-in',
      title: 'Where does temperature come into the picture?',
      blocks: [
        { type: 'p', text: 'Temperature divides **every** logit before softmax. Dividing by a number smaller than 1 **stretches** the gaps between logits; dividing by a number bigger than 1 **shrinks** them. Because softmax exaggerates gaps exponentially, stretched gaps make the top token dominate, and shrunk gaps make choices more even.' },
        { type: 'p', text: 'Importantly, temperature **never changes the order** of tokens. The most likely token stays the most likely at every temperature. It only changes how much more likely it is than the others.' },
        { type: 'viz', name: 'temperature', caption: 'Drag the temperature slider and watch the bars: low values pile probability onto the top token, high values spread it out.' },
        { type: 'check', question: 'Pause and predict: dividing logits [4, 3] by T = 0.5 gives [8, 6]. Does the gap between the two tokens get bigger or smaller, and what happens to the top token\'s probability?', answer: 'The gap doubles from 1 to 2, so the top token becomes more dominant: its probability rises from about 73% (e¹ / (e¹ + 1)) to about 88% (e² / (e² + 1)).' },
      ],
    },
    {
      id: 'step-by-step-example',
      title: 'Step-by-step example with numbers',
      blocks: [
        { type: 'steps', title: 'Applying T = 0.5 to our weather logits', items: [
          { title: 'Start with logits', text: '[4.0, 3.0, 2.5, 2.0, −1.0] for sunny, rainy, cloudy, cold, purple.' },
          { title: 'Divide by T = 0.5', text: 'Every logit doubles: [8.0, 6.0, 5.0, 4.0, −2.0]. Gaps are now twice as big.' },
          { title: 'Subtract the max', text: '[0, −2, −3, −4, −10]. This does not change the result but avoids overflow.' },
          { title: 'Exponentiate', text: 'About [1, 0.135, 0.050, 0.018, 0.00005], summing to about 1.204.' },
          { title: 'Normalize', text: 'Divide by 1.204: about [0.83, 0.11, 0.04, 0.02, 0.00]. "sunny" jumped from 58% to 83%.' },
          { title: 'Sample', text: 'Draw a random token with these probabilities. Most draws give "sunny".' },
        ] },
        { type: 'code', lang: 'python', title: 'temperature.py', code: `import numpy as np
rng = np.random.default_rng(0)

# Next-token candidates after "The weather today is ..."
tokens = ["sunny", "rainy", "cloudy", "cold", "purple"]
logits = np.array([4.0, 3.0, 2.5, 2.0, -1.0])

def softmax_t(z, T):
    z = z / T                       # temperature divides the logits
    z = z - z.max()                 # numerical stability
    p = np.exp(z)
    return p / p.sum()

for T in [0.2, 0.5, 1.0, 1.5, 3.0]:
    p = softmax_t(logits, T)
    print(f"T={T:<4}", " ".join(f"{t}:{v:.2f}" for t, v in zip(tokens, p)))

# T = 0 is treated as greedy decoding: always take the argmax
print("T=0 (greedy) ->", tokens[int(np.argmax(logits))])

# Sample 1000 times at two temperatures and count picks
for T in [0.5, 1.5]:
    picks = rng.choice(len(tokens), size=1000, p=softmax_t(logits, T))
    counts = np.bincount(picks, minlength=len(tokens))
    print(f"1000 samples at T={T}:", dict(zip(tokens, counts.tolist())))`,
          output: `T=0.2  sunny:0.99 rainy:0.01 cloudy:0.00 cold:0.00 purple:0.00
T=0.5  sunny:0.83 rainy:0.11 cloudy:0.04 cold:0.02 purple:0.00
T=1.0  sunny:0.58 rainy:0.21 cloudy:0.13 cold:0.08 purple:0.00
T=1.5  sunny:0.46 rainy:0.24 cloudy:0.17 cold:0.12 purple:0.02
T=3.0  sunny:0.33 rainy:0.24 cloudy:0.20 cold:0.17 purple:0.06
T=0 (greedy) -> sunny
1000 samples at T=0.5: {'sunny': 828, 'rainy': 120, 'cloudy': 37, 'cold': 15, 'purple': 0}
1000 samples at T=1.5: {'sunny': 493, 'rainy': 219, 'cloudy': 156, 'cold': 116, 'purple': 16}`,
          walkthrough: [
            { lines: [4, 6], note: 'Five candidate tokens with illustrative logits. "purple" is a nonsense continuation with a low score.' },
            { lines: [8, 12], note: 'Softmax with temperature: the single line z / T is the entire temperature mechanism.' },
            { lines: [14, 16], note: 'The same logits at five temperatures. Read down the "sunny" column: 0.99 → 0.33 as T rises.' },
            { lines: [18, 19], note: 'T = 0 would divide by zero, so libraries treat it as greedy decoding: take the argmax.' },
            { lines: [21, 25], note: 'Real sampling. At T = 1.5, "purple" appeared 16 times in 1,000 draws; at T = 0.5, never.' },
          ] },
      ],
    },
    {
      id: 'low-and-high',
      title: 'Low temperature vs high temperature',
      blocks: [
        { type: 'chart', kind: 'bar', title: 'Next-token probabilities at three temperatures', yLabel: 'Probability', labels: ['sunny', 'rainy', 'cloudy', 'cold', 'purple'], series: [
          { name: 'T = 0.5', values: [0.83, 0.11, 0.04, 0.02, 0.0] },
          { name: 'T = 1.0', values: [0.58, 0.21, 0.13, 0.08, 0.004] },
          { name: 'T = 1.5', values: [0.46, 0.24, 0.17, 0.12, 0.02] },
        ], caption: 'Computed from the illustrative logits above by the code in this lesson.' },
        { type: 'compare', title: 'Low vs high temperature', options: [
          { name: 'Low (about 0–0.5)', summary: 'Sharpens the distribution toward the top tokens.', pros: ['Consistent, repeatable answers', 'Fewer odd word choices', 'Good for facts, code, extraction'], cons: ['Can be repetitive and bland', 'Long outputs may loop on the same phrases'], bestFor: 'Classification, data extraction, code, factual Q&A' },
          { name: 'High (about 1–1.5+)', summary: 'Flattens the distribution so lower-ranked tokens appear more.', pros: ['Varied, creative wording', 'Different answers on each run'], cons: ['More mistakes and off-topic tokens', 'Can drift into nonsense at very high values'], bestFor: 'Brainstorming, story writing, generating many diverse candidates' },
        ], rows: [
          ['Top token probability (our example)', '0.83 at T = 0.5', '0.46 at T = 1.5'],
          ['Chance of "purple"', 'About 0', 'About 2%'],
        ], verdict: 'Temperature trades reliability for diversity. Pick the lowest value that still gives the variety the task needs.' },
      ],
    },
    {
      id: 'temperature-one-and-zero',
      title: 'Temperature = 1 and temperature = 0',
      blocks: [
        { type: 'p', text: '**T = 1** leaves the logits unchanged, so we sample from the model\'s own probabilities exactly as trained. It is the "natural" setting and a common default.' },
        { type: 'p', text: '**T = 0** would mean dividing by zero, so it is defined as the limit: as T shrinks toward 0, the top token\'s probability approaches 1. Libraries implement it as **greedy decoding**: always pick the highest-logit token (the argmax). Two practical caveats:' },
        { type: 'list', items: [
          '**Greedy is not guaranteed to be perfectly repeatable** in practice. Tiny floating-point differences (for example from how a server batches requests on GPUs) can flip a near-tie between two tokens, and one different token changes everything after it.',
          '**Greedy is not "the most correct" answer.** Picking the best token at each step does not guarantee the best overall sentence, and greedy outputs can get stuck repeating themselves.',
        ] },
        { type: 'chart', kind: 'line', title: 'Probability of the top token ("sunny") as temperature changes', xLabel: 'Temperature', yLabel: 'P(sunny)', series: [ { name: 'P(sunny)', points: [[0.2, 0.99], [0.5, 0.83], [1.0, 0.58], [1.5, 0.46], [3.0, 0.33]] } ], caption: 'From the code output. As T → 0 it approaches 1 (greedy); as T grows it approaches 1/5, the uniform share for five tokens.' },
      ],
    },
    {
      id: 'why-called-temperature',
      title: 'Why is it called temperature?',
      blocks: [
        { type: 'p', text: 'The name comes from physics. In statistical mechanics, the **Boltzmann distribution** says the probability of a system being in a state with energy E is proportional to e^(−E / kT), where T is the physical temperature. At low temperature, the system almost always sits in its lowest-energy state; at high temperature, it jumps between many states. Softmax with temperature has exactly this form, with negative logits playing the role of energy. Cold means settled and predictable; hot means jittery and random.' },
        { type: 'p', text: 'The same knob appears elsewhere in machine learning, for example in knowledge distillation, where a higher temperature softens a teacher model\'s probabilities so a student can learn from the relative scores of wrong answers.' },
      ],
    },
    {
      id: 'when-to-use-and-mistakes',
      title: 'When to use which temperature, and common mistakes',
      blocks: [
        { type: 'table', caption: 'Starting points only; the best values depend on the model and should be tested on your own task.', head: ['Task', 'Typical starting temperature', 'Why'], rows: [
          ['Extracting fields into JSON, classification', '0 to 0.2', 'One right answer; variety only adds errors'],
          ['Code generation', '0 to 0.3', 'Syntax must be exact'],
          ['Customer-support answers', '0.2 to 0.7', 'Accurate but not robotic'],
          ['General chat', 'Around 0.7 to 1.0', 'Natural variety'],
          ['Brainstorming, fiction, many diverse samples', '0.9 to 1.3', 'Diversity is the goal'],
        ] },
        { type: 'p', text: 'Ranges and defaults differ by provider: some APIs accept 0 to 2, others 0 to 1, and some reasoning-focused models fix or restrict temperature. Always check the documentation for the model you call.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Using high temperature to make answers "smarter" (it only makes them more random). Expecting T = 0 to guarantee identical output on every call. Turning temperature up to fix repetition when the real problem is the prompt. Tuning temperature and top-p aggressively at the same time, which makes the effect hard to reason about. And believing temperature changes the model\'s knowledge: it only reshapes the probabilities the model already produced.' },
        { type: 'check', question: 'Our support bot sometimes invents unusual shipping times in otherwise good answers. It runs at T = 1.3. What is a sensible first change?', answer: 'Lower the temperature (for example to about 0.3), so sampling sticks to the high-probability tokens. High temperature makes rare, wrong tokens much more likely. If invented facts persist at low temperature, the fix is better grounding (for example retrieval), not temperature.' },
      ],
    },
    {
      id: 'errors-add-up',
      title: 'Going one level deeper',
      blocks: [
        { type: 'p', text: 'So far we looked at **one** token. A real answer is hundreds of tokens, and each one is a fresh draw. A risk that looks tiny for one token grows quickly over a whole answer. Let us work it out for our nonsense word "purple".' },
        { type: 'steps', title: 'From one token to a 100-token answer', items: [
          { title: 'Chance per token', text: 'At T = 1 the probability of "purple" is about 0.0039, roughly 1 in 257.' },
          { title: 'Chance of avoiding it once', text: '`1 − 0.0039 = 0.9961`.' },
          { title: 'Avoiding it 100 times in a row', text: 'The draws are separate, so we multiply: `0.9961¹⁰⁰ ≈ 0.68`.' },
          { title: 'Read the result', text: 'About 68% of 100-token answers are clean. The other 32% contain at least one "purple", although the per-token chance was under half a percent.' },
          { title: 'Repeat for other temperatures', text: 'Only the first number changes. The table shows how fast the outcome moves.' },
        ] },
        { type: 'table', caption: 'Computed from the lesson\'s illustrative logits. For simplicity we pretend every position has this same distribution.', head: ['Temperature', 'P("purple") per token', 'Clean 100-token answers'], rows: [
          ['0.5', '0.004%', '99.6%'],
          ['0.7', '0.06%', '94.6%'],
          ['1.0', '0.39%', '67.7%'],
          ['1.5', '1.64%', '19.2%'],
          ['3.0', '6.24%', '0.2%'],
        ] },
        { type: 'chart', kind: 'bar', title: 'Share of 100-token answers with no "purple" at all', yLabel: 'Clean answers', unit: '%', labels: ['T = 0.5', 'T = 0.7', 'T = 1.0', 'T = 1.5', 'T = 3.0'], series: [
          { name: 'Clean answers', values: [99.6, 94.6, 67.7, 19.2, 0.2] },
        ], caption: 'Same numbers as the table. A small move in temperature is a large move in how often a long answer goes wrong.' },
        { type: 'p', text: 'This is why long outputs are more sensitive to temperature than short ones, and why a setting that looks fine on one-line answers can fail on long reports.' },
        { type: 'p', text: 'There is also a second way to read the formula. Dividing logits by `T` is the same as raising each **probability** to the power `1/T` and rescaling so they sum to 1. With `T = 0.5` the power is 2, so we square: `0.577² = 0.333`, `0.212² = 0.045`, `0.129² = 0.017`, `0.078² = 0.006`. These add up to about 0.401, and `0.333 / 0.401 = 0.83`, the same 83% for "sunny" we found before. Squaring hurts small numbers far more than large ones, which is exactly why low temperature starves the tail.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We measure randomness with numbers instead of looking at bars. For five temperatures we compute the "effective number of choices" the sampler really has, then write 200 short answers of 10 tokens each and count how many are different and how many contain "purple".' },
        { type: 'code', lang: 'python', title: 'practice_temperature_spread.py', code: `import numpy as np

rng = np.random.default_rng(7)
tokens = ["sunny", "rainy", "cloudy", "cold", "purple"]
logits = np.array([4.0, 3.0, 2.5, 2.0, -1.0])
PURPLE = 4                                    # index of the nonsense token

def softmax_t(z, T):
    z = z / T
    p = np.exp(z - z.max())
    return p / p.sum()

print("  T   choices  distinct  with purple")
for T in (0.2, 0.7, 1.0, 1.5, 3.0):
    p = softmax_t(logits, T)
    # Entropy measures spread; exp(entropy) = "effective number of choices"
    entropy = -np.sum(p * np.log(p))
    choices = np.exp(entropy)
    # Write 200 short "answers" of 10 tokens each at this temperature
    answers = rng.choice(len(tokens), size=(200, 10), p=p)
    distinct = len({tuple(a) for a in answers})           # different answers
    with_purple = np.mean((answers == PURPLE).any(axis=1))  # share with nonsense
    print(f"{T:4.1f}   {choices:5.2f}   {distinct:6d}   {with_purple:10.1%}")`, output: `  T   choices  distinct  with purple
 0.2    1.05        8         0.0%
 0.7    2.43      184         0.0%
 1.0    3.10      198         3.5%
 1.5    3.75      200        13.0%
 3.0    4.50      200        48.5%`, walkthrough: [
          { lines: [3, 6], note: 'The same five candidates and illustrative logits as in the lesson, with a fixed random seed.' },
          { lines: [15, 18], note: '**Entropy** is `−∑ p·ln p`: it is 0 when one token has all the probability and largest when all are equal. Its exponential reads as "the sampler behaves as if it chose evenly among this many tokens".' },
          { lines: [19, 23], note: 'For each temperature we sample 200 answers of 10 tokens. At T = 0.2 there are only 8 different answers; at T = 1.5 all 200 differ, and 13% of them contain "purple".' },
        ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Change the answer length from 10 to 100 tokens: `size=(200, 100)`. Before running, predict the "with purple" share at T = 1.0 using the table from the previous section.',
          'Add `0.05` to the list of temperatures. Predict "choices" and "distinct". Then explain why we cannot simply add `0` to the list.',
          'Raise the logit of "purple" from −1.0 to 1.5, as if the model found it half plausible. Predict what happens to the "with purple" column at T = 0.7, where it was 0.0%.',
        ] },
        { type: 'check', question: 'At T = 3.0 the effective number of choices is 4.50. There are 5 tokens. Could a higher temperature push it above 5, and what value does it approach as T goes towards 0?', answer: 'No. The most spread-out distribution over 5 tokens is the uniform one, which gives exactly 5. Raising T moves towards that limit but can never pass it. Going the other way, lowering T moves the value towards 1: a single choice, which is greedy decoding. So temperature slides the sampler between "1 real option" and "all options equal".' },
        { type: 'check', question: 'At T = 0.2 "sunny" has a probability of about 99%, yet the 200 answers were not all identical: we got 8 different ones. Why?', answer: 'Because 99% is per token, and each answer has 10 tokens. The chance that all ten draws are "sunny" is about 0.993¹⁰ ≈ 0.93. So about 7% of answers differ somewhere, which gives a handful of distinct variants. A low temperature makes output *mostly* repeatable, not identical. Only greedy decoding (T = 0) removes the sampling step completely.' },
      ],
    },
  ],
  quiz: [
    { q: 'What exactly does temperature do inside the sampling step?', options: ['It divides every logit by T before softmax', 'It removes all tokens below a probability threshold', 'It changes the model\'s weights during inference', 'It adds random noise to the input prompt'], answer: 0, explain: 'Temperature is z / T before softmax. Removing low-probability tokens is what top-k or top-p do; weights and prompts are untouched.' },
    { q: 'Two tokens have logits 2.0 and 1.0. At T = 0.5, what are the scaled logits, and does the top token become more or less likely?', options: ['1.0 and 0.5; less likely', '4.0 and 2.0; more likely', '2.5 and 1.5; unchanged', '4.0 and 2.0; less likely'], answer: 1, explain: 'Dividing by 0.5 doubles both logits, doubling the gap from 1 to 2, so after softmax the top token is more dominant.' },
    { q: 'Your JSON-extraction pipeline occasionally outputs malformed fields. It runs at T = 1.2. What should you try first?', options: ['Raise the temperature to 2.0 for more options', 'Lower the temperature to around 0 to 0.2', 'Keep T but double the max output length', 'Switch the softmax to a sigmoid'], answer: 1, explain: 'Extraction has one correct answer, so low temperature reduces random deviations. Raising temperature would make errors more frequent.' },
    { q: 'Compared with T = 1, what does T = 0 do?', options: ['It samples uniformly from all tokens, ignoring their probabilities', 'It makes the model refuse to answer, since no token is sampled', 'It picks the most likely token at every step (greedy decoding)', 'It reverses the order of the token probabilities before sampling'], answer: 2, explain: 'As T → 0 the top token\'s probability approaches 1, so T = 0 is implemented as argmax. Uniform sampling is the T → ∞ limit.' },
    { q: 'Which statement about temperature is a misconception?', options: ['Temperature never changes the ranking of tokens', 'Very high temperatures make nonsense tokens more likely', 'The name comes from the Boltzmann distribution in physics', 'Setting T = 0 guarantees byte-identical output on every API call'], answer: 3, explain: 'Greedy decoding is usually close to deterministic, but floating-point and batching effects can flip near-ties, so identical output is not guaranteed.' },
  ],
  takeaways: [
    'The model outputs logits; softmax turns them into probabilities; one token is sampled.',
    'Temperature divides logits before softmax: T < 1 sharpens, T > 1 flattens, T = 1 leaves them unchanged.',
    'Temperature never changes the token ranking, only how dominant the top tokens are.',
    'T = 0 is implemented as greedy decoding, which is near-deterministic but not guaranteed identical.',
    'Use low temperature for exact tasks (extraction, code) and higher values for creative, diverse output.',
  ],
  terms: [
    { term: 'Logit', def: 'The raw, unnormalized score the model gives each vocabulary token.' },
    { term: 'Softmax', def: 'The function that turns logits into probabilities that are positive and sum to 1.' },
    { term: 'Temperature', def: 'A number that divides the logits before softmax to control randomness.' },
    { term: 'Greedy decoding', def: 'Always choosing the single most likely next token; what T = 0 means.' },
    { term: 'Sampling', def: 'Choosing the next token at random according to its probability.' },
    { term: 'Boltzmann distribution', def: 'The physics distribution e^(−E/kT) that softmax with temperature mirrors.' },
  ],
};
