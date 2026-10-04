export default {
  id: 'how-do-attention-sinks-work',
  minutes: 24,
  hook: 'Why does a chatbot suddenly start writing gibberish the moment we delete the first few, seemingly useless, tokens of a long conversation?',
  summary: 'Trained LLMs dump a large share of their attention onto the first few tokens, even when those tokens mean nothing; these tokens are called attention sinks. If a streaming system evicts them to save memory, the attention distribution shifts and the model breaks down. Keeping a handful of sink tokens plus a sliding window of recent tokens (the StreamingLLM recipe), or giving the model a dedicated learned sink, lets it run stably over very long streams.',
  sections: [
    {
      id: 'what-is-an-llm',
      title: 'What is a Large Language Model?',
      blocks: [
        { type: 'p', text: 'A **Large Language Model (LLM)** is a neural network that reads a sequence of **tokens** (pieces of words) and predicts the next one. It generates text by repeating that prediction: write a token, add it to the input, predict again. Nearly all modern LLMs are decoder-only Transformers, stacks of layers built around attention.' },
        { type: 'p', text: 'Our running example: a voice assistant that stays on all day in a car, listening and replying. Its conversation never really ends, so the token stream grows to hundreds of thousands of tokens. How do we keep it running without running out of memory or losing its mind?' },
      ],
    },
    {
      id: 'what-is-attention',
      title: 'What is attention?',
      blocks: [
        { type: 'p', text: 'In **attention**, the current token builds a **query** and compares it with the **key** of each earlier token. The scores go through **softmax**, which turns them into weights that are positive and **must add up to exactly 1**. The output is the weighted average of the earlier tokens\' **values**.' },
        { type: 'formula', expr: 'wⱼ = exp(sⱼ) / ∑ₖ exp(sₖ)     output = ∑ⱼ wⱼ · vⱼ', where: [ ['sⱼ', 'score of the query against token j\'s key'], ['wⱼ', 'attention weight on token j (all weights sum to 1)'], ['vⱼ', 'value vector of token j'] ] },
        { type: 'p', text: 'That "must add up to 1" rule is the seed of this whole lesson. A head cannot say "nothing here is relevant, give me zero". It has to put its weight *somewhere*.' },
        { type: 'viz', name: 'attention-heatmap', caption: 'Click tokens to see how attention weight is spread; notice that each row\'s weights always sum to 1.' },
      ],
    },
    {
      id: 'streaming-problem',
      title: 'The problem of streaming with long conversations',
      blocks: [
        { type: 'p', text: 'During generation the model keeps keys and values for every past token in the **KV cache**. For an endless stream this cache grows without limit: memory runs out, and every new token gets slower because it must read more cache. Also, models are trained on a maximum length (say 4K or 8K tokens), and quality often collapses beyond it.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a boat\'s ballast', text: 'A sailing boat carries heavy ballast low in the hull. It does nothing useful by itself, but it keeps the boat balanced. Throw it overboard to save weight and the boat capsizes. Attention sinks are the model\'s ballast: they hold weight that has nowhere better to go.' },
      ],
    },
    {
      id: 'naive-fix',
      title: 'The naive fix and why it fails',
      blocks: [
        { type: 'p', text: 'The obvious fix is **window attention**: keep only the most recent W tokens in the cache and evict the oldest ones. Memory becomes fixed and each step stays fast.' },
        { type: 'p', text: 'The StreamingLLM paper (Xiao et al., 2023, *Efficient Streaming Language Models with Attention Sinks*) tested exactly this on models such as Llama 2. As long as the text fit in the window, things were fine. But as soon as the **very first tokens** were evicted, perplexity (a measure of how surprised the model is by text; lower is better) shot up and the output fell apart. Losing a handful of tokens out of thousands should not matter, yet it was catastrophic.' },
        { type: 'p', text: 'The other baseline, **recomputing** the window from scratch for each new token, kept quality but was far too slow, because it recomputes the keys and values of the whole window every step.' },
        { type: 'chart', kind: 'line', title: 'What happens when the first tokens leave the cache (illustrative)', xLabel: 'Tokens generated (thousands)', yLabel: 'Perplexity', series: [ { name: 'Window only', points: [[1, 6], [2, 6], [3, 6.1], [4, 6.1], [5, 60], [6, 120], [8, 180], [10, 220]] }, { name: 'Sinks + window', points: [[1, 6], [2, 6], [3, 6.1], [4, 6.1], [5, 6.2], [6, 6.1], [8, 6.2], [10, 6.2]] } ], caption: 'Illustrative shape of the effect reported in the StreamingLLM paper, not its exact numbers: window-only attention breaks once the first tokens are evicted (here at ~4K), while keeping sinks stays stable.' },
      ],
    },
    {
      id: 'what-is-a-sink',
      title: 'What is an attention sink?',
      blocks: [
        { type: 'p', text: 'When researchers inspected attention maps, they saw that in most layers and heads (beyond the first couple of layers), a large share of attention went to the **first token** of the sequence, often far more than to any meaningful word. This happened even when the first token was just a start-of-text marker or a newline.' },
        { type: 'p', text: 'An **attention sink** is a token that soaks up attention weight without contributing much information. The head uses it as a "no-op": when nothing in the context is relevant, it parks weight on the sink, whose value vector tends to be small, so the output changes little.' },
        { type: 'matrix', title: 'A typical attention pattern in a middle layer (illustrative)', rows: ['tok 1', 'tok 2', 'tok 3', 'tok 4', 'tok 5'], cols: ['tok 0 (first)', 'tok 1', 'tok 2', 'tok 3', 'tok 4', 'tok 5'], values: [
          [0.70, 0.30, null, null, null, null],
          [0.65, 0.15, 0.20, null, null, null],
          [0.60, 0.05, 0.10, 0.25, null, null],
          [0.62, 0.04, 0.06, 0.08, 0.20, null],
          [0.58, 0.05, 0.05, 0.07, 0.10, 0.15],
        ], format: 'pct', caption: 'Illustrative values. The first column (the sink) gets most of the weight in every row, regardless of meaning.' },
      ],
    },
    {
      id: 'why-first-tokens',
      title: 'Why the first tokens become a sink',
      blocks: [
        { type: 'list', items: [
          '**Softmax forces a decision.** Weights must sum to 1, so a head with nothing to look at needs a safe place to put them.',
          '**The first token is always visible.** Under the causal mask, every later token can see token 0, in every training example. No other position is guaranteed to be present for all queries. So the model learns to use it as a universal dumping ground.',
          '**It is about position, not meaning.** The StreamingLLM authors replaced the first four tokens with plain newline tokens and the effect largely remained. What matters is being at the start.',
          '**Several sink tokens help.** Models trained without a special start token spread the sink over the first few tokens, which is why StreamingLLM keeps about 4 initial tokens.',
        ] },
        { type: 'check', question: 'Why can a token in the middle of the text not serve as a reliable sink during training?', answer: 'Because under the causal mask, tokens before it cannot see it. Only the very first tokens are visible to every query in every training sequence, so they are the only consistent place to park attention.' },
      ],
    },
    {
      id: 'numeric-walkthrough',
      title: 'A step-by-step numeric walkthrough',
      blocks: [
        { type: 'p', text: 'Take one query that scores 10 cached tokens. Token 0 is the sink: score 4.0, value near 0. The rest have scores between 0.1 and 0.6. Watch what happens to the softmax when we evict the sink.' },
        { type: 'steps', title: 'Evicting the sink, by the numbers', items: [
          { title: 'Full cache', text: 'exp(4.0) ≈ 54.6 dominates; the other nine exps add to about 13. The sink gets about 0.81 of the weight, each other token at most 0.03. Output ≈ +0.09.' },
          { title: 'Evict to a window of 4', text: 'Only tokens 6–9 remain, with scores 0.2–0.6. Their weights must still sum to 1, so each jumps to roughly 0.20–0.30, about ten times larger than before.' },
          { title: 'See the damage', text: 'The output becomes ≈ +0.55, completely different from +0.09. Every later layer now receives inputs unlike anything seen in training, and errors compound.' },
          { title: 'Keep the sink', text: 'With token 0 plus tokens 6–9, the sink again absorbs most of the weight (~0.90), recent tokens stay small, and the output ≈ +0.06 is close to the original.' },
        ] },
        { type: 'code', lang: 'python', title: 'attention_sink_demo.py', code: `import numpy as np

def softmax(x):
    e = np.exp(x - x.max())
    return e / e.sum()

# Scores of the current query against 10 cached tokens (illustrative values).
# Token 0 is the sink: a large score, but its value vector is near zero.
scores = np.array([4.0, 0.5, 0.2, 0.1, 0.3, 0.4, 0.2, 0.6, 0.3, 0.5])
values = np.array([0.0, 1.0, -1.0, 0.5, 2.0, -0.5, 1.5, 0.8, -1.2, 1.0])

def show(name, keep):
    w = softmax(scores[keep])
    out = w @ values[keep]
    print(f"{name:22s} sink weight={w[0] if keep[0] == 0 else 0:.2f}  "
          f"max other={w[keep != 0].max():.2f}  output={out:+.3f}")

show("full cache", np.arange(10))
show("window only (last 4)", np.arange(6, 10))          # sink evicted
show("sink + last 4", np.array([0, 6, 7, 8, 9]))        # StreamingLLM-style

def streaming_cache(positions, n_sink=4, window=4):
    # keep the first n_sink tokens forever plus the most recent \`window\` tokens
    if len(positions) <= n_sink + window:
        return positions
    return positions[:n_sink] + positions[-window:]

print("cache after 20 tokens:", streaming_cache(list(range(20))))`, output: `full cache             sink weight=0.81  max other=0.03  output=+0.093
window only (last 4)   sink weight=0.00  max other=0.30  output=+0.549
sink + last 4          sink weight=0.90  max other=0.03  output=+0.055
cache after 20 tokens: [0, 1, 2, 3, 16, 17, 18, 19]`,
          walkthrough: [
            { lines: [7, 10], note: 'Illustrative scores and scalar values. The sink has a high score and a value of 0, as real sinks tend to have small values.' },
            { lines: [12, 16], note: 'Softmax over the kept tokens, then the weighted sum of values. We print the sink weight, the largest non-sink weight, and the output.' },
            { lines: [18, 20], note: 'Three cache policies. Evicting the sink inflates the recent tokens\' weights about tenfold and moves the output from +0.09 to +0.55.' },
            { lines: [22, 28], note: 'The fix in one function: keep the first n_sink tokens forever and a rolling window of recent tokens.' },
          ] },
      ],
    },
    {
      id: 'the-fix',
      title: 'The fix: StreamingLLM',
      blocks: [
        { type: 'p', text: 'StreamingLLM keeps a small fixed cache made of two parts: the first few tokens (about 4) as **sinks**, and a **rolling window** of the most recent tokens. Everything in between is evicted. No retraining is needed; it works with existing models.' },
        { type: 'flow', title: 'StreamingLLM cache for each new token', nodes: [
          { label: 'New token', detail: 'Compute its query, key and value.' },
          { label: 'Append to window', detail: 'Add its key and value to the recent-token window.' },
          { label: 'Evict middle', detail: 'If the window is full, drop the oldest non-sink token. The 4 sink tokens are never dropped.' },
          { label: 'Re-index positions', detail: 'Positions are assigned by place in the cache, not in the original text, so they stay inside the range the model was trained on.' },
          { label: 'Attend', detail: 'The query attends over sinks + window, with a stable attention distribution.' },
        ] },
        { type: 'p', text: 'The paper reported stable language modelling over streams of up to about 4 million tokens, and large speedups versus recomputing a sliding window. It also showed that adding one dedicated, learnable **sink token** at the start of every training sample lets a model rely on that single token instead of several.' },
        { type: 'callout', tone: 'warn', title: 'Streaming is not long-term memory', text: 'StreamingLLM keeps the model *fluent* forever; it does not make it *remember* forever. Anything evicted from the middle is gone. If our car assistant must recall the address the driver said two hours ago, we need retrieval or a summary memory on top, not just sinks.' },
      ],
    },
    {
      id: 'modern-sinks',
      title: 'StreamingLLM and modern attention sinks',
      blocks: [
        { type: 'p', text: 'Later models build the sink directly into the architecture. A common approach is a **learned sink logit**: each attention head gets an extra learnable score that joins the softmax denominator but has no value attached. The head can send weight to this "nobody" slot, so it no longer needs to hijack the first real token. OpenAI\'s gpt-oss models (2025) use learned per-head sinks of this kind. A closely related idea, sometimes called "softmax plus one", adds a constant 1 to the softmax denominator for the same reason.' },
        { type: 'compare', title: 'Ways to handle the sink effect', options: [
          { name: 'Window only', summary: 'Keep the last W tokens.', pros: ['Simplest', 'Fixed memory'], cons: ['Breaks once the first tokens are evicted'], bestFor: 'Nothing long-running; a cautionary baseline' },
          { name: 'StreamingLLM', summary: 'Keep ~4 initial sink tokens + last W tokens.', pros: ['Works on existing models without retraining', 'Fixed memory, stable output'], cons: ['Middle context is forgotten'], bestFor: 'Endless chats, live captioning, assistants that run all day' },
          { name: 'Built-in learned sink', summary: 'Extra learnable logit or token in every head, trained from the start.', pros: ['Cleaner attention maps', 'No reliance on real tokens'], cons: ['Must be built in at training time'], bestFor: 'New models designed for long or streaming context' },
        ], verdict: 'For an existing model, keep the first few tokens. For a new model, train with an explicit sink.' },
      ],
    },
    {
      id: 'importance',
      title: 'Importance of attention sinks',
      blocks: [
        { type: 'list', items: [
          '**Streaming and long chats:** keeping sinks is a cheap, essential trick whenever a KV cache is truncated.',
          '**KV cache compression and quantization:** methods that evict or compress cache entries usually protect the first tokens, because damaging them hurts quality far more than their count suggests.',
          '**Interpretability:** sinks explain why attention maps often show a bright first column; it is a "no-op" signal, not proof that the first word matters.',
          '**Architecture design:** learned sinks and related gating ideas are now part of how some new models are built.',
        ] },
        { type: 'check', question: 'Our car assistant uses window-only eviction and starts producing nonsense after about 8,000 tokens, which equals the window size. What is the most likely cause and the cheapest fix?', answer: 'At 8,000 tokens the first tokens are being evicted, so the attention sink disappears and the softmax distribution shifts. The cheapest fix is StreamingLLM-style caching: always keep the first ~4 tokens plus the rolling window.' },
      ],
    },
    {
      id: 'learned-sink-by-the-numbers',
      title: 'Going one level deeper',
      blocks: [
        { type: 'p', text: "We said a learned sink is an extra score that joins the softmax but has no value attached. Let us see with small numbers what that does, and then look at the second detail that keeps streaming stable: position re-indexing." },
        { type: 'formula', expr: 'wⱼ = exp(sⱼ) / (exp(b) + ∑ₖ exp(sₖ))     output = ∑ⱼ wⱼ · vⱼ', where: [ ['b', 'the learned sink logit of this head'], ['sⱼ', 'score of the query against real token j'], ['wⱼ', 'weight on real token j; these weights now sum to less than 1'] ], caption: 'Softmax with a sink logit. The share exp(b) / (…) goes to nobody and adds nothing to the output.' },
        { type: 'steps', title: "One head, four tokens, nothing relevant", items: [
          { title: "Scores", text: "The four real tokens score 0.1, 0.2, 0.0 and 0.1 (illustrative). Their exponentials are about 1.11, 1.22, 1.00 and 1.11, which add up to 4.43." },
          { title: "Without a sink", text: "The weights must sum to 1, so each token gets roughly a quarter. The head is forced to average four irrelevant values." },
          { title: "With a sink logit of 3.0", text: "exp(3.0) ≈ 20.09 joins the denominator: 4.43 + 20.09 = 24.52. The real tokens together get 4.43 / 24.52 ≈ 0.18. The other 0.82 goes to the sink and contributes nothing." },
          { title: "When something matters", text: "If one token scores 5.0, exp(5.0) ≈ 148 dwarfs the sink's 20, so most of the weight goes to that token. The sink only wins when nothing else does." },
        ] },
        { type: 'table', caption: "Position re-indexing in a StreamingLLM-style cache after 20 tokens (4 sinks + window of 4)", head: ['Kept tokens', 'Original position in the text', 'Position the model is given'], rows: [
          ['Sink tokens', '0, 1, 2, 3', '0, 1, 2, 3'],
          ['Window tokens', '16, 17, 18, 19', '4, 5, 6, 7'],
        ] },
        { type: 'p', text: "Without re-indexing, the window tokens would carry positions that keep growing, eventually past anything seen in training. A common bug in home-made streaming caches is to keep the sinks but forget this step: output stays fine for a while, then drifts once positions exceed the training length." },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: "We will write a tiny attention head with an optional learned sink logit and compare two situations: a query with nothing relevant in the context, and a query with one clear match." },
        { type: 'code', lang: 'python', title: 'practice_learned_sink.py', code: `import math

def attend(scores, values, sink_logit=None):
    # softmax over the scores; an optional sink logit joins the denominator
    # but has no value attached, so weight sent there adds nothing to the output
    exps = [math.exp(s) for s in scores]
    denom = sum(exps) + (math.exp(sink_logit) if sink_logit is not None else 0.0)
    w = [e / denom for e in exps]
    out = sum(wi * vi for wi, vi in zip(w, values))
    return w, out

values = [1.0, -1.0, 2.0, 0.5]                    # illustrative value numbers
cases = {"nothing relevant": [0.1, 0.2, 0.0, 0.1],
         "one clear match": [0.1, 0.2, 5.0, 0.1]}

for name, scores in cases.items():
    for label, sink in [("no sink", None), ("sink logit 3.0", 3.0)]:
        w, out = attend(scores, values, sink)
        print(f"{name:17s} {label:15s} weight on real tokens={sum(w):.2f} "
              f"largest={max(w):.2f} output={out:+.2f}")`, output: `nothing relevant  no sink         weight on real tokens=1.00 largest=0.28 output=+0.55
nothing relevant  sink logit 3.0  weight on real tokens=0.18 largest=0.05 output=+0.10
one clear match   no sink         weight on real tokens=1.00 largest=0.98 output=+1.96
one clear match   sink logit 3.0  weight on real tokens=0.88 largest=0.86 output=+1.73`,
          walkthrough: [
            { lines: [3, 10], note: "Attention for one query. The only change from ordinary softmax is line 7: if a sink logit is given, its exponential is added to the denominator. It has no value, so it never appears in the output sum." },
            { lines: [12, 14], note: "Four value numbers and two score patterns: all scores low, or one score much higher than the rest." },
            { lines: [16, 20], note: "Run both patterns with and without the sink. With nothing relevant, the sink takes 82% of the weight and the output shrinks from +0.55 to +0.10. With a clear match, the real token still gets 86%." },
          ] },
        { type: 'p', text: "Now change it:" },
        { type: 'list', items: [
          "Set the sink logit to `0.0`. That is the “softmax plus one” idea, since exp(0) = 1. Predict the weight on real tokens in the “nothing relevant” case.",
          "Set the sink logit to `6.0`. Predict what happens to the “one clear match” case. Is a stronger sink always better?",
          "Change the matching score from `5.0` to `8.0` and keep the sink at `3.0`. Predict how much weight the sink still takes.",
        ] },
        { type: 'check', question: "With nothing relevant, the output is +0.55 without a sink and +0.10 with one. Why is +0.10 closer to what the head should produce?", answer: "When no token is relevant, the best contribution is close to nothing. Without a sink, the weights must still sum to 1, so the head averages four unrelated values and injects noise (+0.55). The sink lets most of the weight go to a slot with no value, so the head stays nearly silent." },
        { type: 'check', question: "A learned sink logit is a parameter of the head, not a token in the cache. Why does that make cache eviction safer than in a model that uses its first token as the sink?", answer: "A first-token sink lives in the KV cache, so a window policy can evict it and shift every weight. A sink logit is part of the model's weights: it is present in every softmax no matter which tokens are cached, so trimming the cache cannot remove it." },
      ],
    },
  ],
  quiz: [
    { q: 'What is an attention sink?', options: ['A token that soaks up attention but adds little information', 'A layer that deletes unimportant tokens from the KV cache', 'The final token of the sequence, which every head attends to', 'A special loss term that limits how much attention a head uses'], answer: 0, explain: 'Sinks soak up attention the head does not need elsewhere. They are usually the first tokens, not the last.' },
    { q: 'Why do the first tokens become sinks?', options: ['They are usually the most meaningful words in the text', 'Every later token can always see them under the causal mask', 'Their position embeddings make their keys much larger', 'The tokenizer marks them as special control tokens'], answer: 1, explain: 'It is about position: replacing them with meaningless newlines largely keeps the effect. Their meaning is not what matters.' },
    { q: 'The cache holds a sink with weight 0.80 and four recent tokens with equal scores and weight 0.05 each. If the sink is evicted and only those four remain, what weight does each get?', options: ['0.05', '0.80', '0.0125', '0.25'], answer: 3, explain: 'Softmax weights must sum to 1 over the remaining tokens. Four equal scores give 1/4 = 0.25 each, a fivefold jump from 0.05. That sudden shift is what breaks window-only streaming.' },
    { q: 'Which cache policy did StreamingLLM propose?', options: ['Recompute the whole recent window from scratch for every new token', 'Keep only the most recent W tokens and evict everything older', 'Keep about 4 initial tokens plus a rolling recent window', 'Keep every token but compress each one to a single bit'], answer: 2, explain: 'Sinks + window gives fixed memory and stable output. Window-only breaks; recomputation is too slow.' },
    { q: 'A team adds StreamingLLM to their assistant and expects it to recall a phone number said 100,000 tokens ago. What is wrong with that expectation?', options: ['StreamingLLM only works for streams below about 4K tokens', 'It keeps the model fluent, but evicted tokens are simply gone', 'The sink tokens quietly store a summary of all past content', 'StreamingLLM needs full retraining before it can be used'], answer: 1, explain: 'Sinks stabilize attention; they do not store content. Long-term recall needs retrieval or summarised memory.' },
  ],
  takeaways: [
    'Softmax weights must sum to 1, so heads need somewhere harmless to put unneeded attention.',
    'The first tokens become attention sinks because every later token can always see them.',
    'Evicting sinks shifts the attention distribution and breaks window-only streaming.',
    'StreamingLLM keeps ~4 sink tokens plus a rolling window: fixed memory, stable output.',
    'Newer models build in learned sinks; none of this gives long-term memory of evicted tokens.',
  ],
  terms: [
    { term: 'Attention sink', def: 'A token, usually the first, that absorbs a large share of attention without adding much information.' },
    { term: 'KV cache', def: 'Stored keys and values of past tokens used during generation.' },
    { term: 'Window attention', def: 'Keeping only the most recent W tokens in the cache.' },
    { term: 'StreamingLLM', def: 'A method that keeps a few initial sink tokens plus a rolling window to stream text indefinitely.' },
    { term: 'Perplexity', def: 'A measure of how surprised a model is by text; lower is better.' },
    { term: 'Learned sink', def: 'An extra learnable attention slot or logit built into each head to absorb unneeded weight.' },
  ],
};
