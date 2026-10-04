export default {
  id: 'recurrent-neural-network',
  minutes: 20,
  hook: 'How can a network read "the movie was not good" one word at a time and still remember the "not" by the time it reaches "good"?',
  summary: 'A recurrent neural network (RNN) processes a sequence one step at a time and carries a hidden state, a small vector of memory, from each step to the next. The same weights are reused at every step: `hₜ = tanh(Wₓₕxₜ + Wₕₕhₜ₋₁ + b)`. RNNs are trained with backpropagation through time, struggle with long-range memory because gradients vanish or explode, and led to LSTMs, GRUs and eventually Transformers.',
  sections: [
    {
      id: 'why-sequences',
      title: 'Why ordinary networks struggle with sequences',
      blocks: [
        { type: 'p', text: 'The networks we have seen so far are **feed-forward**: a fixed-size input goes in, flows through the layers once, and an output comes out. That works for a house described by three numbers. But much of the world arrives as a **sequence**, where order matters and length varies: the words of a sentence, the notes of a melody, a stock price every minute, a user\'s clicks on a website.' },
        { type: 'p', text: 'Our running example is a sentiment classifier for product reviews. "The movie was not good" and "The movie was good, not bad" use almost the same words, but mean opposite things because of their order. A feed-forward network that sees a bag of words, or a fixed-width window, loses that order, and it cannot easily handle reviews of 5 words and 500 words with the same weights.' },
        { type: 'p', text: 'We want a model that: (1) reads inputs in order, (2) handles any length, (3) remembers what it has seen so far, and (4) reuses the same knowledge at every position, since "not" means the same thing at word 3 and word 30. A **recurrent neural network** does exactly that.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like reading with a notepad', text: 'Imagine reading a long review aloud, one word at a time, while keeping a tiny notepad with room for only a few notes. After each word you rewrite the notepad based on what it said before and the word you just read. At the end, you judge the review using only the notepad. The notepad is the RNN\'s hidden state; your rule for updating it is the RNN\'s weights.' },
      ],
    },
    {
      id: 'core-idea',
      title: 'The core idea: a loop with memory',
      blocks: [
        { type: 'p', text: 'An RNN has a **hidden state** `hₜ`: a vector of numbers that summarises everything the network has read up to step `t`. At each **time step** (each position in the sequence) it takes two things, the current input `xₜ` and the previous hidden state `hₜ₋₁`, and combines them into a new hidden state. Optionally it also produces an output `yₜ`.' },
        { type: 'formula', expr: 'hₜ = tanh(Wₓₕ · xₜ + Wₕₕ · hₜ₋₁ + bₕ)        yₜ = Wₕᵧ · hₜ + bᵧ', where: [['xₜ', 'the input at step t, e.g. a word embedding vector'], ['hₜ₋₁', 'the hidden state from the previous step (h₀ is usually all zeros)'], ['Wₓₕ', 'weights from input to hidden'], ['Wₕₕ', 'recurrent weights from the previous hidden state to the new one'], ['Wₕᵧ', 'weights from hidden state to output'], ['tanh', 'activation squashing values into (−1, 1)']], caption: 'This classic form is often called a vanilla or Elman RNN.' },
        { type: 'p', text: 'The key word is **recurrent**: the output of the hidden layer feeds back into itself at the next step. And crucially, `Wₓₕ`, `Wₕₕ` and `Wₕᵧ` are **shared across all time steps**. A 5-word review and a 500-word review use exactly the same parameters, just applied 5 or 500 times. This **weight sharing** is what lets an RNN handle any length and generalise patterns across positions.' },
        { type: 'flow', title: 'An RNN unrolled over four time steps', nodes: [
          { label: 'h₀ = 0', detail: 'Start with an empty memory: a vector of zeros.' },
          { label: 'Step 1: "the"', detail: 'h₁ = tanh(Wₓₕ·x₁ + Wₕₕ·h₀ + b). The same weights will be used in every step.' },
          { label: 'Step 2: "movie"', detail: 'h₂ combines "movie" with h₁, which already encodes "the".' },
          { label: 'Step 3: "was not"', detail: 'Each new word updates the memory. The hidden state now has to carry the negation forward.' },
          { label: 'Step 4: "good"', detail: 'h₄ summarises the whole review. A classifier reads h₄ and outputs positive or negative.' },
        ] },
        { type: 'p', text: '**Unrolling** means drawing the loop as a chain, one copy of the cell per time step. It is only a picture: there is one set of weights, used repeatedly. But it is the right picture for understanding both the forward computation and training.' },
      ],
    },
    {
      id: 'step-by-step',
      title: 'How it works, step by step with numbers',
      blocks: [
        { type: 'steps', title: 'One RNN time step', items: [
          { title: 'Read the input', text: 'Take xₜ, for text usually an embedding vector representing the token.' },
          { title: 'Recall the memory', text: 'Take hₜ₋₁ from the previous step (zeros at the start).' },
          { title: 'Mix', text: 'Compute Wₓₕ·xₜ + Wₕₕ·hₜ₋₁ + b: new information plus transformed old memory.' },
          { title: 'Squash', text: 'Apply tanh, giving the new hidden state hₜ with values in (−1, 1).' },
          { title: 'Optionally output', text: 'yₜ = Wₕᵧ·hₜ. Some tasks need an output every step (tagging each word), others only at the end (sentiment).' },
          { title: 'Pass it on', text: 'hₜ becomes the memory for step t + 1. Repeat until the sequence ends.' },
        ] },
        { type: 'p', text: 'Let us run a tiny RNN by hand with hidden size 2 and a one-number input. Weights: `Wₓₕ = [0.5, −0.3]ᵀ`, `Wₕₕ = [[0.8, 0], [0.2, 0.5]]`, `b = 0`, `Wₕᵧ = [1, −1]`. The input sequence is `[1, 0, 0, 2]`.' },
        { type: 'list', items: [
          '**t = 1, x = 1:** `Wₓₕ·1 = [0.5, −0.3]`, `Wₕₕ·h₀ = [0, 0]`. `h₁ = tanh([0.5, −0.3]) = [0.462, −0.291]`. `y₁ = 0.462 + 0.291 = 0.753`.',
          '**t = 2, x = 0:** no new input, so only memory: `Wₕₕ·h₁ = [0.8×0.462, 0.2×0.462 + 0.5×(−0.291)] = [0.370, −0.053]`. `h₂ = tanh(...) = [0.354, −0.053]`. The memory of the first input is still there, but fading.',
          '**t = 3, x = 0:** it fades further: `h₃ = [0.276, 0.044]`.',
          '**t = 4, x = 2:** a strong new input dominates: `h₄ = [0.840, −0.480]`.',
        ] },
        { type: 'p', text: 'Notice how the information from step 1 shrinks at every step when no new input arrives (0.462 → 0.354 → 0.276 in the first unit). That fading is a small preview of the RNN\'s biggest weakness.' },
        { type: 'check', question: 'Why can the same RNN process a 5-word review and a 500-word review, when a feed-forward network with a fixed input size cannot?', answer: 'Because the RNN applies the **same weights** at every time step and carries a fixed-size hidden state. Longer input just means more steps, not more parameters. A feed-forward network\'s first weight matrix has a fixed number of inputs.' },
      ],
    },
    {
      id: 'shapes',
      title: 'Input and output shapes: what RNNs can do',
      blocks: [
        { type: 'table', caption: 'Common RNN configurations', head: ['Pattern', 'Input → output', 'Example'], rows: [
          ['Many-to-one', 'A sequence → one answer from the last hidden state', 'Review sentiment, spam detection'],
          ['Many-to-many (aligned)', 'One output per input step', 'Part-of-speech tagging, per-frame speech labels'],
          ['One-to-many', 'One input → a generated sequence', 'Image captioning (image features seed h₀)'],
          ['Many-to-many (encoder–decoder)', 'Read a whole sequence, then generate another of different length', 'Machine translation (the 2014 "sequence to sequence" approach)'],
          ['Generation (language model)', 'Each step predicts the next token, which becomes the next input', 'Character-level text generation'],
        ] },
        { type: 'p', text: 'Two common extensions: a **bidirectional RNN** runs one RNN left-to-right and another right-to-left and combines their states, so each position sees both past and future context (useful for tagging, not for generating text). A **stacked (deep) RNN** feeds the hidden states of one RNN layer as the inputs to another.' },
      ],
    },
    {
      id: 'training',
      title: 'Training: backpropagation through time',
      blocks: [
        { type: 'p', text: 'RNNs are trained with the same backpropagation we already know, applied to the **unrolled** network. Because the weights are shared, the gradient for `Wₕₕ` is the **sum** of its gradients at every time step. This is called **backpropagation through time (BPTT)**.' },
        { type: 'p', text: 'Here is the catch. To learn that the "not" at step 3 should flip the meaning of "good" at step 50, the error at the end must flow back through 47 steps. By the chain rule, that gradient includes a product of 47 factors, each roughly `Wₕₕ` times a tanh derivative (which is at most 1). Multiply many numbers smaller than 1 and you get almost zero: the **vanishing gradient problem**. Multiply many numbers larger than 1 and you get a huge number: the **exploding gradient problem**.' },
        { type: 'formula', expr: '∂hₜ/∂h₀ = ∏ₖ₌₁ᵗ diag(1 − hₖ²) · Wₕₕ', caption: 'A product of t matrices. Its size shrinks or grows roughly exponentially with t, depending on how large Wₕₕ is.' },
        { type: 'code', lang: 'python', title: 'rnn_demo.py', code: `import numpy as np

# Part 1: a tiny RNN reading a sequence one step at a time (hidden size 2)
W_xh = np.array([[0.5], [-0.3]])          # input -> hidden   (2x1)
W_hh = np.array([[0.8, 0.0], [0.2, 0.5]]) # hidden -> hidden  (2x2), shared by ALL steps
b_h = np.zeros((2, 1))
W_hy = np.array([[1.0, -1.0]])            # hidden -> output  (1x2)

h = np.zeros((2, 1))                      # h_0: empty memory
for t, x in enumerate([1.0, 0.0, 0.0, 2.0], start=1):
    h = np.tanh(W_xh * x + W_hh @ h + b_h)    # h_t = tanh(W_xh x_t + W_hh h_(t-1) + b)
    y = (W_hy @ h).item()
    print(f"t={t} x={x}  h={h.ravel().round(3)}  y={y:+.3f}")

# Part 2: how much does h_T still depend on h_0? (gradient through time)
rng = np.random.default_rng(0)
for scale in (0.5, 1.0, 1.5):
    W = scale * np.linalg.qr(rng.normal(size=(16, 16)))[0]   # orthogonal x scale
    h, J = rng.normal(0, 0.1, (16, 1)), np.eye(16)
    norms = []
    for t in range(1, 51):
        h = np.tanh(W @ h)
        J = (1 - h ** 2) * W @ J          # chain rule: dh_t/dh_0 = diag(tanh') W dh_(t-1)/dh_0
        if t in (1, 10, 50):
            norms.append(f"{np.linalg.norm(J, 2):.2e}")
    print(f"recurrent scale {scale}: |dh_t/dh_0| at t=1,10,50 ->", norms)`, output: `t=1 x=1.0  h=[ 0.462 -0.291]  y=+0.753
t=2 x=0.0  h=[ 0.354 -0.053]  y=+0.407
t=3 x=0.0  h=[0.276 0.044]  y=+0.232
t=4 x=2.0  h=[ 0.84 -0.48]  y=+1.320
recurrent scale 0.5: |dh_t/dh_0| at t=1,10,50 -> ['5.00e-01', '9.76e-04', '8.88e-16']
recurrent scale 1.0: |dh_t/dh_0| at t=1,10,50 -> ['1.00e+00', '9.62e-01', '8.13e-01']
recurrent scale 1.5: |dh_t/dh_0| at t=1,10,50 -> ['1.50e+00', '2.86e+01', '2.26e+02']`, walkthrough: [
          { lines: [3, 7], note: 'The tiny RNN from the hand calculation. W_hh is the recurrent matrix used at every step.' },
          { lines: [9, 13], note: 'The forward loop: one line of math per step. The printed hidden states match the numbers we computed by hand.' },
          { lines: [15, 20], note: 'A 16-unit RNN whose recurrent matrix is an orthogonal matrix times a scale, so we control how much it stretches vectors.' },
          { lines: [21, 23], note: 'Run 50 steps and apply the chain rule as we go: J holds ∂hₜ/∂h₀, the influence of the starting state on the current one.' },
          { lines: [24, 26], note: 'Scale 0.5: influence vanishes to ~10⁻¹⁵ after 50 steps. Scale 1.5: it grows to over 200. Only around 1.0 does it stay usable.' },
        ] },
        { type: 'p', text: 'The output makes the problem concrete. With a recurrent scale of 0.5, by step 50 the hidden state is essentially independent of the start: the network cannot learn long-range patterns because no gradient signal survives. With 1.5, the gradients grow and training becomes unstable. Keeping everything balanced at exactly the right scale is impractical, so better architectures were needed.' },
        { type: 'callout', tone: 'tip', title: 'Practical fixes', text: '**Gradient clipping** (rescale the gradient whenever its norm exceeds a threshold, e.g. 1.0) handles exploding gradients and is standard for RNN training. **Truncated BPTT** only backpropagates through the last k steps (say 100) to save memory and time, at the cost of not learning dependencies longer than k. Vanishing gradients need an architectural fix: gates.' },
      ],
    },
    {
      id: 'lstm-gru',
      title: 'LSTM and GRU: RNNs with gates',
      blocks: [
        { type: 'p', text: 'The **Long Short-Term Memory (LSTM)** network, introduced by Sepp Hochreiter and Jürgen Schmidhuber in 1997, adds a separate **cell state** that runs along the sequence with only small, controlled changes, plus **gates**: small sigmoid layers that output numbers between 0 and 1 and act like valves.' },
        { type: 'list', items: [
          '**Forget gate:** how much of the old cell state to keep.',
          '**Input gate:** how much of the new candidate information to write.',
          '**Output gate:** how much of the cell state to expose as the hidden state.',
        ] },
        { type: 'p', text: 'Because the cell state is updated by *adding* gated information rather than by repeatedly multiplying through a squashing function, gradients can flow across many more steps when the forget gate stays near 1. The **Gated Recurrent Unit (GRU)**, proposed by Cho and colleagues in 2014, is a simpler variant with two gates (update and reset) and no separate cell state; it often performs similarly to an LSTM with fewer parameters.' },
        { type: 'compare', title: 'Vanilla RNN vs LSTM vs GRU', options: [
          { name: 'Vanilla RNN', summary: 'One tanh layer updates the hidden state.', pros: ['Simplest and fastest per step', 'Easy to understand'], cons: ['Forgets after a short span (vanishing gradients)'], bestFor: 'Teaching, very short sequences' },
          { name: 'LSTM', summary: 'Cell state plus forget, input and output gates.', pros: ['Remembers much longer', 'Robust, very widely used before Transformers'], cons: ['About 4× the parameters of a vanilla RNN of the same size', 'Still sequential'], bestFor: 'Longer sequences, time series, speech' },
          { name: 'GRU', summary: 'Update and reset gates, no separate cell state.', pros: ['Fewer parameters than LSTM', 'Often similar accuracy'], cons: ['Slightly less expressive in some tasks'], bestFor: 'A lighter alternative to LSTM' },
        ], verdict: 'If you use a recurrent model today, it is usually an LSTM or GRU rather than a vanilla RNN.' },
      ],
    },
    {
      id: 'rnn-vs-transformer',
      title: 'RNNs vs Transformers',
      blocks: [
        { type: 'p', text: 'Even LSTMs have two deep limits. First, **sequential computation**: step t cannot start until step t − 1 finishes, so you cannot spread one sequence across thousands of GPU cores during training. Second, the **bottleneck**: everything the model knows about the past must squeeze through one fixed-size hidden vector.' },
        { type: 'p', text: '**Attention** removed the bottleneck by letting the model look back at all previous positions directly, and the **Transformer** (2017) dropped recurrence entirely, processing all tokens of a training sequence in parallel. That is why today\'s large language models are Transformers. RNNs still have one advantage: generating each new token costs the same small, constant amount of memory and compute, whereas a Transformer\'s attention must look over a growing context. This has motivated newer recurrent-style designs, such as state-space models and linear-attention RNNs, that try to combine parallel training with cheap recurrent inference.' },
        { type: 'viz', name: 'rnn-vs-transformer', caption: 'Watch the race: the RNN must read tokens strictly one after another, while the Transformer processes the whole sequence at once during training.' },
        { type: 'timeline', title: 'From simple RNNs to Transformers', items: [
          { when: '1990', title: 'Elman network', text: 'Jeffrey Elman\'s simple recurrent network popularises the hidden-state loop. Backpropagation through time is described around the same period.' },
          { when: '1997', title: 'LSTM', text: 'Hochreiter and Schmidhuber add a cell state and gates to fight vanishing gradients.' },
          { when: '2014', title: 'GRU and seq2seq', text: 'The GRU is proposed, and encoder–decoder LSTMs show strong results in machine translation.' },
          { when: '2014–15', title: 'Attention', text: 'Attention lets a decoder look back at every encoder state instead of one compressed vector.' },
          { when: '2017', title: 'Transformer', text: '"Attention Is All You Need" removes recurrence; parallel training wins at scale.' },
          { when: '2020s', title: 'Recurrent ideas return', text: 'State-space and linear-recurrent models revisit RNN-style constant-memory inference with parallel training.' },
        ] },
      ],
    },
    {
      id: 'real-world-and-pitfalls',
      title: 'Real-world use, pitfalls and when not to use an RNN',
      blocks: [
        { type: 'callout', tone: 'example', title: 'Where RNNs were and are used', text: 'Before Transformers, LSTMs powered many production systems in speech recognition, machine translation, handwriting recognition and keyboard next-word prediction. Today they remain a reasonable choice for small on-device models, streaming sensor and time-series data where inputs arrive one at a time, and situations where memory per step must stay constant.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Using a vanilla RNN and expecting it to remember things 100 steps back. Forgetting gradient clipping and getting NaN losses. Mixing up padding: in a batch of different-length sequences, padded positions must be masked or packed so they do not corrupt the final hidden state. Forgetting to reset the hidden state between unrelated sequences. And using a bidirectional RNN for generation, where the future is not available.' },
        { type: 'list', items: [
          '**Do not choose an RNN** for large-scale language modelling or tasks needing very long context where you can afford a Transformer: it trains far slower and remembers less.',
          '**Do consider one** for small, streaming, low-latency problems, or as a baseline for time series.',
        ] },
        { type: 'check', question: 'An LSTM trains well on short sentences but its loss suddenly becomes NaN on long documents. What is the first fix to try?', answer: 'Add **gradient clipping**. Long sequences mean long products in backpropagation through time, and occasional exploding gradients produce huge updates that turn the loss into NaN. Truncated BPTT and a lower learning rate are also worth trying.' },
      ],
    },
  ],
  quiz: [
    { q: 'What makes a recurrent neural network "recurrent"?', options: ['It uses a new set of weights for each time step in the sequence', 'Its hidden state feeds into the next step, with the same weights each time', 'It processes all time steps in parallel and then combines the results', 'It repeats training on the same batch many times until the loss is low enough'], answer: 1, explain: 'The hidden state loops back into the cell at the next step, and the weights are shared across steps. Using different weights per step would break length generalisation, and parallel processing describes a Transformer.' },
    { q: 'An RNN with hidden size 1 has Wₓₕ = 1, Wₕₕ = 0.5, b = 0 and h₀ = 0. Ignoring tanh (treat it as identity), what is h₂ for inputs x₁ = 2, x₂ = 1?', options: ['1.0', '1.5', '2.0', '3.0'], answer: 2, explain: 'h₁ = 1·2 + 0.5·0 = 2. h₂ = 1·1 + 0.5·2 = 2.0. Choosing 3.0 forgets to multiply the old state by Wₕₕ = 0.5.' },
    { q: 'Our vanilla RNN sentiment model ignores a "not" that appears 80 words before the end of long reviews. What is the best change?', options: ['Remove the tanh activation so the old signal is no longer squashed at each step', 'Switch to an LSTM, GRU or Transformer, which keep signals alive over many steps', 'Use a smaller hidden state so each step overwrites less of the memory', 'Train with a larger learning rate so far-back words get bigger updates'], answer: 1, explain: 'This is the vanishing gradient problem: the signal from 80 steps back shrinks to almost nothing. Gated architectures (or attention) are the standard fix. A larger learning rate cannot recover a signal that is essentially zero, and it risks instability.' },
    { q: 'Compared with a Transformer, what is a key disadvantage of an RNN during training?', options: ['It needs extra parameters for every additional time step in a long sequence', 'It needs every input sequence to have exactly the same length', 'Its steps run one after another, so training cannot parallelise over time', 'It can only produce a single output at the end of the sequence'], answer: 2, explain: 'Each hidden state depends on the previous one, forcing sequential computation. RNNs keep the same parameter count for any length, handle variable lengths naturally, and can output at every step.' },
    { q: 'Which statement about training RNNs is a misconception?', options: ['Backpropagation through time sums the gradients for the shared weights over all time steps', 'Gradient clipping helps against exploding gradients', 'Truncated BPTT limits how far back gradients flow', 'Gradient clipping also fixes vanishing gradients, so LSTMs are unnecessary'], answer: 3, explain: 'Clipping only caps gradients that are too large; it cannot enlarge gradients that have shrunk to nearly zero. Vanishing gradients needed gated designs like LSTM and GRU. The other statements are correct.' },
  ],
  takeaways: [
    'An RNN reads a sequence step by step, updating a hidden state: hₜ = tanh(Wₓₕxₜ + Wₕₕhₜ₋₁ + b).',
    'The same weights are reused at every step, so one model handles any sequence length.',
    'Training uses backpropagation through time; long products of derivatives make gradients vanish or explode.',
    'LSTMs and GRUs add gates so information can survive many steps; gradient clipping handles explosions.',
    'Transformers replaced RNNs for most language tasks because they train in parallel and attend to all positions directly.',
  ],
  terms: [
    { term: 'Recurrent neural network (RNN)', def: 'A network that processes a sequence one step at a time, passing a hidden state from each step to the next.' },
    { term: 'Hidden state', def: 'The vector an RNN carries between steps that summarises what it has seen so far.' },
    { term: 'Unrolling', def: 'Drawing an RNN as a chain of identical cells, one per time step, sharing the same weights.' },
    { term: 'Backpropagation through time (BPTT)', def: 'Backpropagation applied to the unrolled RNN, summing gradients for the shared weights over all steps.' },
    { term: 'Vanishing / exploding gradients', def: 'Gradients that shrink towards zero or grow huge because they are products of many factors.' },
    { term: 'LSTM', def: 'A gated RNN with a cell state and forget, input and output gates that preserve information over long spans.' },
    { term: 'Gradient clipping', def: 'Rescaling gradients whose norm exceeds a threshold to prevent unstable updates.' },
  ],
};
