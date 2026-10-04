export default {
  id: 'how-does-semantic-caching-work',
  minutes: 23,
  hook: '"How do I get a refund?" and "Can I get my money back?" are different strings but the same question. Why pay an LLM twice to answer it?',
  summary: 'A semantic cache stores past LLM answers together with the embedding of the question that produced them. When a new question arrives, we embed it and look for a stored question whose embedding is similar enough (above a threshold); if found, we return the stored answer instead of calling the LLM. It saves cost and latency on repeated questions, but the threshold must be tuned carefully, because a too-low threshold returns answers to questions that only look similar.',
  sections: [
    {
      id: 'what-is-a-cache',
      title: 'What is a cache, and why traditional caching fails for AI apps',
      blocks: [
        { type: 'p', text: 'A **cache** is a fast store of results we already computed, so we can reuse them instead of computing again. Web browsers cache images; databases cache query results. A cache maps a **key** to a **value**. On a **hit** (key found) we return the value instantly; on a **miss** we compute it and store it.' },
        { type: 'p', text: 'A **traditional cache** uses **exact matching**: the key is the exact request, often hashed. That works when the same request repeats byte for byte. But people ask LLM apps in their own words. Our running example, a shop\'s support chatbot, receives:' },
        { type: 'list', items: [
          '"How do I get a refund?"',
          '"Can I get my money back?"',
          '"how do i get a refund" (lowercase, no question mark)',
          '"What\'s the process for refunds?"',
        ] },
        { type: 'p', text: 'An exact-match cache treats all four as different keys, so it calls the LLM four times and gets four nearly identical answers. LLM calls are the slowest and most expensive part of the app, often seconds and a noticeable cost per call, so this waste adds up quickly at scale.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like an experienced shop assistant', text: 'A new assistant looks up every question in the manual. An experienced one recognises "can I get my money back?" as the refund question they answered ten times today and replies straight away, without caring about the exact words. A semantic cache gives an app that kind of memory.' },
      ],
    },
    {
      id: 'what-is-semantic-caching',
      title: 'What is semantic caching? Embeddings and similarity',
      blocks: [
        { type: 'p', text: '**Semantic caching** matches questions by **meaning** instead of exact text. "Semantic" means "about meaning". We store each answered question as a vector, and when a new question\'s vector is close enough to a stored one, we reuse that stored answer.' },
        { type: 'p', text: 'To compare meanings, we use **embeddings**: lists of numbers (vectors) produced by an embedding model, arranged so that texts with similar meaning get vectors pointing in similar directions. Two paraphrases of the refund question get vectors that are very close; a question about shipping gets a vector pointing elsewhere.' },
        { type: 'p', text: '**Similarity** between embeddings is usually measured with **cosine similarity**: the cosine of the angle between two vectors. It is 1 when they point the same way, near 0 when unrelated. For vectors of length 1, it equals the dot product.' },
        { type: 'formula', expr: 'cos(a, b) = (a · b) / (‖a‖ ‖b‖)', where: [['a · b', 'sum of products of matching numbers'], ['‖a‖', 'length of vector a'], ['range', '−1 to 1; near 1 = same meaning']] },
        { type: 'viz', name: 'vector-similarity', caption: 'Drag the two vectors and watch cosine similarity change with the angle between them. A semantic cache compares a new question with stored ones exactly like this.' },
      ],
    },
    {
      id: 'step-by-step',
      title: 'How semantic caching works step by step',
      blocks: [
        { type: 'steps', title: 'Handling one request', items: [
          { title: 'Embed the question', text: 'Turn the incoming question into a vector with an embedding model (a fast, cheap call compared with the LLM).' },
          { title: 'Search the cache', text: 'Find the most similar stored question vector, usually with a vector index for speed.' },
          { title: 'Compare with the threshold', text: 'If the best similarity is at or above the threshold (e.g. 0.95), it is a hit.' },
          { title: 'Hit: return the stored answer', text: 'Skip the LLM entirely. Latency drops from seconds to milliseconds.' },
          { title: 'Miss: call the LLM and store', text: 'Generate a fresh answer, return it, and save (question vector, question, answer) for the future.' },
        ] },
        { type: 'flow', title: 'Request path through a semantic cache', nodes: [
          { label: 'Question', detail: '"Can I get my money back?"' },
          { label: 'Embed', detail: 'Vector for the question.' },
          { label: 'Nearest stored question', detail: '"How do I get a refund?" with similarity 0.994.' },
          { label: 'Threshold check', detail: '0.994 ≥ 0.95 → hit.' },
          { label: 'Answer', detail: 'Stored refund answer returned without calling the LLM.' },
        ] },
        { type: 'p', text: 'The cache usually lives in a vector database or a vector-capable store such as Redis, alongside metadata: when the entry was created, which model produced the answer, which user or tenant it belongs to, and a time-to-live (TTL) after which it expires.' },
      ],
    },
    {
      id: 'numeric-walkthrough',
      title: 'A numeric walkthrough in code',
      blocks: [
        { type: 'p', text: 'This script runs six support questions through a semantic cache with threshold 0.95. The embeddings are hand-made 4-number vectors whose axes mean roughly *refund*, *shipping*, *password* and *cancel*, so we can read them; a real system would get 768+ numbers from an embedding model.' },
        { type: 'code', lang: 'python', title: 'semantic_cache.py', code: `import numpy as np

def unit(v):
    v = np.array(v, dtype=float)
    return v / np.linalg.norm(v)

# Pretend embeddings: axes = [refund, shipping, password, cancel]
E = {"How do I get a refund?":          unit([.9, .1, 0, .2]),
     "Can I get my money back?":        unit([.85, .15, .05, .25]),
     "How long does shipping take?":    unit([.1, .95, 0, .05]),
     "When will my order arrive?":      unit([.1, .9, 0, .15]),
     "How do I cancel my order?":       unit([.35, .3, 0, .9]),
     "How do I cancel my subscription?": unit([.4, .05, .1, .9])}

cache = []                                 # list of (embedding, question, answer)
THRESHOLD = 0.95

def ask(q):
    v = E[q]
    if cache:
        sims = [float(v @ e) for e, _, _ in cache]
        best = int(np.argmax(sims))
        if sims[best] >= THRESHOLD:
            return f"HIT  {sims[best]:.3f} -> reuse answer to {cache[best][1]!r}"
    answer = f"<LLM answer for {q!r}>"     # the expensive call
    cache.append((v, q, answer))
    return "MISS -> call LLM, store answer"

for q in E:
    print(f"{q:34} {ask(q)}")`, output: `How do I get a refund?             MISS -> call LLM, store answer
Can I get my money back?           HIT  0.994 -> reuse answer to 'How do I get a refund?'
How long does shipping take?       MISS -> call LLM, store answer
When will my order arrive?         HIT  0.994 -> reuse answer to 'How long does shipping take?'
How do I cancel my order?          MISS -> call LLM, store answer
How do I cancel my subscription?   HIT  0.963 -> reuse answer to 'How do I cancel my order?'`,
          walkthrough: [
            { lines: [3, 5], note: 'Scale vectors to length 1 so a dot product is the cosine similarity.' },
            { lines: [7, 13], note: 'Pretend embeddings for six questions. Paraphrases get similar numbers.' },
            { lines: [15, 16], note: 'The cache is a list of (vector, question, answer). The threshold is 0.95.' },
            { lines: [18, 24], note: 'Compare the new question with every cached question; if the best similarity reaches the threshold, return the cached answer.' },
            { lines: [25, 27], note: 'Otherwise "call the LLM" (here a placeholder string) and store the result.' },
            { lines: [29, 30], note: 'Ask the six questions in order.' },
          ] },
        { type: 'p', text: 'Read the results. "Can I get my money back?" is a correct hit (0.994) on the refund question. "When will my order arrive?" is a correct hit on the shipping question. But look at the last line: "How do I cancel my **subscription**?" hits "How do I cancel my **order**?" with similarity 0.963. These are different questions with different answers. This is a **false hit**: the cache confidently returns the wrong answer. With a threshold of 0.97 it would have been a miss.' },
        { type: 'matrix', title: 'Cosine similarity between the six questions', rows: ['refund', 'money back', 'shipping', 'arrive', 'cancel order', 'cancel subscr.'], cols: ['refund', 'money back', 'shipping', 'arrive', 'cancel order', 'cancel subscr.'], values: [[1, 0.994, 0.22, 0.247, 0.56, 0.593], [0.994, 1, 0.279, 0.312, 0.624, 0.647], [0.22, 0.279, 1, 0.994, 0.377, 0.14], [0.247, 0.312, 0.994, 1, 0.474, 0.242], [0.56, 0.624, 0.377, 0.474, 1, 0.963], [0.593, 0.647, 0.14, 0.242, 0.963, 1]], format: 'num', caption: 'Computed from the toy vectors in the code. True paraphrases score 0.994; the two different "cancel" questions still score 0.963.' },
      ],
    },
    {
      id: 'threshold',
      title: 'Setting the similarity threshold',
      blocks: [
        { type: 'p', text: 'The **threshold** is the minimum similarity that counts as "the same question". It is the most important setting in a semantic cache, and it is a trade-off:' },
        { type: 'list', items: [
          '**Too low** (e.g. 0.80): many hits, big savings, but more **false hits**, where users get answers to a different question. This is the dangerous failure.',
          '**Too high** (e.g. 0.99): almost no false hits, but true paraphrases are missed, so the cache barely saves anything.',
        ] },
        { type: 'viz', name: 'semantic-cache', caption: 'Move the similarity threshold. Incoming queries turn into correct hits, misses or false hits. Find the point where false hits disappear but useful hits remain.' },
        { type: 'chart', kind: 'line', title: 'Hit rate and false-hit rate vs threshold', xLabel: 'Threshold', yLabel: 'Share of requests', series: [ { name: 'Hit rate', points: [[0.8, 0.62], [0.85, 0.55], [0.9, 0.46], [0.95, 0.33], [0.98, 0.18], [0.99, 0.09]] }, { name: 'False-hit rate', points: [[0.8, 0.14], [0.85, 0.08], [0.9, 0.04], [0.95, 0.01], [0.98, 0.003], [0.99, 0.001]] } ], caption: 'Illustrative curves, not measurements. Both fall as the threshold rises; the right value depends on your embedding model and on how costly a wrong answer is.' },
        { type: 'p', text: 'How to choose: collect real question pairs from logs, label each pair "same answer" or "different answer", compute their similarities with your actual embedding model, and pick the threshold that keeps false hits below what you can tolerate. Similarity values are model-specific: 0.90 from one model is not the same as 0.90 from another. Teams often start conservatively (high) and lower it gradually while monitoring.' },
        { type: 'check', question: 'In our code, which threshold would have avoided the false hit while keeping both correct hits?', answer: 'Anything above 0.963 and at or below 0.994, for example 0.97 or 0.98. The cancel-order/cancel-subscription pair scored 0.963, while the true paraphrase pairs scored 0.994.' },
      ],
    },
    {
      id: 'advantages',
      title: 'Advantages of semantic caching',
      blocks: [
        { type: 'compare', title: 'Exact-match cache vs semantic cache',
          options: [
            { name: 'Exact-match cache', summary: 'Key = hash of the exact request text.', pros: ['Never returns a wrong answer for a different question', 'Very cheap lookup (a hash)'], cons: ['Misses every paraphrase', 'Low hit rate for free-form questions'], bestFor: 'Identical repeated requests, deterministic API calls' },
            { name: 'Semantic cache', summary: 'Key = embedding; match by similarity.', pros: ['Catches paraphrases', 'Much higher hit rate in chat apps', 'Large savings in LLM cost and latency'], cons: ['Can return false hits', 'Needs an embedding call and vector search per request', 'Threshold tuning'], bestFor: 'FAQ-style and support questions asked many ways' },
          ],
          rows: [
            ['"refund?" vs "money back?"', 'Miss', 'Hit'],
            ['Risk of wrong answer', 'None (from the cache)', 'Yes, if threshold too low'],
            ['Extra per-request work', 'Hash', 'Embedding + vector search'],
          ],
          verdict: 'Use both: check the exact cache first (free and safe), then the semantic cache, then the LLM.' },
        { type: 'p', text: 'The benefits: **lower cost** (each hit avoids an LLM call), **lower latency** (milliseconds instead of seconds), **less load** on rate-limited APIs, and **more consistent answers** to the same question. Savings depend entirely on how repetitive the traffic is: support bots and FAQ assistants repeat a lot; open-ended creative or highly personal chats repeat little.' },
        { type: 'callout', tone: 'example', title: 'Real-world tools', text: 'Open-source projects such as GPTCache (from Zilliz) and the semantic cache in RedisVL implement this pattern, and several LLM gateways and frameworks (for example LangChain\'s cache integrations) offer semantic caching options. Do not confuse it with **prompt caching** offered by LLM providers, which reuses the model\'s internal computation for an identical prompt *prefix* and still generates a fresh answer.' },
      ],
    },
    {
      id: 'things-to-keep-in-mind',
      title: 'Things to keep in mind',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Where semantic caches go wrong', text: '**False hits** on questions that differ in a small but crucial detail: "cancel my order" vs "cancel my subscription", "flights to Paris" vs "flights from Paris", "Python 2" vs "Python 3". **Personal or account-specific answers**: "what is my balance?" must never be served from another user\'s cache entry; scope entries by user or tenant, or do not cache them. **Stale answers**: prices and policies change; use a TTL and clear entries when source documents change. **Conversation context**: "and what about the blue one?" depends on earlier turns, so caching it on its own text is wrong.' },
        { type: 'list', items: [
          '**Cache what is stable and shared**: FAQs, policy questions, how-to questions.',
          '**Do not cache** time-sensitive, personal, or context-dependent questions, or answers that relied on tool calls with live data.',
          '**Store metadata**: model version, prompt version, creation time; invalidate when any of them change.',
          '**Monitor**: log hits with their similarity, sample them for review, and track user feedback on cached answers.',
          '**Mind the overhead**: every request now pays for an embedding and a vector search; with very low hit rates the cache can cost more than it saves.',
        ] },
        { type: 'check', question: 'Our bank chatbot caches "What is my current balance?" and a second user asking the same thing receives the first user\'s balance. What went wrong, and how do we fix it?', answer: 'The answer is personal, so it must not be shared between users. Either exclude personal or account-specific questions from the cache, or scope cache entries by user (include the user ID in the lookup), and avoid caching answers that came from live account data.' },
        { type: 'p', text: 'Semantic caching is a simple, powerful idea: remember answers by meaning. It works best when many people ask the same stable questions in different words, with a carefully tuned threshold and clear rules about what may be cached.' },
      ],
    },
    {
      id: 'worked-example-break-even',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: 'A semantic cache is not free. Every request pays for an embedding and a vector search, whether it ends in a hit or not. So when does the cache pay for itself? Let us work it out with illustrative prices and timings.' },
        { type: 'steps', title: 'Finding the break-even point', items: [
          { title: 'Write down the costs', text: 'One LLM call: $0.01 and 2,000 ms. One cache check (embedding plus search): $0.0001 and 30 ms.' },
          { title: 'Cost per request', text: 'With a cache: check + (1 − h) × LLM, where h is the hit rate. Without a cache: just the LLM cost.' },
          { title: 'Break-even', text: 'The cache wins when h × LLM cost is more than the check cost: h > 0.0001 / 0.01 = 1%.' },
          { title: 'A support bot, h = 30%', text: 'Per 10,000 requests: no cache costs $100. With the cache: $1 for checks + 7,000 × $0.01 = $71. We save $29.' },
          { title: 'A creative-writing app, h = 0.5%', text: '$1 for checks + 9,950 × $0.01 = $100.50. The cache now costs more than having none.' },
          { title: 'Latency', text: 'Average = 30 + (1 − h) × 2,000 ms. At h = 30% that is 1,430 ms instead of 2,000. Note that every miss got 30 ms slower.' },
        ] },
        { type: 'table', caption: 'Per 10,000 requests, with the illustrative prices above.', head: ['Hit rate', 'Total cost', 'Average latency'], rows: [
          ['No cache', '$100.00', '2,000 ms'],
          ['0.5%', '$100.50', '2,020 ms'],
          ['10%', '$91.00', '1,830 ms'],
          ['30%', '$71.00', '1,430 ms'],
          ['60%', '$41.00', '830 ms'],
        ] },
        { type: 'p', text: 'One cost is missing from the table: **false hits**. Suppose a wrong answer leads to a support escalation worth $5 (illustrative). At h = 30% we serve 3,000 answers from the cache. If 1% of them are false hits, that is 30 wrong answers, or $150 of damage, against $29 saved. This is why we fix the threshold for safety first and only then look at the hit rate.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'The lesson said: label real question pairs, then pick the threshold that keeps false hits low enough. Now we code that. We take 15 labelled pairs, sweep six thresholds, count good hits and false hits at each, and choose the lowest threshold that stays within our tolerance.' },
        { type: 'code', lang: 'python', title: 'practice_threshold_sweep.py', code: `# Labelled pairs from (pretend) logs: the similarity of a new question to its
# nearest cached question, and whether the cached answer really was the right one.
# Illustrative numbers.
pairs = [
    (0.99, True), (0.98, True), (0.97, True), (0.96, False), (0.96, True),
    (0.95, True), (0.94, False), (0.93, True), (0.91, False), (0.90, True),
    (0.88, False), (0.86, False), (0.82, False), (0.75, False), (0.60, False),
]
MAX_FALSE_HITS = 0                  # how many wrong answers we tolerate in this sample

def evaluate(threshold):
    hits = [same for sim, same in pairs if sim >= threshold]
    good = sum(hits)                # True counts as 1
    return len(hits) / len(pairs), good, len(hits) - good

best = None
print("threshold  hit rate  good hits  false hits")
for t in [0.85, 0.90, 0.93, 0.95, 0.97, 0.99]:
    hit_rate, good, false_hits = evaluate(t)
    print(f"   {t:.2f}     {hit_rate:6.0%}  {good:9}  {false_hits:10}")
    if best is None and false_hits <= MAX_FALSE_HITS:
        best = t                    # lowest threshold that is still safe
print("chosen threshold:", best)`, output: `threshold  hit rate  good hits  false hits
   0.85        80%          7           5
   0.90        67%          7           3
   0.93        53%          6           2
   0.95        40%          5           1
   0.97        20%          3           0
   0.99         7%          1           0
chosen threshold: 0.97`,
          walkthrough: [
            { lines: [1, 9], note: 'Each pair holds a similarity and a label: True if the cached answer was right for the new question, False if it was not. We tolerate zero false hits.' },
            { lines: [11, 14], note: 'For one threshold: every pair at or above it is a hit. Hits labelled True are good; the rest are false hits.' },
            { lines: [16, 23], note: 'Sweep the thresholds from low to high, print a row for each, and remember the first one that meets the tolerance.' },
          ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Set `MAX_FALSE_HITS = 1`. Read the table in the output and predict the chosen threshold before you run it.',
          'Add one more pair to the list: `(0.98, False)`. Predict the new chosen threshold and the hit rate we are left with.',
          'Add `0.96` to the list of thresholds to try. Predict the number of false hits in that row.',
        ] },
        { type: 'check', question: 'At 0.95 there is 1 false hit and the hit rate is 40%. At 0.97 there are none and the hit rate is 20%. A teammate wants 0.95 "because it doubles the savings". What two things should we ask before agreeing?', answer: 'First: what does one wrong answer cost compared with one LLM call? If a false hit can mislead a customer about refunds, a few saved cents do not cover it. Second: is the sample big enough? Fifteen pairs is tiny. Zero false hits in 15 does not prove the rate is zero, so we should label many more pairs before trusting either threshold.' },
        { type: 'check', question: 'The list contains (0.96, True) and (0.96, False): the same similarity with opposite labels. What does that tell us about what a threshold can and cannot do?', answer: 'No threshold can separate those two pairs, because similarity is the only thing it looks at. To tell them apart we need another signal: scoping entries by user or product, checking that key terms match (order against subscription), or a second, more careful check on borderline hits.' },
      ],
    },
  ],
  quiz: [
    { q: 'How does a semantic cache decide that a new question is a hit?', options: ['Its exact text hash matches a stored question', 'Its embedding is similar enough to a stored one', 'It contains at least one word from a stored question', 'The LLM is asked whether it has seen it before'], answer: 1, explain: 'A semantic cache compares embeddings and treats similarity at or above the threshold as a hit. Exact hashing is how a traditional cache works.' },
    { q: 'In the code, "cancel my subscription" matched "cancel my order" at 0.963 with threshold 0.95. What kind of result is this?', options: ['A correct hit, since 0.963 is above 0.95', 'A miss, since 0.963 is below 0.99', 'A false hit: the wrong answer was reused', 'An exact match on the hashed question'], answer: 2, explain: 'The similarity passed the threshold, so the cache returned the order-cancellation answer for a subscription question: a false hit. A threshold of about 0.97 would avoid it here.' },
    { q: 'Users complain that the support bot sometimes answers a slightly different question than they asked. Hit rate is very high. What should we change first?', options: ['Lower the threshold to get even more hits', 'Remove the TTL so entries never expire', 'Switch the cache key to a hash of the answer', 'Raise the similarity threshold'], answer: 3, explain: 'Wrong-but-similar answers are false hits, caused by a threshold that is too permissive. Raising it trades some hits for correctness.' },
    { q: 'How does a semantic cache differ from provider-side prompt caching?', options: ['They are two names for one technique', 'Prompt caching reuses whole answers to similar questions', 'A semantic cache skips the LLM; prompt caching still generates', 'A semantic cache only works with exact prefixes'], answer: 2, explain: 'A semantic cache returns a stored answer without calling the LLM. Prompt caching reuses computation for an identical prompt prefix but still generates a new answer.' },
    { q: 'A teammate says: "Let\'s cache every question, including \'What is my order status?\', to maximise savings." What is the main problem?', options: ['Personal, live answers could be served to other users', 'Order-status questions are too short to embed', 'Caching would make the LLM itself slower', 'Vector search cannot handle that many entries'], answer: 0, explain: 'Account-specific and time-sensitive answers must not be shared or reused blindly. Scope by user or exclude such questions from the cache.' },
  ],
  takeaways: [
    'Exact-match caches miss paraphrases; semantic caches match questions by embedding similarity.',
    'Flow: embed the question, find the nearest cached question, hit if similarity ≥ threshold, else call the LLM and store.',
    'The threshold trades hit rate against false hits; tune it on labelled pairs from real logs, per embedding model.',
    'Hits save LLM cost and cut latency from seconds to milliseconds, most of all for repetitive FAQ-style traffic.',
    'Never cache personal, time-sensitive or context-dependent answers without scoping, TTLs and invalidation.',
  ],
  terms: [
    { term: 'Semantic cache', def: 'A cache that reuses stored LLM answers for new questions with similar meaning.' },
    { term: 'Similarity threshold', def: 'The minimum similarity between question embeddings that counts as a cache hit.' },
    { term: 'False hit', def: 'A cache hit that returns the answer to a different question.' },
    { term: 'Cosine similarity', def: 'The cosine of the angle between two vectors; close to 1 means very similar meaning.' },
    { term: 'TTL', def: 'Time to live: how long a cache entry stays valid before it expires.' },
    { term: 'Prompt caching', def: 'A provider feature that reuses computation for identical prompt prefixes; it still generates a fresh answer.' },
  ],
};
