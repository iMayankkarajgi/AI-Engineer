export default {
  id: 'decoding-eagle',
  minutes: 23,
  hook: 'Why would guessing a model\'s hidden thoughts be easier than guessing its next word, and how does that make generation three times faster?',
  summary: 'EAGLE is a speculative decoding method whose tiny draft network predicts the target model\'s next internal feature vector (its top-layer hidden state) instead of the next token, and feeds back the token that was actually sampled to remove ambiguity. Its guesses are accepted far more often than a small separate model\'s, so the big model can confirm several tokens per pass with no change in output. EAGLE-2 adds dynamic draft trees and EAGLE-3 scales the idea further; all three are now built into major serving engines.',
  sections: [
    {
      id: 'what-is-eagle',
      title: 'What is EAGLE?',
      blocks: [
        { type: 'p', text: '**EAGLE** (short for *Extrapolation Algorithm for Greater Language-model Efficiency*) is a way to speed up text generation from a large language model without changing what it writes. It was introduced in early 2024 by Yuhui Li, Fangyun Wei, Chao Zhang and Hongyang Zhang in the paper *EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty*.' },
        { type: 'p', text: 'Like Medusa (previous lesson), EAGLE is a form of **speculative decoding**: something cheap guesses several future tokens and the big model checks them all in one pass. EAGLE\'s twist is in *what* the cheap part guesses. Instead of guessing words, it guesses the big model\'s next **feature**: the hidden-state vector that sits just before the model\'s final output layer. Turning that predicted feature into a word is then easy, because we reuse the big model\'s own output layer.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like predicting a friend\'s mood, not their words', text: 'Guessing the exact sentence a friend will say next is hard. Guessing their state of mind ("they\'re about to explain the steps") is easier and smoother, and once you know that, the likely words follow. EAGLE predicts the model\'s "state of mind" (its feature vector) and lets the model\'s own vocabulary layer pick the words.' },
        { type: 'p', text: 'Our running example is a coding assistant built on a 70B model. Users complain the answers trickle out. We want them to stream two to three times faster with byte-for-byte the same output.' },
      ],
    },
    {
      id: 'speculative-recap',
      title: 'A quick recap of speculative decoding',
      blocks: [
        { type: 'p', text: 'An LLM generates **autoregressively**: one token per forward pass, each pass depending on the last. Each pass during this **decode** phase must read all the model\'s weights from GPU memory, which takes far longer than the arithmetic. So a pass over 5 tokens costs about the same as a pass over 1. Speculative decoding exploits that spare capacity:' },
        { type: 'steps', title: 'Speculative decoding in four moves', items: [
          { title: 'Draft', text: 'A cheap drafter proposes the next k tokens, for example "for i in range".' },
          { title: 'Verify', text: 'The big **target model** processes all k drafted tokens in one forward pass and computes its own prediction at every position.' },
          { title: 'Accept', text: 'Keep drafted tokens from the left while they pass the acceptance test (equal to the target\'s choice for greedy decoding, or the rejection-sampling rule for sampling).' },
          { title: 'Correct and continue', text: 'At the first rejection, use the target\'s own token instead. We always gain at least one token per pass, often several.' },
        ] },
        { type: 'viz', name: 'speculative-decoding', caption: 'Change how good the drafter is and how many tokens it proposes; see accepted vs rejected tokens and the estimated speedup.' },
        { type: 'p', text: 'The acceptance rule guarantees that the final text has exactly the distribution the target model alone would give. So the only question is: how do we get a drafter that is both **cheap** and **often right**?' },
      ],
    },
    {
      id: 'token-level-problem',
      title: 'The problem with token-level drafting',
      blocks: [
        { type: 'p', text: 'There are two classic ways to draft at the **token level** (predicting the next token directly):' },
        { type: 'list', items: [
          '**A separate small model** (for example a 1B model drafting for a 70B one). It is a whole second network that must share the tokenizer, be served alongside, and run step by step. Because it is much weaker, its guesses are often rejected.',
          '**Extra heads on the big model** (Medusa). Cheap and simple, but head 3 must guess the token three positions ahead without knowing the two tokens in between. Its accuracy drops fast with distance.',
        ] },
        { type: 'p', text: 'The deeper issue is that tokens are **discrete and jumpy**. The next word can flip between very different choices with small changes in context. Predicting it well needs a lot of model capacity, which is exactly what a cheap drafter lacks.' },
        { type: 'check', question: 'Medusa\'s head 2 guesses position t+3 directly. What information does it lack that a sequential drafter would have?', answer: 'It does not know which token was chosen at position t+2 (or t+1 beyond the model\'s own prediction). It has to guess blind about the intermediate tokens, so its guesses get much worse with distance. A sequential drafter sees each token it drafted before guessing the next.' },
      ],
    },
    {
      id: 'feature-level-drafting',
      title: 'The big idea: draft at the feature level',
      blocks: [
        { type: 'p', text: 'Inside a transformer, every token position ends with a **feature vector** `f` (also called the top-layer hidden state). The **LM head**, a single matrix followed by softmax, turns `f` into probabilities over the vocabulary. EAGLE\'s authors observed that the sequence of features `f₁, f₂, f₃, …` is **smoother and more regular** than the sequence of tokens, so a very small network can extrapolate it well.' },
        { type: 'p', text: 'So EAGLE\'s drafter is tiny: an input layer that merges two vectors into one, followed by **a single transformer decoder layer**. It reuses the target model\'s frozen **embedding table** (to turn tokens into vectors) and frozen **LM head** (to turn predicted features into tokens). Only the small middle part is trained, which the paper reports takes on the order of one to two days on a few GPUs even for a 70B target.' },
        { type: 'flow', title: 'One EAGLE drafting step', nodes: [
          { label: 'Target feature fₜ', detail: 'The big model\'s top-layer hidden state at the latest position, already computed during the last verification pass.' },
          { label: 'Sampled token tₜ₊₁', detail: 'The token actually chosen from fₜ. Its embedding comes from the target\'s own embedding table.' },
          { label: 'Merge layer', detail: 'Concatenate fₜ with the token embedding (2 × hidden size) and project back to hidden size with one linear layer.' },
          { label: 'One decoder layer', detail: 'A single transformer layer with attention over earlier draft positions predicts the next feature f̂ₜ₊₁.' },
          { label: 'Frozen LM head', detail: 'The target\'s LM head turns f̂ₜ₊₁ into a probability distribution; we pick the drafted token(s) for position t+2.' },
          { label: 'Repeat', detail: 'Feed f̂ₜ₊₁ and the new drafted token back in to predict f̂ₜ₊₂, and so on for a few steps.' },
        ] },
        { type: 'p', text: 'Training uses two losses together: a **regression loss** that pushes the predicted feature close to the real one, and a **classification loss** that checks that the LM head applied to the predicted feature gives the right token. In EAGLE the drafter was trained on a fixed chat dataset with the target\'s features computed on that data.' },
      ],
    },
    {
      id: 'feeding-back-the-token',
      title: 'Resolving the uncertainty by feeding back the token',
      blocks: [
        { type: 'p', text: 'Features alone hide a trap. Generation with sampling is random: from the same feature `fₜ`, the model might pick "am" or it might pick "always". Those two choices lead to **different** next features. A drafter that sees only `fₜ` cannot know which branch happened, so it would predict a blurry average of the two futures, which is a poor guess for either. The EAGLE paper calls this **feature uncertainty**.' },
        { type: 'p', text: 'The fix is simple: give the drafter the token that was actually sampled. To predict `fₜ₊₁`, EAGLE feeds both `fₜ` **and** the embedding of the sampled token `tₜ₊₁`. The paper describes this as feeding a token sequence advanced by one time step. With the token known, the future is no longer ambiguous.' },
        { type: 'code', lang: 'python', title: 'eagle_math.py', code: `import numpy as np

def expected_tokens(alpha, k):
    # Chain of k drafted tokens, each accepted with chance alpha (if all earlier were).
    # Plus the 1 token the target always contributes: 1 + a + a^2 + ... + a^k
    return sum(alpha ** i for i in range(k + 1))

def speedup(alpha, k, draft_cost):
    # One step = k draft passes (each costs draft_cost of a target pass) + 1 target pass.
    return expected_tokens(alpha, k) / (1 + k * draft_cost)

# Illustrative settings, not benchmarks.
setups = {
    "small draft model (token level)": (0.60, 0.10),
    "EAGLE head (feature level)     ": (0.80, 0.05),
}
for name, (alpha, cost) in setups.items():
    best = max(range(1, 7), key=lambda k: speedup(alpha, k, cost))
    print(f"{name} alpha={alpha} cost={cost}  best k={best}  "
          f"tokens/step={expected_tokens(alpha, best):.2f}  speedup={speedup(alpha, best, cost):.2f}x")

# Feature uncertainty: the next feature depends on which token was sampled.
rng = np.random.default_rng(0)
feature = rng.normal(size=4)                       # current top-layer feature f_t
emb = {"am": rng.normal(size=4), "always": rng.normal(size=4)}
W = rng.normal(size=(4, 8)) * 0.5                  # toy draft layer
for tok in emb:                                    # same f_t, different sampled token
    nxt = np.tanh(W @ np.concatenate([feature, emb[tok]]))
    print(f"after sampling '{tok}': next feature =", np.round(nxt, 2))`, output: `small draft model (token level) alpha=0.6 cost=0.1  best k=3  tokens/step=2.18  speedup=1.67x
EAGLE head (feature level)      alpha=0.8 cost=0.05  best k=6  tokens/step=3.95  speedup=3.04x
after sampling 'am': next feature = [ 0.27 -0.89  0.07  0.97]
after sampling 'always': next feature = [-0.28 -0.43 -0.62 -0.55]`, walkthrough: [
          { lines: [3, 6], note: 'Expected tokens per verification step for a chain of k drafts with per-token acceptance rate α: 1 + α + α² + … + αᵏ.' },
          { lines: [8, 10], note: 'Speedup divides tokens per step by the time a step takes, measured in target passes: k cheap draft passes plus one target pass.' },
          { lines: [12, 20], note: 'Compare a token-level small model with an EAGLE-style head (illustrative α and cost) and pick the best draft length for each.' },
          { lines: [22, 28], note: 'A toy drafter gets the same feature fₜ but two different sampled tokens. The predicted next features differ completely, which is why EAGLE must be told which token was sampled.' },
        ] },
        { type: 'p', text: 'The last two output lines show the point: same feature in, different token in, very different future out. Without the token, the drafter would have to average these two vectors and would be wrong for both.' },
      ],
    },
    {
      id: 'speedup-math',
      title: 'The math behind the speedup with small numbers',
      blocks: [
        { type: 'p', text: 'Let α be the chance a drafted token is accepted (given earlier ones were), k the number of drafted tokens, and c the cost of one draft pass relative to one target pass.' },
        { type: 'formula', expr: 'Speedup ≈ (1 + α + α² + … + αᵏ) / (1 + k·c)', where: [ ['α', 'acceptance rate per drafted token'], ['k', 'tokens drafted per step'], ['c', 'cost of one draft pass ÷ cost of one target pass'], ['numerator', 'expected tokens gained per verification step'], ['denominator', 'time per step, in units of one target pass'] ], caption: 'A simplified model: it ignores trees and assumes verification costs the same as a one-token pass.' },
        { type: 'p', text: 'Work it by hand for a small separate draft model with α = 0.6, c = 0.1, k = 3. Tokens per step: 1 + 0.6 + 0.36 + 0.216 = 2.18. Cost per step: 1 + 3 × 0.1 = 1.3. Speedup ≈ 2.18 / 1.3 ≈ 1.67×.' },
        { type: 'p', text: 'Now an EAGLE-style head with α = 0.8 and c = 0.05 (one decoder layer is a tiny fraction of an 80-layer model). With k = 6: tokens per step ≈ 3.95, cost 1.3, speedup ≈ 3.04×. Two things changed together: higher acceptance means longer accepted runs, and cheaper drafting means we can afford to draft further. These are illustrative numbers, but the paper reports speedups in the same range: about 2.7× to 3.5× for LLaMA2-Chat 70B with greedy decoding, with output unchanged.' },
        { type: 'chart', kind: 'line', title: 'Speedup vs draft length k', xLabel: 'Drafted tokens k', yLabel: 'Speedup (×)', series: [
          { name: 'Small draft model (α=0.6, c=0.1)', points: [[1, 1.45], [2, 1.63], [3, 1.67], [4, 1.65], [5, 1.59], [6, 1.52]] },
          { name: 'EAGLE head (α=0.8, c=0.05)', points: [[1, 1.71], [2, 2.22], [3, 2.57], [4, 2.8], [5, 2.95], [6, 3.04]] },
        ], caption: 'Illustrative, computed from the formula above. The weak drafter peaks early because extra drafts are rarely accepted; the strong, cheap drafter keeps gaining.' },
        { type: 'check', question: 'If α were 0.8 but each draft pass cost as much as half a target pass (c = 0.5), would drafting 6 tokens still pay off?', answer: 'No. Tokens per step would still be about 3.95, but cost per step would be 1 + 6 × 0.5 = 4, so speedup ≈ 0.99×: slightly slower than plain decoding. A drafter must be both accurate and cheap; EAGLE\'s single decoder layer is what keeps c small.' },
      ],
    },
    {
      id: 'eagle-2-dynamic-trees',
      title: 'EAGLE-2 and dynamic draft trees',
      blocks: [
        { type: 'p', text: 'Like Medusa, the original EAGLE drafted a **tree** of candidates rather than a single chain, and verified it in one pass with **tree attention** (each candidate attends only to its own ancestors). But EAGLE-1 used a **static tree**: the same shape every step, decided in advance.' },
        { type: 'p', text: 'A fixed shape wastes effort. After "for i in", the next token is almost surely "range", so one branch is enough. After "The best way to", many continuations are plausible, so a wide tree helps. **EAGLE-2** (Li et al., 2024) makes the tree shape **dynamic** based on context.' },
        { type: 'p', text: 'Its key observation is that the EAGLE drafter is **well calibrated**: its confidence in a token is a good estimate of the chance that the target will accept it. The chance of a whole path being accepted is roughly the product of the confidences along it. EAGLE-2 uses that value to grow the tree:' },
        { type: 'steps', title: 'How EAGLE-2 builds its tree', items: [
          { title: 'Expand', text: 'At each depth, score every node by its path value (product of draft confidences from the root). Only the top few nodes get expanded with their best next-token guesses.' },
          { title: 'Repeat for a few depths', text: 'Confident regions grow deep and narrow; uncertain regions stay shallow and wide.' },
          { title: 'Rerank', text: 'From all the nodes drafted, keep the ones with the highest path values, up to a fixed budget, as the tree to verify.' },
          { title: 'Verify', text: 'The target checks the whole tree with tree attention in one pass and keeps the longest accepted path.' },
        ] },
        { type: 'p', text: 'The EAGLE-2 paper reports speedups of roughly 3× to 4.3× and says it is about 20–40% faster than EAGLE-1, still with no change in the output distribution. A later version, **EAGLE-3** (2025), drops the requirement to predict the feature exactly, predicts tokens directly from a fusion of low-, middle- and high-layer features, and trains with a "training-time test" that simulates several drafting steps. Its authors report that it keeps improving as it is trained on more data, with speedups reported up to about 6.5× in some settings.' },
        { type: 'timeline', title: 'From drafts to dynamic trees', items: [
          { when: '2022–2023', title: 'Speculative decoding', text: 'A small draft model proposes tokens; the large model verifies them with a lossless acceptance rule.' },
          { when: 'Jan 2024', title: 'Medusa', text: 'Extra heads on the target model guess several future tokens; tree attention verifies them.' },
          { when: 'Jan 2024', title: 'EAGLE', text: 'A one-layer drafter extrapolates the target\'s features, with the sampled token fed back; static tree.' },
          { when: 'Jun 2024', title: 'EAGLE-2', text: 'Context-aware dynamic draft trees driven by the drafter\'s calibrated confidence.' },
          { when: '2025', title: 'EAGLE-3', text: 'Multi-layer feature fusion and training-time test; scales with more training data.' },
        ] },
      ],
    },
    {
      id: 'eagle-today',
      title: 'How EAGLE lives on today',
      blocks: [
        { type: 'p', text: 'EAGLE-style drafting has become one of the default speculative decoding options in production engines. vLLM, SGLang and NVIDIA TensorRT-LLM all support EAGLE drafters (EAGLE-3 in recent versions), and pre-trained EAGLE draft heads have been published for many popular open models. You load the target model plus a small draft checkpoint and set a few options, such as the number of draft steps and the tree size. Exact flag names change between releases, so check your engine\'s docs.' },
        { type: 'compare', title: 'Three ways to draft', options: [
          { name: 'Small draft model', summary: 'A separate, smaller LLM proposes tokens.', pros: ['No training if a sibling exists', 'Exact distribution preserved'], cons: ['Weak guesses, low acceptance', 'A second model to serve', 'Must share the tokenizer'], bestFor: 'Model families with a good small sibling' },
          { name: 'Medusa', summary: 'Extra heads on the target guess several positions ahead at once.', pros: ['Very cheap drafting', 'One model to serve'], cons: ['Far heads guess blind', 'Accuracy falls fast with distance'], bestFor: 'Simple single-model setups' },
          { name: 'EAGLE', summary: 'A one-layer drafter predicts the next feature, given the sampled token.', pros: ['High acceptance', 'Cheap drafting', 'Lossless', 'Dynamic trees in EAGLE-2'], cons: ['Needs a trained draft head per target model', 'Gains shrink at large batch sizes'], bestFor: 'Low-latency serving of popular open models' },
        ], rows: [ ['Predicts', 'Tokens', 'Tokens, k positions ahead', 'Features, then tokens'], ['Sees earlier drafted tokens', 'Yes', 'No', 'Yes'], ['Extra network size', 'Whole small model', 'A few heads', 'About one decoder layer'], ['Output changed?', 'No', 'No with strict acceptance', 'No'] ], verdict: 'EAGLE combines the strengths of the other two: sequential, informed drafting like a draft model, at the cost of a single extra layer like Medusa.' },
        { type: 'callout', tone: 'example', title: 'Real-world use', text: 'For our 70B coding assistant, we would download (or train) an EAGLE-3 draft head for the exact model version, enable it in vLLM or SGLang, and measure latency at our real batch sizes. Code is predictable text, so acceptance rates tend to be high and users notice faster streaming.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes and limits', text: 'A draft head is tied to one exact target model: if you fine-tune the target, retrain or re-fit the drafter, or acceptance collapses. Speedups are largest at small batch sizes; on a saturated GPU serving hundreds of requests, verifying big trees costs real compute and can even slow things down. Measure with your own prompts, since acceptance on chat, code and math can differ a lot.' },
      ],
    },
    {
      id: "dynamic-tree-by-hand",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "The dynamic tree is easier to believe once we grow one by hand. Our coding assistant has written `for i in`. The drafter's confidences below are made up for illustration. We expand the top 2 nodes at each depth, go 3 levels deep, and may keep 5 nodes in the final tree." },
        { type: "steps", title: "Growing and pruning one tree", items: [
          { title: "Depth 1", text: "The drafter offers A with confidence 0.90 and B with 0.08. Their path values are the same numbers, because the path has one step." },
          { title: "Depth 2", text: "We expand both. Under A: C with 0.70 and D with 0.20, so the path values are 0.90 × 0.70 = 0.63 and 0.90 × 0.20 = 0.18. Under B: E with 0.60 and F with 0.30, giving 0.048 and 0.024." },
          { title: "Pick what to expand next", text: "The top 2 path values at depth 2 are A→C (0.63) and A→D (0.18). The nodes under B are not expanded, even though E looked confident on its own (0.60)." },
          { title: "Depth 3", text: "Under A→C: G with 0.80 → 0.504, and H with 0.10 → 0.063. Under A→D: I with 0.50 → 0.09, and J with 0.40 → 0.072." },
          { title: "Rerank all ten nodes", text: "Sorted by path value: A 0.90, A→C 0.63, A→C→G 0.504, A→D 0.18, A→D→I 0.09, then B 0.08 and the rest. With a budget of 5 we keep the first five." }
        ] },
        { type: "table", caption: "All ten drafted nodes, ranked by path value (illustrative numbers)", head: ["Node", "Own confidence", "Path value", "Kept?"], rows: [
          ["A", "0.90", "0.90", "Yes"],
          ["A→C", "0.70", "0.63", "Yes"],
          ["A→C→G", "0.80", "0.504", "Yes"],
          ["A→D", "0.20", "0.18", "Yes"],
          ["A→D→I", "0.50", "0.09", "Yes"],
          ["B", "0.08", "0.08", "No"],
          ["A→D→J", "0.40", "0.072", "No"],
          ["A→C→H", "0.10", "0.063", "No"],
          ["B→E", "0.60", "0.048", "No"],
          ["B→F", "0.30", "0.024", "No"]
        ] },
        { type: "p", text: "Two things to notice. B→E has a higher own confidence than A→D, yet it ranks far lower, because a node is only useful if the whole path to it is accepted. And the kept tree is deep and narrow: it follows A three levels down and drops B completely. That is the shape we want when the first token is nearly certain." },
        { type: "p", text: "The kept set is always a proper tree. A confidence is never above 1, so a parent's path value is never below its child's. If a child makes the cut, its parent does too." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will code the expand-and-rerank loop and run it in two contexts: a predictable one, where the drafter is 90% sure of its first guess, and an uncertain one, where its confidence is spread over three guesses. The drafter is a toy that returns the same three confidences at every node. We print which nodes are kept and how deep they are." },
        { type: "code", lang: "python", title: "practice_dynamic_tree.py", code: `# Growing a draft tree from path values, as the lesson describes for EAGLE-2.
import heapq

def guesses(sharp):
    # Toy drafter: confidences of its top-3 next tokens (illustrative).
    # sharp=True is a predictable context, sharp=False an uncertain one.
    return [0.90, 0.06, 0.02] if sharp else [0.40, 0.30, 0.20]

def build_tree(sharp, depth=3, expand=2, budget=6):
    frontier = [((), 1.0)]              # (path, path value); () is the real context
    nodes = []
    for _ in range(depth):
        best = heapq.nlargest(expand, frontier, key=lambda n: n[1])  # expand top few
        frontier = []
        for path, value in best:
            for i, conf in enumerate(guesses(sharp)):
                frontier.append((path + (i,), value * conf))  # multiply along the path
        nodes += frontier
    return heapq.nlargest(budget, nodes, key=lambda n: n[1])  # rerank, keep the best

for name, sharp in [("predictable", True), ("uncertain", False)]:
    kept = build_tree(sharp)
    depths = sorted(len(path) for path, _ in kept)
    print(f"{name}: node depths {depths}, "
          f"expected accepted drafts {sum(v for _, v in kept):.2f}")
    for path, value in kept:
        print(f"   path {path}  value {value:.3f}")`, output: `predictable: node depths [1, 1, 2, 2, 2, 3], expected accepted drafts 2.61
   path (0,)  value 0.900
   path (0, 0)  value 0.810
   path (0, 0, 0)  value 0.729
   path (1,)  value 0.060
   path (0, 1)  value 0.054
   path (1, 0)  value 0.054
uncertain: node depths [1, 1, 1, 2, 2, 2], expected accepted drafts 1.30
   path (0,)  value 0.400
   path (1,)  value 0.300
   path (2,)  value 0.200
   path (0, 0)  value 0.160
   path (0, 1)  value 0.120
   path (1, 0)  value 0.120`, walkthrough: [
          { lines: [1, 7], note: "A toy drafter. In a predictable context one guess dominates. In an uncertain one, three guesses are all plausible." },
          { lines: [9, 19], note: "Expand: at each depth take the nodes with the highest path values, add their children, and multiply confidences along the path. Rerank: keep the best nodes overall, up to the budget." },
          { lines: [21, 27], note: "Build one tree per context. If confidences are good estimates of acceptance, the sum of the kept path values estimates how many drafted tokens will be accepted." }
        ] },
        { type: "p", text: "With the same budget of 6 nodes, the predictable context reaches depth 3 and expects about 2.6 accepted drafts. The uncertain context spends its nodes on three first guesses, never gets past depth 2, and expects about 1.3. Now change it:" },
        { type: "list", items: [
          "Set `budget=3`. Predict the shape of each tree before you run it: which one becomes a single chain, and which one becomes three siblings?",
          "Set `expand=1`, so only the single best node is expanded at each depth. Predict what happens to the uncertain tree's expected accepted drafts, and why the predictable tree hardly changes.",
          "Make the uncertain drafter even flatter: `[0.25, 0.25, 0.25]`. Predict the expected accepted drafts. Is a tree still worth verifying here?"
        ] },
        { type: "check", question: "In the worked example, node B→E has a confidence of 0.60 and node A→D only 0.20. Why does the tree keep A→D and drop B→E?", answer: "A drafted token only helps if every token before it on its path is accepted. B→E needs B first, and B is accepted only about 8% of the time, so its path value is 0.08 × 0.60 = 0.048. A→D needs A, which is accepted about 90% of the time: 0.90 × 0.20 = 0.18. The tree ranks by the chance of the whole path." },
        { type: "check", question: "Suppose a drafter is badly over-confident: it reports 0.9 for tokens the target accepts only half the time. What happens to the tree, to the speed, and to the output?", answer: "The path values stay high, so the tree grows deep and narrow, like our predictable case. But the target rejects early on that single path, and there are few sibling nodes to fall back on, so each pass confirms fewer tokens and is slower than a wider tree would have been. The output does not change, because every token is still checked by the target. This is why the lesson stresses that the drafter is well calibrated." }
      ]
    },
    {
      id: 'quick-summary',
      title: 'Quick summary',
      blocks: [
        { type: 'list', ordered: true, items: [
          'Speculative decoding drafts tokens cheaply and verifies them in one target pass, keeping the output unchanged.',
          'Token-level drafting is hard: small models guess poorly, and Medusa heads guess far positions blind.',
          'EAGLE drafts at the feature level with a single decoder layer, reusing the target\'s embeddings and LM head.',
          'Feeding back the sampled token removes feature uncertainty: the drafter knows which branch actually happened.',
          'Speedup ≈ (1 + α + … + αᵏ) / (1 + k·c): EAGLE wins by raising α and keeping c tiny.',
          'EAGLE-2 shapes the draft tree per context using calibrated confidence; EAGLE-3 scales further, and all are in vLLM, SGLang and TensorRT-LLM.',
        ] },
      ],
    },
  ],
  quiz: [
    { q: "What does the EAGLE drafter predict directly?", options: ["The next token directly, using its own small vocabulary output layer", "The target's next top-layer feature, which its frozen LM head turns into a token", "The attention weights of the target model for the upcoming position", "Which Medusa head should be trusted at each position of the tree"], answer: 1, explain: "EAGLE extrapolates features (the hidden state before the LM head) and reuses the target's frozen LM head to get tokens. Predicting tokens directly is what token-level drafters do; EAGLE-3 later moves closer to that, but the original EAGLE idea is feature-level drafting." },
    { q: "Why does EAGLE feed the sampled token back into the drafter along with the feature?", options: ["To save GPU memory by caching tokens instead of full feature vectors", "Because the target model cannot start its own verification pass without that token", "Because one feature can lead to different futures depending on the sampled token", "So the drafter can skip tree attention when it drafts the next token"], answer: 2, explain: "From one feature, sampling might pick \"am\" or \"always\", and each leads to a different next feature. Without the token, the drafter must guess a blurry average. Feeding the token resolves this feature uncertainty." },
    { q: 'A drafter has α = 0.5, drafts k = 2 tokens, and each draft pass costs c = 0.25 of a target pass. Using Speedup ≈ (1 + α + α²) / (1 + k·c), what is the speedup?', options: ['1.75×', '1.17×', '2.33×', '0.88×'], answer: 1, explain: 'Tokens per step = 1 + 0.5 + 0.25 = 1.75. Cost = 1 + 2 × 0.25 = 1.5. Speedup = 1.75 / 1.5 ≈ 1.17×. Answering 1.75× forgets that drafting itself takes time.' },
    { q: "How does EAGLE-2 differ from EAGLE-1?", options: ["It shapes the draft tree dynamically by drafter confidence, not a fixed layout", "It removes the need for the target model to verify the drafted tokens at all", "It drafts with a separate 7B model instead of a lightweight head", "It changes the output distribution slightly in exchange for noticeably more speed"], answer: 0, explain: "EAGLE-2 notices the drafter's confidence approximates acceptance, so it grows deep branches where the drafter is sure and keeps the tree shallow where it is not. It remains lossless and still uses the target to verify." },
    { q: "A teammate says: \"EAGLE makes outputs slightly worse, that is the price of speed.\" What is wrong with this claim?", options: ["Nothing is wrong: EAGLE accepts slightly worse drafts in exchange for speed", "EAGLE only works with greedy decoding, so output quality is not even defined", "EAGLE actually improves quality, because the drafter is smarter than the target model itself", "The target verifies each token with a lossless rule, so the output distribution is unchanged"], answer: 3, explain: "Like standard speculative decoding, EAGLE keeps only tokens the target model accepts under a rule that preserves its distribution. The drafter affects speed, not what the target would say. It also supports sampling, not just greedy decoding." },
  ],
  takeaways: [
    'EAGLE drafts at the feature level: a one-layer network extrapolates the target\'s top-layer hidden state.',
    'Feeding back the sampled token removes the ambiguity of which future actually happened.',
    'High acceptance plus very cheap drafting gives roughly 3× lossless speedups in the paper\'s settings.',
    'EAGLE-2 shapes the draft tree per context using calibrated confidence; EAGLE-3 scales the approach further.',
    'Draft heads are tied to one target model, and gains are largest at small batch sizes.',
  ],
  terms: [
    { term: 'Feature (hidden state)', def: 'The vector a transformer produces at a position just before the LM head turns it into token probabilities.' },
    { term: 'Feature uncertainty', def: 'The ambiguity that the next feature depends on which token was randomly sampled from the current one.' },
    { term: 'Draft head', def: 'EAGLE\'s small trained network (about one decoder layer) that proposes future features and tokens.' },
    { term: 'Acceptance rate (α)', def: 'The probability that a drafted token is accepted by the target model given earlier drafts were accepted.' },
    { term: 'Dynamic draft tree', def: 'EAGLE-2\'s context-dependent tree of candidate continuations, grown where the drafter is confident.' },
    { term: 'Lossless', def: 'Producing exactly the output distribution of the target model alone, despite drafting.' },
  ],
};
