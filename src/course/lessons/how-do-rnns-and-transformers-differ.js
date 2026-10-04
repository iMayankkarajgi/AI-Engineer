export default {
  id: "how-do-rnns-and-transformers-differ",
  minutes: 20,
  hook: "Why did almost the whole field switch from RNNs to Transformers within a few years of 2017, and are RNN ideas really gone?",
  summary: "Both RNNs and Transformers process sequences such as text. An RNN reads one token at a time and squeezes everything it has seen into a single memory vector, which makes it slow to train and forgetful over long distances. A Transformer uses self-attention to let every token look directly at every other token in parallel, which trains much faster on GPUs and handles long-range context well, at the cost of compute that grows with the square of the sequence length.",
  sections: [
    {
      id: "what-both-are-for",
      title: "What both of them are for",
      blocks: [
        { type: "p", text: "Many kinds of data are **sequences**: ordered lists where position matters. A sentence is a sequence of tokens, speech is a sequence of audio frames, a stock chart is a sequence of prices. “Dog bites man” and “man bites dog” contain the same words but mean different things, so a model must understand both the items and their order." },
        { type: "p", text: "**Recurrent Neural Networks (RNNs)** and **Transformers** are two neural-network designs for sequences. Both turn each input token into a vector that captures its meaning *in context*, and both can be used to classify a sequence, translate it, or generate a new one. They differ in *how* information moves between positions. Our running example: the sentence “The keys that the man left on the kitchen table **are** missing”. To choose “are” (not “is”), a model must connect it to “keys”, eight tokens earlier." },
        { type: "callout", tone: "analogy", title: "Think of it like two readers", text: "The RNN reader reads one word at a time through a narrow slot and keeps a short mental note, rewriting it after each word. By the end of a long paragraph, early details have faded. The Transformer reader sees the whole page at once and can glance from any word to any other word instantly, as often as needed." },
      ],
    },
    {
      id: "what-is-an-rnn",
      title: "What is an RNN?",
      blocks: [
        { type: "p", text: "An RNN keeps a **hidden state**: a vector that acts as the network's running memory. At each step it combines the current token with the previous hidden state to produce a new hidden state. The same weights are reused at every step, which is what “recurrent” means." },
        { type: "formula", expr: "hₜ = tanh(Wₓ · xₜ + Wₕ · hₜ₋₁ + b)", where: [["xₜ", "the embedding of the token at step t"], ["hₜ₋₁", "the hidden state (memory) after the previous step"], ["Wₓ, Wₕ, b", "learned weights and bias, shared across all steps"], ["tanh", "a squashing function that keeps values between −1 and 1"]], caption: "The basic (Elman) RNN update." },
        { type: "steps", title: "How an RNN reads “The keys … are”", items: [
          { title: "Start empty", text: "h₀ is a vector of zeros: no memory yet." },
          { title: "Read “The”", text: "Combine x₁ with h₀ to get h₁." },
          { title: "Read “keys”", text: "Combine x₂ with h₁ to get h₂. Now the memory should note “plural subject”." },
          { title: "Keep going", text: "Each of the next tokens (that, the, man, left, on, the, kitchen, table) overwrites part of the memory." },
          { title: "Predict at “are”", text: "Only h₁₀ is available. Whether “plural” survived eight updates decides whether the model picks “are” or “is”." },
        ] },
        { type: "p", text: "Improved variants were invented to protect the memory. The **LSTM** (Long Short-Term Memory, Hochreiter and Schmidhuber, 1997) adds **gates**, small learned switches that decide what to keep, forget and output. The **GRU** (Gated Recurrent Unit, 2014) is a simpler gated version. Before 2017, LSTMs were the standard for translation, speech recognition and text generation." },
      ],
    },
    {
      id: "problem-with-rnn",
      title: "The problem with an RNN",
      blocks: [
        { type: "list", items: [
          "**No parallelism across time**: hₜ needs hₜ₋₁, so a 1,000-token sequence needs 1,000 strictly ordered steps. GPUs, which are fast because they do many operations at once, sit mostly idle. Training on huge datasets becomes slow.",
          "**Vanishing and exploding gradients**: to learn, the error signal travels backwards through every step (backpropagation through time). At each step it is multiplied by similar factors. If they are below 1 the signal shrinks towards zero; above 1 it blows up. Long-range lessons are hard to learn.",
          "**Memory bottleneck**: everything seen so far must fit in one fixed-size vector. Early details get overwritten.",
          "**Long path length**: information from token 1 reaches token 100 only after passing through 99 updates.",
        ] },
        { type: "chart", kind: "line", title: "How a signal shrinks over many steps", xLabel: "Steps between tokens", yLabel: "Remaining signal", series: [ { name: "Factor 0.9 per step", points: [[0, 1], [5, 0.59], [10, 0.35], [20, 0.12], [30, 0.04], [50, 0.005]] }, { name: "Factor 0.5 per step", points: [[0, 1], [5, 0.03], [10, 0.001], [20, 0], [30, 0], [50, 0]] } ], caption: "Illustrative: values of 0.9ᵏ and 0.5ᵏ (rounded). Real RNN gradients depend on weights and inputs, but repeated multiplication causes this exponential decay. LSTMs reduce it; they do not remove it entirely." },
        { type: "check", question: "An LSTM fixes vanishing gradients better than a plain RNN. Does it also fix the parallelism problem?", answer: "No. An LSTM still computes step t from the state at step t−1, so it remains sequential in time. Gates help memory and gradient flow, not parallel training." },
      ],
    },
    {
      id: "what-is-a-transformer",
      title: "What is a Transformer?",
      blocks: [
        { type: "p", text: "The **Transformer** was introduced in 2017 in the paper “Attention Is All You Need” by Vaswani and colleagues at Google. It removed recurrence completely. Its key operation is **self-attention**: every token builds a query, compares it with a key from every other token, and takes a weighted mix of their values. In one step, “are” can look straight back at “keys” and give it a high weight." },
        { type: "p", text: "Because attention alone does not know word order, Transformers add **positional information** to each token (fixed sinusoidal patterns in the original paper; learned or rotary position encodings in many later models). Each layer then runs attention followed by a small feed-forward network, and many layers are stacked. All positions in a layer are computed at the same time with large matrix multiplications, exactly what GPUs are built for." },
        { type: "timeline", title: "From recurrence to attention", items: [
          { when: "1990", title: "Simple RNN", text: "Elman's recurrent network popularises the hidden-state loop for sequences." },
          { when: "1997", title: "LSTM", text: "Gated memory cells make longer dependencies learnable." },
          { when: "2014", title: "Seq2seq and attention", text: "Encoder–decoder LSTMs translate sentences; Bahdanau and colleagues add attention so the decoder can look back at all encoder states." },
          { when: "2017", title: "Transformer", text: "Attention without recurrence; faster to train and better at translation." },
          { when: "2018 onward", title: "BERT, GPT and LLMs", text: "Pre-trained Transformers take over almost all language tasks, then vision and audio." },
          { when: "2023 onward", title: "Recurrence returns, differently", text: "State-space models such as Mamba and RNN-style designs such as RWKV revisit linear-time sequence processing, often in hybrids with attention." },
        ] },
      ],
    },
    {
      id: "key-difference",
      title: "The key difference in one line",
      blocks: [
        { type: "callout", tone: "tip", title: "In one line", text: "An RNN passes information along the sequence one step at a time through a single memory; a Transformer lets every token look directly at every other token, all at once." },
        { type: "p", text: "Everything else follows from that: speed of training (parallel vs sequential), long-range memory (direct link vs many hops), and cost (quadratic attention vs linear recurrence)." },
        { type: "viz", name: "rnn-vs-transformer", caption: "Watch the race: the RNN processes tokens one by one, while the Transformer handles the whole sequence in parallel." },
      ],
    },
    {
      id: "side-by-side",
      title: "RNN vs Transformer side by side (code)",
      blocks: [
        { type: "p", text: "Let us measure the long-range problem directly. We build a tiny untrained RNN and a single attention step, then nudge the *first* token and check how much the *last* output changes, for sequences of length 5, 20 and 50." },
        { type: "code", lang: "python", title: "rnn_vs_attention.py", code: `import numpy as np

rng = np.random.default_rng(0)
d = 4                                   # numbers per token
Wx = rng.normal(size=(d, d)) * 0.5      # input -> hidden weights
Wh = rng.normal(size=(d, d)) * 0.5      # hidden -> hidden weights

def run_rnn(X):
    h = np.zeros(d)
    for x in X:                         # strictly one token after another
        h = np.tanh(x @ Wx + h @ Wh)    # new memory = f(token, old memory)
    return h

def attention(X):
    scores = X @ X.T / np.sqrt(d)       # every pair of tokens in ONE matmul
    w = np.exp(scores - scores.max(1, keepdims=True))
    w /= w.sum(1, keepdims=True)        # softmax per row
    return w @ X                        # each output mixes all tokens

# How much does the FIRST token still influence the LAST output?
# Nudge token 0 and measure how much the last output moves.
for n in [5, 20, 50]:
    X = rng.normal(size=(n, d))
    X2 = X.copy(); X2[0] += 1.0
    rnn_effect = np.abs(run_rnn(X2) - run_rnn(X)).sum()
    att_effect = np.abs(attention(X2)[-1] - attention(X)[-1]).sum()
    print(f"n={n:2d}  RNN steps={n:2d}  RNN effect={rnn_effect:.1e}  "
          f"attention effect={att_effect:.1e}")

print("RNN: sequential steps grow with n; attention: one parallel step")`, output: `n= 5  RNN steps= 5  RNN effect=4.8e-03  attention effect=3.7e-01
n=20  RNN steps=20  RNN effect=8.3e-07  attention effect=9.4e-02
n=50  RNN steps=50  RNN effect=0.0e+00  attention effect=8.8e-03
RNN: sequential steps grow with n; attention: one parallel step`,
          walkthrough: [
            { lines: [3, 6], note: "Random weights for a 4-dimension RNN. No training; we only study how information flows." },
            { lines: [8, 12], note: "The RNN loop: one token per step, each step needing the previous memory. This loop cannot run in parallel." },
            { lines: [14, 18], note: "Plain self-attention: all pairwise scores in one matrix multiplication, softmax per row, then a weighted mix." },
            { lines: [20, 24], note: "For each length, make random tokens, then a copy where only token 0 is changed." },
            { lines: [25, 28], note: "Measure how much the final output moves in each model." },
          ] },
        { type: "p", text: "In the RNN, the first token's influence collapses exponentially: about 5×10⁻³ after 5 steps, under 10⁻⁶ after 20, and below floating-point precision (printed as 0) after 50. In attention, the influence also shrinks, but only because this *untrained* attention spreads its weight over more tokens. It shrinks slowly, and a trained model can learn to put high weight on a distant token whenever it matters, because the link is direct. The RNN also needed n sequential steps; attention needed one matrix operation." },
      ],
    },
    {
      id: "tabulate",
      title: "Let's tabulate the difference",
      blocks: [
        { type: "compare", title: "RNN (including LSTM/GRU) vs Transformer",
          options: [
            { name: "RNN / LSTM", summary: "Reads tokens in order, carrying a fixed-size hidden state.", pros: ["Memory per step does not grow with sequence length", "Natural for streaming input, one item at a time", "Small and efficient for short sequences and tiny devices"], cons: ["Sequential: slow to train on long sequences", "Forgets long-range information", "Hard to scale to very large models"], bestFor: "Small on-device models, simple streaming signals, low-resource settings" },
            { name: "Transformer", summary: "Every token attends to every other token in parallel.", pros: ["Highly parallel training on GPUs", "Direct links between any two tokens", "Scales to huge models and data"], cons: ["Attention compute and memory grow with n² (sequence length squared)", "Needs explicit position information", "KV cache grows during generation"], bestFor: "Language models, translation, vision, speech, most modern AI" },
          ],
          rows: [
            ["How tokens interact", "Through the hidden state, step by step", "Directly, via attention weights"],
            ["Sequential steps per layer", "n", "1 (all positions in parallel)"],
            ["Path between token 1 and token n", "n − 1 hops", "1 hop"],
            ["Compute per layer", "Grows linearly with n", "Grows with n² for attention"],
            ["Memory during generation", "Fixed-size state", "KV cache grows with context"],
            ["Word order", "Built in by processing order", "Added via positional encoding"],
          ],
          verdict: "For large-scale language modelling, Transformers win on training speed and quality. RNN-like ideas remain attractive where long inputs must be processed with constant memory." },
      ],
    },
    {
      id: "when-to-use",
      title: "When to use which one?",
      blocks: [
        { type: "table", head: ["Situation", "Better choice", "Why"], rows: [
          ["Chatbot, summarisation, code generation", "Transformer", "Best quality; huge pre-trained models are available"],
          ["Classifying or embedding text", "Transformer (encoder)", "Strong pre-trained encoders exist"],
          ["Tiny microcontroller reading a sensor stream", "RNN / GRU", "Very small, constant memory, processes one reading at a time"],
          ["Short time series with little data", "Either; often a simple RNN or classic model", "A big Transformer may overfit or be overkill"],
          ["Extremely long sequences on a tight memory budget", "Consider state-space or hybrid models", "Linear-time processing; an active research area"],
        ] },
        { type: "callout", tone: "warn", title: "Common misconception", text: "“Transformers have no limits on context.” They have a maximum context length, and attention cost grows with the square of the length. Many efficiency tricks (sliding-window attention, KV-cache compression, hybrids with recurrent layers) exist precisely because of this." },
        { type: "check", question: "Our team must process 1-million-step sensor logs on a small edge device with very little memory. Why might a recurrent or state-space model beat a standard Transformer here?", answer: "A standard Transformer would need attention over a million positions (n² growth) and a growing KV cache, which a small device cannot hold. A recurrent or state-space model carries a fixed-size state, so memory stays constant no matter how long the log is." },
      ],
    },
    {
      id: "summary",
      title: "Summary",
      blocks: [
        { type: "p", text: "RNNs and Transformers both model sequences. RNNs read in order and keep one memory vector, so they are sequential, struggle with long-range dependencies, and are slow to train at scale. Transformers replace recurrence with self-attention, giving every token a direct, parallel view of every other token, which made today's large language models possible, at the cost of quadratic attention. RNN-style ideas live on in efficient modern architectures for very long or streaming inputs." },
      ],
    },
  ],
  quiz: [
    { q: "What is the core difference between how RNNs and Transformers move information between tokens?", options: ["RNNs mix tokens with attention, while Transformers carry one hidden state forward in time", "RNNs relay information step by step; Transformer tokens attend to all others at once", "RNNs are designed for image data, while Transformers are designed only for text", "RNNs use fixed hand-set weights, while Transformers learn their weights from data"], answer: 1, explain: "This is the one-line difference. The first option swaps the two mechanisms; both architectures work on many data types and both have learned weights." },
    { q: "In the code, the RNN's “effect of token 0 on the last output” went from about 5×10⁻³ (n=5) to 0 (n=50). What does this demonstrate?", options: ["The RNN loop has a bug that drops the first token once n grows large", "Attention is more accurate than recurrence on every sequence task", "The RNN is designed to skip the first token and start reading from the second", "Early tokens' influence fades exponentially as it passes through many steps"], answer: 3, explain: "Repeated multiplication through the recurrent update shrinks early influence exponentially, the same mechanism behind vanishing gradients. The code has no bug, and the untrained comparison does not prove accuracy in general." },
    { q: "Why do Transformers train much faster than RNNs on GPUs?", options: ["Each layer computes all positions at once with matrix multiplications", "Transformers have fewer parameters than RNNs of similar quality", "Transformers skip backpropagation and learn in one forward pass", "Transformers skip the softmax during training and add it at inference"], answer: 0, explain: "The speed comes from parallelism across positions. Transformers are often much larger than RNNs, they are trained with backpropagation, and softmax is part of attention." },
    { q: "Our edge device must summarise a continuous sensor stream with almost no memory. Which property of an RNN-style model helps most?", options: ["Its quadratic attention cost, which scales well for long streams", "Its positional encodings, which let it discard older sensor readings", "Its fixed-size hidden state, so memory does not grow with the stream", "Its ability to see future tokens, so it can plan the summary ahead"], answer: 2, explain: "A fixed-size state means constant memory regardless of stream length. Quadratic attention and positional encodings are Transformer features, and RNNs read in order without seeing the future." },
    { q: "Which statement about LSTMs is correct?", options: ["LSTMs removed the sequential bottleneck, so Transformers were not needed until 2017", "LSTMs replace recurrence with self-attention between all pairs of tokens", "LSTMs process all tokens in parallel, just like Transformer layers do", "LSTMs use gates to protect memory and gradients, but still run one step at a time"], answer: 3, explain: "Gates help with forgetting and vanishing gradients, but the recurrence remains sequential. That remaining bottleneck is exactly what the Transformer removed." },
  ],
  takeaways: [
    "Both RNNs and Transformers model sequences; they differ in how tokens share information.",
    "RNNs read step by step with one memory vector: sequential, forgetful over long ranges, slow to train at scale.",
    "LSTMs and GRUs ease forgetting with gates but stay sequential.",
    "Transformers use self-attention for direct, parallel token-to-token links, enabling large-scale training.",
    "Transformers pay quadratic attention cost; recurrent and state-space ideas return for very long or streaming inputs.",
  ],
  terms: [
    { term: "Sequence", def: "An ordered list of items, such as tokens, where position carries meaning." },
    { term: "RNN", def: "A network that processes a sequence one step at a time, updating a hidden state with shared weights." },
    { term: "Hidden state", def: "The RNN's running memory vector, updated after each token." },
    { term: "LSTM", def: "An RNN variant with gates that control what to keep, forget and output." },
    { term: "Vanishing gradient", def: "When the learning signal shrinks towards zero as it travels back through many steps." },
    { term: "Self-attention", def: "An operation where each token computes weights over all tokens and mixes their information." },
  ],
};
