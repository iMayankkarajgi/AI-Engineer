export default {
  id: 'cross-attention-in-transformers',
  minutes: 23,
  hook: 'When a translation model writes the French word "chats", how does it know to look back at the English word "cats" in a completely different sentence?',
  summary: 'Cross-attention is attention between two different sequences. The queries come from the sequence being generated (for example the French decoder), while the keys and values come from another source (the English encoder output, an audio clip, or a text prompt for an image model). The math is the same scaled dot-product attention; only the origin of Q versus K and V changes.',
  sections: [
    {
      id: 'what-is-cross-attention',
      title: 'What is cross-attention?',
      blocks: [
        { type: 'p', text: 'So far we have studied **self-attention**, where a sequence attends to itself: every token\'s query is compared with the keys of tokens in the *same* sequence. **Cross-attention** connects *two* sequences. One sequence asks the questions (provides the queries), and the other sequence supplies the answers (provides the keys and values).' },
        { type: 'p', text: 'Our running example is translation. The English sentence **"I love cats"** goes into an **encoder**, a stack of layers that turns it into a set of context-rich vectors. A **decoder** then writes the French sentence **"J\'aime les chats"** one token at a time. Each time the decoder is about to write a word, cross-attention lets it look over the English vectors and pick out the relevant ones.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like an interpreter with notes', text: 'A human interpreter listens to a speech and takes notes (the encoder). While speaking the translation, they glance back at their notes for exactly the part they are about to say (cross-attention). Their own sentence so far decides *what* they look for; the notes decide *what they find*.' },
      ],
    },
    {
      id: 'why-cross-attention',
      title: 'Why do we need cross-attention?',
      blocks: [
        { type: 'p', text: 'Many tasks turn one thing into another: English into French, audio into text, a text prompt into an image, a long document into a summary. The output must stay **grounded** in the input at every step. Self-attention alone can only look inside one sequence, so the decoder needs a separate channel into the source.' },
        { type: 'p', text: 'Before Transformers, encoder-decoder models built from recurrent networks compressed the whole input into a **single fixed-size vector** and handed that to the decoder. Long sentences lost detail because everything had to squeeze through that one bottleneck. Attention between decoder and encoder (introduced for translation around 2014–2015) fixed this by letting the decoder look at **every** encoder position, with weights that change at each output step. Cross-attention in the Transformer is the modern form of that idea.' },
        { type: 'check', question: 'Why does a fixed-size summary vector struggle with long inputs, while cross-attention does not?', answer: 'A fixed-size vector must hold the whole input no matter how long it is, so detail gets lost. Cross-attention keeps one vector per input token and lets each output step choose which ones to read, so nothing is forced through a single bottleneck.' },
      ],
    },
    {
      id: 'q-k-v-in-cross-attention',
      title: 'Query, key and value in cross-attention',
      blocks: [
        { type: 'p', text: 'The formula is unchanged: `softmax(Q·Kᵀ / √dₖ)·V`. What changes is **where each matrix comes from**:' },
        { type: 'formula', expr: 'Q = H_dec · W_q     K = H_enc · W_k     V = H_enc · W_v', where: [
          ['H_dec', 'decoder hidden states (target side, e.g. the French words so far), shape T_tgt × d_model'],
          ['H_enc', 'encoder output (source side, e.g. the English words), shape T_src × d_model'],
          ['Q', 'T_tgt × dₖ: what each target position is looking for'],
          ['K, V', 'T_src × dₖ and T_src × dᵥ: what each source position offers and carries'],
        ] },
        { type: 'p', text: 'The score matrix Q·Kᵀ therefore has shape **T_tgt × T_src**: one row per target token and one column per source token. It does not have to be square. A 3-word English sentence can produce a 4-token French sentence, and the weights are simply 4 × 3.' },
        { type: 'matrix', title: 'Illustrative cross-attention weights: French rows attend to English columns', rows: ['J\'', 'aime', 'les', 'chats'], cols: ['I', 'love', 'cats'], values: [[0.82, 0.12, 0.06], [0.08, 0.86, 0.06], [0.1, 0.2, 0.7], [0.04, 0.06, 0.9]], format: 'pct', caption: 'Illustrative numbers, not from a trained model. Trained translation models often show such roughly diagonal "alignment" patterns, with reordering where languages differ.' },
        { type: 'p', text: 'Note how "les" (the French article, which has no English counterpart here) still attends mostly to "cats", because the article is chosen to agree with the noun that follows it. Cross-attention learns these soft alignments without anyone labelling which word matches which.' },
      ],
    },
    {
      id: 'self-vs-cross',
      title: 'Self-attention vs cross-attention',
      blocks: [
        { type: 'compare', title: 'Same formula, different sources', options: [
          { name: 'Self-attention', summary: 'Q, K and V all come from the same sequence.', pros: ['Builds context within a sequence', 'Works in encoders and decoder-only LLMs'], cons: ['Cannot see a second input on its own'], bestFor: 'Understanding or continuing one sequence' },
          { name: 'Cross-attention', summary: 'Q from one sequence; K and V from another.', pros: ['Grounds output in a separate input', 'Inputs can be a different length or modality'], cons: ['Needs a separate encoder or input stream', 'Extra layers and memory for the source keys/values'], bestFor: 'Translation, speech-to-text, text-to-image, multimodal models' },
        ], rows: [
          ['Queries from', 'The sequence itself', 'The target / generating sequence'],
          ['Keys and values from', 'The sequence itself', 'The source / conditioning sequence'],
          ['Score matrix shape', 'T × T (square)', 'T_tgt × T_src (often not square)'],
          ['Causal mask', 'Yes in decoders', 'No: the whole source is already known'],
        ], verdict: 'Self-attention answers "how do my own tokens relate?"; cross-attention answers "what in the other input do I need right now?"' },
        { type: 'p', text: 'One detail in that table is easy to miss: cross-attention normally uses **no causal mask**. The causal mask prevents looking at *future target* tokens. The source sentence is fully known before decoding starts, so every target position may look at every source position. The decoder\'s **self**-attention is still causally masked.' },
      ],
    },
    {
      id: 'step-by-step',
      title: 'Step-by-step working of cross-attention',
      blocks: [
        { type: 'steps', title: 'Inside one decoder layer of an encoder-decoder Transformer', items: [
          { title: 'Encode the source once', text: 'The encoder reads "I love cats" with bidirectional self-attention and outputs one vector per source token, H_enc.' },
          { title: 'Masked self-attention', text: 'The decoder tokens so far ("<s> J\' aime") attend to each other with a causal mask.' },
          { title: 'Make queries', text: 'The decoder hidden states are projected with W_q into queries: "what source information do I need?"' },
          { title: 'Make keys and values from the source', text: 'H_enc is projected with W_k and W_v. These depend only on the source, so they can be computed once and reused for every generated token.' },
          { title: 'Attend', text: 'softmax(Q·Kᵀ / √dₖ) gives each target token a weight over source tokens; multiply by V to pull in source information.' },
          { title: 'Feed forward', text: 'The result passes through the residual connection, normalization and the feed-forward network, then on to the next layer.' },
        ] },
        { type: 'flow', title: 'Where cross-attention sits in an encoder-decoder layer', nodes: [
          { label: 'Encoder output', detail: 'One vector per source token; provides keys and values to every decoder layer.' },
          { label: 'Decoder self-attn', detail: 'Causally masked attention among target tokens generated so far.' },
          { label: 'Cross-attention', detail: 'Queries from the decoder, keys and values from the encoder output.' },
          { label: 'Feed-forward', detail: 'Per-token network that processes the combined information.' },
          { label: 'Next token', detail: 'After the last layer, a softmax over the vocabulary picks the next French token.' },
        ] },
      ],
    },
    {
      id: 'walk-through',
      title: 'A simple example walk-through',
      blocks: [
        { type: 'p', text: 'Here is cross-attention in numpy. The decoder has produced "<s> J\' aime" so far; the encoder has encoded "I love cats". Weights are random, so which word looks at which is chance. What matters is where Q, K and V come from and the shapes.' },
        { type: 'code', lang: 'python', title: 'cross_attention.py', code: `import numpy as np
np.set_printoptions(precision=2, suppress=True)
rng = np.random.default_rng(3)

src = ["I", "love", "cats"]            # encoder side (English)
tgt = ["<s>", "J'", "aime"]            # decoder side (French so far)
d_model, d_k = 6, 4

enc = rng.standard_normal((len(src), d_model))   # encoder output
dec = rng.standard_normal((len(tgt), d_model))   # decoder hidden states
W_q, W_k, W_v = (rng.standard_normal((d_model, d_k)) * 0.4 for _ in range(3))

def softmax(z):
    z = z - z.max(axis=-1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)

Q = dec @ W_q          # queries come from the DECODER
K = enc @ W_k          # keys come from the ENCODER
V = enc @ W_v          # values come from the ENCODER
print("Q", Q.shape, " K", K.shape, " V", V.shape)

weights = softmax(Q @ K.T / np.sqrt(d_k))   # (3 target x 3 source)
print("cross-attention weights (rows = French, cols = English):")
for word, row in zip(tgt, weights):
    print(f"  {word:>5}", row, "-> looks most at", src[row.argmax()])

out = weights @ V
print("output shape:", out.shape, "(one vector per decoder token)")

# Source length can differ from target length: add 2 more source tokens
enc5 = np.vstack([enc, rng.standard_normal((2, d_model))])
w5 = softmax(Q @ (enc5 @ W_k).T / np.sqrt(d_k))
print("with 5 source tokens, weights shape:", w5.shape)`,
          output: `Q (3, 4)  K (3, 4)  V (3, 4)
cross-attention weights (rows = French, cols = English):
    <s> [0.8  0.02 0.18] -> looks most at I
     J' [0.04 0.82 0.14] -> looks most at love
   aime [0.02 0.9  0.09] -> looks most at love
output shape: (3, 4) (one vector per decoder token)
with 5 source tokens, weights shape: (3, 5)`,
          walkthrough: [
            { lines: [5, 11], note: 'Two different sequences: three English encoder vectors and three French decoder vectors, plus three random projection matrices.' },
            { lines: [18, 21], note: 'The defining lines: Q is built from the decoder, K and V from the encoder. Everything else is ordinary attention.' },
            { lines: [23, 26], note: 'Weights have one row per French token and one column per English token; each row sums to 1. No causal mask is applied.' },
            { lines: [28, 29], note: 'The output has one vector per decoder token, now carrying information pulled from the English side.' },
            { lines: [31, 34], note: 'With a 5-token source the weight matrix becomes 3 × 5: the two sequences can have different lengths.' },
          ] },
        { type: 'check', question: 'During generation, the decoder adds one French token per step. Which of Q, K and V must be recomputed for the new token, and which can be reused?', answer: 'Only the new token\'s query is new. K and V come from the encoder output, which does not change during decoding, so they are computed once and cached for all steps.' },
      ],
    },
    {
      id: 'where-used',
      title: 'Where cross-attention is used',
      blocks: [
        { type: 'table', caption: 'Common places cross-attention appears (well-documented architectures)', head: ['System', 'Queries from', 'Keys and values from'], rows: [
          ['Original Transformer (2017), T5, BART', 'Decoder (output text)', 'Encoder (input text)'],
          ['Whisper (speech recognition)', 'Text decoder', 'Audio encoder output'],
          ['Stable Diffusion (text-to-image)', 'Image features inside the denoising U-Net', 'Text-encoder embeddings of the prompt'],
          ['Flamingo-style vision-language models', 'Language model layers', 'Image features (via gated cross-attention)'],
        ] },
        { type: 'callout', tone: 'example', title: 'Real-world example: text-to-image', text: 'When you type "a red bicycle on a beach" into a diffusion model like Stable Diffusion, the prompt is encoded into a sequence of vectors. Inside the image network, each spatial location of the image produces a query and cross-attends to the prompt vectors. That is how pixels in one region can "listen" to the word "bicycle" and pixels elsewhere to "beach".' },
        { type: 'p', text: 'Decoder-only chat LLMs, by contrast, usually do **not** have cross-attention layers. They put everything (instructions, documents, the conversation) into one sequence and rely on causal self-attention. Some multimodal models use cross-attention to inject images, while others convert images into tokens and feed them into the same sequence. Both designs exist, and which one a given product uses varies.' },
      ],
    },
    {
      id: 'importance-and-pitfalls',
      title: 'Why cross-attention matters, and common mistakes',
      blocks: [
        { type: 'list', items: [
          '**Grounding:** every output step can consult the source, so outputs stay tied to the input.',
          '**Flexible lengths:** source and target lengths are independent (T_tgt × T_src weights).',
          '**Multimodality:** the source can be text, audio, image patches, or any sequence of vectors, as long as it is projected to the right width.',
          '**Efficiency at decoding:** source keys and values are computed once and reused at every step.',
          '**Interpretability:** cross-attention maps often show rough alignments, such as which source word a translated word came from.',
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Swapping the roles (taking queries from the encoder) produces outputs aligned to the *source* length instead of the target. Applying a causal mask to cross-attention needlessly hides parts of the source. Forgetting a **padding mask** on the source side lets the decoder attend to filler tokens in batched inputs. And treating cross-attention maps as exact word alignments: they are soft, and different heads and layers can disagree.' },
        { type: 'p', text: '**When not to use it:** if all your inputs are text and you are building on a decoder-only LLM, concatenating the source into the prompt is usually simpler and works well. Cross-attention earns its place when the source is a different modality, is very long and fixed (encode once, decode many tokens), or when you want a clean separation between "what we condition on" and "what we generate".' },
      ],
    },
    {
      id: "worked-example-one-target-token",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "The lesson's code used random weights, so we could not check a row by hand. Let us do one target token with small made-up numbers. The decoder is about to write “chats”. Its query is [2, 0]. The three English tokens offer these keys and values (dₖ = 2, illustrative)." },
        { type: "table", caption: "Source keys and values for the hand example (illustrative numbers).", head: ["Source token", "Key", "Value", "Raw score with query [2, 0]"], rows: [
          ["I", "[0, 2]", "[1, 0]", "2·0 + 0·2 = 0"],
          ["love", "[1, 1]", "[0, 1]", "2·1 + 0·1 = 2"],
          ["cats", "[3, 0]", "[1, 1]", "2·3 + 0·0 = 6"],
        ] },
        { type: "steps", title: "From scores to the output for “chats”", items: [
          { title: "Scale", text: "Divide by √2 ≈ 1.41: [0, 2, 6] becomes [0, 1.41, 4.24]." },
          { title: "Softmax", text: "e⁰ = 1, e^1.41 ≈ 4.11, e^4.24 ≈ 69.59. The sum is 74.70, so the weights are about [0.01, 0.06, 0.93]. “chats” looks almost only at “cats”." },
          { title: "Blend the source values", text: "0.01·[1, 0] + 0.06·[0, 1] + 0.93·[1, 1] ≈ [0.94, 0.99]. The output is close to the value of “cats”." },
          { title: "Now add filler", text: "Pad the source with a fourth token. Its vector is arbitrary; say its key is [3, 0.5] and its value is [−2, 4]. Its raw score is also 6, the same as “cats”." },
          { title: "See the damage", text: "With no mask the weights become about [0.01, 0.03, 0.48, 0.48] and the output jumps to about [−0.48, 2.44]. Half of what “chats” reads is now noise." },
          { title: "Fix it", text: "Set the filler's score to −∞ before softmax. Its weight becomes 0 and we are back to [0.01, 0.06, 0.93]." },
        ] },
        { type: "p", text: "Two things are worth keeping from this. First, one row of cross-attention is nothing more than a soft lookup into the source: the target token brings a question, the source brings the answers. Second, the source side needs its own mask. It is not the causal mask, which we do not use here. It is a **padding mask** on the source columns, and without it the result for a sentence depends on how much filler its batch happened to add." },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will imitate three decoding steps. The source keys and values are built once, before the loop. Each step then makes one new query and reads the source, with and without a padding mask, so we can watch both the reuse and the leak." },
        { type: "code", lang: "python", title: "practice_cross_attention_steps.py", code: `import numpy as np
np.set_printoptions(precision=2, suppress=True)
rng = np.random.default_rng(11)

src = ["I", "love", "cats", "<pad>"]          # source, padded to length 4
d_model, d_k = 6, 4
enc = rng.standard_normal((len(src), d_model))
W_q, W_k, W_v = (rng.standard_normal((d_model, d_k)) * 0.6 for _ in range(3))

# Source keys and values: computed ONCE, before decoding starts
K, V = enc @ W_k, enc @ W_v
src_is_pad = np.array([s == "<pad>" for s in src])

def cross_attend(query, use_pad_mask):
    scores = query @ K.T / np.sqrt(d_k)       # this target token vs every source token
    if use_pad_mask:
        scores = np.where(src_is_pad, -np.inf, scores)
    w = np.exp(scores - scores.max())
    return w / w.sum()

# Decode three target tokens. Each step builds only ONE new query.
for step, word in enumerate(["J'", "aime", "les"], start=1):
    query = rng.standard_normal(d_model) @ W_q    # stand-in for the decoder state
    leaky = cross_attend(query, use_pad_mask=False)
    clean = cross_attend(query, use_pad_mask=True)
    print(f"step {step} {word:>4}: no mask {leaky}  masked {clean}")
print("K and V were built once and reused for", step, "steps")`, output: `step 1   J': no mask [0.22 0.38 0.28 0.12]  masked [0.25 0.43 0.32 0.  ]
step 2 aime: no mask [0.12 0.49 0.26 0.13]  masked [0.13 0.56 0.3  0.  ]
step 3  les: no mask [0.44 0.1  0.11 0.36]  masked [0.68 0.15 0.17 0.  ]
K and V were built once and reused for 3 steps`,
          walkthrough: [
            { lines: [5, 8], note: "A source of three real tokens plus one filler token, random encoder vectors and three projection matrices." },
            { lines: [10, 12], note: "The source side is projected to keys and values once. `src_is_pad` marks the filler column." },
            { lines: [14, 19], note: "One row of cross-attention: score the query against every source key, optionally hide the filler, then softmax." },
            { lines: [21, 27], note: "Three decoding steps. Only the query is new each time. Without the mask the filler takes 12%, 13% and 36% of the weight; with it, exactly 0." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Multiply the query by 3 (add `* 3` at the end of the `query = ...` line). Predict first: do the masked weights get flatter or more peaked, and does the top token change?",
          "Add `src_is_pad[0] = True` after the line that builds `src_is_pad`, so “I” is hidden too. Predict the masked weights for step 1 from the current ones.",
          "Move the line `K, V = enc @ W_k, enc @ W_v` inside `cross_attend`. Predict whether any printed weight changes, and count how many times the source is now projected.",
        ] },
        { type: "check", question: "At step 3 the unmasked row puts 36% on `<pad>`. Filler has no meaning. How can it earn that much weight, and what would it do to a real system?", answer: "A filler position still has a vector, so it still has a key, and a dot product with that key can be large by chance. Attention cannot know the token is meaningless unless we tell it. In a real system the output for the same sentence would then change with the amount of filler in its batch, which shows up as results that differ between batch sizes." },
        { type: "check", question: "In the hand example the query for “chats” was [2, 0] and “cats” got 93%. Suppose training doubles the query to [4, 0] and changes nothing else. What happens to the weight on “cats”, and why?", answer: "It rises to almost 100%. Doubling the query doubles every raw score to [0, 4, 12], so the gaps between them double too, and softmax turns bigger gaps into a sharper split. The direction of the query decides *which* source token wins; its length decides *by how much*." },
      ],
    },
  ],
  quiz: [
    { q: 'In cross-attention inside a translation model, where do the queries come from?', options: ['The encoder output for every token of the source sentence', 'The decoder\'s hidden states for the target tokens so far', 'A fixed learned query vector that is shared by all tokens', 'The vocabulary embedding table for the target language'], answer: 1, explain: 'Queries come from the decoder (what the target side needs); keys and values come from the encoder (what the source offers). Swapping them is a common confusion.' },
    { q: 'A source sentence has 7 tokens and the decoder has produced 4 tokens. What is the shape of the cross-attention weight matrix for one head?', options: ['7 × 7', '4 × 4', '4 × 7', '7 × 4'], answer: 2, explain: 'Rows follow the queries (4 target tokens) and columns follow the keys (7 source tokens), giving 4 × 7.' },
    { q: 'Why is a causal mask normally NOT applied in cross-attention?', options: ['The source is fully known up front, so attending to any of it is not cheating', 'Cross-attention has no softmax, so there is nothing for a mask to block', 'The decoder has no self-attention layers, so it never sees its own future tokens anyway', 'Causal masks only work on square matrices, and this one is rectangular'], answer: 0, explain: 'The causal mask stops a model from seeing future target tokens. The source is given in full, so every target position may attend to every source position.' },
    { q: 'You build a speech-to-text model and decoding is slow because you recompute the audio keys and values at every generated token. What is the fix?', options: ['Add a causal mask to the encoder so each step sees less of the audio', 'Recompute the decoder queries only every few tokens and reuse them in between', 'Compute the encoder keys and values once per input and reuse them each step', 'Replace cross-attention with a single summary vector of the audio'], answer: 2, explain: 'Encoder keys and values depend only on the source, which does not change while decoding. Caching them avoids repeated work; a summary vector would reintroduce the old bottleneck.' },
    { q: 'Which statement about self-attention versus cross-attention is a misconception?', options: ['Cross-attention uses a fundamentally different formula from self-attention', 'Self-attention takes Q, K and V from the same sequence', 'Cross-attention lets the source and target have different lengths', 'Cross-attention can connect different modalities, such as text and images'], answer: 0, explain: 'Both use softmax(Q·Kᵀ / √dₖ)·V. The only difference is which sequence supplies the queries and which supplies the keys and values.' },
  ],
  takeaways: [
    'Cross-attention connects two sequences: queries from the one being generated, keys and values from the source.',
    'The math is identical to self-attention; the weight matrix is T_tgt × T_src and need not be square.',
    'It uses no causal mask, because the source is fully known; the decoder\'s self-attention is still masked.',
    'Source keys and values are computed once and reused at every decoding step.',
    'It powers translation (T5, BART), speech recognition (Whisper), text-to-image (Stable Diffusion) and some multimodal LLMs.',
  ],
  terms: [
    { term: 'Cross-attention', def: 'Attention where queries come from one sequence and keys and values from another.' },
    { term: 'Encoder', def: 'The part of a model that reads the source input and produces one vector per input token.' },
    { term: 'Decoder', def: 'The part of a model that generates the output sequence one token at a time.' },
    { term: 'Encoder-decoder model', def: 'A Transformer with an encoder for the input and a decoder that cross-attends to it.' },
    { term: 'Alignment', def: 'Which source positions a target position draws from; cross-attention learns it softly.' },
    { term: 'Conditioning', def: 'Feeding extra information (a prompt, audio, an image) that guides what a model generates.' },
  ],
};
