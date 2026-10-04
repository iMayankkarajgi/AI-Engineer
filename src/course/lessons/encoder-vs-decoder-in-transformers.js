export default {
  id: "encoder-vs-decoder-in-transformers",
  minutes: 20,
  hook: "BERT and GPT are both Transformers, yet one is great at understanding and the other at writing. What single design choice makes the difference?",
  summary: "An encoder reads the whole input at once, letting every token look both left and right, and outputs a context-rich vector per token: ideal for understanding. A decoder generates text one token at a time and uses a causal mask so each token sees only earlier tokens: ideal for writing. Transformers come in three types, encoder-only, decoder-only and encoder–decoder, and we choose among them based on whether the task is understanding, open-ended generation or mapping an input to an output.",
  sections: [
    {
      id: "what-is-a-transformer",
      title: "What is a Transformer?",
      blocks: [
        { type: "p", text: "A **Transformer** is a neural-network architecture for sequences, introduced in 2017. It turns each token into a vector and refines those vectors through a stack of layers. In each layer, **self-attention** lets tokens gather information from other tokens, and a small **feed-forward network** processes each token on its own." },
        { type: "p", text: "The original Transformer had two stacks: an **encoder** and a **decoder**. Later models kept one or both. This lesson is about what each stack does and why the difference matters when we pick a model. Our running example: a support team that wants to (a) detect the topic of each incoming ticket and (b) draft replies." },
        { type: "callout", tone: "analogy", title: "Think of it like a reader and a writer", text: "The **encoder** is a careful reader: it may read the whole letter, jump back and forth, and only then decide what each sentence means. The **decoder** is a writer: it writes one word at a time and can only look back at what it has already written, never at words it has not written yet." },
      ],
    },
    {
      id: "a-word-about-tokens",
      title: "A word about tokens",
      blocks: [
        { type: "p", text: "Both encoder and decoder work on **tokens**: small pieces of text such as words or word parts, each mapped to an integer ID by a tokenizer. “The bank of the river” might be five tokens. Each ID is looked up in an **embedding table** to get a vector, and **positional information** is added so the model knows token order." },
        { type: "p", text: "From then on, everything happens to these per-token vectors. An encoder outputs one refined vector per input token. A decoder outputs, at its last position, a probability for every possible next token." },
      ],
    },
    {
      id: "what-is-an-encoder",
      title: "What is an Encoder?",
      blocks: [
        { type: "p", text: "An **encoder** takes the full input sequence and produces a **contextual representation** of every token: a vector that describes the token *in the context of the whole input*. Its self-attention is **bidirectional**: token 2 can look at token 1 (left) and token 5 (right) alike." },
        { type: "p", text: "This matters for meaning. In “The bank of the river”, the word “bank” is only clear once we see “river”, which comes *after* it. An encoder lets “bank” attend to “river” directly, so its vector leans towards the riverside meaning." },
        { type: "p", text: "Encoders are usually pre-trained with **masked language modelling**: hide some tokens and predict them from both sides. BERT (Google, 2018) masked about 15% of tokens, for example “The [MASK] of the river” → predict “bank”. Because the hidden token is replaced, looking right is not cheating." },
        { type: "list", items: [
          "**Input**: a complete sequence (sentence, document, query).",
          "**Output**: one vector per token, often pooled into one vector for the whole input.",
          "**Good at**: classification, sentiment, named-entity recognition, embeddings for search, reranking.",
          "**Examples**: BERT, RoBERTa, many sentence-embedding models.",
        ] },
      ],
    },
    {
      id: "what-is-a-decoder",
      title: "What is a Decoder?",
      blocks: [
        { type: "p", text: "A **decoder** generates a sequence **one token at a time**. At each step it reads all tokens produced so far and predicts a probability for the next one; the chosen token is appended and the process repeats. This is called **autoregressive** generation." },
        { type: "p", text: "Its self-attention is **causal** (also called masked): token t may attend only to tokens 1…t. A **causal mask** sets every “look at the future” score to −∞ before softmax, so those weights become 0. Without it, training would let each position peek at the very token it must predict." },
        { type: "p", text: "Decoders are pre-trained with **next-token prediction** (causal language modelling): given “The bank of the”, predict “river”. In an encoder–decoder model, each decoder layer has an extra **cross-attention** sub-layer whose queries come from the decoder and whose keys and values come from the encoder output, so the writer can consult the reader's notes." },
        { type: "list", items: [
          "**Input**: the tokens generated so far (plus the prompt).",
          "**Output**: a probability distribution over the next token.",
          "**Good at**: open-ended generation: chat, writing, code, reasoning in text.",
          "**Examples**: the GPT series, Llama, Mistral and most chat LLMs.",
        ] },
      ],
    },
    {
      id: "one-big-difference",
      title: "The one big difference",
      blocks: [
        { type: "callout", tone: "tip", title: "In one line", text: "The encoder lets every token see the whole sequence (bidirectional attention); the decoder lets each token see only itself and earlier tokens (causal attention). Everything else follows from this mask." },
        { type: "p", text: "Let us see it in numbers. We compute attention weights for “The bank of the river” twice: once with no mask (encoder) and once with a causal mask (decoder). The token vectors are random, so the exact values are illustrative, but the masking pattern is exactly what real models do." },
        { type: "code", lang: "python", title: "encoder_vs_decoder_mask.py", code: `import numpy as np

tokens = ["The", "bank", "of", "the", "river"]
n = len(tokens)
rng = np.random.default_rng(1)
X = rng.normal(size=(n, 4))                     # toy token vectors
scores = X @ X.T / 2.0                          # raw attention scores (√4 = 2)

def softmax_rows(s):
    e = np.exp(s - s.max(1, keepdims=True))
    return e / e.sum(1, keepdims=True)

# Encoder: bidirectional, every token sees every token
enc = softmax_rows(scores)

# Decoder: causal mask, token i may only see tokens 0..i
mask = np.triu(np.ones((n, n)), k=1).astype(bool)   # True above the diagonal
dec = softmax_rows(np.where(mask, -np.inf, scores))

for name, w in [("ENCODER", enc), ("DECODER", dec)]:
    print(name)
    for i, t in enumerate(tokens):
        row = " ".join(f"{v:4.2f}" for v in w[i])
        print(f"  {t:5s} -> {row}")

# Can 'bank' (position 1) use 'river' (position 4) to pick its meaning?
print("bank->river  encoder:", round(enc[1, 4], 2), " decoder:", round(dec[1, 4], 2))`, output: `ENCODER
  The   -> 0.54 0.13 0.12 0.08 0.14
  bank  -> 0.13 0.34 0.22 0.14 0.16
  of    -> 0.15 0.27 0.24 0.18 0.16
  the   -> 0.10 0.17 0.19 0.33 0.21
  river -> 0.17 0.20 0.16 0.21 0.27
DECODER
  The   -> 1.00 0.00 0.00 0.00 0.00
  bank  -> 0.28 0.72 0.00 0.00 0.00
  of    -> 0.23 0.41 0.36 0.00 0.00
  the   -> 0.12 0.22 0.24 0.42 0.00
  river -> 0.17 0.20 0.16 0.21 0.27
bank->river  encoder: 0.16  decoder: 0.0`,
          walkthrough: [
            { lines: [3, 7], note: "Five tokens with random 4-dimension vectors; raw scores are dot products scaled by √4 = 2." },
            { lines: [9, 11], note: "Row-wise softmax turns each row of scores into weights that sum to 1." },
            { lines: [13, 14], note: "Encoder: plain softmax, no mask. Every token can attend to every token." },
            { lines: [16, 18], note: "Decoder: `np.triu(..., k=1)` marks cells above the diagonal (future tokens). Setting them to −∞ makes their softmax weight exactly 0." },
            { lines: [20, 24], note: "Print both weight matrices, one row per token doing the looking." },
            { lines: [26, 27], note: "The key question: can “bank” use “river”? Yes in the encoder (0.16), no in the decoder (0.0)." },
          ] },
        { type: "matrix", title: "Decoder (causal) attention weights from the code", rows: ["The", "bank", "of", "the", "river"], cols: ["The", "bank", "of", "the", "river"], values: [[1, null, null, null, null], [0.28, 0.72, null, null, null], [0.23, 0.41, 0.36, null, null], [0.12, 0.22, 0.24, 0.42, null], [0.17, 0.2, 0.16, 0.21, 0.27]], format: "pct", caption: "Empty cells are masked future positions. The last row equals the encoder's last row, because the last token has no future to hide." },
        { type: "viz", name: "attention-heatmap", caption: "Click a token to see its attention weights over the sentence, then toggle the causal mask to switch between encoder-style and decoder-style attention." },
        { type: "check", question: "In the output, why is the row for “river” identical in the encoder and decoder matrices, while the row for “The” differs completely?", answer: "“river” is the last token, so the causal mask hides nothing from it: it sees all five tokens either way. “The” is first, so in the decoder it can only see itself (weight 1.00), while in the encoder it spreads attention over all five tokens." },
      ],
    },
    {
      id: "three-types",
      title: "The three types of Transformers",
      blocks: [
        { type: "flow", title: "How an encoder–decoder model translates", nodes: [
          { label: "Source text", detail: "“The bank of the river” enters the encoder." },
          { label: "Encoder", detail: "Bidirectional self-attention produces one context vector per source token. Runs once." },
          { label: "Decoder step", detail: "Causal self-attention over the target tokens written so far, then cross-attention into the encoder vectors." },
          { label: "Next token", detail: "Softmax over the vocabulary picks the next target word, e.g. “La”, then “rive”…" },
          { label: "Repeat", detail: "Append the token and run the decoder again until the end token." },
        ] },
        { type: "list", items: [
          "**Encoder-only** (BERT family): understanding tasks; outputs vectors, not free text.",
          "**Decoder-only** (GPT family, Llama, most chat LLMs): generation; also handles understanding by phrasing it as text (“Topic of this ticket: …”).",
          "**Encoder–decoder** (original Transformer, T5, BART, Whisper for speech-to-text): input-to-output tasks like translation and summarisation.",
        ] },
        { type: "steps", title: "Choosing a type for a new task", items: [
          { title: "Is the output a label, score or vector?", text: "If yes, an encoder-only model is usually the efficient choice." },
          { title: "Is the output free-form text with no fixed source?", text: "Chat, creative writing, code generation: use a decoder-only model." },
          { title: "Is there a clear input that maps to a different output?", text: "Translation, summarisation, speech to text: an encoder–decoder fits well, though large decoder-only models also do these tasks well." },
          { title: "Check constraints", text: "Latency, cost and hardware: a small encoder can classify thousands of tickets per second on a CPU, while a large decoder is slower and pricier per call." },
        ] },
      ],
    },
    {
      id: "tabulate",
      title: "Let's tabulate the difference",
      blocks: [
        { type: "compare", title: "Encoder vs Decoder",
          options: [
            { name: "Encoder", summary: "Reads the whole input at once and outputs contextual vectors.", pros: ["Sees context on both sides", "Fast: one pass over the input", "Excellent embeddings and classifiers"], cons: ["Does not generate free text on its own"], bestFor: "Classification, search embeddings, reranking, entity extraction" },
            { name: "Decoder", summary: "Generates one token at a time, seeing only the past.", pros: ["Generates any text", "One model handles many tasks through prompts", "Scales very well"], cons: ["Sequential generation is slower", "Each token sees only the left context"], bestFor: "Chatbots, writing, code, general assistants" },
          ],
          rows: [
            ["Attention", "Bidirectional (no mask)", "Causal (future masked)"],
            ["Pre-training task", "Predict masked tokens", "Predict the next token"],
            ["Output", "A vector per token", "Probabilities for the next token"],
            ["Passes per input", "One", "One per generated token"],
            ["Cross-attention", "Not used", "Only in encoder–decoder models"],
            ["Famous examples", "BERT, RoBERTa", "GPT series, Llama"],
          ],
          verdict: "Read with an encoder, write with a decoder. For our support team: an encoder classifies tickets cheaply; a decoder drafts the replies." },
      ],
    },
    {
      id: "when-to-use",
      title: "When to use which one?",
      blocks: [
        { type: "table", head: ["Task", "Good choice", "Why"], rows: [
          ["Route tickets to billing, shipping or returns", "Encoder-only", "Label output; fast and cheap at high volume"],
          ["Embed help articles for semantic search", "Encoder-only (embedding model)", "Bidirectional context gives strong vectors"],
          ["Draft a reply to a customer", "Decoder-only", "Open-ended text generation"],
          ["Translate help articles into Spanish", "Encoder–decoder or a large decoder-only LLM", "Clear input→output mapping"],
          ["Transcribe a support phone call", "Encoder–decoder (e.g. Whisper)", "Audio encoder, text decoder"],
          ["General assistant that does all of the above", "Decoder-only LLM", "Flexible, but larger and costlier per request"],
        ] },
        { type: "callout", tone: "warn", title: "Common misconception", text: "“Decoder-only models can't understand text because they only look left.” They understand very well: by the time a decoder reaches the end of the prompt, the last positions have seen everything before them. The real trade-off is efficiency and fit: for pure classification or embeddings at scale, a small encoder is often cheaper and just as accurate." },
        { type: "check", question: "We need to score 2 million product reviews per day as positive or negative on modest hardware. Which type would we try first and why?", answer: "An encoder-only model (fine-tuned for sentiment). It produces a label in a single forward pass with no token-by-token generation, so it is far cheaper and faster than prompting a large decoder for each review." },
      ],
    },
    {
      id: "summary",
      title: "Summary",
      blocks: [
        { type: "p", text: "Encoders and decoders share the same building blocks (embeddings, attention, feed-forward layers, residuals, normalization) but differ in one mask. Encoders attend in both directions and output vectors, which makes them great readers for classification and embeddings. Decoders attend only to the past and output next-token probabilities, which makes them writers for generation. Encoder–decoder models combine both through cross-attention for input-to-output tasks. Today, decoder-only models power most chat LLMs, while encoders remain the efficient choice for understanding at scale." },
      ],
    },
  ],
  quiz: [
    { q: "What is the single most important architectural difference between a Transformer encoder and decoder?", options: ["Encoders mix tokens with attention, while decoders pass a recurrent state", "Decoders mask future tokens; encoders let every token attend in both directions", "Encoders have no feed-forward layers, while decoders have one per block", "Decoders drop positional information, while encoders add it to their embeddings"], answer: 1, explain: "The mask is the key difference. Both stacks use attention, feed-forward layers and positional information; neither uses recurrence." },
    { q: "In the code's decoder matrix, the row for “bank” is [0.28, 0.72, 0.00, 0.00, 0.00]. Why are the last three entries zero?", options: ["Those three tokens have zero-length value vectors, so they add nothing", "Softmax rounds small weights down to zero to keep the rows sparse", "The causal mask set their scores to −∞, giving them zero weight", "The encoder output was not passed to the decoder for those positions"], answer: 2, explain: "“of”, “the” and “river” come after “bank”, so they are masked to −∞ before softmax, giving exactly 0 weight. Softmax never outputs exact zeros for finite scores, and this toy code has no cross-attention." },
    { q: "Our team must classify millions of support tickets cheaply. A colleague proposes prompting a large decoder-only LLM for each one. What is the most sensible first alternative to evaluate?", options: ["A fine-tuned encoder-only classifier that labels each ticket in one pass", "An encoder–decoder translation model that rewrites each ticket as a label", "Turning off the LLM's causal mask at inference so it reads both ways", "Raising the LLM's temperature so it generates each label faster"], answer: 0, explain: "For high-volume labelling, an encoder classifier is typically much cheaper and fast enough. Translation models do not fit; removing the mask at inference breaks a model trained with it; temperature does not change speed." },
    { q: "Which pairing of pre-training objective and model type is correct?", options: ["Encoder: next-token prediction; decoder: masked-token prediction", "Both: supervised pre-training on labelled classification datasets", "Encoder: denoising corrupted images; decoder: next-token prediction", "Encoder: masked-token prediction (BERT); decoder: next-token (GPT)"], answer: 3, explain: "Encoders hide tokens and predict them from both sides; decoders predict the next token from the left. The first option swaps them, and pre-training uses unlabelled text, not classification labels." },
    { q: "“Decoder-only models cannot understand a prompt because they only look left.” Why is this wrong?", options: ["Decoders quietly switch to bidirectional attention once inference begins", "Later positions attend to every earlier token, so the last sees the whole prompt", "Decoders first run a hidden encoder over the prompt, then generate", "The causal mask is removed after pre-training, so the prompt is read in full"], answer: 1, explain: "Causal attention still lets the last positions see everything before them, which is the entire prompt. Decoders do not switch to bidirectional attention, do not have an encoder, and keep the mask after training." },
  ],
  takeaways: [
    "Encoder: bidirectional attention, outputs one context vector per token; great for understanding.",
    "Decoder: causal attention, generates one token at a time; great for writing.",
    "The causal mask (future scores set to −∞) is the key difference.",
    "Three types: encoder-only (BERT), decoder-only (GPT, most chat LLMs), encoder–decoder (T5, Whisper).",
    "Choose by task: labels and embeddings → encoder; open-ended text → decoder; input→output mapping → encoder–decoder.",
  ],
  terms: [
    { term: "Encoder", def: "A Transformer stack that reads the whole input bidirectionally and outputs a contextual vector per token." },
    { term: "Decoder", def: "A Transformer stack that generates tokens one at a time using causal self-attention." },
    { term: "Bidirectional attention", def: "Attention where each token can attend to tokens on both its left and right." },
    { term: "Causal mask", def: "A mask that blocks attention to future tokens by setting their scores to −∞ before softmax." },
    { term: "Cross-attention", def: "Attention where decoder queries look at encoder keys and values." },
    { term: "Masked language modelling", def: "Pre-training by hiding some tokens and predicting them from the surrounding context." },
  ],
};
