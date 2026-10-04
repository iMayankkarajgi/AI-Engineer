export default {
  id: 'math-behind-attention-qkv',
  minutes: 27,
  hook: 'When a Transformer reads "I love cats", how does the word "love" decide how much to listen to "I" and how much to listen to "cats"? It is just four matrix steps, and we can do them by hand.',
  summary: 'Attention turns each token into three vectors: a query (what I am looking for), a key (what I offer) and a value (what I will pass on). Dot products between queries and keys give scores, we scale them by √dₖ, softmax turns each row into weights that sum to 1, and the output for each token is the weighted average of the value vectors. We will compute every number for a three-word sentence.',
  sections: [
    {
      id: 'the-attention-formula',
      title: 'The attention formula',
      blocks: [
        { type: 'p', text: 'Every modern large language model (LLM) is built from a block called the **Transformer**, and the heart of that block is **attention**. Attention lets every token in a sentence look at the other tokens and pull in the information it needs. The word "it" in "The trophy did not fit in the suitcase because it was too big" must look back at "trophy" to mean anything. Attention is the mechanism that does this looking.' },
        { type: 'p', text: 'The whole mechanism fits on one line. It looks scary at first, but by the end of this lesson every symbol in it will have a concrete number attached.' },
        { type: 'formula', expr: 'Attention(Q, K, V) = softmax(Q·Kᵀ / √dₖ) · V',
          where: [
            ['Q', 'the query matrix: one row per token, saying "what am I looking for?"'],
            ['K', 'the key matrix: one row per token, saying "what do I contain?"'],
            ['V', 'the value matrix: one row per token, saying "what will I hand over if you pick me?"'],
            ['Kᵀ', 'K transposed (rows become columns), so that Q·Kᵀ compares every query with every key'],
            ['dₖ', 'the length of each query and key vector; we divide by its square root'],
            ['softmax', 'turns each row of scores into positive weights that add up to 1'],
          ],
          caption: 'Scaled dot-product attention, from the 2017 paper "Attention Is All You Need".' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a library search', text: 'You walk into a library with a **question** (the query). Every book has a **label on its spine** (the key). You compare your question with every label and decide how relevant each book is (the scores). Then you do not read just one book: you take a little from each, more from the relevant ones and almost nothing from the rest. What you actually read is the **content inside** each book (the value). Attention does this for every token at the same time.' },
        { type: 'p', text: 'Our running example is the tiny sentence **"I love cats"**: three tokens. We will follow it through each step: words to vectors, vectors to Q, K and V, scores, scaling, softmax and the final weighted sum.' },
      ],
    },
    {
      id: 'words-to-vectors',
      title: 'Setting up: from words to vectors',
      blocks: [
        { type: 'p', text: 'A neural network cannot multiply words, only numbers. So the first thing a Transformer does is split text into **tokens** (words or pieces of words) and replace each token with an **embedding**: a list of numbers learned during training that captures what the token means. Real models use embeddings with thousands of numbers (for example 4,096). We will use just **4 numbers per token** so we can follow the arithmetic.' },
        { type: 'table', caption: 'Our input matrix X: one row per token, d_model = 4 columns. The numbers are made up for illustration.', head: ['Token', 'Embedding (row of X)'], rows: [
          ['I', '[1, 0, 1, 0]'],
          ['love', '[0, 2, 0, 2]'],
          ['cats', '[1, 1, 1, 1]'],
        ] },
        { type: 'p', text: 'Stacking the three rows gives a **matrix** X with shape 3 × 4: 3 tokens, each of width `d_model = 4`. The name `d_model` just means "the width of the vectors that flow through the model". In a real model the embedding would also carry position information (covered in the RoPE lesson), but we skip that here to keep the numbers clean.' },
        { type: 'callout', tone: 'note', title: 'Shapes are your best friend', text: 'Most confusion in attention math disappears if you write the shape next to every matrix. We will do that all the way through: X is (3 × 4), and every result we build will have a shape you can predict before computing it.' },
      ],
    },
    {
      id: 'creating-q-k-v',
      title: 'Creating the Q, K and V matrices',
      blocks: [
        { type: 'p', text: 'Each token now plays three different roles, so we make three different versions of it. We multiply X by three **weight matrices** `W_q`, `W_k` and `W_v`. These matrices are the learned parameters of the attention layer: training adjusts them so that the queries, keys and values become useful. Here we fix them to small whole numbers so you can check the arithmetic.' },
        { type: 'formula', expr: 'Q = X · W_q     K = X · W_k     V = X · W_v', where: [
          ['X', '(3 × 4) token embeddings'],
          ['W_q, W_k, W_v', '(4 × 3) learned projection matrices; 4 in, dₖ = 3 out'],
          ['Q, K, V', '(3 × 3) one query, key and value row per token'],
        ] },
        { type: 'p', text: 'Let us compute the query for "I" by hand. Its embedding is `[1, 0, 1, 0]`, so multiplying by `W_q` simply adds row 1 and row 3 of `W_q`: `[1, 0, 1] + [0, 0, 1] = [1, 0, 2]`. The key for "I" uses `W_k` in the same way: `[0, 0, 1] + [0, 1, 0] = [0, 1, 1]`. Doing this for every token gives:' },
        { type: 'table', caption: 'Q, K and V for our three tokens (computed by the code later in this lesson).', head: ['Token', 'Query q', 'Key k', 'Value v'], rows: [
          ['I', '[1, 0, 2]', '[0, 1, 1]', '[1, 2, 3]'],
          ['love', '[2, 2, 2]', '[4, 4, 0]', '[2, 8, 0]'],
          ['cats', '[2, 1, 3]', '[2, 3, 1]', '[2, 6, 3]'],
        ] },
        { type: 'p', text: 'Why three separate projections instead of comparing raw embeddings? Because "what I am looking for" and "what I contain" are different things. The word "love" (a verb) may be *looking for* its subject and object, while what it *offers* to others is "I am an action of liking". Separate matrices let the model learn these roles independently. The value projection is separate again because the information worth passing on need not be the same as the features used for matching.' },
        { type: 'check', question: 'Pause and predict: if X were (10 × 512) and each W were (512 × 64), what shape would Q·Kᵀ have?', answer: 'Q and K would both be (10 × 64). Kᵀ is (64 × 10), so Q·Kᵀ is (10 × 10): one score for every pair of the 10 tokens. The score matrix is always (tokens × tokens), whatever dₖ is.' },
      ],
    },
    {
      id: 'attention-scores',
      title: 'Computing attention scores (Q × Kᵀ)',
      blocks: [
        { type: 'p', text: 'Now each query is compared with every key using the **dot product**: multiply matching positions and add them up. A large positive dot product means the two vectors point in a similar direction, which we read as "this key matches what this query wants". A score near zero means "unrelated", and a negative score means "points the opposite way".' },
        { type: 'p', text: 'For the query of "I", `q = [1, 0, 2]`:' },
        { type: 'list', items: [
          'vs key of "I" `[0, 1, 1]`: 1·0 + 0·1 + 2·1 = **2**',
          'vs key of "love" `[4, 4, 0]`: 1·4 + 0·4 + 2·0 = **4**',
          'vs key of "cats" `[2, 3, 1]`: 1·2 + 0·3 + 2·1 = **4**',
        ] },
        { type: 'p', text: 'Writing all of these at once is exactly the matrix product Q·Kᵀ. Row i, column j holds "how well query i matches key j":' },
        { type: 'matrix', title: 'Raw scores Q·Kᵀ (rows = query token, columns = key token)', rows: ['I', 'love', 'cats'], cols: ['I', 'love', 'cats'], values: [[2, 4, 4], [4, 16, 12], [4, 12, 10]], format: 'int', caption: 'Row "love" has the largest numbers: its query [2, 2, 2] is long and lines up well with the key of "love" itself.' },
        { type: 'p', text: 'Notice the matrix is not symmetric in general: the score of "I" looking at "love" uses the query of "I" and the key of "love", while "love" looking at "I" uses the query of "love" and the key of "I". In this toy example some entries happen to match, but with real learned weights they almost never do. Attention is directional.' },
      ],
    },
    {
      id: 'scaling-the-scores',
      title: 'Scaling the scores',
      blocks: [
        { type: 'p', text: 'Next we divide every score by `√dₖ`. Here dₖ = 3, so we divide by √3 ≈ 1.73. Row "I" becomes `[2, 4, 4] / 1.73 = [1.15, 2.31, 2.31]`, and row "love" becomes `[2.31, 9.24, 6.93]`.' },
        { type: 'p', text: 'Why bother? A dot product is a sum of dₖ terms, so the bigger dₖ is, the larger (and more spread out) the scores tend to be. Real models use dₖ = 64 or 128. Without scaling, softmax would receive huge numbers, put nearly all of its weight on one token and leave the others with almost zero, which also makes training slow because gradients nearly vanish. Dividing by √dₖ keeps scores in a comfortable range no matter how wide the vectors are. The next lesson proves exactly why √dₖ is the right number.' },
        { type: 'callout', tone: 'tip', title: 'Small preview', text: 'Even in our tiny example scaling matters. Without it, the "love" row would give weights of about 0.00 / 0.98 / 0.02. With it, we get 0.00 / 0.91 / 0.09, so "cats" keeps a meaningful share.' },
      ],
    },
    {
      id: 'applying-softmax',
      title: 'Applying softmax',
      blocks: [
        { type: 'p', text: 'Scores can be any real number, but we want **weights**: positive numbers that add up to 1 in each row, so the output is a proper weighted average. The **softmax** function does this. For a row of numbers z₁ … zₙ it raises e to each number and divides by the total.' },
        { type: 'formula', expr: 'softmax(zᵢ) = eᶻⁱ / ∑ⱼ eᶻʲ', where: [['e', 'Euler\'s number, about 2.718'], ['zᵢ', 'the i-th scaled score in the row']], caption: 'Bigger scores get exponentially bigger weights, but every weight stays above zero.' },
        { type: 'p', text: 'For row "I", the scaled scores are `[1.15, 2.31, 2.31]`. Exponentiating gives about `[3.17, 10.07, 10.07]`, which sum to 23.31. Dividing each by 23.31 gives weights **[0.136, 0.432, 0.432]**. So "I" takes 13.6% of its new meaning from itself and about 43% from each of "love" and "cats".' },
        { type: 'matrix', title: 'Attention weights after softmax (each row sums to 100%)', rows: ['I', 'love', 'cats'], cols: ['I', 'love', 'cats'], values: [[0.136, 0.432, 0.432], [0.001, 0.909, 0.09], [0.007, 0.755, 0.238]], format: 'pct', caption: 'Computed from our toy numbers. "love" attends 91% to itself; "cats" attends mostly to "love".' },
        { type: 'callout', tone: 'note', title: 'The stability trick', text: 'Code usually subtracts the largest number in each row before exponentiating. This does not change the result (the same factor cancels in the top and bottom of the fraction) but stops e^z from overflowing when z is large.' },
      ],
    },
    {
      id: 'weights-times-values',
      title: 'Computing the final output (attention weights × V)',
      blocks: [
        { type: 'p', text: 'Finally each token builds its output by mixing the value vectors using its weights. For "I":' },
        { type: 'p', text: '`0.136·[1, 2, 3] + 0.432·[2, 8, 0] + 0.432·[2, 6, 3] = [1.86, 6.32, 1.70]`' },
        { type: 'p', text: 'This new vector is the **context-aware** representation of "I". Before attention, the vector for "I" knew only about the word "I". After attention, it carries information blended in from "love" and "cats". Stack the outputs of all three tokens and you get a (3 × 3) matrix: same number of rows as tokens, width dᵥ (the value width).' },
        { type: 'viz', name: 'qkv-math', caption: 'Step through the same pipeline: Q·Kᵀ, divide by √dₖ, softmax, then the weighted sum of V. Watch how each number is produced from the previous step.' },
        { type: 'check', question: 'Suppose a row of weights came out as [0, 1, 0]. What would that token\'s output be?', answer: 'Exactly the value vector of the second token, copied unchanged. A one-hot weight row means "take everything from one token". Softmax never gives exactly 0 or 1, but very peaked rows come close, which is why unscaled scores are a problem.' },
      ],
    },
    {
      id: 'putting-it-together',
      title: 'Putting it all together in code',
      blocks: [
        { type: 'steps', title: 'Attention in five moves', items: [
          { title: 'Embed', text: 'Turn each token into a vector; stack them into X with shape (tokens × d_model).' },
          { title: 'Project', text: 'Multiply X by learned W_q, W_k and W_v to get Q, K and V, each (tokens × dₖ).' },
          { title: 'Score', text: 'Compute Q·Kᵀ: a (tokens × tokens) table of how well each query matches each key.' },
          { title: 'Scale and softmax', text: 'Divide by √dₖ, then softmax each row so the weights are positive and sum to 1.' },
          { title: 'Blend', text: 'Multiply the weights by V: each token\'s output is a weighted average of all value vectors.' },
        ] },
        { type: 'code', lang: 'python', title: 'qkv_by_hand.py', code: `import numpy as np
np.set_printoptions(precision=2, suppress=True)

# 3 tokens ("I", "love", "cats"), each a 4-dim embedding (d_model = 4)
X = np.array([[1, 0, 1, 0],
              [0, 2, 0, 2],
              [1, 1, 1, 1]], dtype=float)

# Learned projection matrices (fixed small numbers here), 4 -> d_k = 3
W_q = np.array([[1, 0, 1], [1, 0, 0], [0, 0, 1], [0, 1, 1]], dtype=float)
W_k = np.array([[0, 0, 1], [1, 1, 0], [0, 1, 0], [1, 1, 0]], dtype=float)
W_v = np.array([[0, 2, 0], [0, 3, 0], [1, 0, 3], [1, 1, 0]], dtype=float)

Q, K, V = X @ W_q, X @ W_k, X @ W_v
print("Q =\\n", Q)
print("K =\\n", K)
print("V =\\n", V)

scores = Q @ K.T                      # 3x3: query i vs key j
print("scores = Q.K^T =\\n", scores)

d_k = K.shape[1]
scaled = scores / np.sqrt(d_k)        # divide by sqrt(3) = 1.73
print("scaled =\\n", scaled)

def softmax(z):
    z = z - z.max(axis=-1, keepdims=True)   # subtract row max for stability
    e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)

weights = softmax(scaled)             # each row sums to 1
print("weights =\\n", weights)
print("row sums:", weights.sum(axis=1))

out = weights @ V                     # blend the value vectors
print("output =\\n", out)`,
          output: `Q =
 [[1. 0. 2.]
 [2. 2. 2.]
 [2. 1. 3.]]
K =
 [[0. 1. 1.]
 [4. 4. 0.]
 [2. 3. 1.]]
V =
 [[1. 2. 3.]
 [2. 8. 0.]
 [2. 6. 3.]]
scores = Q.K^T =
 [[ 2.  4.  4.]
 [ 4. 16. 12.]
 [ 4. 12. 10.]]
scaled =
 [[1.15 2.31 2.31]
 [2.31 9.24 6.93]
 [2.31 6.93 5.77]]
weights =
 [[0.14 0.43 0.43]
 [0.   0.91 0.09]
 [0.01 0.75 0.24]]
row sums: [1. 1. 1.]
output =
 [[1.86 6.32 1.7 ]
 [2.   7.81 0.27]
 [1.99 7.48 0.74]]`,
          walkthrough: [
            { lines: [4, 7], note: 'X holds one 4-number embedding per token. In a real model these come from an embedding table plus position information.' },
            { lines: [9, 12], note: 'The three projection matrices. In a trained model they are learned; here they are small integers so the math is checkable.' },
            { lines: [14, 17], note: 'One matrix multiply each produces all queries, keys and values for every token at once.' },
            { lines: [19, 20], note: 'Q @ K.T compares every query with every key in a single operation: a 3 × 3 score table.' },
            { lines: [22, 24], note: 'Divide by √dₖ = √3 so the scores do not grow with vector width.' },
            { lines: [26, 33], note: 'Row-wise softmax with the max-subtraction trick. The row sums print as 1.' },
            { lines: [35, 36], note: 'The weighted sum of value vectors: each output row is a context-aware version of its token.' },
          ] },
        { type: 'p', text: 'Everything runs as **matrix multiplications**, which is the reason attention is fast on GPUs: all tokens are processed in parallel rather than one after another as in older recurrent networks.' },
      ],
    },
    {
      id: 'compare-and-pitfalls',
      title: 'How it compares, where it is used and common mistakes',
      blocks: [
        { type: 'compare', title: 'Plain averaging vs dot-product attention', options: [
          { name: 'Plain average of neighbours', summary: 'Every token gets an equal share of every other token.', pros: ['Trivial to compute', 'No parameters'], cons: ['Cannot focus on the relevant word', 'Same mix for every token'], bestFor: 'Baselines such as bag-of-words averaging' },
          { name: 'Scaled dot-product attention', summary: 'Weights depend on how well each query matches each key.', pros: ['Each token chooses its own mix', 'Learned via W_q, W_k, W_v', 'Fully parallel matrix math'], cons: ['Score table grows as tokens²', 'Needs position information added separately'], bestFor: 'Every Transformer layer in modern LLMs' },
        ], rows: [
          ['Who decides the weights', 'Fixed (1/n each)', 'Learned query-key matching'],
          ['Different per token', 'No', 'Yes, one row of weights per token'],
          ['Cost for n tokens', 'About n²·d', 'About n²·d (plus projections)'],
        ], verdict: 'Attention keeps the cheap "weighted average" shape but lets the model learn where to look. That one change is what made Transformers work.' },
        { type: 'callout', tone: 'example', title: 'Where you meet this every day', text: 'Every token a chatbot writes passes through dozens of attention layers, each doing exactly these steps (with many heads at once, covered later). When a support bot answers "Your order ships Monday" after reading a long order history, attention is how the word "ships" finds the relevant date in the earlier text.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Mixing up which side is transposed (it is Q·Kᵀ, giving tokens × tokens, not Qᵀ·K). Applying softmax over the wrong axis (it must run along each row, over the keys). Forgetting the √dₖ scaling. And thinking Q, K and V are three different inputs: in self-attention they are all projections of the **same** X.' },
        { type: 'p', text: 'One honest limit: the score matrix has one entry per pair of tokens, so memory and compute grow with the **square** of the sequence length. Doubling the context roughly quadruples the attention work. Techniques like FlashAttention, sliding windows and KV caching (later lessons) exist largely to manage this cost.' },
      ],
    },
    {
      id: "worked-example-cats-row",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "We did the row for “I” by hand. Let us now do the row for “cats” from start to finish, and this time use the stability trick by hand too. Its raw scores from the score matrix are [4, 12, 10]." },
        { type: "steps", title: "The “cats” row, one move at a time", items: [
          { title: "Scale", text: "Divide by √3 ≈ 1.73: [4, 12, 10] becomes [2.31, 6.93, 5.77]." },
          { title: "Subtract the row maximum", text: "The largest value is 6.93. Subtracting it gives [−4.62, 0, −1.15]. The weights will be the same, but now no exponent is large." },
          { title: "Exponentiate", text: "e^(−4.62) ≈ 0.010, e⁰ = 1, e^(−1.15) ≈ 0.315. The sum is about 1.325." },
          { title: "Normalise", text: "Divide each by 1.325: weights ≈ [0.007, 0.755, 0.238]. They add up to 1." },
          { title: "Blend the values", text: "0.007·[1, 2, 3] + 0.755·[2, 8, 0] + 0.238·[2, 6, 3] ≈ [1.99, 7.48, 0.74]. This matches the last row of the code's output." },
        ] },
        { type: "p", text: "Now look at the three outputs next to the values they were mixed from. Something stands out: every output number sits **between** the smallest and largest value in its column." },
        { type: "table", caption: "Each output is a weighted average, so it can never leave the range of the values. Numbers from the code output.", head: ["Value column", "Values (I, love, cats)", "Range", "Outputs (I, love, cats)"], rows: [
          ["1st", "1, 2, 2", "1 to 2", "1.86, 2.00, 1.99"],
          ["2nd", "2, 8, 6", "2 to 8", "6.32, 7.81, 7.48"],
          ["3rd", "3, 0, 3", "0 to 3", "1.70, 0.27, 0.74"],
        ] },
        { type: "p", text: "This is a real limit of the attention step. Its weights are positive and sum to 1, so it can only *select and blend* what the value vectors already hold. It cannot produce a 9 in the second column when the largest value there is 8. Building new features out of the blend is the job of the layers around attention: the output matrix and the feed-forward network that follows." },
        { type: "callout", tone: "tip", title: "A free sanity check", text: "When we debug attention code, we can test this directly: before any output projection, each output number must lie between the column minimum and maximum of V. If it does not, the weights are not a proper softmax row." },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build attention as a **soft dictionary** with plain Python loops and no matrices. Three colour names have a key and a value. We look up a query, and then make the lookup sharper and sharper to watch a blend turn into a near-exact lookup." },
        { type: "code", lang: "python", title: "practice_soft_dictionary.py", code: `import math

# A "soft dictionary": each entry has a key vector and a value vector.
# Values are made-up (red, green) colour amounts, for illustration only.
keys = {"red": [1.0, 0.0], "green": [0.0, 1.0], "orange": [0.8, 0.6]}
values = {"red": [255, 0], "green": [0, 255], "orange": [255, 165]}

def attend(query, sharpness):
    d_k = len(query)
    scores = {}
    for name, key in keys.items():
        dot = sum(q * k for q, k in zip(query, key))    # query . key
        scores[name] = sharpness * dot / math.sqrt(d_k)  # scale by sqrt(d_k)
    top = max(scores.values())
    exps = {name: math.exp(s - top) for name, s in scores.items()}
    total = sum(exps.values())
    weights = {name: e / total for name, e in exps.items()}   # softmax
    # Output = weighted average of the value vectors
    out = [sum(weights[n] * values[n][i] for n in keys) for i in range(2)]
    return weights, out

query = [1.0, 0.1]        # "something very red, a tiny bit green"
for sharpness in [1, 5, 25]:
    weights, out = attend(query, sharpness)
    w = "  ".join(f"{n}={p:.2f}" for n, p in weights.items())
    print(f"sharpness {sharpness:2d}: {w}  ->  output [{out[0]:.0f}, {out[1]:.0f}]")`, output: `sharpness  1: red=0.41  green=0.22  orange=0.37  ->  output [200, 117]
sharpness  5: red=0.61  green=0.03  orange=0.37  ->  output [249, 67]
sharpness 25: red=0.92  green=0.00  orange=0.08  ->  output [255, 13]`,
          walkthrough: [
            { lines: [3, 6], note: "The dictionary. Keys are 2-number directions used for matching. Values are what we get back. The key of “orange” points mostly the same way as “red”." },
            { lines: [8, 13], note: "Score every entry: the dot product of the query with its key, divided by √dₖ. `sharpness` multiplies the scores so we can see what bigger scores do." },
            { lines: [14, 20], note: "Softmax with the subtract-the-maximum trick, then the weighted average of the value vectors, one output number at a time." },
            { lines: [22, 26], note: "Look up the same query at three sharpness levels. The winner never changes, but its share grows from 41% to 92%." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Change the query to `[0.0, 1.0]`. Predict the winner and the output at sharpness 25 before running.",
          "Change the query to `[0.8, 0.6]`, exactly the key of “orange”. Predict: does “orange” win at sharpness 1, and by how much?",
          "Keep the original query but make the orange key twice as long: `[1.6, 1.2]`. Predict which entry wins now, and what that says about long key vectors.",
        ] },
        { type: "check", question: "The query [1.0, 0.1] points almost exactly at the key of “red”. Yet at sharpness 1, “red” gets only 41%. Is the matching broken?", answer: "No. The raw dot products are 1.0 for red, 0.86 for orange and 0.1 for green, and after dividing by √2 the gaps between them are well under 1. Softmax turns small gaps into a soft split. How peaked attention is depends on how far apart the scores are, and that depends on how long the query and key vectors are. A trained model grows those lengths where it needs a sharp lookup." },
        { type: "check", question: "In the lesson's table, the second value column holds 2, 8 and 6. Could some choice of attention weights make a token's output 9 in that column?", answer: "No. The weights are positive and sum to 1, so the result is always a weighted average and stays between 2 and 8. To get anything outside that range the model needs a different step, such as the output projection or the feed-forward network. Attention moves and mixes information; it does not invent new values." },
      ],
    },
  ],
  quiz: [
    { q: 'In self-attention, what role does the key vector of a token play?', options: ['It is the information the token passes on when it is attended to', 'It is what the token advertises so queries can measure their match', 'It is the final output the attention layer produces for that token', 'It stores the token’s position in the sentence for the other tokens'], answer: 1, explain: 'Keys are compared with queries via dot products to produce scores. The information actually passed on is the value vector, which is the tempting wrong answer.' },
    { q: 'A sequence has 6 tokens and dₖ = 64. What is the shape of the score matrix Q·Kᵀ?', options: ['(6 × 64)', '(64 × 64)', '(6 × 6)', '(64 × 6)'], answer: 2, explain: 'Q is (6 × 64) and Kᵀ is (64 × 6), so the product is (6 × 6): one score for every query-key pair. dₖ disappears in the multiplication.' },
    { q: 'Our query for "I" is [1, 0, 2] and a key is [2, 3, 1]. What is the raw score before scaling?', options: ['4', '3', '6', '5'], answer: 0, explain: '1·2 + 0·3 + 2·1 = 2 + 0 + 2 = 4. Raw scores are plain dot products; scaling by √dₖ comes afterwards.' },
    { q: 'What is the difference between the attention weights and the attention output?', options: ['They are the same tokens × tokens matrix, just written in two different notations', 'Weights are softmaxed scores (tokens × tokens); output is weights × V (tokens × dᵥ)', 'Weights are computed from V, while the output is computed from K and Q', 'The output is computed first, and the weights are then derived from it'], answer: 1, explain: 'Weights say how much each token listens to each other token. The output is what each token actually receives: a weighted average of the value vectors.' },
    { q: 'A teammate says: "Q, K and V are three different inputs to self-attention, like three separate documents." What is wrong with this?', options: ['Nothing; Q, K and V really are three separate inputs to the layer', 'Q, K and V are fixed random matrices that are never updated in training', 'Only K and V come from the input; Q is a fixed learned constant vector', 'All three are learned projections of the same token embeddings X'], answer: 3, explain: 'Self-attention computes Q = X·W_q, K = X·W_k and V = X·W_v from the same X. Only in cross-attention do queries come from a different sequence than keys and values.' },
  ],
  takeaways: [
    'Each token is projected into a query (what it looks for), a key (what it offers) and a value (what it hands over).',
    'Q·Kᵀ gives a tokens × tokens table of match scores using dot products.',
    'Scores are divided by √dₖ so they do not grow with vector width, then softmax turns each row into weights summing to 1.',
    'The output for each token is the weighted average of all value vectors: a context-aware representation.',
    'It is all matrix multiplication, so it runs in parallel, but cost grows with the square of sequence length.',
  ],
  terms: [
    { term: 'Query (Q)', def: 'A projection of a token that represents what information it is looking for.' },
    { term: 'Key (K)', def: 'A projection of a token that is matched against queries to decide relevance.' },
    { term: 'Value (V)', def: 'A projection of a token that carries the information passed on when it is attended to.' },
    { term: 'Dot product', def: 'Multiply two vectors position by position and add the results; large when they point the same way.' },
    { term: 'Softmax', def: 'A function that turns a list of numbers into positive weights that sum to 1.' },
    { term: 'dₖ', def: 'The length of each query and key vector; scores are divided by its square root.' },
    { term: 'Attention weights', def: 'The softmax output: how much each token listens to every other token.' },
  ],
};
