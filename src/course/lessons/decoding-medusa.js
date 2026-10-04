export default {
  id: 'decoding-medusa',
  minutes: 23,
  hook: 'What if a language model could guess its next three words by itself, with no second model to help, and still never change what it would have said?',
  summary: 'Medusa speeds up text generation by bolting a few small extra "heads" onto an existing LLM so that, in one forward pass, the model guesses several future tokens at once. A special tree-shaped attention mask lets the model check many of those guesses in the very next pass, and every guess that matches what the model would have produced anyway is kept for free.',
  sections: [
    {
      id: 'what-is-medusa',
      title: 'What is Medusa?',
      blocks: [
        { type: 'p', text: '**Medusa** is a method for making large language models (LLMs) generate text faster. It was introduced in 2024 by Tianle Cai and colleagues in the paper *Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads*. The name comes from the Greek myth of Medusa, whose head was covered in snakes: the method gives one model many small prediction **heads**.' },
        { type: 'p', text: 'Medusa belongs to a family of tricks called **speculative decoding**: guess several future tokens cheaply, then let the real model check all those guesses in one go. What makes Medusa different is *where the guesses come from*. Classic speculative decoding uses a separate, smaller "draft" model. Medusa uses no second model at all. The big model drafts for itself.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a court stenographer', text: 'A fast stenographer does not wait for every word. While the speaker says "the cat", she has already pencilled in the likely next words "sat on the". If the speaker really says them, she has saved time; if not, she rubs them out and keeps writing. Medusa heads are those pencilled-in guesses, made by the same brain that is listening.' },
        { type: 'p', text: 'Throughout this lesson we follow one running example: a support chatbot answering "How do I reset my password?". The chatbot is a 7-billion-parameter model running on one GPU, and we want its answers to stream out faster without changing a single word of them.' },
      ],
    },
    {
      id: 'why-generation-is-slow',
      title: 'Why text generation is slow',
      blocks: [
        { type: 'p', text: 'An LLM writes text **autoregressively**: it produces one token (a word or piece of a word), appends it to the input, and runs again to get the next token. A 300-token answer needs about 300 forward passes, one after another. No pass can start before the previous one finishes, because each one needs the token the previous one chose.' },
        { type: 'p', text: 'Each of those passes is surprisingly wasteful. To produce one token, the GPU must read **every weight** of the model from its memory. For a 7B model in 16-bit precision that is about 14 GB of data per token. Modern GPUs can do arithmetic far faster than they can move that much data, so during this one-token-at-a-time phase (called **decoding**) the chip spends most of its time waiting on memory. We say decoding is **memory-bandwidth bound**.' },
        { type: 'p', text: 'Here is the key consequence. If we feed the model 5 tokens instead of 1 in a single pass, it still reads the weights only once. The extra arithmetic is almost free. So checking 5 tokens costs roughly the same wall-clock time as producing 1. Every speculative method, Medusa included, is built on this fact.' },
        { type: 'check', question: 'Pause and predict: if a forward pass over 1 token takes 20 ms on our GPU, roughly how long would one pass over 4 tokens take during decoding?', answer: 'Only a little more than 20 ms. Decoding is limited by reading the weights from memory, which happens once per pass regardless of whether we process 1 or 4 tokens. The extra compute for 3 more tokens is small, so the pass might take 21–23 ms (illustrative), not 80 ms.' },
      ],
    },
    {
      id: 'speculative-decoding-recap',
      title: 'A quick recap of speculative decoding',
      blocks: [
        { type: 'p', text: 'Classic speculative decoding pairs two models. A small, fast **draft model** guesses the next few tokens. The large **target model** (the one whose output we actually want) then processes all those guesses in a single forward pass and checks them. It keeps the longest run of guesses that agree with what it would have generated, and adds one token of its own at the point where they first disagree.' },
        { type: 'viz', name: 'speculative-decoding', caption: 'A draft proposes k tokens; the target verifies them in one pass. Watch how many are accepted per step and how the speedup estimate changes.' },
        { type: 'p', text: 'Because the target model always has the final say, the output is identical to what it would have produced alone (with greedy decoding), or has the exact same probability distribution (with sampling and the proper acceptance rule). Speed improves; quality does not change.' },
      ],
    },
    {
      id: 'the-draft-model-problem',
      title: 'The problem with needing a draft model',
      blocks: [
        { type: 'p', text: 'The two-model recipe works, but it is awkward to run in practice:' },
        { type: 'list', items: [
          '**You need a matching draft model.** It must share the exact same tokenizer and vocabulary as the target. Many models have no small sibling.',
          '**The two models must agree.** If the draft was trained on different data, its guesses get rejected often and the speedup disappears.',
          '**Serving gets complicated.** Two models must be loaded, kept in memory, scheduled and batched together. The draft also needs its own KV cache (the stored keys and values of past tokens).',
          '**The draft still runs one token at a time.** Drafting 4 tokens means 4 small sequential passes, which adds latency of its own.',
        ] },
        { type: 'p', text: 'For our support chatbot this means: find a tiny model trained like ours, deploy it next to ours, and hope they agree. The Medusa authors asked a simpler question: the big model already understands the conversation deeply, so why not let it guess further ahead by itself?' },
      ],
    },
    {
      id: 'many-heads-one-model',
      title: 'The big idea: many heads on one model',
      blocks: [
        { type: 'p', text: 'A normal LLM ends with one **LM head**: a final layer that turns the last hidden state (a long vector summarising everything read so far, call it `h`) into probabilities over the vocabulary for the *next* token. Medusa keeps that head and adds a few more next to it, usually 3 to 5.' },
        { type: 'list', items: [
          'The original LM head predicts the token at position **t+1** (the next token).',
          'Medusa head 1 predicts the token at position **t+2** (one further).',
          'Medusa head 2 predicts **t+3**, head 3 predicts **t+4**, and so on.',
        ] },
        { type: 'p', text: 'All heads read the *same* hidden state `h` from the same forward pass. So one pass now produces the normal next token plus a guess for each of the next few positions. No second model, no extra sequential passes.' },
        { type: 'formula', expr: 'pₖ = softmax( W₂⁽ᵏ⁾ · ( SiLU(W₁⁽ᵏ⁾ · h) + h ) )', where: [ ['h', 'last hidden state of the backbone model at the current position'], ['W₁⁽ᵏ⁾', 'a small square weight matrix for head k (initialised to zero)'], ['SiLU', 'a smooth activation function, x · sigmoid(x)'], ['+ h', 'a residual connection, so the head starts as a copy of h'], ['W₂⁽ᵏ⁾', 'projection to vocabulary size (initialised from the original LM head)'], ['pₖ', 'head k\'s probabilities for the token k+1 positions ahead'] ], caption: 'Each Medusa head, as described in the paper, is one feed-forward layer with a residual connection.' },
        { type: 'p', text: 'Each head is tiny compared with the model: one hidden-size matrix plus an output projection. Because `W₁` starts at zero and `W₂` starts as a copy of the LM head, every head begins life predicting the same thing as the original head and then learns to shift its focus further ahead.' },
        { type: 'steps', title: 'Training the heads', items: [
          { title: 'Medusa-1: freeze the backbone', text: 'Keep the original model frozen and train only the new heads, using the model\'s own training-style data. This is cheap (a few GPU-hours for a 7B model in the paper) and cannot hurt the original output, because the backbone and its LM head are untouched.' },
          { title: 'Medusa-2: train jointly', text: 'Fine-tune the backbone together with the heads, with care (different learning rates, a warm-up) so the original next-token quality is preserved. The heads become more accurate because the hidden state learns to carry more future information.' },
          { title: 'Self-distillation when data is missing', text: 'If the original training data is not available, generate training text with the model itself and train the heads to match it. This keeps the heads aligned with the model\'s real behaviour.' },
        ] },
        { type: 'callout', tone: 'note', title: 'Why accuracy drops with distance', text: 'Head 1 only has to look one extra step ahead, so it is right fairly often. Head 3 has to guess three steps ahead without knowing the two tokens in between, so it is right much less often. This is the central weakness Medusa must work around, and the reason it guesses several candidates per head instead of one.' },
      ],
    },
    {
      id: 'tree-attention',
      title: 'How tree attention checks many guesses at once',
      blocks: [
        { type: 'p', text: 'To keep the picture small, imagine the model has just written "The cat" and the LM head has picked its next token. Head 1\'s top two guesses for the following position are "sat" and "is"; head 2\'s top two for the position after that are "on" and "down". If we only kept each head\'s single best guess, one wrong guess would end the run. Instead Medusa keeps the top few guesses of every head and combines them into a **tree** of candidate continuations.' },
        { type: 'p', text: 'Each path from the root of the tree is one possible continuation. We want to verify all paths in **one** forward pass. The trick is to flatten every tree node into one long input sequence and use a custom attention mask, called **tree attention**: each node may attend only to the real context and to its own ancestors in the tree, never to its siblings or cousins. Each node also gets the position index of its depth, not its place in the flattened list.' },
        { type: 'matrix', title: 'Tree attention mask (1 = may attend)', rows: ['sat', 'is', 'sat→on', 'sat→down', 'is→on', 'is→down'], cols: ['sat', 'is', 'sat→on', 'sat→down', 'is→on', 'is→down'], values: [[1, 0, 0, 0, 0, 0], [0, 1, 0, 0, 0, 0], [1, 0, 1, 0, 0, 0], [1, 0, 0, 1, 0, 0], [0, 1, 0, 0, 1, 0], [0, 1, 0, 0, 0, 1]], format: 'int', caption: 'A tree with 2 guesses from head 1 and 2 from head 2. "sat→on" sees "sat" and itself but not "is". All 6 nodes are scored in one pass; every row also sees the full earlier context (not shown).' },
        { type: 'steps', title: 'One Medusa decoding step', items: [
          { title: 'Run the model once', text: 'The forward pass gives the normal next token from the LM head and top-k guesses from each Medusa head.' },
          { title: 'Build the candidate tree', text: 'Combine the guesses into a tree. Real systems use a fixed, sparse tree (tens of nodes) that favours the most likely branches, rather than every combination.' },
          { title: 'Verify with tree attention', text: 'In the next forward pass, feed all tree nodes at once with the tree mask. The model computes its own prediction at every node.' },
          { title: 'Accept the longest good path', text: 'Walk each path and keep tokens while they match what the model itself predicts (greedy) or pass the acceptance test (sampling). Pick the path with the most accepted tokens.' },
          { title: 'Repeat from the new end', text: 'Append the accepted tokens plus the model\'s own correction token, update the KV cache for that path only, and the same pass has already produced fresh head guesses for the next step.' },
        ] },
        { type: 'p', text: 'Notice that verification and drafting overlap: the pass that checks the current tree also produces the heads\' guesses for the next tree. That is why Medusa adds very little latency per step.' },
        { type: 'deeper', title: 'Typical acceptance: how Medusa handles sampling', blocks: [
          { type: 'p', text: 'With greedy decoding the rule is simple: accept a guessed token only if it equals the model\'s own top choice. With sampling (temperature above 0), standard speculative decoding uses **rejection sampling**, which keeps the output distribution exactly unchanged. The Medusa paper also proposes a looser rule called **typical acceptance**: accept a candidate if the original model gives it a probability above a threshold that depends on how uncertain (high-entropy) the model is at that point.' },
          { type: 'p', text: 'Typical acceptance accepts more tokens, so it is faster, but it no longer guarantees exactly the same distribution as plain sampling. The authors report that quality stays comparable. If you need a strict guarantee, use greedy decoding or rejection sampling.' },
        ] },
      ],
    },
    {
      id: 'speedup-math',
      title: 'The math behind the speedup with small numbers',
      blocks: [
        { type: 'p', text: 'Let us put numbers on it. Say head 1\'s best guess is right 60% of the time, head 2\'s 40%, and head 3\'s 25% (illustrative numbers; real values depend on model, data and training). Guess 2 only counts if guess 1 was also right, and so on. So the expected number of tokens per step is:' },
        { type: 'formula', expr: 'E[tokens] = 1 + a₁ + a₁·a₂ + a₁·a₂·a₃', where: [ ['1', 'the model\'s own next token, always produced'], ['aₖ', 'chance head k\'s guess is accepted, given the earlier ones were'] ], caption: 'With a₁=0.6, a₂=0.4, a₃=0.25: 1 + 0.6 + 0.24 + 0.06 = 1.90 tokens per step.' },
        { type: 'p', text: 'Now use a tree with each head\'s top 3 guesses. The right token is in head 1\'s top 3 more often, say 85%; head 2\'s top 3, 65%; head 3\'s top 3, 45%. The same formula gives 1 + 0.85 + 0.55 + 0.25 ≈ 2.65 tokens per step. The tree turns weak individual guesses into a much longer accepted run.' },
        { type: 'p', text: 'Speedup is tokens per step divided by the cost of a step. If verifying the tree makes each pass about 10% slower, the speedup is roughly 2.65 / 1.1 ≈ 2.4×. A bigger tree raises tokens per step but also raises cost per step, and on a busy GPU that cost grows faster. Choosing the tree is a balance.' },
        { type: 'code', lang: 'python', title: 'medusa_math.py', code: `import itertools
import numpy as np

# Illustrative accuracies for 3 Medusa heads (head 1 guesses 1 token past the
# base model's own next token, head 2 two past it, and so on).
top1 = [0.60, 0.40, 0.25]          # chance the head's single best guess is right
top3 = [0.85, 0.65, 0.45]          # chance the right token is in its top 3

def expected_tokens(acc):
    # The base model always yields 1 token. Guess k only counts if guesses 1..k all hit.
    total, run = 1.0, 1.0
    for a in acc:
        run *= a
        total += run
    return total

print("tokens per step, chain of top-1 guesses:", round(expected_tokens(top1), 2))
print("tokens per step, tree of top-3 guesses: ", round(expected_tokens(top3), 2))

# Build a tiny tree: 2 options from head 1, each followed by 2 options from head 2.
head1, head2 = ["sat", "is"], ["on", "down"]
paths = [(a,) for a in head1] + list(itertools.product(head1, head2))
nodes = paths                       # each node is identified by its path from the root
mask = np.zeros((len(nodes), len(nodes)), dtype=int)
for i, n in enumerate(nodes):
    for j, m in enumerate(nodes):
        mask[i, j] = int(n[:len(m)] == m)   # attend only to yourself and your ancestors
print("tree nodes:", [" ".join(n) for n in nodes])
print(mask)

# Monte Carlo check of the chain formula with a fixed seed.
rng = np.random.default_rng(0)
hits = rng.random((100_000, 3)) < np.array(top1)
accepted = np.cumprod(hits, axis=1).sum(axis=1) + 1
print("simulated tokens per step (top-1 chain):", round(accepted.mean(), 2))`, output: `tokens per step, chain of top-1 guesses: 1.9
tokens per step, tree of top-3 guesses:  2.65
tree nodes: ['sat', 'is', 'sat on', 'sat down', 'is on', 'is down']
[[1 0 0 0 0 0]
 [0 1 0 0 0 0]
 [1 0 1 0 0 0]
 [1 0 0 1 0 0]
 [0 1 0 0 1 0]
 [0 1 0 0 0 1]]
simulated tokens per step (top-1 chain): 1.9`, walkthrough: [
          { lines: [4, 7], note: 'Illustrative head accuracies. Top-3 accuracy is always at least top-1 accuracy, and both fall for heads that look further ahead.' },
          { lines: [9, 15], note: 'The expected accepted length: keep multiplying acceptance chances, because a later guess only counts if all earlier ones were right.' },
          { lines: [20, 27], note: 'Build every tree node as a path and set mask[i, j] = 1 when node j is a prefix (an ancestor or itself) of node i. That is exactly the tree attention mask.' },
          { lines: [31, 34], note: 'A simulation with a fixed seed confirms the formula: about 1.9 tokens per step for the top-1 chain.' },
        ] },
        { type: 'check', question: 'If we added a 4th head whose top-1 guess is right only 10% of the time (given the earlier ones were right), how much would the top-1 chain gain?', answer: 'Very little. The new term is a₁·a₂·a₃·a₄ = 0.6 × 0.4 × 0.25 × 0.1 = 0.006 tokens per step. Far-ahead heads add almost nothing on their own, which is why Medusa relies on trees and why most setups use only a handful of heads.' },
      ],
    },
    {
      id: 'results',
      title: 'The results',
      blocks: [
        { type: 'p', text: 'The paper tested Medusa on chat models such as Vicuna (7B, 13B and 33B) and Zephyr. It reports that Medusa-1 (frozen backbone) gave over 2.2× faster generation without changing output quality, and Medusa-2 (joint training) gave roughly 2.3× to 3.6× speedups. Gains varied with the model and the kind of text: predictable text such as code or extraction tends to accept more guesses than open-ended creative writing.' },
        { type: 'chart', kind: 'bar', title: 'Tokens per step in our toy example', yLabel: 'Tokens per forward pass', labels: ['Plain decoding', 'Medusa top-1 chain', 'Medusa top-3 tree'], series: [ { name: 'Tokens per step', values: [1, 1.9, 2.65] } ], caption: 'Illustrative numbers from the code above, not measured benchmarks. Real speedup is lower than tokens per step because verification makes each pass slightly more expensive.' },
        { type: 'compare', title: 'Draft-model speculative decoding vs Medusa', options: [
          { name: 'Separate draft model', summary: 'A small model proposes tokens; the big model verifies.', pros: ['No change to the big model', 'Exact distribution with rejection sampling', 'Works with any compatible pair'], cons: ['Needs a matching small model', 'Two models to serve and cache', 'Drafting is sequential'], bestFor: 'Model families with a good small sibling' },
          { name: 'Medusa heads', summary: 'Extra heads on the big model guess several future tokens in one pass.', pros: ['One model to deploy', 'Heads are cheap to train', 'Drafting is nearly free'], cons: ['Heads must be trained per model', 'Far heads are weak because they guess blind', 'Typical acceptance is not exactly lossless'], bestFor: 'Single-model serving, low-batch latency' },
        ], rows: [ ['Extra model', 'Yes', 'No, just small heads'], ['Draft cost per step', 'k small sequential passes', 'Part of the same pass'], ['Training needed', 'None if a draft exists', 'Train the heads'], ['Verification', 'Usually a single chain', 'A tree of candidates'] ], verdict: 'Medusa trades a little training for a much simpler deployment. When a good draft model already exists, the classic approach is still a fine choice.' },
      ],
    },
    {
      id: 'medusa-today',
      title: 'How Medusa lives on today',
      blocks: [
        { type: 'p', text: 'Medusa was influential less as a final product and more as a set of ideas that later systems adopted:' },
        { type: 'list', items: [
          '**Tree attention and tree verification** became standard. Later methods such as EAGLE (next lesson) also verify a tree of drafts in one pass.',
          '**Drafting from the model\'s own hidden states** inspired stronger successors. Hydra made each head see the previous head\'s guess; EAGLE predicts future hidden features instead of tokens directly.',
          '**Multi-token prediction during pre-training**, used for example by DeepSeek-V3, trains extra prediction modules alongside the model, which can then serve as built-in drafters.',
          '**Serving engines support it.** NVIDIA TensorRT-LLM and Hugging Face Text Generation Inference have shipped Medusa support, and vLLM has had Medusa among its speculative options. Exact support varies by version, so check the docs of the release you run.',
        ] },
        { type: 'callout', tone: 'example', title: 'Real-world use', text: 'A team serving a single fine-tuned chat model at low batch sizes (a few users at a time) can train Medusa heads for a few GPU-hours and switch them on in a serving engine that supports them. Their users see answers stream out roughly twice as fast, with no second model to manage.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes and limits', text: 'Medusa helps most when the GPU is under-used (small batches). With large batches the GPU is already busy doing compute, so extra tree tokens are no longer free and the speedup shrinks or vanishes. Heads are tied to one exact model: after you fine-tune the model, retrain the heads. And do not assume "faster" means "identical": with typical acceptance the sampled text can differ statistically from plain sampling.' },
      ],
    },
    {
      id: "one-step-traced-by-hand",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "Let us trace one full Medusa step for our support chatbot with greedy decoding. The answer so far is “To reset your password,” and the LM head has just picked the next token: “click”. In the same pass, head 1 offered its top two guesses for the following position, “the” and “on”, and head 2 offered “link” and “Reset” for the position after that. The tokens are made up for illustration." },
        { type: "steps", title: "Verifying a 6-node tree in one pass", items: [
          { title: "Build the tree", text: "Two nodes at depth 1 (“the”, “on”) and four at depth 2 (“the→link”, “the→Reset”, “on→link”, “on→Reset”). Six nodes in total." },
          { title: "Run one pass with the tree mask", text: "All six nodes go in together after “click”. At every node the model reports what it would write next, having seen only the real text and that node's ancestors." },
          { title: "Check depth 1", text: "After “click” the model's own choice is “the”. The node “the” is accepted. The node “on” is rejected, and with it both nodes underneath." },
          { title: "Check depth 2", text: "At the node “the” the model's own choice is “Reset”. So “the→Reset” is accepted and “the→link” is not." },
          { title: "Take the model's own token", text: "At the node “the→Reset” the model has already computed its next choice, say “button”. We keep it. It is the one token every step is sure to give." },
          { title: "Count", text: "This step added “the”, “Reset” and “button”: 3 tokens from one pass. Four of the six nodes were wasted work." }
        ] },
        { type: "table", caption: "The four paths through the tree and how far each one gets", head: ["Path", "Depth 1 matches?", "Depth 2 matches?", "Guesses accepted"], rows: [
          ["the → link", "Yes", "No", "1"],
          ["the → Reset", "Yes", "Yes", "2"],
          ["on → link", "No", "(not checked)", "0"],
          ["on → Reset", "No", "(not checked)", "0"]
        ] },
        { type: "p", text: "Now compare with a chain that keeps only each head's first guess: “the” then “link”. It would accept “the”, fail on “link”, and add the model's own token: 2 tokens instead of 3. The second guess of head 2 is what earned the extra token." },
        { type: "p", text: "And the worst case? If the model's choice after “click” had been neither “the” nor “on”, all six nodes would be rejected. We would still get the model's own token, so the step yields 1 token, like plain decoding, after a slightly more expensive pass." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "The lesson said that choosing the tree is a balance. We will simulate that balance. Three heads each offer their top 1, top 2 or top 3 guesses, and we build the full tree of every combination. A guess at some depth counts if the true token is among that head's kept guesses. Each tree node makes the pass a little slower. All accuracies and costs are illustrative." },
        { type: "code", lang: "python", title: "practice_tree_width.py", code: `# How wide should the candidate tree be? A toy simulation with 3 extra heads.
import random
random.seed(1)
# Chance the true token is within a head's top-1, top-2, top-3 (illustrative).
CUM = [[0.60, 0.75, 0.85], [0.40, 0.55, 0.65], [0.25, 0.36, 0.45]]
NODE_COST = 0.02      # extra pass time per tree node, in passes (illustrative)
STEPS = 20000

def rank_of_truth(head):
    # 1, 2 or 3 if the true token is the head's 1st, 2nd or 3rd guess, else 99
    r = random.random()
    for rank, c in enumerate(CUM[head], start=1):
        if r < c:
            return rank
    return 99

def run(width):
    total = 0
    for _ in range(STEPS):
        tokens = 1                              # the model's own next token
        for head in range(3):
            if rank_of_truth(head) <= width:    # some branch holds the true token
                tokens += 1
            else:
                break                           # deeper nodes on this path are wasted
        total += tokens
    nodes = width + width ** 2 + width ** 3     # full tree: every combination
    per_step = total / STEPS
    return nodes, per_step, per_step / (1 + nodes * NODE_COST)

for width in (1, 2, 3):
    nodes, per_step, speedup = run(width)
    print(f"top-{width} per head: {nodes:2d} tree nodes, "
          f"{per_step:.2f} tokens/step, speedup {speedup:.2f}x")`, output: `top-1 per head:  3 tree nodes, 1.90 tokens/step, speedup 1.80x
top-2 per head: 14 tree nodes, 2.30 tokens/step, speedup 1.80x
top-3 per head: 39 tree nodes, 2.66 tokens/step, speedup 1.49x`, walkthrough: [
          { lines: [1, 7], note: "For each head, the chance that the true token is in its top 1, 2 or 3 guesses. These match the lesson's illustrative numbers, with a top-2 column added. Each tree node adds 2% to the pass time." },
          { lines: [9, 15], note: "Draw where the true token sits in one head's ranked list: first, second, third, or not in the top 3 at all." },
          { lines: [17, 26], note: "One decoding step: start with the model's own token, then go head by head and stop at the first head whose kept guesses miss the true token." },
          { lines: [27, 29], note: "A full tree has width + width² + width³ nodes. Speedup is tokens per step divided by the cost of the slower pass." }
        ] },
        { type: "p", text: "Tokens per step rise with every extra guess per head, as the formula predicts (1.90, then about 2.30, then about 2.65). But the node count jumps from 3 to 14 to 39, and at top-3 the cost of the pass grows faster than the tokens it wins. Now change it:" },
        { type: "list", items: [
          "Set `NODE_COST = 0.005`, a GPU with plenty of spare compute. Predict which width now gives the best speedup.",
          "Set `NODE_COST = 0.1`, a busy GPU with large batches. Predict whether any width beats 1.5×, and which width is now the worst.",
          "Remove head 3: loop over `range(2)` and use `nodes = width + width ** 2`. Predict how many tokens per step the top-3 tree loses and whether its speedup goes up or down."
        ] },
        { type: "check", question: "In the worked example, four of the six tree nodes were computed and then thrown away. Is that a flaw we should fix?", answer: "No, it is the price of hedging. We cannot know in advance which branch the model will agree with, so we check several at once. When the GPU has spare compute, extra nodes in the same pass cost little. It becomes a real cost only when the GPU is already busy, which is why the gain shrinks at large batch sizes." },
        { type: "check", question: "In the practice output, the top-3 tree has the most tokens per step and the lowest speedup. Why, and what does the lesson say real systems do instead of a full tree?", answer: "A full tree grows as width + width² + width³, so 39 nodes are verified to win less than one extra token per step over top-1. Most of those nodes sit under unlikely branches. Real systems use a fixed sparse tree with tens of nodes that spends them on the most likely branches." }
      ]
    },
    {
      id: 'quick-summary',
      title: 'Quick summary',
      blocks: [
        { type: 'list', ordered: true, items: [
          'Decoding is slow because every token needs a full pass that is limited by memory bandwidth, so checking several tokens at once is almost free.',
          'Speculative decoding exploits this but usually needs a separate draft model.',
          'Medusa adds a few small heads to the model itself; head k guesses the token k+1 positions ahead from the same hidden state.',
          'The top guesses of each head form a tree, which tree attention verifies in one pass by letting each node see only its ancestors.',
          'Expected tokens per step is 1 + a₁ + a₁a₂ + …; trees raise the acceptance chances, giving roughly 2–3× speedups in the paper.',
          'It shines at small batch sizes and on predictable text, and its ideas live on in EAGLE, multi-token prediction and modern serving engines.',
        ] },
      ],
    },
  ],
  quiz: [
    { q: "What do Medusa's extra heads read as their input?", options: ["The output tokens of a separate small draft model", "The same last hidden state that the original LM head reads", "The KV cache of the previous request", "The raw input token embeddings, before the first transformer layer"], answer: 1, explain: "All Medusa heads sit on top of the backbone and read the same final hidden state h. That is why they cost almost nothing extra: no second model and no extra sequential passes. A separate draft model is exactly what Medusa avoids." },
    { q: 'With head acceptance rates a₁ = 0.5 and a₂ = 0.4 (and no more heads), how many tokens per step do we expect?', options: ['1.9', '0.9', '1.7', '1.2'], answer: 2, explain: 'E = 1 + a₁ + a₁·a₂ = 1 + 0.5 + 0.2 = 1.7. The leading 1 is the model\'s own token, which is always produced. Adding 0.5 + 0.4 without multiplying would give 1.9, but guess 2 only counts if guess 1 was also right.' },
    { q: 'In tree attention, what may the node "sat → on" attend to?', options: ['Every node in the tree, so it can compare alternatives', 'Only the node "is", its sibling branch', 'Nothing but itself', 'The earlier context, its ancestor "sat", and itself'], answer: 3, explain: 'Each node sees the real context, its own ancestors and itself. Seeing sibling branches like "is" would leak tokens from a different possible continuation and give wrong predictions.' },
    { q: "Our chatbot serves 200 users at once with large batches, and enabling Medusa barely helps. What is the most likely reason?", options: ["At large batches the GPU is already compute-busy, so extra tree tokens are not free", "Medusa only works with greedy decoding, and chat traffic uses sampling", "The heads need a separate draft model, which was not loaded on the server", "Tree attention cannot be combined with a KV cache, so it gets turned off"], answer: 0, explain: "Medusa exploits idle compute during memory-bound decoding. With big batches the GPU has little spare compute, so verifying extra candidates costs real time. Medusa does work with sampling (via rejection or typical acceptance) and needs no draft model." },
    { q: "Which statement about Medusa vs classic draft-model speculative decoding is correct?", options: ["Medusa needs a draft model with the same tokenizer, while classic speculative decoding does not", "Both require training a brand-new large model from scratch before use", "Medusa drafts inside the main model's own pass; the classic method runs a separate model", "Medusa always produces exactly the same text as plain sampling, even with typical acceptance"], answer: 2, explain: "Medusa's heads draft from the main model's hidden state in the same pass; the classic method runs a smaller model sequentially. The tokenizer constraint applies to the classic method, and typical acceptance trades the exact-distribution guarantee for speed." },
  ],
  takeaways: [
    'Decoding is memory-bound, so verifying several tokens in one pass costs about the same as producing one.',
    'Medusa adds small heads to the model itself; head k guesses k+1 tokens ahead, so no draft model is needed.',
    'Tree attention verifies many candidate continuations in one pass by letting each node see only its ancestors.',
    'Expected tokens per step = 1 + a₁ + a₁a₂ + …; trees raise acceptance and give roughly 2–3× speedups in practice.',
    'Gains shrink at large batch sizes, and heads must be retrained whenever the base model changes.',
  ],
  terms: [
    { term: 'Medusa head', def: 'A small feed-forward layer on top of an LLM\'s last hidden state that predicts a token several positions ahead.' },
    { term: 'Speculative decoding', def: 'Guessing several future tokens cheaply, then verifying them all with the main model in one forward pass.' },
    { term: 'Tree attention', def: 'An attention mask that lets many candidate continuations share one forward pass, each node seeing only its ancestors.' },
    { term: 'Memory-bandwidth bound', def: 'Limited by how fast data (here, model weights) can be read from memory rather than by arithmetic speed.' },
    { term: 'Typical acceptance', def: 'Medusa\'s relaxed rule that accepts a guess when the model gives it a high enough probability, trading exactness for speed.' },
    { term: 'Self-distillation', def: 'Training the heads on text the model itself generated, used when the original training data is unavailable.' },
  ],
};
