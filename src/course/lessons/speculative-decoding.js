export default {
  id: "speculative-decoding",
  minutes: 28,
  hook: "How can a big LLM write two or three tokens per forward pass without changing a single word of what it would have written anyway?",
  summary: "LLM generation is slow because each token needs a full forward pass of a big model that is limited by memory bandwidth, not math. Speculative decoding lets a small, fast draft model guess several tokens ahead; the big target model then checks all the guesses in one parallel pass and keeps the longest correct prefix. With the right acceptance rule the output distribution is exactly the target model's, and real systems typically see around 2–3× faster decoding.",
  sections: [
    {
      id: "the-problem",
      title: "What problem speculative decoding solves",
      blocks: [
        { type: "p", text: "Large models write good text but slowly: each new token requires one complete forward pass, and tokens must be produced one after another because each depends on the last. For our running example, a **coding assistant** running a 70B-parameter model, a 300-token answer means 300 sequential passes. Users watch the text crawl out." },
        { type: "p", text: "**Speculative decoding** is a technique that reduces the number of sequential passes of the big model without changing its output. It was introduced in 2023, independently by Leviathan, Kalman and Matias at Google (“Fast Inference from Transformers via Speculative Decoding”) and by Chen and colleagues at DeepMind (“Accelerating Large Language Model Decoding with Speculative Sampling”)." },
        { type: "callout", tone: "analogy", title: "Think of it like a junior and a senior writer", text: "A junior writer quickly drafts the next few words. The senior editor reads the draft in one go and approves the words they agree with, up to the first one they would have written differently, then writes that one themselves. When the draft is good, several words get approved per glance from the senior; the final text is always exactly what the senior would have written." }
      ]
    },
    {
      id: "why-slow",
      title: "Why LLM generation is slow",
      blocks: [
        { type: "p", text: "During decoding, each forward pass must read every model weight from GPU memory. A 70B model in FP16 is about 140 GB, so even at roughly 3 TB/s of bandwidth, reading it takes tens of milliseconds, while the actual math for one token keeps the compute units mostly idle. Decoding is **memory-bandwidth-bound**." },
        { type: "p", text: "Here is the crucial consequence: processing **5 tokens in one pass costs almost the same time as processing 1**, because the expensive part (streaming the weights) is shared. That is why prefill of a long prompt is fast per token. The problem in decode is that we normally do not *have* 5 tokens to process; we only know the next one after computing it." },
        { type: "callout", tone: "note", title: "The opening", text: "If someone could hand us plausible future tokens, the big model could check them all in one pass at nearly the cost of one token. Speculative decoding supplies those guesses cheaply." }
      ]
    },
    {
      id: "core-idea",
      title: "The core idea and the big picture",
      blocks: [
        { type: "p", text: "Two models cooperate. The **target model** is the big, accurate model whose output we want. The **draft model** is a much smaller, faster model (for example a 1B model from the same family, sharing the same tokenizer). Each round:" },
        { type: "flow", title: "One round of speculative decoding", loop: true, nodes: [
          { label: "Draft k tokens", detail: "The small model generates k tokens autoregressively, e.g. k = 4. Cheap: each draft pass is far faster than a target pass." },
          { label: "Verify in one pass", detail: "The target model runs once over the prefix plus all k draft tokens, producing its own probabilities at all k + 1 positions in parallel." },
          { label: "Accept a prefix", detail: "Compare draft tokens with the target's distributions left to right; keep them until the first rejection." },
          { label: "Add one target token", detail: "At the first rejection, sample a replacement from a corrected distribution; if all k were accepted, sample a bonus token from the target's last position." }
        ] },
        { type: "p", text: "Every round produces **at least one** token (the correction or bonus), exactly as a normal decode step would, and up to k + 1 tokens when all drafts are accepted. So it is never worse in tokens-per-target-pass, only in the overhead of drafting." },
        { type: "viz", name: "speculative-decoding", caption: "Watch the draft model propose k tokens and the target verify them; accepted tokens turn green, the first rejection is replaced, and the speedup estimate updates." }
      ]
    },
    {
      id: "walkthrough",
      title: "Step-by-step walkthrough",
      blocks: [
        { type: "p", text: "The coding assistant has written `for i in` and uses k = 4 with greedy decoding (always pick the most likely token), which makes the checking easy to follow." },
        { type: "steps", title: "One round, greedy version", items: [
          { title: "Draft", text: "The draft model proposes: “range”, “(”, “len”, “)”. That took 4 small, fast passes." },
          { title: "Verify", text: "The target runs one pass on `for i in range ( len )`. At each position it reports what *it* would pick next: after “in” → “range”; after “range” → “(”; after “(” → “len”; after “len” → “(”; after “)” → (not needed)." },
          { title: "Compare left to right", text: "“range” ✓, “(” ✓, “len” ✓, “)” ✗ (the target wanted “(”, as in `len(items)`)." },
          { title: "Keep and correct", text: "Keep the 3 accepted tokens and append the target's own choice “(”. Result: 4 new tokens from 1 target pass instead of 4." },
          { title: "Discard and continue", text: "The rejected draft “)” is thrown away (and its KV cache entries rolled back). The next round starts from `for i in range(len(`." }
        ] },
        { type: "check", question: "In this round, if the draft's very first token had been wrong, how many tokens would the round produce?", answer: "One: the target's own token at the first position. The round costs one target pass plus the drafting, so it is slightly slower than a plain decode step but never produces fewer tokens." }
      ]
    },
    {
      id: "verification",
      title: "The verification step: why output stays exact",
      blocks: [
        { type: "p", text: "With greedy decoding, verification is just “does the draft token equal the target's top choice?”. With **sampling** (temperature above 0), we need a rule that keeps the output distribution identical to sampling from the target alone. The rule from both 2023 papers, called **speculative sampling**, works per token:" },
        { type: "formula", expr: "accept draft token x with probability min(1, p(x) / q(x));   if rejected, sample from norm(max(0, p − q))", where: [["p", "the target model's probability distribution at this position"], ["q", "the draft model's distribution at this position"], ["x", "the token the draft actually sampled from q"], ["norm(·)", "rescale so the probabilities sum to 1"]] },
        { type: "p", text: "Intuition: if the draft under-rated x (q(x) ≤ p(x)), always accept. If it over-rated x, accept only part of the time, in proportion. The leftover probability mass p − q, where the target likes tokens more than the draft did, is exactly what the correction sample fills in. The two cases together reproduce p perfectly. The overall chance of accepting a token is α = ∑ min(p(x), q(x)), the overlap of the two distributions." },
        { type: "code", lang: "python", title: "speculative_sampling.py", code: `import numpy as np
rng = np.random.default_rng(0)
vocab = ["the", "cat", "sat", "on", "mat"]
p = np.array([0.40, 0.25, 0.15, 0.12, 0.08])     # target (big) model's distribution
q = np.array([0.55, 0.15, 0.20, 0.05, 0.05])     # draft (small) model's distribution

def speculative_token():
    x = rng.choice(5, p=q)                        # draft proposes token x
    if rng.random() < min(1, p[x] / q[x]):        # accept with prob min(1, p/q)
        return x, True
    residual = np.maximum(p - q, 0)               # else resample from (p - q)+
    return rng.choice(5, p=residual / residual.sum()), False

N = 200_000
draws = [speculative_token() for _ in range(N)]
counts = np.bincount([t for t, _ in draws], minlength=5) / N
accept = np.mean([a for _, a in draws])
print("target p:      ", p.round(3).tolist())
print("speculative out:", counts.round(3).tolist())
print(f"acceptance rate: {accept:.3f}  (theory: {np.minimum(p, q).sum():.3f})")

# Expected tokens per target pass with k drafts and acceptance a
for a in [0.6, 0.8]:
    for k in [2, 4, 8]:
        print(f"a={a} k={k}: {(1 - a**(k + 1)) / (1 - a):.2f} tokens per target pass")`, output: `target p:       [0.4, 0.25, 0.15, 0.12, 0.08]
speculative out: [0.401, 0.249, 0.15, 0.12, 0.08]
acceptance rate: 0.799  (theory: 0.800)
a=0.6 k=2: 1.96 tokens per target pass
a=0.6 k=4: 2.31 tokens per target pass
a=0.6 k=8: 2.47 tokens per target pass
a=0.8 k=2: 2.44 tokens per target pass
a=0.8 k=4: 3.36 tokens per target pass
a=0.8 k=8: 4.33 tokens per target pass`, walkthrough: [
          { lines: [1, 5], note: "A 5-token vocabulary with a target distribution p and a deliberately different draft distribution q." },
          { lines: [7, 12], note: "The speculative sampling rule for one position: draft samples x from q, accept with probability min(1, p/q), else resample from the leftover mass (p − q)+." },
          { lines: [14, 20], note: "Run it 200,000 times. The output frequencies match p, and the acceptance rate matches ∑ min(p, q) = 0.80." },
          { lines: [22, 25], note: "Expected tokens produced per target pass for different acceptance rates a and draft lengths k." }
        ] },
        { type: "p", text: "Even though the draft strongly prefers “the” (0.55 vs 0.40), the final output frequencies match the target to three decimals. Speculative decoding changes speed, not answers (up to normal floating-point differences)." }
      ]
    },
    {
      id: "real-numbers",
      title: "Real numbers and speedup",
      blocks: [
        { type: "formula", expr: "E[tokens per target pass] = (1 − αᵏ⁺¹) / (1 − α)", where: [["α", "probability each draft token is accepted (assumed independent)"], ["k", "number of draft tokens per round"]], caption: "From Leviathan et al. (2023). With α = 0.8 and k = 4: (1 − 0.8⁵) / 0.2 ≈ 3.36." },
        { type: "chart", kind: "line", title: "Expected tokens per target pass vs draft length", xLabel: "Draft length k", yLabel: "Tokens per target pass", series: [{ name: "α = 0.6", points: [[1, 1.6], [2, 1.96], [4, 2.31], [6, 2.43], [8, 2.47]] }, { name: "α = 0.8", points: [[1, 1.8], [2, 2.44], [4, 3.36], [6, 3.95], [8, 4.33]] }], caption: "Computed from the formula. Gains flatten as k grows, because later draft tokens are less likely to survive." },
        { type: "p", text: "Tokens per pass is not the same as wall-clock speedup. Each round also costs k draft passes and a slightly larger verification pass. If a draft pass costs a fraction c of a target pass, a round costs roughly k·c + 1 target-pass units. With α = 0.8, k = 4 and c = 0.05, we get 3.36 tokens per 1.2 units ≈ 2.8× faster. The original papers reported roughly 2–3× speedups on their models; in practice results depend heavily on the task, the draft model and the batch size." },
        { type: "check", question: "Why might k = 8 be slower than k = 4 in wall-clock time even though it gives more tokens per target pass?", answer: "Each extra draft token costs a draft pass, but its chance of surviving keeps falling (α to the power of its position). With α = 0.6, going from k = 4 to 8 adds only 0.16 expected tokens but doubles drafting cost." }
      ]
    },
    {
      id: "where-used-tradeoffs",
      title: "Where it is used, and the trade-offs",
      blocks: [
        { type: "p", text: "Speculative decoding is supported by major serving engines including vLLM, TensorRT-LLM, SGLang and llama.cpp. Google has said it uses the technique in products such as AI Overviews in Search. Many variants replace the separate draft model with something cheaper:" },
        { type: "list", items: [
          "**Extra prediction heads** on the target model itself, as in Medusa, or a light draft layer on its features, as in EAGLE.",
          "**Multi-token prediction** modules trained with the model; DeepSeek-V3 describes using its MTP module for speculative decoding.",
          "**N-gram / prompt lookup**: drafting by copying text from the prompt, with no model at all (next lesson)."
        ] },
        { type: "compare", title: "Normal decoding vs speculative decoding", options: [
          { name: "Normal decoding", summary: "One target pass per token.", pros: ["Simple", "No extra model or memory", "Best when GPU is already fully batched"], cons: ["Latency is one full pass per token"], bestFor: "High-throughput batch serving with large batches" },
          { name: "Speculative decoding", summary: "Draft k tokens, verify in one target pass.", pros: ["Often 2–3× lower latency", "Output distribution unchanged", "Biggest gains on predictable text like code"], cons: ["Draft model needs memory and must share the tokenizer", "Wasted work on rejected drafts", "Gains shrink at large batch sizes, where the GPU is less idle"], bestFor: "Latency-sensitive serving at small to medium batch sizes" }
        ], rows: [["Output quality", "Target model", "Identical to target model"], ["Target passes per token", "1", "About 1 / E[tokens per pass]"]], verdict: "Use it when per-user latency matters and the GPU has spare compute; measure, because gains depend on acceptance rate and batch size." },
        { type: "callout", tone: "warn", title: "Common mistakes", text: "Picking a draft model that is too big (drafting eats the savings) or too different (low acceptance). Expecting the same gains at batch size 64 as at batch size 1: with big batches the target pass is already closer to compute-bound, so extra verified tokens are no longer nearly free. And assuming speculative decoding changes quality: if verification is implemented correctly, it does not." }
      ]
    },
    {
      id: "acceptance-rule-by-hand",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "The simulation showed that the acceptance rule reproduces the target's distribution. Let us see why with numbers small enough to do by hand. The vocabulary has three tokens, A, B and C. The target says p = [0.5, 0.3, 0.2]. The draft is too fond of A: q = [0.7, 0.2, 0.1]." },
        { type: "steps", title: "Following the probability mass", items: [
          { title: "The draft proposes", text: "It proposes A 70% of the time, B 20% and C 10%." },
          { title: "Accept or reject A", text: "A is over-rated, so we accept it with probability p/q = 0.5 ÷ 0.7 ≈ 0.714. A is proposed and accepted 0.7 × 0.714 = 0.5 of the time. It is proposed and rejected 0.7 − 0.5 = 0.2 of the time." },
          { title: "Accept B and C", text: "Both are under-rated (q ≤ p), so they are always accepted. That gives 0.2 for B and 0.1 for C." },
          { title: "Total acceptance", text: "0.5 + 0.2 + 0.1 = 0.8. This is exactly ∑ min(p, q)." },
          { title: "Build the correction", text: "max(0, p − q) = [0, 0.1, 0.1]. Rescaled to sum to 1 it is [0, 0.5, 0.5]. A rejection never produces A, because the draft already proposes A too often." },
          { title: "Spread the rejected mass", text: "The 0.2 of rejected mass is split evenly: 0.1 goes to B and 0.1 to C." }
        ] },
        { type: "table", caption: "Where each token's final probability comes from", head: ["Token", "Target p", "Draft q", "Accepted as a draft", "Added by corrections", "Final"], rows: [
          ["A", "0.5", "0.7", "0.5", "0", "0.5"],
          ["B", "0.3", "0.2", "0.2", "0.1", "0.3"],
          ["C", "0.2", "0.1", "0.1", "0.1", "0.2"]
        ] },
        { type: "p", text: "The last column equals p in every row. The rule trims the tokens the draft likes too much down to the target's level, and hands the trimmed mass to the tokens the draft liked too little. Nothing is left over." },
        { type: "p", text: "This also gives us a test for an implementation. If we sample many tokens and the output frequencies drift away from p, two usual causes are sampling the correction from p itself instead of from the leftover p − q, and comparing against a q that is not the one the draft actually sampled from." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build the whole draft-and-verify loop for greedy decoding and count target passes. There is no real model. A list of true and false values says, for each position, whether the draft would guess the target's token. It is right about 80% of the time, and one draft pass costs 0.05 of a target pass. Both numbers are illustrative." },
        { type: "code", lang: "python", title: "practice_draft_verify.py", code: `# A draft-and-verify loop with greedy decoding and a stand-in draft model.
import random
random.seed(0)
N, ALPHA, C = 300, 0.8, 0.05     # tokens to write, draft accuracy, draft pass cost
# Decide once, for every position, whether the draft would guess it right.
draft_ok = [random.random() < ALPHA for _ in range(N)]

def run(k):
    pos, passes = 0, 0
    while pos < N:
        passes += 1                       # ONE target pass checks up to k drafts
        accepted = 0
        while accepted < k and pos < N and draft_ok[pos]:
            pos += 1                      # draft token matches the target: keep it
            accepted += 1
        if pos < N:
            pos += 1                      # the target's own token (fix or bonus)
    cost = passes * (1 + k * C)           # in units of one target pass
    return passes, N / passes, N / cost

print(f"plain decoding: {N} target passes, speedup 1.00x")
for k in (1, 2, 4, 8):
    passes, per_pass, speedup = run(k)
    theory = (1 - ALPHA ** (k + 1)) / (1 - ALPHA)
    print(f"k={k}: {passes:3d} target passes, {per_pass:.2f} tokens/pass "
          f"(formula {theory:.2f}), speedup {speedup:.2f}x")`, output: `plain decoding: 300 target passes, speedup 1.00x
k=1: 170 target passes, 1.76 tokens/pass (formula 1.80), speedup 1.68x
k=2: 126 target passes, 2.38 tokens/pass (formula 2.44), speedup 2.16x
k=4:  94 target passes, 3.19 tokens/pass (formula 3.36), speedup 2.66x
k=8:  75 target passes, 4.00 tokens/pass (formula 4.33), speedup 2.86x`, walkthrough: [
          { lines: [1, 6], note: "The setup: 300 tokens to write, a draft that is right about 80% of the time, and a fixed seed so the run repeats exactly." },
          { lines: [8, 17], note: "One round per loop: accept draft tokens until the first wrong one or until k are accepted, then add the target's own token." },
          { lines: [18, 19], note: "Each round costs one target pass plus k cheap draft passes. Speedup is tokens divided by that total cost." },
          { lines: [21, 26], note: "Try four draft lengths and compare tokens per pass with the formula from the lesson." }
        ] },
        { type: "p", text: "The simulated tokens per pass sit close to the formula, and the speedup grows more slowly than tokens per pass because every round also pays for k draft passes. Now change it:" },
        { type: "list", items: [
          "Set `C = 0.3`, a draft model that is too big. Predict which k now gives the best speedup, then check.",
          "Set `ALPHA = 0.5`. Use the formula to predict tokens per pass for k = 4 before you run it. Is k = 8 still worth it?",
          "Make the draft's mistakes come in clumps: replace the `draft_ok` line with `draft_ok = [(i // 10) % 5 != 0 for i in range(N)]`. It is still right 80% of the time. Predict whether tokens per pass goes up or down for k = 4, and explain what you see."
        ] },
        { type: "check", question: "In the worked example, p = [0.5, 0.3, 0.2] and q = [0.7, 0.2, 0.1]. A round ends in a rejection. Which token can the correction never be, and why?", answer: "A. The correction is sampled from max(0, p − q), and for A that is zero because the draft proposes A more often than the target wants. A rejection exists to add mass to tokens the draft under-proposed, which here are B and C." },
        { type: "check", question: "Someone uses the target model as its own draft model, so q = p and every draft token is accepted. Why is this not a speedup?", answer: "Acceptance is perfect, but each draft pass now costs as much as a target pass, so c = 1. A round with k drafts costs k + 1 target passes and yields at most k + 1 tokens: one token per pass, the same as plain decoding. The gain comes from the draft being much cheaper than the target, not from acceptance alone." }
      ]
    },
    {
      id: "quick-summary",
      title: "Quick summary",
      blocks: [
        { type: "p", text: "Decode is slow because each token needs a full, memory-bound pass of the big model, yet checking several tokens in one pass costs about the same as one. Speculative decoding exploits this: a cheap drafter guesses k tokens, the target verifies them in one pass, keeps the matching prefix and adds one token of its own. The acceptance rule min(1, p/q) with residual resampling keeps the output exactly the target's. Speedup depends on the acceptance rate α, the draft length k and the draft's cost." }
      ]
    }
  ],
  quiz: [
    { q: "Why can the target model verify k draft tokens in about the time of generating one token?", options: ["The draft model does the verification, so the target pass is nearly free", "Decode is memory-bound: one pass reads the weights once for 1 or k + 1 positions", "Verification skips the attention layers, so each extra position costs nothing", "The target model switches to fewer layers when it processes draft tokens"], answer: 1, explain: "The dominant cost is streaming the weights. Processing a few extra positions in the same pass adds little time." },
    { q: "With acceptance rate α = 0.8 and k = 4 draft tokens, what is the expected number of tokens per target pass, using the lesson's formula?", options: ["4.00", "1.80", "5.00", "3.36"], answer: 3, explain: "(1 − 0.8⁵) / (1 − 0.8) = (1 − 0.328) / 0.2 ≈ 3.36." },
    { q: "Our coding assistant uses speculative decoding but sees almost no speedup. Logs show only about 30% of draft tokens are accepted. What should we try first?", options: ["Increase k from 4 to 16 so each target pass checks more draft tokens", "Use a draft model better aligned with the target, e.g. one distilled from it", "Raise the target's temperature so that it agrees with more of the draft tokens", "Skip the verification step and accept the draft tokens as they are"], answer: 1, explain: "Low acceptance means the draft disagrees with the target. A better-aligned draft raises α. Larger k with low α mostly adds wasted work, and removing verification would change outputs." },
    { q: "Compared with normal decoding, what does speculative decoding change?", options: ["The output distribution, which lowers quality slightly in exchange for speed", "How many sequential target passes are needed, not the output distribution", "The prompt, which the draft model rewrites before the target model reads it", "The size of the target's weights, since part of the work moves to the draft"], answer: 1, explain: "Correct speculative sampling reproduces the target's distribution exactly; it only reduces how many sequential target passes are needed." },
    { q: "In speculative sampling, the draft proposes token x with q(x) = 0.5 while the target has p(x) = 0.25. What happens?", options: ["Accepted with probability 0.5; if rejected, resample from normalised max(0, p − q)", "Accepted with certainty, because the draft model was confident about x", "Rejected outright, because p(x) is lower than q(x), and the target resamples", "Accepted with probability 0.25; if rejected, the step outputs no new token"], answer: 0, explain: "Acceptance probability is min(1, p/q) = 0.25 / 0.5 = 0.5. On rejection, the replacement comes from the residual distribution, which is what keeps the output exact." }
  ],
  takeaways: [
    "Decode is memory-bound, so verifying several tokens in one target pass costs about as much as generating one.",
    "A cheap draft proposes k tokens; the target verifies them in one pass and keeps the longest accepted prefix plus one token.",
    "Accept with probability min(1, p/q) and resample rejections from (p − q)+ to keep the output exactly the target's.",
    "Expected tokens per target pass = (1 − αᵏ⁺¹) / (1 − α); real speedups are typically around 2–3×.",
    "Gains depend on draft quality, draft cost, k and batch size; measure on your own workload."
  ],
  terms: [
    { term: "Speculative decoding", def: "Generating several tokens per target-model pass by drafting guesses cheaply and verifying them in parallel." },
    { term: "Target model", def: "The large model whose output distribution we want to reproduce." },
    { term: "Draft model", def: "A small, fast model (or cheap mechanism) that proposes candidate tokens." },
    { term: "Acceptance rate (α)", def: "The probability a draft token is accepted; equal to ∑ min(p, q) for one position." },
    { term: "Speculative sampling", def: "The accept-or-resample rule that keeps the output distribution identical to the target's." },
    { term: "Bonus token", def: "The extra token sampled from the target's last position when all drafts are accepted." }
  ]
};
