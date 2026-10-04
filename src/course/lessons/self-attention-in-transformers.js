export default {
  id: "self-attention-in-transformers",
  minutes: 29,
  hook: "In “The animal didn't cross the street because it was too tired”, how does a model work out that “it” means the animal and not the street?",
  summary: "Self-attention lets every token in a sequence look at every other token and build a new, context-aware version of itself. Each token produces a query, a key and a value; queries are compared with keys by dot product, scaled by √dₖ, turned into weights with softmax, and used to average the values. Running several of these in parallel (multi-head attention) lets a Transformer capture many kinds of relationships at once.",
  sections: [
    {
      id: "what-is-self-attention",
      title: "What is Self Attention?",
      blocks: [
        { type: "p", text: "**Self-attention** is an operation that updates each token's vector by mixing in information from the other tokens *of the same sequence*, weighted by how relevant each one is. “Self” means the sequence attends to itself (in contrast with cross-attention, where one sequence attends to a different one). The output is one new vector per token, of the same size, that now carries context." },
        { type: "p", text: "Before self-attention, the vector for “it” is the same in every sentence. After self-attention in a trained model, the vector for “it” in our sentence contains a large share of information from “animal”, so later layers can treat it as referring to the animal." },
        { type: "callout", tone: "analogy", title: "Think of it like a group discussion", text: "Each word walks into a room with a question (“who am I referring to?”), a name tag describing itself (“I am a noun, an animal”) and some notes to share. Each word compares its question with everyone's name tag, listens most to the best matches, and updates its own notes with a blend of what they shared. That is self-attention: question = query, name tag = key, notes = value." },
      ],
    },
    {
      id: "why-needed",
      title: "Why do we need Self Attention?",
      blocks: [
        { type: "p", text: "Word meaning depends on context. “Bank” in “river bank” and “bank loan” are different. “It” can point to almost anything. A fixed embedding, one vector per word, cannot capture this, so a model needs a way to let words *inform each other*." },
        { type: "list", items: [
          "**Resolve references**: link “it”, “they”, “this” to what they mean.",
          "**Disambiguate**: pick the right sense of “bank”, “bat”, “spring”.",
          "**Long-range links**: connect a verb to its subject many words away (“The keys … are”).",
          "**Parallelism**: recurrent networks pass context step by step; self-attention links all pairs at once, which trains fast on GPUs.",
        ] },
        { type: "p", text: "Earlier sequence models (RNNs, LSTMs) carried context through a single memory vector updated word by word, so distant information faded and training could not be parallelised across positions. Self-attention gives every pair of tokens a direct connection, with weights that depend on the actual content of the sentence." },
      ],
    },
    {
      id: "query-key-value",
      title: "Query, Key, and Value vectors",
      blocks: [
        { type: "p", text: "Each token vector x is multiplied by three learned weight matrices to produce three new vectors:" },
        { type: "list", items: [
          "**Query** q = x · W_Q: what this token is looking for.",
          "**Key** k = x · W_K: what this token offers to be matched against.",
          "**Value** v = x · W_V: the information this token passes on if it is attended to.",
        ] },
        { type: "p", text: "Why three separate vectors instead of using x directly? Because the role of a word when *searching* differs from its role when *being found* and from *what it contributes*. A pronoun's query might look for “nouns that can be tired”, while a noun's key advertises “I am an animate noun”. The three matrices W_Q, W_K, W_V are learned during training, just like every other weight." },
        { type: "callout", tone: "analogy", title: "The library lookup", text: "A query is the search phrase we type; keys are the catalogue entries; values are the books themselves. Unlike a real library, attention does not return a single best book: it returns a blend of all books, weighted by how well each entry matches the search." },
        { type: "p", text: "Stacking all tokens as rows, we get matrices Q = X·W_Q, K = X·W_K and V = X·W_V. With n tokens and key size dₖ, Q and K are n × dₖ." },
      ],
    },
    {
      id: "step-by-step",
      title: "Step-by-step working of Self Attention",
      blocks: [
        { type: "formula", expr: "Attention(Q, K, V) = softmax(Q · Kᵀ / √dₖ) · V", where: [["Q · Kᵀ", "an n × n matrix: the score of every query against every key"], ["√dₖ", "square root of the key dimension, used to scale the scores"], ["softmax", "applied to each row, turning scores into weights that are positive and sum to 1"], ["· V", "each output row is the weighted average of the value vectors"]], caption: "Scaled dot-product attention, from “Attention Is All You Need” (2017)." },
        { type: "steps", title: "The five steps", items: [
          { title: "Project", text: "Multiply each token vector by W_Q, W_K and W_V to get its query, key and value." },
          { title: "Score", text: "For each token's query, take the dot product with every key. A larger dot product means a better match." },
          { title: "Scale", text: "Divide all scores by √dₖ. With dₖ = 64, divide by 8." },
          { title: "Softmax", text: "Apply softmax across each row so each token's weights over all tokens are positive and sum to 1. (In a decoder, future positions are masked to −∞ first.)" },
          { title: "Mix", text: "Multiply the weights by the values: each token's output is a weighted average of all value vectors." },
        ] },
        { type: "viz", name: "qkv-math", caption: "Walk through Q·Kᵀ, scaling by √dₖ, softmax and the weighted sum of V with real numbers, one step at a time." },
        { type: "deeper", title: "Why divide by √dₖ?", blocks: [
          { type: "p", text: "If the numbers in q and k are independent with mean 0 and variance 1, their dot product is a sum of dₖ such products, so its variance is dₖ and its typical size grows like √dₖ. With dₖ = 64, raw scores might be around ±8 or more." },
          { type: "p", text: "Large scores push softmax towards a one-hot output (almost all weight on one token). There, gradients become tiny and learning stalls. Dividing by √dₖ brings the variance back to about 1, keeping softmax in a range where it can still learn." },
          { type: "p", text: "Small example: scores [8, 4] give softmax ≈ [0.982, 0.018]. Scaled by √64 = 8 they become [1, 0.5] and softmax ≈ [0.62, 0.38], a much softer distribution." },
        ] },
      ],
    },
    {
      id: "walk-through",
      title: "A simple example walk-through",
      blocks: [
        { type: "p", text: "Let us run every step with real numbers on three tokens, “cat sat mat”, each a 4-dimensional vector, projected to dₖ = 2. The weight matrices hold small integers (−1, 0, 1) so we can check the arithmetic by hand." },
        { type: "code", lang: "python", title: "self_attention_by_hand.py", code: `import numpy as np
np.set_printoptions(precision=2, suppress=True)

tokens = ["cat", "sat", "mat"]
X = np.array([[1.0, 0.0, 1.0, 0.0],     # cat
              [0.0, 1.0, 0.0, 1.0],     # sat
              [1.0, 1.0, 0.0, 0.0]])    # mat   (3 tokens x d_model=4)

rng = np.random.default_rng(0)
W_q = rng.integers(-1, 2, size=(4, 2)).astype(float)   # learned in real models
W_k = rng.integers(-1, 2, size=(4, 2)).astype(float)
W_v = rng.integers(-1, 2, size=(4, 2)).astype(float)

# Step 1: project every token into a query, a key and a value
Q, K, V = X @ W_q, X @ W_k, X @ W_v
for name, M in [("Q", Q), ("K", K), ("V", V)]:
    print(name, "=", M.tolist())

# Step 2: score every query against every key (dot products)
scores = Q @ K.T
print("scores = Q @ K.T =", scores.tolist())

# Step 3: scale by sqrt(d_k) so large dimensions do not blow up softmax
d_k = K.shape[1]
scaled = scores / np.sqrt(d_k)

# Step 4: softmax each row into weights that sum to 1
weights = np.exp(scaled - scaled.max(1, keepdims=True))
weights /= weights.sum(1, keepdims=True)
print("weights =\\n", weights)

# Step 5: each output is the weighted average of the value vectors
out = weights @ V
for t, o in zip(tokens, out):
    print(f"output[{t}] = {o}")`, output: `Q = [[0.0, -1.0], [-1.0, -2.0], [1.0, -1.0]]
K = [[-1.0, 1.0], [1.0, 2.0], [-1.0, 2.0]]
V = [[-1.0, 1.0], [1.0, 0.0], [0.0, 1.0]]
scores = Q @ K.T = [[-1.0, -2.0, -2.0], [-1.0, -5.0, -3.0], [-2.0, -1.0, -3.0]]
weights =
 [[0.5  0.25 0.25]
 [0.77 0.05 0.19]
 [0.28 0.58 0.14]]
output[cat] = [-0.26  0.75]
output[sat] = [-0.72  0.95]
output[mat] = [0.29 0.42]`,
          walkthrough: [
            { lines: [4, 7], note: "Three token vectors (rows of X), each with 4 numbers." },
            { lines: [9, 12], note: "Random integer projection matrices W_Q, W_K, W_V of shape 4 × 2. In a real model these are learned." },
            { lines: [14, 17], note: "Step 1: Q, K and V are each 3 × 2: one query, key and value per token." },
            { lines: [19, 21], note: "Step 2: Q @ K.T gives a 3 × 3 score matrix. Row i holds token i's query scored against every key." },
            { lines: [23, 25], note: "Step 3: divide by √2 ≈ 1.414 because dₖ = 2." },
            { lines: [27, 30], note: "Step 4: row-wise softmax (subtracting the row max first for numerical safety). Each row sums to 1." },
            { lines: [32, 35], note: "Step 5: each output is the weighted average of the value vectors." },
          ] },
        { type: "p", text: "Check “cat” by hand. Its query is [0, −1]. Dot with the keys: [0,−1]·[−1,1] = −1, [0,−1]·[1,2] = −2, [0,−1]·[−1,2] = −2. Scaled: −0.71, −1.41, −1.41. Softmax: e⁰ = 1 and e^(−0.71) ≈ 0.49 (after subtracting the max) give 1/1.99 ≈ 0.50 and 0.49/1.99 ≈ 0.25, 0.25. Output = 0.50·[−1, 1] + 0.25·[1, 0] + 0.25·[0, 1] ≈ [−0.25, 0.75]; the code prints −0.26 because it uses unrounded weights." },
        { type: "matrix", title: "Attention weights from the code", rows: ["cat", "sat", "mat"], cols: ["cat", "sat", "mat"], values: [[0.5, 0.25, 0.25], [0.77, 0.05, 0.19], [0.28, 0.58, 0.14]], format: "pct", caption: "Each row is one token's attention over all tokens (rounded). Note that a token need not attend most to itself: “sat” puts 77% on “cat”." },
        { type: "check", question: "In the output, “sat” gives itself only 5% weight. Is that a bug?", answer: "No. Attention weights depend on how well the query matches each key, not on position. Here the query of “sat” ([−1, −2]) matches the key of “cat” ([−1, 1]) best, scoring −1, versus −5 for its own key ([1, 2]). Trained models often attend strongly away from the current token." },
      ],
    },
    {
      id: "why-it-works",
      title: "Why Self Attention works so well",
      blocks: [
        { type: "list", items: [
          "**Content-based, dynamic weights**: weights are computed from the actual tokens in each input, so the same layer handles “it = animal” in one sentence and “it = street” in another.",
          "**Direct paths**: any token can influence any other in a single step, so long-range relationships are easy to learn.",
          "**Parallel computation**: all scores are one matrix multiplication, ideal for GPUs.",
          "**Stackable**: outputs have the same shape as inputs, so layers can be stacked to build richer and richer representations.",
        ] },
        { type: "compare", title: "Three ways to mix information across a sequence",
          options: [
            { name: "Recurrence (RNN)", summary: "Pass a memory vector from token to token.", pros: ["Memory per step is constant", "Natural for streams"], cons: ["Sequential; slow to train", "Distant information fades"], bestFor: "Small streaming models" },
            { name: "Convolution (CNN)", summary: "Each token mixes with a fixed-size window of neighbours.", pros: ["Parallel", "Cheap per layer"], cons: ["Long-range links need many layers", "Fixed weights regardless of content"], bestFor: "Local patterns, audio, images" },
            { name: "Self-attention", summary: "Each token mixes with all tokens, weighted by content.", pros: ["Direct long-range links", "Parallel", "Weights adapt to each input"], cons: ["Cost grows with n² in sequence length", "Needs positional information"], bestFor: "Language models and most modern AI" },
          ],
          rows: [
            ["Steps from token 1 to token n", "n − 1", "About n / window size (layers)", "1"],
            ["Mixing weights", "Fixed, learned", "Fixed, learned", "Computed from the input"],
          ],
          verdict: "Self-attention trades quadratic cost for direct, content-aware connections, a trade that has paid off for language." },
        { type: "callout", tone: "warn", title: "Limits and common mistakes", text: "Self-attention is **order-blind**: without positional encodings, shuffling the tokens only shuffles the outputs. Its cost grows with the square of the sequence length (a 10× longer input means roughly 100× more attention scores). And attention weights are not a reliable explanation of *why* a model decided something; they show where information flowed in one layer, not the full reasoning." },
      ],
    },
    {
      id: "multi-head",
      title: "Multi-Head Self Attention",
      blocks: [
        { type: "p", text: "One attention operation produces one set of weights per token, so it tends to capture one kind of relationship at a time. **Multi-head attention** runs h attention operations (**heads**) in parallel, each with its own W_Q, W_K, W_V of a smaller size. One head might follow the previous token, another might link pronouns to nouns, another might focus on punctuation." },
        { type: "formula", expr: "MultiHead(X) = Concat(head₁, …, headₕ) · W_O,   headᵢ = Attention(X·W_Qⁱ, X·W_Kⁱ, X·W_Vⁱ)", where: [["h", "number of heads (8 in the original base Transformer)"], ["dₖ", "per-head size, usually d_model / h (512 / 8 = 64 in the original)"], ["W_O", "an output matrix that mixes the concatenated heads back to d_model"]] },
        { type: "p", text: "Because each head works in a smaller space (64 instead of 512 dimensions), the total compute is about the same as one big head, but the model gains several independent views of the sentence. Many modern LLMs also share keys and values between groups of heads (grouped-query attention) to save memory during generation." },
        { type: "viz", name: "multi-head", caption: "Switch between heads that learned different patterns: previous-token, subject, punctuation." },
      ],
    },
    {
      id: "where-used",
      title: "Where Self Attention is used",
      blocks: [
        { type: "table", head: ["Area", "How self-attention is used", "Examples"], rows: [
          ["Large language models", "Causal (masked) self-attention in every decoder layer", "GPT series, Llama, most chat assistants"],
          ["Text understanding", "Bidirectional self-attention in encoders", "BERT, sentence-embedding models"],
          ["Vision", "Images split into patches; patches attend to each other", "Vision Transformer (ViT, 2020)"],
          ["Speech", "Audio frames attend to each other in the encoder", "Whisper"],
          ["Image generation", "Attention layers inside the denoising network, plus cross-attention to the text prompt", "Stable Diffusion and similar diffusion models"],
          ["Science", "Attention over protein sequences and residue pairs", "AlphaFold 2"],
        ] },
        { type: "callout", tone: "example", title: "Back to “it was too tired”", text: "In a trained model, some heads in middle layers give the token “it” high weight on “animal”. If we change the sentence to “…because it was too wide”, the weight shifts towards “street”. Nothing about the layer changed; only the input did. That is the power of content-based weights." },
      ],
    },
    {
      id: "common-mistakes-diagnosis",
      title: "Common mistakes and how to spot them",
      blocks: [
        { type: "p", text: "Self-attention is only a few lines of code, and that makes its bugs sneaky. The code still runs and still returns numbers of the right shape. Here are the slips we see most often when someone writes it by hand, with a quick test for each." },
        { type: "table", caption: "Typical self-attention bugs and how to catch them.", head: ["Mistake", "What we observe", "Quick test"], rows: [
          ["Softmax over columns instead of rows", "Columns sum to 1, rows do not", "Sum each row of the weights; every sum must be 1"],
          ["Forgot to divide by √dₖ", "Weights are almost one-hot from the first training step; learning is slow", "Print the largest weight per row; values near 1.00 everywhere are a warning"],
          ["Mask applied after softmax", "Rows sum to less than 1", "Sum each row again after masking"],
          ["Q and K swapped", "The score matrix is transposed: token i's row holds how others look at it", "Check a pair we understand: does the row of “it” point at “animal”?"],
          ["No positional information", "Shuffled input gives the same outputs, shuffled", "Feed a sentence and its reverse; compare one token's output"],
        ] },
        { type: "p", text: "Two of these are worth doing with numbers. **Wrong axis**: in our hand-computed weight matrix, each row sums to 1, but the first column sums to 0.50 + 0.77 + 0.28 = 1.55. If a test on the columns passes, the softmax ran in the wrong direction." },
        { type: "p", text: "**Masking too late**: suppose one row of weights is [0.5, 0.3, 0.2] and the third token must be hidden. Zeroing it after softmax leaves [0.5, 0.3, 0], which sums to 0.8, so the output is no longer a proper average. Setting its score to −∞ *before* softmax gives [0.625, 0.375, 0]. The two visible tokens keep their 5 : 3 ratio and the row sums to 1 again." },
        { type: "steps", title: "A three-step sanity check for any attention code", items: [
          { title: "Check the shapes", text: "With n tokens, the scores and weights must be n × n and the output must be n × the value size." },
          { title: "Check the rows", text: "Every row of weights is positive and sums to 1. Masked cells are exactly 0." },
          { title: "Check a case we can predict", text: "Make all scores equal. Every output must then be the plain average of the visible value vectors." },
        ] },
        { type: "viz", name: "attention-heatmap", caption: "Click a token to see its row of weights over the sentence. Each row is one token's view and always adds up to 100%, with or without the causal mask." },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "Random weights never show *why* attention works. So we will set the weights by hand. We build a three-token example where the query of “it” is designed to find an animate noun, and check that the output of “it” really picks up the features of “animal”." },
        { type: "code", lang: "python", title: "practice_it_finds_animal.py", code: `import numpy as np
np.set_printoptions(precision=2, suppress=True)

tokens = ["animal", "street", "it"]
# Hand-made features (illustrative): [is_animate, is_place, is_pronoun]
X = np.array([[1.0, 0.0, 0.0],
              [0.0, 1.0, 0.0],
              [0.0, 0.0, 1.0]])

# Hand-set projections instead of learned ones (d_k = 1 keeps it readable)
W_q = np.array([[0.0], [0.0], [1.5]])    # only the pronoun asks a question
W_k = np.array([[2.0], [-2.0], [0.0]])   # animate says "yes", place says "no"
W_v = np.eye(3)                          # values pass the features on unchanged

Q, K, V = X @ W_q, X @ W_k, X @ W_v
scores = Q @ K.T / np.sqrt(K.shape[1])   # 3 x 3: every query against every key
weights = np.exp(scores - scores.max(1, keepdims=True))
weights /= weights.sum(1, keepdims=True) # softmax per row
out = weights @ V                        # blend the values

print("scores for 'it':", scores[2])
for t, w, o in zip(tokens, weights, out):
    print(f"{t:6s} weights={w}  output={o}")`, output: `scores for 'it': [ 3. -3.  0.]
animal weights=[0.33 0.33 0.33]  output=[0.33 0.33 0.33]
street weights=[0.33 0.33 0.33]  output=[0.33 0.33 0.33]
it     weights=[0.95 0.   0.05]  output=[0.95 0.   0.05]`,
          walkthrough: [
            { lines: [4, 8], note: "Each token is described by three made-up features: animate, place, pronoun. One token per row." },
            { lines: [10, 13], note: "We choose the projections ourselves. The query only fires for pronouns. The key is positive for animate things and negative for places. Values copy the features." },
            { lines: [15, 19], note: "The usual pipeline: project, score every query against every key, scale, softmax per row, blend the values." },
            { lines: [21, 23], note: "“it” scores 3 for animal, −3 for street and 0 for itself, which softmax turns into 95%, 0% and 5%. Its output is now mostly “animate”." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Flip the key signs to `[[-2.0], [2.0], [0.0]]`, as if the sentence ended “because it was too wide”. Predict the new weights for “it”.",
          "Change `1.5` in `W_q` to `0.0`. Predict the weights and output for “it” when it asks no question at all.",
          "Set the pronoun's key to `2.0` (the last row of `W_k`). Predict how “it” now splits its weight between “animal” and itself.",
        ] },
        { type: "check", question: "The score of “it” for “street” is −3, yet its weight is 0.00, not a negative number. And “it” itself, with score 0, still gets 0.05. What does this tell us about how to read attention scores?", answer: "Only the differences between scores in a row matter. Softmax always returns positive weights that sum to 1, so a negative score just means “much less than the best match”, never negative attention. A score of 0 is not “no attention” either: it is 3 below the top score, which leaves a small share. Adding the same number to every score in a row would change nothing." },
        { type: "check", question: "The output for “it” is [0.95, 0, 0.05]. Its own “pronoun” feature fell from 1 to 0.05. Has the model forgotten that “it” is a pronoun?", answer: "The attention output alone nearly has. But in a Transformer layer this output is *added* to the token's original vector through the residual connection, so “it” keeps its own features and gains the animate signal on top. Attention supplies the context; the residual path keeps the identity." },
      ],
    },
  ],
  quiz: [
    { q: "In self-attention, what role does the key vector play?", options: ["It is the information a token passes on to others when it is attended to", "It is what other tokens' queries are compared against to get scores", "It stores the token's position so attention can tell word order", "It is the final output of the layer after the weighted sum is taken"], answer: 1, explain: "Queries are matched against keys by dot product to produce scores. Values (the first option) carry the information that gets mixed; position comes from positional encodings; the output is the weighted sum of values." },
    { q: "A token's scaled scores are [0, 0] over two tokens whose value vectors are [2, 0] and [0, 4]. What is its attention output?", options: ["[2, 4]", "[0, 0]", "[1, 2]", "[2, 0]"], answer: 2, explain: "Equal scores give softmax weights [0.5, 0.5], so the output is 0.5·[2, 0] + 0.5·[0, 4] = [1, 2]. [2, 4] adds without weighting, and [2, 0] would need all weight on the first token." },
    { q: "Why do we divide Q · Kᵀ by √dₖ?", options: ["Dot products grow with dₖ, so softmax saturates and gradients become tiny", "To make the attention matrix symmetric, so token pairs score equally", "To turn the raw scores into probabilities that sum to one per row", "To push the scores of future tokens down so they are effectively hidden away"], answer: 0, explain: "Scaling keeps score variance around 1 so softmax stays trainable. Softmax (not scaling) creates probabilities, the causal mask hides future tokens, and attention matrices are generally not symmetric." },
    { q: "Our model treats “dog bites man” and “man bites dog” as meaning the same thing. Which missing component most likely causes this?", options: ["The value projection W_V, which carries each token's word order", "The softmax, which ranks tokens by where they appear in the sentence", "Multi-head attention, since a single head cannot track word order", "Positional encoding, because self-attention alone is order-blind"], answer: 3, explain: "Without position information, self-attention sees a set of tokens, so swapping words just swaps outputs. W_V, softmax and multiple heads do not provide order." },
    { q: "How does multi-head attention differ from single-head attention?", options: ["It runs attention several times in sequence, with each pass feeding the next one", "It runs several smaller attentions in parallel, each with its own projections", "It removes queries and keys, mixing the values with fixed uniform weights", "It restricts each head to a small window of neighbouring tokens"], answer: 1, explain: "Heads are parallel, each with its own W_Q, W_K, W_V in a smaller dimension, combined with W_O. Stacking in sequence is what layers do; heads still use queries and keys and can attend anywhere." },
  ],
  takeaways: [
    "Self-attention lets each token build a context-aware vector by mixing information from all tokens.",
    "Each token gets a query (what it seeks), a key (what it offers) and a value (what it shares) from learned matrices.",
    "Attention(Q, K, V) = softmax(Q·Kᵀ / √dₖ) · V; scaling by √dₖ keeps softmax trainable.",
    "Multi-head attention runs several smaller attentions in parallel to capture different relationships.",
    "Self-attention is order-blind (needs positions) and costs grow with the square of sequence length.",
  ],
  terms: [
    { term: "Self-attention", def: "An operation where every token in a sequence attends to every token of the same sequence to update its representation." },
    { term: "Query", def: "A vector describing what a token is looking for, compared against keys." },
    { term: "Key", def: "A vector describing what a token offers, matched against queries." },
    { term: "Value", def: "A vector holding the information a token contributes to others' outputs." },
    { term: "Scaled dot-product attention", def: "softmax(Q·Kᵀ / √dₖ) · V, the standard attention formula." },
    { term: "Attention head", def: "One independent attention operation with its own Q, K, V projections." },
    { term: "Softmax", def: "A function that turns a list of scores into positive weights summing to 1." },
  ],
};
