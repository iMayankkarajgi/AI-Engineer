export default {
  id: "decoding-transformer-architecture",
  minutes: 25,
  hook: "Every major chatbot, image captioner and code assistant is built from the same few repeated parts. What are they, and how does a sentence flow through them?",
  summary: "The Transformer turns tokens into vectors, adds position information, and then refines those vectors through a stack of identical layers. Each layer has two parts: multi-head attention, where tokens exchange information, and a feed-forward network, which processes each token on its own, both wrapped in residual connections and layer normalization. The original design had an encoder that reads the input and a decoder that writes the output; today we also use encoder-only and decoder-only versions.",
  sections: [
    {
      id: "why-needed",
      title: "Why the Transformer was needed",
      blocks: [
        { type: "p", text: "Before 2017, the best translation systems were **recurrent** encoder–decoder models (LSTMs) with attention added on top. They worked, but recurrence forced them to process words one after another. Training was slow, and information from distant words faded." },
        { type: "p", text: "The paper “Attention Is All You Need” (Vaswani et al., 2017) asked a bold question: what if we drop recurrence completely and build the whole model from attention plus simple per-token layers? The result, the **Transformer**, trained much faster on GPUs because every position is processed in parallel, and it set new quality records on English–German and English–French translation. It became the foundation for BERT, GPT and nearly every large model since." },
        { type: "callout", tone: "analogy", title: "Think of it like a newsroom meeting", text: "Each token is a reporter holding one word. In every round (layer), reporters first *talk to each other* to gather relevant context (attention), then each *goes back to their desk and thinks alone* to update their notes (feed-forward network). After many rounds, every reporter's notes describe their word in the light of the whole story." },
        { type: "p", text: "Our running example is translation, the task the Transformer was invented for: English “I love cats” in, French “J'aime les chats” out." },
      ],
    },
    {
      id: "two-halves",
      title: "The two halves of the architecture",
      blocks: [
        { type: "p", text: "The original Transformer has two stacks. The **encoder** reads the whole input sentence and produces one context-rich vector per input token. The **decoder** generates the output sentence one token at a time, looking both at what it has written so far and at the encoder's vectors." },
        { type: "flow", title: "The original encoder–decoder Transformer", nodes: [
          { label: "Input tokens", detail: "“I love cats” is tokenized and turned into embedding vectors plus positional encodings." },
          { label: "Encoder ×N", detail: "N identical layers (N = 6 in the original base model). Each layer: self-attention over all input tokens, then a feed-forward network." },
          { label: "Encoder output", detail: "One vector per input token, each now describing its word in the context of the whole sentence." },
          { label: "Decoder ×N", detail: "N identical layers. Each: masked self-attention over the output so far, cross-attention to the encoder output, then a feed-forward network." },
          { label: "Linear + softmax", detail: "The top decoder vector is projected to a score for every vocabulary token, and softmax turns scores into probabilities for the next output token." },
        ] },
        { type: "table", caption: "Hyperparameters of the original base Transformer (2017)", head: ["Setting", "Value", "Meaning"], rows: [
          ["Layers (N)", "6 encoder + 6 decoder", "How many times the block repeats"],
          ["d_model", "512", "Size of each token vector"],
          ["Attention heads", "8", "Parallel attention patterns per layer (64 dimensions each)"],
          ["d_ff", "2,048", "Hidden size of the feed-forward network"],
          ["Parameters", "about 65 million", "Tiny by today's standards"],
        ] },
      ],
    },
    {
      id: "input-pipeline",
      title: "Tokenization, Embedding, and Positional Encoding",
      blocks: [
        { type: "p", text: "**Tokenization** cuts text into tokens and maps them to integer IDs (the original paper used a byte-pair encoding vocabulary shared between the two languages). **Embedding** looks up each ID in a learned table to get a d_model-sized vector, so “cats” becomes a list of 512 numbers that the model can refine." },
        { type: "p", text: "Attention by itself treats its input as an unordered set: if we shuffle the tokens, each token gets the same attention result, just in a shuffled position. So we must inject order. **Positional encoding** adds a position-dependent vector to each embedding. The original paper used fixed sine and cosine waves of different frequencies:" },
        { type: "formula", expr: "PE(pos, 2i) = sin(pos / 10000^(2i/d_model)),   PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))", where: [["pos", "the token's position: 0, 1, 2, …"], ["i", "which pair of dimensions (low i = fast-changing wave, high i = slow wave)"], ["d_model", "the vector size, e.g. 512"]], caption: "Each position gets a unique pattern, and nearby positions get similar patterns." },
        { type: "p", text: "**Small numbers.** For position 1 and the first pair of dimensions (i = 0): PE = sin(1) ≈ 0.84 and cos(1) ≈ 0.54. For position 0 they are sin(0) = 0 and cos(0) = 1. These small numbers are simply added to the token embedding. Many later models use **learned** position embeddings (GPT-2, BERT) or **rotary position embeddings (RoPE)**, which rotate query and key vectors by an angle that depends on position (Llama and many others)." },
      ],
    },
    {
      id: "attention",
      title: "The Attention Mechanism and Multi-Head Attention",
      blocks: [
        { type: "p", text: "**Attention** lets each token gather information from other tokens. Each token vector is multiplied by three learned matrices to create a **query** (what am I looking for?), a **key** (what do I contain?) and a **value** (what will I share?). The query of one token is compared with the keys of all tokens by dot product; softmax turns the scores into weights; the output is the weighted sum of values." },
        { type: "formula", expr: "Attention(Q, K, V) = softmax(Q · Kᵀ / √dₖ) · V", where: [["Q, K, V", "matrices of queries, keys and values, one row per token"], ["dₖ", "dimension of each key; dividing by √dₖ keeps scores from growing too large"], ["softmax", "turns each row of scores into positive weights that sum to 1"]] },
        { type: "p", text: "**Multi-head attention** runs several attention operations in parallel, each with its own smaller Q, K, V projections (8 heads of 64 dimensions in the base model). Different heads can learn different relationships, such as “look at the previous word” or “look at the subject of the verb”. Their outputs are concatenated and mixed by one more matrix." },
        { type: "viz", name: "multi-head", caption: "Switch between heads to see different learned attention patterns over the same sentence." },
        { type: "p", text: "The original Transformer uses attention in **three places**: (1) encoder self-attention, where input tokens attend to all input tokens; (2) decoder masked self-attention, where each output token attends only to earlier output tokens; and (3) **cross-attention**, where decoder queries attend to the encoder's keys and values, letting the translation look at the source sentence." },
      ],
    },
    {
      id: "ffn-residual-norm",
      title: "Feed-Forward Networks, Residual Connections, and Layer Normalization",
      blocks: [
        { type: "p", text: "After attention mixes information *between* tokens, a **position-wise feed-forward network (FFN)** processes *each token on its own*, with the same weights at every position: expand to a bigger size, apply a non-linearity, shrink back." },
        { type: "formula", expr: "FFN(x) = max(0, x·W₁ + b₁) · W₂ + b₂", where: [["W₁", "512 → 2,048 expansion in the base model"], ["max(0, ·)", "ReLU activation (modern models often use GELU or SwiGLU)"], ["W₂", "2,048 → 512 projection back"]], caption: "Most of a Transformer's parameters usually live in these FFN layers." },
        { type: "p", text: "Two helpers keep deep stacks trainable. A **residual connection** adds a sub-layer's input to its output: `x + Sublayer(x)`. The sub-layer only has to learn a *change* to x, and gradients have a direct path back through the addition, which makes very deep networks stable. **Layer normalization** rescales each token vector to mean 0 and variance 1 (then applies a learned scale and shift), keeping numbers in a healthy range." },
        { type: "callout", tone: "note", title: "Post-norm vs pre-norm", text: "The 2017 paper normalised *after* the residual addition: LayerNorm(x + Sublayer(x)). Most modern LLMs normalise *before* the sub-layer: x + Sublayer(LayerNorm(x)), which trains more stably in very deep models. Many also replace LayerNorm with the cheaper RMSNorm." },
        { type: "viz", name: "normalization", caption: "Switch between BatchNorm, LayerNorm and RMSNorm to see which axis gets normalised. Transformers use per-token normalization (LayerNorm or RMSNorm)." },
      ],
    },
    {
      id: "encoder-decoder-work",
      title: "How the Encoder and Decoder work",
      blocks: [
        { type: "steps", title: "Translating “I love cats” step by step", items: [
          { title: "Encode once", text: "The three English tokens pass through all encoder layers in parallel. Out come three vectors, each aware of the whole sentence." },
          { title: "Start the decoder", text: "The decoder receives only a start token. Masked self-attention has just that one token to look at." },
          { title: "Cross-attend", text: "The decoder's query asks the encoder vectors “what should come first?” and attends mostly to “I” and “love”." },
          { title: "Predict", text: "After the FFN and the final linear + softmax, the most likely first token is “J'” (or “J'aime”, depending on the tokenizer)." },
          { title: "Feed back and repeat", text: "The new token is appended to the decoder input; the decoder runs again, producing “aime”, “les”, “chats” and finally an end token. The encoder output is reused at every step." },
        ] },
        { type: "check", question: "During translation, how many times does the encoder run, and how many times does the decoder run, for a 5-token French output (including the end token)?", answer: "The encoder runs once over the English sentence. The decoder runs once per generated token, so 5 times (with a KV cache, each run only processes the newest token). That asymmetry is why the encoder's output is computed once and reused." },
      ],
    },
    {
      id: "data-flow",
      title: "How data flows through the entire architecture (code)",
      blocks: [
        { type: "p", text: "Below is one complete Transformer layer in numpy with tiny sizes (d_model = 8, 2 heads, d_ff = 32), following the original post-norm design. The weights are random, so the numbers are meaningless, but every shape and step is real." },
        { type: "code", lang: "python", title: "one_transformer_layer.py", code: `import numpy as np

rng = np.random.default_rng(42)
vocab, d_model, n_heads, d_ff = 10, 8, 2, 32
tokens = np.array([3, 7, 1, 4])            # token ids for a 4-token sentence
n, d_k = len(tokens), d_model // n_heads

# 1. Embedding lookup + sinusoidal positional encoding
E = rng.normal(size=(vocab, d_model)) * 0.5
pos = np.arange(n)[:, None]; i = np.arange(d_model)[None, :]
angle = pos / 10000 ** (2 * (i // 2) / d_model)
PE = np.where(i % 2 == 0, np.sin(angle), np.cos(angle))
x = E[tokens] + PE
print("embeddings + positions:", x.shape)

def layer_norm(v):
    return (v - v.mean(-1, keepdims=True)) / (v.std(-1, keepdims=True) + 1e-5)

def softmax(s):
    e = np.exp(s - s.max(-1, keepdims=True)); return e / e.sum(-1, keepdims=True)

# 2. Multi-head self-attention, then residual + LayerNorm (post-norm, as in 2017)
Wq, Wk, Wv, Wo = (rng.normal(size=(d_model, d_model)) * 0.3 for _ in range(4))
Q, K, V = (x @ W for W in (Wq, Wk, Wv))
heads = []
for h in range(n_heads):                   # each head uses its own slice
    s = slice(h * d_k, (h + 1) * d_k)
    w = softmax(Q[:, s] @ K[:, s].T / np.sqrt(d_k))
    heads.append(w @ V[:, s])
    print(f"head {h} attention of token 0:", np.round(w[0], 2))
attn = np.concatenate(heads, axis=-1) @ Wo
x = layer_norm(x + attn)
print("after attention + residual + norm:", x.shape)

# 3. Position-wise feed-forward network, then residual + LayerNorm
W1 = rng.normal(size=(d_model, d_ff)) * 0.3
W2 = rng.normal(size=(d_ff, d_model)) * 0.3
x = layer_norm(x + np.maximum(0, x @ W1) @ W2)
print("after feed-forward + residual + norm:", x.shape)

# 4. Output head: project to vocabulary scores (untrained, so random)
logits = x @ E.T                           # weight tying with the embedding
print("next-token probs for last position:", np.round(softmax(logits[-1]), 2))`, output: `embeddings + positions: (4, 8)
head 0 attention of token 0: [0.25 0.42 0.17 0.16]
head 1 attention of token 0: [0.24 0.33 0.21 0.22]
after attention + residual + norm: (4, 8)
after feed-forward + residual + norm: (4, 8)
next-token probs for last position: [0.27 0.04 0.03 0.03 0.08 0.03 0.09 0.35 0.   0.07]`,
          walkthrough: [
            { lines: [3, 6], note: "Sizes: vocabulary 10, vectors of 8 numbers, 2 heads of 4 dimensions each, FFN hidden size 32. Our sentence is 4 token IDs." },
            { lines: [8, 14], note: "Embedding lookup plus sinusoidal positional encoding. Result: a 4 × 8 matrix, one row per token." },
            { lines: [16, 20], note: "Helpers: layer norm (per token, across features) and a numerically stable softmax." },
            { lines: [22, 30], note: "Multi-head attention: project to Q, K, V, then each head attends using its own 4-dimension slice. Each printed row of weights sums to 1." },
            { lines: [31, 33], note: "Concatenate heads, mix with W_o, add the residual, normalise. Shape stays 4 × 8." },
            { lines: [35, 39], note: "Feed-forward network per token (8 → 32 → 8 with ReLU), residual, normalise. Shape still 4 × 8." },
            { lines: [41, 43], note: "Output head: score every vocabulary token for the last position and softmax into probabilities. Training would make these meaningful." },
          ] },
        { type: "p", text: "The key observation: **the shape never changes inside the stack**. A layer takes n × d_model and returns n × d_model, which is why we can stack 6, 32 or 100 identical layers. Only the content of each vector gets richer." },
      ],
    },
    {
      id: "three-variants",
      title: "The three variants of the Transformer",
      blocks: [
        { type: "compare", title: "Encoder-only, decoder-only and encoder–decoder",
          options: [
            { name: "Encoder-only", summary: "Just the encoder stack; every token sees every token (bidirectional).", pros: ["Rich understanding of the whole input", "Efficient for classification and embeddings"], cons: ["Not designed to generate long text"], bestFor: "Classification, search embeddings, named-entity recognition (BERT, RoBERTa)" },
            { name: "Decoder-only", summary: "Just the decoder stack with a causal mask, no cross-attention.", pros: ["One simple stack for everything", "Scales extremely well with next-token pre-training"], cons: ["Each token sees only the past, not the future"], bestFor: "Chat, text and code generation (GPT, Llama and most modern chat LLMs)" },
            { name: "Encoder–decoder", summary: "The original design: encoder reads, decoder writes with cross-attention.", pros: ["Strong for input→output mapping", "Encoder sees the input bidirectionally"], cons: ["Two stacks to train and run"], bestFor: "Translation, summarisation, speech-to-text (original Transformer, T5, BART, Whisper)" },
          ],
          rows: [
            ["Attention mask", "None (full)", "Causal", "Full in encoder, causal in decoder"],
            ["Cross-attention", "No", "No", "Yes"],
            ["Typical training", "Masked-token prediction", "Next-token prediction", "Predict output text from input text"],
          ],
          verdict: "Decoder-only dominates general-purpose LLMs today; encoder-only remains the workhorse for embeddings and classification; encoder–decoder fits clear input-to-output tasks." },
      ],
    },
    {
      id: "why-powerful",
      title: "Why the Transformer is so powerful",
      blocks: [
        { type: "list", items: [
          "**Parallel training**: all positions are processed at once, so huge datasets can be used on GPU clusters.",
          "**Direct long-range links**: any token reaches any other in one attention step.",
          "**Scales smoothly**: adding layers, width and data has kept improving results, which enabled today's large models.",
          "**General**: the same blocks work for text, images (split into patches), audio and video.",
          "**Simple, repeated design**: one layer type stacked many times is easy to optimise in hardware and software.",
        ] },
        { type: "callout", tone: "warn", title: "Limits we must know", text: "Self-attention compute and memory grow with the square of the sequence length, so long contexts are expensive. Generation is still one token at a time for decoder models. And a Transformer is only as good as its training data; the architecture alone does not guarantee truthfulness." },
        { type: "check", question: "If we removed the positional encodings from a Transformer encoder, what would happen to “dog bites man” vs “man bites dog”?", answer: "Each token would get the same output vector in both sentences (just in a different order), because self-attention without position information cannot tell order. The model could not tell who bit whom." },
      ],
    },
  ],
  quiz: [
    { q: "In a Transformer layer, what is the job of the feed-forward network compared with attention?", options: ["It mixes information between tokens, while attention processes each token alone", "It transforms each token on its own, after attention has mixed tokens", "It adds positional information to each token embedding before attention", "It converts the final token vectors back into readable output text"], answer: 1, explain: "Attention exchanges information across tokens; the position-wise FFN then transforms each token independently with the same weights. The first option reverses the roles; positional encoding and detokenization are separate steps." },
    { q: "A layer receives a 10 × 512 input (10 tokens, d_model 512). What shape is its output?", options: ["10 × 2,048", "512 × 10", "10 × 512", "1 × 512"], answer: 2, explain: "Each Transformer layer preserves the n × d_model shape, which is what allows stacking. 2,048 is only the FFN's internal hidden size, and the sequence is not collapsed to one vector." },
    { q: "We are building a system that labels support tickets by topic and produces embeddings for search. Which Transformer variant fits best?", options: ["Encoder-only, because every token can see the whole input", "Decoder-only, because its causal mask suits labelling tasks best", "Encoder–decoder, because classification requires cross-attention", "None; Transformers generate text and cannot output class labels"], answer: 0, explain: "Encoder-only models like BERT are designed for understanding tasks such as classification and embeddings. Decoder-only models can also do it but their causal mask limits each token's view, and cross-attention is not needed for labelling." },
    { q: "What do residual connections do in a Transformer?", options: ["They replace attention in the deeper layers so the stack trains faster", "They mask future tokens so each position only attends to earlier ones", "They encode each word's position by adding a fixed signal to the input", "They add a sub-layer's input to its output, easing gradient flow"], answer: 3, explain: "x + Sublayer(x) gives a direct path for information and gradients, making deep stacks trainable. Masking and positional encoding are different mechanisms." },
    { q: "Someone claims: “Attention alone already knows word order, so positional encoding is just an optional extra.” What is correct?", options: ["True, because the dot product between tokens already depends on their position", "False: without positions, self-attention sees an unordered set of tokens", "True, but only for decoder models, whose causal mask fully encodes order", "False, because positional encoding replaces attention in modern Transformers"], answer: 1, explain: "Self-attention is order-blind: shuffling tokens just shuffles outputs. Positional encodings (sinusoidal, learned or RoPE) supply order. They complement attention; they do not replace it. Decoder models also need positions (the causal mask gives some implicit order signal, but explicit positions are standard)." },
  ],
  takeaways: [
    "The Transformer replaced recurrence with attention, enabling parallel training (Vaswani et al., 2017).",
    "Input pipeline: tokenize → embed → add positional encoding (sinusoidal, learned or RoPE).",
    "Each layer = multi-head attention (tokens talk) + feed-forward network (each token thinks), with residuals and layer norm.",
    "The encoder reads the input once; the decoder writes token by token using masked self-attention and cross-attention.",
    "Variants: encoder-only (BERT), decoder-only (GPT and most LLMs), encoder–decoder (T5, original Transformer).",
  ],
  terms: [
    { term: "Encoder", def: "The stack that reads the whole input and produces context-rich vectors for each input token." },
    { term: "Decoder", def: "The stack that generates output tokens one at a time, using masked self-attention (and cross-attention in encoder–decoder models)." },
    { term: "Positional encoding", def: "Vectors added to token embeddings so the model can tell token order." },
    { term: "Multi-head attention", def: "Several attention operations in parallel, each learning a different pattern, then combined." },
    { term: "Feed-forward network (FFN)", def: "A small two-layer network applied to each token independently inside every layer." },
    { term: "Residual connection", def: "Adding a sub-layer's input to its output: x + Sublayer(x)." },
    { term: "Layer normalization", def: "Rescaling each token vector to a standard mean and variance to keep training stable." },
  ],
};
