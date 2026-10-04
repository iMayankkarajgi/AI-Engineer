export default {
  id: 'how-do-top-k-and-top-p-sampling-work',
  minutes: 18,
  hook: 'Always picking the most likely word makes a chatbot dull and repetitive, but picking from all 100,000 words lets in nonsense. How do we keep the good choices and cut the junk?',
  summary: 'Top-k and top-p are filters applied to the next-token probabilities before sampling. Top-k keeps a fixed number of the most likely tokens; top-p (nucleus sampling) keeps the smallest set of top tokens whose probabilities add up to at least p. Both throw away the long tail of unlikely tokens and renormalize the rest. Top-p adapts to how confident the model is, which is why it is the more common default; both are usually combined with temperature.',
  sections: [
    {
      id: 'how-llm-picks',
      title: 'How an LLM picks the next token',
      blocks: [
        { type: 'p', text: 'At each step an LLM outputs a **logit** (a raw score) for every token in its vocabulary. **Temperature** divides those logits, **softmax** turns them into probabilities that sum to 1, and then a **decoding strategy** chooses one token. The decoding strategy is what this lesson is about.' },
        { type: 'p', text: 'Running example: our travel-booking assistant is completing **"For our trip we booked a hotel in ..."**. Suppose the model\'s probabilities for the top candidates are:' },
        { type: 'chart', kind: 'bar', title: 'Next-token probabilities (illustrative)', yLabel: 'Probability', labels: ['Paris', 'Lyon', 'France', 'the', 'Nice', 'a', 'Rome', 'banana'], series: [ { name: 'Probability', values: [0.5, 0.15, 0.12, 0.08, 0.06, 0.05, 0.03, 0.01] } ], caption: 'Illustrative numbers. In a real model, thousands more tokens share a tiny bit of probability each, the "long tail".' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a talent show shortlist', text: 'A judge does not pick the winner from every person in the city, nor does she always pick the same favourite. She first makes a **shortlist** of strong acts, then chooses among them, more often the stronger ones. Top-k makes a shortlist of a fixed size ("the top 5"). Top-p makes a shortlist big enough to cover most of the talent ("whoever together accounts for 90% of the votes").' },
      ],
    },
    {
      id: 'problem-greedy',
      title: 'The problem with always picking the best token',
      blocks: [
        { type: 'p', text: '**Greedy decoding** always takes the single most likely token. It is simple and predictable, but it has two problems for open-ended text:' },
        { type: 'list', items: [
          '**Dull and repetitive.** Human writing often uses words that are not the single most likely choice. Always taking the top token produces flat text, and in long outputs the model can fall into loops, repeating the same phrase because it keeps being the most likely continuation.',
          '**No variety.** Every run gives the same answer. That is bad for brainstorming, for generating several drafts, or for any feature that should feel natural rather than robotic.',
        ] },
        { type: 'p', text: 'Greedy is still a good choice when there is one right answer (classification, extraction, many code tasks). For everything else we want **sampling**: picking at random according to the probabilities.' },
      ],
    },
    {
      id: 'problem-full-sampling',
      title: 'The problem with picking from every token',
      blocks: [
        { type: 'p', text: 'Pure sampling from the full distribution has the opposite problem. Each tail token is unlikely, but there are **tens of thousands** of them. Together they can hold a noticeable share of the probability. If 3% of the mass sits in nonsense tokens like "banana", then roughly once every 33 tokens the model picks something odd. In a 500-token answer that happens many times, and each odd token sends the following text further off track because the model conditions on its own mistakes.' },
        { type: 'p', text: 'The fix is to **truncate the tail**: remove unlikely tokens, keep the plausible ones, and sample among those. Top-k and top-p are two ways to decide where to cut.' },
        { type: 'check', question: 'If each of 50,000 tail tokens has probability 0.000001, how much total probability does the tail hold?', answer: '50,000 × 0.000001 = 0.05, or 5%. Individually negligible tokens add up, so roughly 1 in 20 sampled tokens would come from the tail.' },
      ],
    },
    {
      id: 'top-k',
      title: 'What is top-k sampling? A step-by-step example',
      blocks: [
        { type: 'p', text: '**Top-k sampling** keeps only the **k** tokens with the highest probabilities, sets all others to zero, **renormalizes** the kept ones so they sum to 1 again, and samples from them. k is a whole number such as 40 or 50 in practice; we use k = 3 for clarity.' },
        { type: 'steps', title: 'Top-k with k = 3', items: [
          { title: 'Sort', text: 'Order tokens by probability: Paris 0.50, Lyon 0.15, France 0.12, the 0.08, Nice 0.06, ...' },
          { title: 'Keep the top k', text: 'Keep Paris, Lyon and France. Their total is 0.50 + 0.15 + 0.12 = 0.77.' },
          { title: 'Zero the rest', text: '"the", "Nice", "a", "Rome" and "banana" can no longer be chosen.' },
          { title: 'Renormalize', text: 'Divide each kept probability by 0.77: Paris 0.65, Lyon 0.19, France 0.16.' },
          { title: 'Sample', text: 'Draw one of the three at random with those probabilities.' },
        ] },
        { type: 'viz', name: 'top-k-top-p', caption: 'Move the k and p sliders over a next-token distribution. Kept tokens stay coloured, removed ones fade, and the kept probabilities are renormalized.' },
      ],
    },
    {
      id: 'top-k-problem',
      title: 'The problem with top-k sampling',
      blocks: [
        { type: 'p', text: 'The weakness of top-k is that **k is fixed, but the model\'s confidence is not**. The shape of the distribution changes at every step:' },
        { type: 'list', items: [
          '**When the model is confident** ("The capital of France is" → Paris 92%), k = 3 still keeps two weak options. Sampling occasionally picks one of them, which can introduce a wrong fact.',
          '**When the model is uncertain** ("My favourite food is" → many reasonable answers of similar probability), k = 3 cuts off perfectly good options and makes the text less diverse than it should be.',
        ] },
        { type: 'p', text: 'No single k is right for both situations. That observation motivated top-p.' },
      ],
    },
    {
      id: 'top-p',
      title: 'What is top-p sampling? A step-by-step example',
      blocks: [
        { type: 'p', text: '**Top-p sampling**, also called **nucleus sampling**, was proposed in the 2019 paper "The Curious Case of Neural Text Degeneration" by Holtzman and colleagues. Instead of a fixed count, it keeps the **smallest set of most-likely tokens whose probabilities add up to at least p** (for example p = 0.9). That set is the "nucleus". Its size changes automatically with the model\'s confidence.' },
        { type: 'formula', expr: 'nucleus = smallest set V_p of top tokens with ∑_{x ∈ V_p} P(x) ≥ p', where: [
          ['p', 'the cumulative probability threshold, between 0 and 1 (often 0.9 to 0.95)'],
          ['V_p', 'the kept tokens; everything else gets probability 0 before renormalizing'],
        ] },
        { type: 'steps', title: 'Top-p with p = 0.8', items: [
          { title: 'Sort', text: 'Paris 0.50, Lyon 0.15, France 0.12, the 0.08, Nice 0.06, ...' },
          { title: 'Running total', text: '0.50 → 0.65 → 0.77 → 0.85. The total first reaches 0.8 after the 4th token.' },
          { title: 'Keep the nucleus', text: 'Keep Paris, Lyon, France and "the" (total 0.85). Drop the rest.' },
          { title: 'Renormalize', text: 'Divide by 0.85: Paris 0.59, Lyon 0.18, France 0.14, the 0.09.' },
          { title: 'Sample', text: 'Draw one of these four.' },
        ] },
        { type: 'code', lang: 'python', title: 'top_k_top_p.py', code: `import numpy as np

tokens = ["Paris", "Lyon", "France", "the", "Nice", "a", "Rome", "banana"]
probs = np.array([0.50, 0.15, 0.12, 0.08, 0.06, 0.05, 0.03, 0.01])

def top_k(p, k):
    keep = np.argsort(p)[::-1][:k]          # indices of the k largest
    out = np.zeros_like(p)
    out[keep] = p[keep]
    return out / out.sum()                  # renormalise to sum to 1

def top_p(p, threshold):
    order = np.argsort(p)[::-1]             # sort high -> low
    cum = np.cumsum(p[order])
    n = np.searchsorted(cum, threshold) + 1 # smallest set reaching threshold
    keep = order[:n]
    out = np.zeros_like(p)
    out[keep] = p[keep]
    return out / out.sum()

def show(name, p):
    kept = [f"{t}:{v:.2f}" for t, v in zip(tokens, p) if v > 0]
    print(f"{name:<12} kept {len(kept)} -> " + " ".join(kept))

show("top-k k=3", top_k(probs, 3))
show("top-p p=0.8", top_p(probs, 0.8))
show("top-p p=0.9", top_p(probs, 0.9))

# A confident distribution: top-p shrinks, top-k does not
sure = np.array([0.92, 0.03, 0.02, 0.01, 0.01, 0.005, 0.003, 0.002])
show("sure, k=3", top_k(sure, 3))
show("sure, p=0.9", top_p(sure, 0.9))

# A flat (uncertain) distribution: top-p grows, top-k does not
flat = np.array([0.16, 0.15, 0.14, 0.13, 0.12, 0.11, 0.10, 0.09])
show("flat, k=3", top_k(flat, 3))
show("flat, p=0.9", top_p(flat, 0.9))`,
          output: `top-k k=3    kept 3 -> Paris:0.65 Lyon:0.19 France:0.16
top-p p=0.8  kept 4 -> Paris:0.59 Lyon:0.18 France:0.14 the:0.09
top-p p=0.9  kept 5 -> Paris:0.55 Lyon:0.16 France:0.13 the:0.09 Nice:0.07
sure, k=3    kept 3 -> Paris:0.95 Lyon:0.03 France:0.02
sure, p=0.9  kept 1 -> Paris:1.00
flat, k=3    kept 3 -> Paris:0.36 Lyon:0.33 France:0.31
flat, p=0.9  kept 7 -> Paris:0.18 Lyon:0.16 France:0.15 the:0.14 Nice:0.13 a:0.12 Rome:0.11`,
          walkthrough: [
            { lines: [6, 10], note: 'Top-k: take the indices of the k largest probabilities, zero everything else, renormalize.' },
            { lines: [12, 19], note: 'Top-p: sort, take the running total, and keep tokens up to and including the first one where the total reaches the threshold.' },
            { lines: [25, 27], note: 'On our example, k = 3 keeps 3 tokens; p = 0.8 keeps 4; p = 0.9 keeps 5.' },
            { lines: [29, 32], note: 'A confident distribution: top-p keeps only "Paris" (0.92 ≥ 0.9), while top-k still keeps two weak extras.' },
            { lines: [34, 37], note: 'A flat distribution (same labels, made-up near-equal numbers): top-p widens to 7 tokens; top-k still cuts to 3.' },
          ] },
        { type: 'check', question: 'With probabilities [0.6, 0.25, 0.1, 0.05] and p = 0.9, how many tokens does top-p keep?', answer: 'Running total: 0.6, 0.85, 0.95. It first reaches 0.9 at the third token, so 3 tokens are kept (then renormalized by dividing by 0.95).' },
      ],
    },
    {
      id: 'top-k-vs-top-p',
      title: 'Top-k vs top-p sampling',
      blocks: [
        { type: 'compare', title: 'Fixed count vs probability mass', options: [
          { name: 'Top-k', summary: 'Keep the k most likely tokens.', pros: ['Very simple and cheap', 'Hard cap on how many options exist'], cons: ['Ignores how confident the model is', 'Too wide when confident, too narrow when uncertain'], bestFor: 'A safety cap alongside top-p, or simple setups' },
          { name: 'Top-p (nucleus)', summary: 'Keep the smallest top set whose probabilities sum to at least p.', pros: ['Adapts to confidence automatically', 'Keeps diversity where it is genuine'], cons: ['Needs sorting and a running sum', 'On very flat distributions it can keep many tokens'], bestFor: 'Default choice for open-ended generation' },
        ], rows: [
          ['Parameter', 'Integer k (e.g. 40)', 'Fraction p (e.g. 0.9)'],
          ['Confident step (one token at 92%)', 'Still keeps k tokens', 'Keeps 1 token'],
          ['Uncertain step (many similar options)', 'Still keeps k tokens', 'Keeps many tokens'],
        ], verdict: 'Top-p usually behaves better because the shortlist grows and shrinks with the model\'s confidence. Many systems combine both: top-p for adaptivity plus a large top-k as a hard cap.' },
      ],
    },
    {
      id: 'with-temperature',
      title: 'How top-k and top-p work with temperature',
      blocks: [
        { type: 'p', text: 'Temperature and these filters do different jobs. **Temperature reshapes** the distribution (sharper or flatter). **Top-k and top-p truncate** it (remove the tail). They are commonly applied in this order:' },
        { type: 'flow', title: 'A typical sampling pipeline', nodes: [
          { label: 'Logits', detail: 'Raw scores for every vocabulary token.' },
          { label: '÷ temperature', detail: 'Sharpen (T < 1) or flatten (T > 1) the distribution.' },
          { label: 'Top-k filter', detail: 'Optionally keep only the k largest.' },
          { label: 'Top-p filter', detail: 'Keep the smallest set reaching cumulative probability p.' },
          { label: 'Renormalize + sample', detail: 'Rescale kept probabilities to sum to 1 and draw one token.' },
        ] },
        { type: 'p', text: 'The order matters: temperature is applied **before** top-p, so a high temperature flattens the distribution and therefore makes the nucleus **larger** (more tokens are needed to reach p). Libraries mostly follow this order, but details can differ, so check the one you use.' },
        { type: 'callout', tone: 'note', title: 'Other truncation methods exist', text: 'Newer methods such as **min-p** sampling keep tokens whose probability is at least some fraction of the top token\'s probability. They share the same goal: cut the tail in a way that adapts to the model\'s confidence. Support varies by library and API.' },
      ],
    },
    {
      id: 'when-to-use',
      title: 'When to use which one, and common mistakes',
      blocks: [
        { type: 'table', caption: 'Reasonable starting points; tune on your own task and model.', head: ['Situation', 'Suggested setting', 'Why'], rows: [
          ['One correct answer (extraction, classification)', 'Greedy, or temperature near 0', 'Truncation does not matter if you always take the top token'],
          ['General chat, support answers', 'Top-p around 0.9 to 0.95, moderate temperature', 'Natural variety without tail nonsense'],
          ['Creative writing, brainstorming', 'Top-p around 0.95, temperature around 1', 'Wide but still plausible choices'],
          ['Need a strict upper bound on options', 'Top-k (e.g. 40 to 50) plus top-p', 'k caps the list when p would keep too many'],
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Setting top-p = 1.0 and thinking you have filtered something (p = 1 keeps every token). Setting k = 1 and expecting variety (it is greedy decoding). Cranking temperature high and relying on top-p to clean up: the flatter distribution makes the nucleus huge. Tuning temperature, top-k and top-p all at once without testing; change one at a time. And remembering that some APIs expose only some of these parameters.' },
        { type: 'callout', tone: 'example', title: 'Real-world use', text: 'Most LLM APIs and open-source inference servers expose `temperature` and `top_p`, and many also accept `top_k`. A support bot might run with low temperature and top-p 0.9 for steady answers, while a "suggest 5 taglines" feature uses higher temperature and top-p 0.95 to get genuinely different options.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does top-p (nucleus) sampling keep?', options: ['A fixed number p of the most likely tokens, dropping the rest', 'The smallest set of top tokens whose probabilities sum to at least p', 'Every token whose own probability is individually above the threshold p', 'A random fraction p of the vocabulary, sampled fresh each step'], answer: 1, explain: 'Top-p uses cumulative probability mass, not a count or a per-token threshold. Keeping a fixed number of the most likely tokens is what top-k does.' },
    { q: 'Probabilities are [0.40, 0.30, 0.20, 0.10]. Using top-p with p = 0.75, which tokens are kept and what does the top token become after renormalizing?', options: ['First two; 0.40 / 0.70 ≈ 0.57', 'All four; 0.40', 'First three; 0.40 / 0.90 ≈ 0.44', 'First one; 1.00'], answer: 2, explain: 'Running total: 0.40, 0.70, 0.90. It first reaches 0.75 at the third token, so three are kept, and 0.40 / 0.90 ≈ 0.44.' },
    { q: 'Your model is extremely confident at some steps (one token above 95%) and very unsure at others. Which method adapts its shortlist size to this automatically?', options: ['Top-p sampling', 'Top-k sampling with k = 40', 'Greedy decoding', 'Pure sampling from all tokens'], answer: 0, explain: 'Top-p shrinks to one token when confident and widens when uncertain. Top-k always keeps exactly k tokens.' },
    { q: 'A story generator uses temperature 1.8 and top-p 0.9, and outputs are still chaotic. What is the most likely explanation?', options: ['Top-p is applied after sampling, so it has no effect on which token is picked', 'Temperature 1.8 flattens the distribution, so the 0.9 nucleus holds many weak tokens', 'Top-p only works together with greedy decoding, so in this setup it is simply ignored', 'Any temperature above 1 automatically disables top-p in most libraries'], answer: 1, explain: 'Temperature is applied before truncation. A flatter distribution needs many more tokens to reach 90% of the mass, so lots of weak options survive. Lowering temperature is the fix.' },
    { q: 'Which statement is a misconception?', options: ['Top-k with k = 1 is the same as greedy decoding', 'Both top-k and top-p renormalize the kept probabilities', 'Setting top-p to 1.0 removes the long tail of unlikely tokens', 'Top-k ignores how confident the model is'], answer: 2, explain: 'With p = 1.0 the nucleus must include all probability mass, so nothing is removed. The other statements are true.' },
  ],
  takeaways: [
    'Greedy decoding is dull and repetitive; sampling from every token lets in tail nonsense.',
    'Top-k keeps a fixed number of the most likely tokens, then renormalizes.',
    'Top-p keeps the smallest set of top tokens whose probabilities sum to at least p, so it adapts to confidence.',
    'Temperature reshapes the distribution before truncation; high temperature makes the top-p nucleus bigger.',
    'A common default for open-ended text is top-p around 0.9 to 0.95 with moderate temperature; use greedy for single-answer tasks.',
  ],
  terms: [
    { term: 'Greedy decoding', def: 'Always choosing the single most likely next token.' },
    { term: 'Top-k sampling', def: 'Sampling only from the k most likely tokens after renormalizing.' },
    { term: 'Top-p (nucleus) sampling', def: 'Sampling from the smallest set of top tokens whose probabilities sum to at least p.' },
    { term: 'Long tail', def: 'The many low-probability tokens that together can hold noticeable probability mass.' },
    { term: 'Renormalize', def: 'Rescale the kept probabilities so they sum to 1 again.' },
    { term: 'Cumulative probability', def: 'The running total of probabilities when tokens are sorted from most to least likely.' },
  ],
};
