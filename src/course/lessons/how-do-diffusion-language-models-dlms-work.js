export default {
  id: 'how-do-diffusion-language-models-dlms-work',
  minutes: 27,
  hook: 'What if a language model wrote a whole paragraph at once, like a photo coming into focus, instead of one word after another?',
  summary: 'A Diffusion Language Model (DLM) generates text by starting from a sequence of blank (masked) tokens and repeatedly filling in and refining many positions in parallel, instead of predicting one next token at a time. It is trained by randomly masking parts of real text (the forward process) and learning to predict the hidden tokens (the reverse process). DLMs promise faster generation and bidirectional context, but still face quality, tooling and efficiency challenges compared with autoregressive LLMs.',
  sections: [
    {
      id: 'what-is-dlm',
      title: 'What is a Diffusion Language Model?',
      blocks: [
        { type: 'p', text: 'A **Diffusion Language Model (DLM)** is a language model that writes by **iterative refinement**. It begins with a draft that is entirely noise, for text usually a row of special `[MASK]` tokens, and in each step predicts what belongs in the masked positions, commits some of those predictions, and repeats until no masks are left. Many tokens can be decided in the same step.' },
        { type: 'p', text: 'The network inside is usually still a **Transformer**, but its attention is **bidirectional**: every position can see every other position, left and right, unlike the causal mask of a chat LLM.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a crossword', text: 'An autoregressive model fills a sentence like typing: left to right, never going back. A diffusion model fills it like a crossword: first the answers it is surest about, anywhere in the grid, and those letters then make the remaining blanks easier to solve.' },
      ],
    },
    {
      id: 'how-llms-write',
      title: 'How do today\'s language models write text?',
      blocks: [
        { type: 'p', text: 'Almost all popular LLMs are **autoregressive (AR)**: they generate one token at a time, left to right. At each step they compute a probability distribution over the next token, sample one, append it, and run again. The probability of a whole sentence is factored as `P(x₁) · P(x₂ | x₁) · P(x₃ | x₁, x₂) · …`.' },
        { type: 'viz', name: 'streaming', caption: 'Autoregressive models emit tokens one by one; total time grows with the number of tokens.' },
      ],
    },
    {
      id: 'problem-with-ar',
      title: 'The problem with the usual approach',
      blocks: [
        { type: 'list', items: [
          '**Sequential by nature.** Writing 1,000 tokens needs 1,000 forward passes, one after another. GPUs are underused during decoding because each step processes only one new token per sequence.',
          '**No going back.** Once a token is emitted it is fixed. An early mistake can derail the rest of the answer.',
          '**Left-to-right only.** The model cannot use what it plans to say later to choose earlier words. Known quirks such as the "reversal curse" (learning "A is B" but failing on "B is A") are linked to this one-directional training.',
        ] },
        { type: 'p', text: 'Diffusion offers a different trade: a fixed number of refinement steps, each of which can decide many tokens at once, with the whole sequence visible at every step.' },
      ],
    },
    {
      id: 'origin',
      title: 'Where the diffusion idea comes from',
      blocks: [
        { type: 'p', text: '**Diffusion models** made their name in image generation (DDPM in 2020, then Stable Diffusion, DALL·E 2 and others). Training adds Gaussian noise to images little by little until they become pure static (the **forward process**), and a network learns to undo one small step of noise at a time (the **reverse process**). To generate, start from random static and denoise step by step until an image appears.' },
        { type: 'viz', name: 'diffusion', caption: 'Slide through the steps: an image goes from pure noise to clean (reverse) and back (forward). Text diffusion follows the same idea with masks instead of pixel noise.' },
        { type: 'p', text: 'Text is not continuous like pixels, so "add a little Gaussian noise" does not make sense for a word. Research on **discrete diffusion** (for example D3PM in 2021, then SEDD and masked diffusion models in 2023–2024) defined noise for tokens. The approach that won out in practice is **masking**.' },
      ],
    },
    {
      id: 'noise-for-text',
      title: 'What does "noise" mean for text?',
      blocks: [
        { type: 'p', text: 'In **masked diffusion**, the noise level is a number `t` between 0 and 1. At noise level t, each token is independently replaced by `[MASK]` with probability t. At t = 0 the text is clean; at t = 1 every token is masked. A half-noised sentence has about half its words hidden.' },
        { type: 'table', caption: 'One sentence at three noise levels (each token masked independently with probability t)', head: ['Noise level t', 'Example'], rows: [
          ['0.0', 'the cat sat on the warm mat today'],
          ['0.5', 'the [MASK] [MASK] on [MASK] warm mat today'],
          ['1.0', '[MASK] [MASK] [MASK] [MASK] [MASK] [MASK] [MASK] [MASK]'],
        ] },
        { type: 'p', text: 'Other noise types exist (for example replacing tokens with random tokens), but masking is the most widely used in current large DLMs such as LLaDA.' },
      ],
    },
    {
      id: 'two-phases',
      title: 'The two phases: forward and reverse',
      blocks: [
        { type: 'compare', title: 'Forward vs reverse process', options: [
          { name: 'Forward (noising)', summary: 'Corrupt clean text by masking tokens at a random level t.', pros: ['Fixed rule, nothing to learn', 'Creates unlimited training examples from any text'], cons: ['Only used during training'], bestFor: 'Making training inputs' },
          { name: 'Reverse (denoising)', summary: 'A network predicts the original tokens at all masked positions.', pros: ['This is the learned model', 'Predicts every masked position in parallel'], cons: ['Each step is a full forward pass over the whole sequence'], bestFor: 'Training target and, repeated, text generation' },
        ], verdict: 'Training teaches the reverse process on examples produced by the forward process; generation runs the reverse process many times starting from all masks.' },
        { type: 'formula', expr: 'L = 𝔼ₜ,ₓ [ (1/t) · ∑ᵢ∈masked −log p_θ(xᵢ | xₜ) ]', where: [ ['t', 'noise level, drawn uniformly from (0, 1]'], ['xₜ', 'the sentence with tokens masked at rate t'], ['p_θ(xᵢ | xₜ)', 'the model\'s probability for the true token at masked position i'], ['1/t', 'weighting so that every noise level contributes fairly'] ], caption: 'The masked-diffusion training loss used by models such as LLaDA: cross-entropy on masked positions only, reweighted by noise level.' },
        { type: 'p', text: 'If this reminds us of BERT, that is right: BERT also predicts masked tokens. The differences are that BERT always masks about 15%, whereas a DLM trains on **every** masking rate from almost 0% to 100%, and that this lets a DLM generate text from scratch, which BERT cannot do well.' },
      ],
    },
    {
      id: 'generation-steps',
      title: 'How a DLM actually generates text, step by step',
      blocks: [
        { type: 'steps', title: 'Generating an answer with a masked DLM', items: [
          { title: 'Choose a length and step count', text: 'Append, say, 256 `[MASK]` tokens after the prompt and pick a number of steps, e.g. 64 (so about 4 tokens are committed per step).' },
          { title: 'Predict everything', text: 'One forward pass predicts a token and a confidence for every masked position at once, using the prompt and all already-filled tokens on both sides.' },
          { title: 'Commit the best', text: 'Keep the most confident predictions (or a random subset) and leave the rest masked. Committing low-confidence guesses early tends to cause errors.' },
          { title: 'Optionally remask', text: 'Some samplers "remask" low-confidence tokens that were filled earlier, letting the model revise them later. This is a way to fix mistakes AR models cannot.' },
          { title: 'Repeat', text: 'Run the next step with the updated sequence. Noise goes down step by step.' },
          { title: 'Finish', text: 'When no masks remain, the text is done. Unused positions are typically filled with end-of-text padding.' },
        ] },
        { type: 'check', question: 'A DLM must produce 512 tokens and uses 128 denoising steps. On average how many tokens are committed per step? What happens to quality if we cut to 16 steps?', answer: '512 / 128 = 4 tokens per step. With 16 steps it must commit 32 tokens per step, deciding many tokens without seeing each other\'s final values; quality usually drops. Fewer steps = faster but less accurate.' },
      ],
    },
    {
      id: 'tiny-example',
      title: 'A tiny end-to-end example',
      blocks: [
        { type: 'p', text: 'Target: "the cat sat on the warm mat today" (8 tokens). We start with 8 masks and commit the 2 most confident predictions per step.' },
        { type: 'matrix', title: 'Which positions are revealed after each step (1 = filled)', rows: ['step 1', 'step 2', 'step 3', 'step 4'], cols: ['the', 'cat', 'sat', 'on', 'the', 'warm', 'mat', 'today'], values: [
          [1, null, null, 1, null, null, null, null],
          [1, 1, 1, 1, null, null, null, null],
          [1, 1, 1, 1, 1, null, 1, null],
          [1, 1, 1, 1, 1, 1, 1, 1],
        ], format: 'int', caption: 'From the code run below. Tokens appear out of order; anchors like "the" and "on" come first and help fill their neighbours.' },
      ],
    },
    {
      id: 'code-walkthrough',
      title: 'A simple code-style walk-through',
      blocks: [
        { type: 'p', text: 'The script shows both phases. The "denoiser" is a stand-in that knows the answer and fakes confidence (higher when neighbours are revealed); a real DLM is a trained Transformer. The control flow, however, is the real sampling loop.' },
        { type: 'code', lang: 'python', title: 'toy_masked_diffusion.py', code: `import numpy as np
rng = np.random.default_rng(3)
target = "the cat sat on the warm mat today".split()
M = "____"

# Forward process: mask each token independently with probability t
for t in [0.0, 0.5, 1.0]:
    noisy = [M if rng.random() < t else w for w in target]
    print(f"forward t={t:.1f}: {' '.join(noisy)}")

def toy_denoiser(seq):
    # Stand-in for the trained network: predicts every masked slot at once and
    # is more confident when neighbouring tokens are already revealed.
    preds = {}
    for i, w in enumerate(seq):
        if w == M:
            known = sum(1 for j in (i - 1, i + 1) if 0 <= j < len(seq) and seq[j] != M)
            preds[i] = (target[i], 0.4 + 0.25 * known + 0.1 * rng.random())
    return preds

# Reverse process: start fully masked, reveal the 2 most confident tokens per step
seq, steps = [M] * len(target), 0
while M in seq:
    preds = toy_denoiser(seq)
    best = sorted(preds, key=lambda i: preds[i][1], reverse=True)[:2]
    for i in best:
        seq[i] = preds[i][0]
    steps += 1
    print(f"reverse step {steps}: {' '.join(seq)}")
print(f"{len(target)} tokens in {steps} denoising steps (autoregressive would need {len(target)})")`, output: `forward t=0.0: the cat sat on the warm mat today
forward t=0.5: the ____ ____ on ____ warm mat today
forward t=1.0: ____ ____ ____ ____ ____ ____ ____ ____
reverse step 1: the ____ ____ on ____ ____ ____ ____
reverse step 2: the cat sat on ____ ____ ____ ____
reverse step 3: the cat sat on the ____ mat ____
reverse step 4: the cat sat on the warm mat today
8 tokens in 4 denoising steps (autoregressive would need 8)`,
          walkthrough: [
            { lines: [6, 9], note: 'Forward process: each token is masked with probability t. This is how training examples are made.' },
            { lines: [11, 19], note: 'The denoiser predicts all masked positions in one call, each with a confidence. Here confidence rises when neighbours are known, mimicking how context helps.' },
            { lines: [21, 28], note: 'Reverse process: start all-masked, commit the 2 most confident predictions per step, repeat until done.' },
            { lines: [29, 29], note: '8 tokens in 4 steps. Each step is a full pass over the sequence, so fewer steps only means faster generation if passes are not much more expensive.' },
          ] },
      ],
    },
    {
      id: 'dlm-vs-ar',
      title: 'DLMs vs the usual language models',
      blocks: [
        { type: 'compare', title: 'Autoregressive LLM vs Diffusion LM', options: [
          { name: 'Autoregressive (AR)', summary: 'One token at a time, left to right, causal attention.', pros: ['Mature: KV cache, speculative decoding, huge tooling', 'Top quality at scale today', 'Natural variable-length output'], cons: ['Sequential decoding', 'Cannot revise emitted tokens'], bestFor: 'General chat, reasoning, most production use' },
          { name: 'Diffusion (DLM)', summary: 'Start masked, refine many tokens in parallel over steps, bidirectional attention.', pros: ['Many tokens per step: potentially much faster', 'Sees both directions; can revise via remasking', 'Natural for infilling and editing'], cons: ['Standard KV caching does not directly apply', 'Output length often set in advance', 'Quality at frontier scale still catching up'], bestFor: 'Fast code completion, infilling, latency-critical generation' },
        ], rows: [
          ['Forward passes for N tokens', 'N', 'Number of steps (can be ≪ N)'],
          ['Attention', 'Causal', 'Bidirectional'],
          ['Training target', 'Next token', 'Masked tokens at all noise levels'],
          ['Speed/quality knob', 'Model size, speculative decoding', 'Number of denoising steps'],
        ], verdict: 'AR remains the default; DLMs are a serious challenger where speed and editing matter.' },
      ],
    },
    {
      id: 'advantages',
      title: 'Advantages of DLMs',
      blocks: [
        { type: 'list', items: [
          '**Parallel generation:** with fewer steps than tokens, DLMs can be very fast. Inception Labs reported over 1,000 tokens per second on an H100 for its Mercury Coder models (Feb 2025), and Google\'s experimental Gemini Diffusion (announced May 2025) was reported at roughly 1,000–1,500 tokens per second. These are vendor figures.',
          '**Bidirectional context:** every token is chosen while seeing both sides, which suits infilling ("fill in the middle of this function") and editing.',
          '**Self-correction:** remasking lets the model revise earlier choices.',
          '**Controllable speed:** the step count is a dial between speed and quality.',
          '**Less directional bias:** LLaDA\'s authors reported better results than a comparable AR model on a reversed-poem completion task.',
        ] },
      ],
    },
    {
      id: 'limitations',
      title: 'Limitations of DLMs',
      blocks: [
        { type: 'list', items: [
          '**Expensive steps:** each step runs the whole sequence through the network, and bidirectional attention prevents straightforward KV caching. Research on approximate caching and block-wise ("semi-autoregressive") diffusion addresses this.',
          '**Parallel decoding errors:** tokens filled in the same step are predicted independently. If "New York" and "Los Angeles" are both plausible, one step may produce "New Angeles". More steps reduce this.',
          '**Fixed length:** many DLMs need the output length decided up front; too short truncates, too long wastes compute.',
          '**Quality gap at scale:** open DLMs such as LLaDA 8B (trained from scratch on 2.3T tokens) were reported competitive with similar-size AR models, but the strongest frontier models remain autoregressive.',
          '**Ecosystem:** serving engines, fine-tuning recipes and RL methods are far more mature for AR models.',
        ] },
        { type: 'callout', tone: 'warn', title: 'Common misconception', text: '"Diffusion LMs are always faster." Only if the step count is much smaller than the number of tokens and each step is not proportionally more expensive. With many steps, long outputs and no caching, a DLM can be slower than a well-optimised AR model.' },
        { type: 'check', question: 'A DLM fills "I flew to ___ ___" with 1 step for both blanks. Why might it produce "San York"?', answer: 'In one step both positions are predicted independently from the same context. Each may pick its most likely token ("San" from San Francisco, "York" from New York) without seeing the other\'s choice. More steps let the second token condition on the first.' },
      ],
    },
    {
      id: 'current-state',
      title: 'The current state',
      blocks: [
        { type: 'timeline', title: 'Milestones in text diffusion', items: [
          { when: '2021', title: 'D3PM', text: 'Discrete diffusion defined for tokens, including masking as a noise type.' },
          { when: '2023–2024', title: 'SEDD and masked diffusion models', text: 'Better objectives make discrete diffusion competitive with small AR models.' },
          { when: 'Feb 2025', title: 'LLaDA 8B and Mercury Coder', text: 'An 8B masked DLM trained from scratch; the first commercial diffusion LLM, focused on fast code.' },
          { when: 'May 2025', title: 'Gemini Diffusion', text: 'Google DeepMind shows an experimental text diffusion model with very fast generation.' },
          { when: '2025–2026', title: 'Scaling and hybrids', text: 'Larger open DLMs, models adapted from AR checkpoints, block diffusion and faster samplers.' },
        ] },
        { type: 'callout', tone: 'example', title: 'Where DLMs are used today', text: 'The clearest commercial use so far is fast code generation and editing, where latency matters and infilling is natural. For general chat and deep reasoning, autoregressive models still dominate as of 2026, and this area is moving quickly.' },
      ],
    },
    {
      id: 'worked-example-step-budget',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: "Is a diffusion model faster or slower for a given answer? Let us count for an output of 256 tokens. We use a simple unit: one **position-pass** is one token position going through the network once. The counts are illustrative and ignore the prompt." },
        { type: 'table', caption: "Work to produce 256 tokens (illustrative count)", head: ['Setup', 'Rounds, one after another', 'Positions per round', 'Total position-passes', 'Tokens committed per round'], rows: [
          ['Autoregressive with a KV cache', '256', '1', '256', '1'],
          ['Diffusion, 256 steps', '256', '256', '65,536', '1'],
          ['Diffusion, 32 steps', '32', '256', '8,192', '8'],
          ['Diffusion, 8 steps', '8', '256', '2,048', '32'],
        ] },
        { type: 'steps', title: "Reading the table", items: [
          { title: "Total work", text: "Every diffusion row does more arithmetic than the autoregressive row, because each step re-processes all 256 positions." },
          { title: "Waiting time", text: "Rounds run one after another, but the positions inside a round run in parallel on a GPU. With 32 steps there are 32 rounds to wait for instead of 256." },
          { title: "The speed-up", text: "If a round over 256 positions takes about as long as a round over 1 position, 32 steps is roughly 8 times faster. If the wide round is much slower, the gain shrinks." },
          { title: "The price", text: "At 8 steps, 32 tokens are fixed per round without seeing each other's final choice. That is where quality drops." },
        ] },
        { type: 'p', text: "We can put a number on that last risk. Suppose two neighbouring blanks must spell a city, and the model thinks New York has probability 0.5, Los Angeles 0.3 and San Diego 0.2 (illustrative). Filled in one step, each blank is sampled on its own. The pair matches only when both happen to pick the same city: 0.5² + 0.3² + 0.2² = 0.38. So 62% of the time we get a name like “New Diego”. Filled in two steps, the second blank sees the first, and the mismatch disappears." },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: "We will measure the parallel decoding error ourselves. Two masked positions must form a city name. We fill them in one step (each on its own) and in two steps (the second sees the first), 10,000 times each, and count the invalid names." },
        { type: 'code', lang: 'python', title: 'practice_parallel_error.py', code: `import random
random.seed(1)

# Joint distribution of a two-token city name (illustrative probabilities)
cities = {("New", "York"): 0.5, ("Los", "Angeles"): 0.3, ("San", "Diego"): 0.2}
first = {a: p for (a, _), p in cities.items()}     # what token 1 looks like alone
second = {b: p for (_, b), p in cities.items()}    # what token 2 looks like alone

def pick(dist):
    return random.choices(list(dist), weights=list(dist.values()))[0]

def one_step():
    # both masks filled in the same step: each token is sampled on its own
    return pick(first), pick(second)

def two_steps():
    # step 1 commits token 1; step 2 sees it and picks the matching token 2
    a = pick(first)
    return a, next(b for (x, b) in cities if x == a)

n = 10_000
for name, sampler in [("1 step (parallel)", one_step), ("2 steps", two_steps)]:
    outs = [sampler() for _ in range(n)]
    bad = [o for o in outs if o not in cities]
    example = " ".join(bad[0]) if bad else "none"
    print(f"{name:18s} invalid names: {len(bad) / n:.1%}  example: {example}")
print("theory for 1 step:", f"{1 - sum(p * p for p in cities.values()):.1%}")`, output: `1 step (parallel)  invalid names: 62.3%  example: New Diego
2 steps            invalid names: 0.0%  example: none
theory for 1 step: 62.0%`,
          walkthrough: [
            { lines: [4, 7], note: "The true distribution is over pairs of tokens. From it we derive what each position looks like on its own: the first token is New, Los or San; the second is York, Angeles or Diego, with the same probabilities." },
            { lines: [9, 14], note: "One step: both positions are sampled independently from their own distributions. Each choice is reasonable alone, but nothing ties them together." },
            { lines: [16, 19], note: "Two steps: commit the first token, then choose the second given the first. The dependency is respected." },
            { lines: [21, 27], note: "Sample 10,000 names each way. One step gives 62.3% invalid names, matching the 62% we computed by hand. Two steps give none." },
          ] },
        { type: 'p', text: "Now change it:" },
        { type: 'list', items: [
          "Change the probabilities to `0.9`, `0.05` and `0.05`. Predict the invalid rate for the one-step sampler with the formula on the last line, then run it.",
          "Add a fourth city, `(\"Las\", \"Vegas\")`, and give all four a probability of `0.25`. Predict the new invalid rate.",
          "Rewrite `two_steps` so it commits the second token first and then picks the matching first token. Predict the invalid rate. Does the order matter for a model that sees both directions?",
        ] },
        { type: 'check', question: "With probabilities 0.9, 0.05 and 0.05, the one-step invalid rate falls to about 18.5%. What does this say about when it is safe to commit many tokens in one step?", answer: "It is safe when the model is already confident. If one option dominates, independent choices almost always agree, so little is lost. When several options are equally likely, independent choices clash. That is why samplers commit the most confident positions first and leave uncertain ones for later steps." },
        { type: 'check', question: "In the table, diffusion with 32 steps does 8,192 position-passes while cached autoregressive decoding does 256, yet the diffusion model can finish first. How?", answer: "Finishing time depends on how many rounds must run one after another, not only on total arithmetic. The 256 positions of a round are processed in parallel on the GPU, so the model waits for 32 rounds instead of 256. It does more work but less waiting. The advantage disappears if each wide round is much slower than a one-token round." },
      ],
    },
  ],
  quiz: [
    { q: 'How does a masked diffusion language model generate text?', options: ['From all masks, it fills and refines many positions per step', 'It predicts exactly one token at a time, from left to right', 'It retrieves whole sentences from a large database of text', 'It adds Gaussian noise to word embeddings and then sorts them'], answer: 0, explain: 'DLMs iteratively denoise a fully masked sequence. Left-to-right one-token generation is the autoregressive approach.' },
    { q: 'In masked diffusion training at noise level t = 0.25, what happens to a 20-token sentence?', options: ['Exactly the first 5 tokens are always masked', 'Every token is swapped for a random word', 'Five extra mask tokens are added at the end', 'Each token is masked with probability 0.25'], answer: 3, explain: 'Each token is masked independently with probability t; on average 0.25 × 20 = 5 tokens, but not always exactly 5 and not at fixed positions.' },
    { q: 'A DLM uses 64 steps to produce 256 tokens. Roughly how many tokens are committed per step?', options: ['1', '64', '4', '256'], answer: 2, explain: '256 / 64 = 4. Fewer steps would mean more tokens per step and usually lower quality.' },
    { q: 'Which is a genuine advantage of DLMs over autoregressive LLMs?', options: ['Standard KV caching works more easily than in AR models', 'They always produce higher-quality text than AR models', 'They see both sides and can revise tokens by remasking', 'They do not need a Transformer or any attention at all'], answer: 2, explain: 'Bidirectional attention and remasking are real advantages. KV caching is actually harder for DLMs, and quality is not always higher.' },
    { q: 'Our team switches to a DLM expecting more speed, but with 512 steps for 512-token outputs it is slower than our AR model. Why?', options: ['Diffusion language models cannot run on GPUs at all', 'One token per step loses the parallel gain; steps cost more', 'The tokenizer is incompatible with diffusion sampling', 'Diffusion models only work for images, never for text'], answer: 1, explain: 'Speed comes from committing many tokens per step. One token per step removes that benefit, and each step is a full bidirectional pass.' },
  ],
  takeaways: [
    'DLMs start from a fully masked sequence and refine many tokens in parallel over several steps.',
    'Training masks real text at random noise levels (forward) and learns to predict the masked tokens (reverse).',
    'Bidirectional attention enables infilling and self-correction through remasking.',
    'Speed depends on committing many tokens per step; too few steps hurts quality.',
    'AR models still lead on quality and tooling; DLMs are strongest today in fast code generation and editing.',
  ],
  terms: [
    { term: 'Diffusion Language Model (DLM)', def: 'A model that generates text by iteratively denoising a masked sequence, many tokens per step.' },
    { term: 'Autoregressive model', def: 'A model that generates one token at a time, each conditioned on the previous ones.' },
    { term: 'Forward process', def: 'The fixed noising procedure that masks tokens at a chosen noise level.' },
    { term: 'Reverse process', def: 'The learned denoising step that predicts the original tokens at masked positions.' },
    { term: 'Noise level (t)', def: 'The probability that each token is masked; 0 is clean text, 1 is fully masked.' },
    { term: 'Remasking', def: 'Re-hiding low-confidence filled tokens so the model can revise them in later steps.' },
    { term: 'Bidirectional attention', def: 'Attention in which every position can see positions on both sides.' },
  ],
};
