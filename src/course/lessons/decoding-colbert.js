export default {
  id: 'decoding-colbert',
  minutes: 29,
  hook: 'What if, instead of squeezing a whole passage into one vector, we kept a vector for every word and let each query word find its best match?',
  summary: 'ColBERT (Khattab and Zaharia, 2020) is a retrieval model that encodes the query and each document separately into one vector per token, then scores a pair with MaxSim: every query token takes its highest similarity to any document token, and these maxima are summed. This "late interaction" keeps most of the precision of a cross-encoder while letting document vectors be computed ahead of time, at the cost of a much bigger index.',
  sections: [
    {
      id: 'what-is-colbert',
      title: 'What is the ColBERT paper, and what we need to know first',
      blocks: [
        { type: 'p', text: '**ColBERT** stands for **Co**ntextualized **L**ate interaction over **BERT**. It was introduced by Omar Khattab and Matei Zaharia of Stanford in the paper *"ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT"*, published at SIGIR 2020. The paper tackled a sharp dilemma in neural search: the most accurate models were far too slow, and the fast ones lost too much accuracy.' },
        { type: 'p', text: 'Building blocks we will use:' },
        { type: 'list', items: [
          '**Token**: a piece of text (a word or part of a word) that a model processes as one unit.',
          '**BERT**: a Transformer encoder that reads a whole text and outputs one vector per token. Each vector is **contextualized**: the vector for "bank" differs in "river bank" and "bank account", because it depends on the surrounding words.',
          '**Embedding / vector**: a list of numbers representing meaning. Similar meanings give vectors with high **cosine similarity** (the cosine of the angle between them; 1 = same direction).',
          '**Retrieval vs reranking**: retrieval finds candidates in a whole collection; reranking re-orders a short list of candidates.',
          '**MS MARCO**: a large public passage-ranking benchmark built from real Bing search queries, the main test bed in the paper.',
        ] },
        { type: 'callout', tone: 'analogy', title: 'Think of it like matching a shopping list', text: 'You have a shopping list (the query) and you visit a shop (a document). For each item on your list, you look for the best match on the shelves and note how good it is. The shop\'s score is the sum of those best matches. A shop that has a great match for *every* item on your list wins, even if it also sells lots of unrelated things.' },
      ],
    },
    {
      id: 'two-old-extremes',
      title: 'The big picture: the two old extremes',
      blocks: [
        { type: 'p', text: 'Before ColBERT, BERT-based ranking came in two flavours, at opposite ends of a speed/accuracy line.' },
        { type: 'p', text: '**Cross-encoders** (all-to-all interaction) join the query and document into one input and run BERT over the pair. Every query token can attend to every document token in every layer, so relevance judgements are excellent. But nothing can be precomputed: each query needs a full BERT pass for every candidate document. Reranking 1,000 candidates means 1,000 BERT passes per query.' },
        { type: 'p', text: '**Single-vector bi-encoders** (no interaction) encode the query into one vector and each document into one vector, separately. Documents are encoded ahead of time and searched with fast nearest-neighbour search. But a whole passage is squeezed into one vector, so fine-grained matching of individual terms is lost.' },
        { type: 'compare', title: 'Where ColBERT sits',
          options: [
            { name: 'Bi-encoder', summary: 'One vector per text, compared once.', pros: ['Fastest; precomputed docs', 'Small index'], cons: ['Coarse; details squeezed out'], bestFor: 'First-stage retrieval at huge scale' },
            { name: 'ColBERT (late interaction)', summary: 'One vector per token, matched with MaxSim.', pros: ['Token-level precision', 'Docs precomputed; works with ANN'], cons: ['Index many times bigger', 'More complex serving'], bestFor: 'High-quality retrieval or reranking' },
            { name: 'Cross-encoder', summary: 'Query and document read together.', pros: ['Most accurate interaction'], cons: ['One full pass per pair; no precompute'], bestFor: 'Reranking a short list' },
          ],
          rows: [
            ['When query meets doc', 'After encoding, once', 'After encoding, per token', 'Inside every layer'],
            ['Vectors per document', '1', '≈ number of tokens', 'None stored'],
          ],
          verdict: 'ColBERT moves the interaction "late" (after encoding) but keeps it fine-grained (per token): most of the precision, much of the speed.' },
      ],
    },
    {
      id: 'late-interaction-and-encoding',
      title: 'Late interaction and how the query and document are encoded',
      blocks: [
        { type: 'p', text: '**Late interaction** means the query and document are encoded **independently** (so documents can be processed offline) and only meet at the very end, in a cheap scoring step over their token vectors. "Late" contrasts with "early" interaction in cross-encoders, where they mix from the first layer.' },
        { type: 'steps', title: 'The ColBERT encoders', items: [
          { title: 'Add a marker token', text: 'The query gets a special [Q] token after [CLS]; documents get a [D] token. One shared BERT then knows which kind of text it is reading.' },
          { title: 'Pad the query with [MASK]', text: 'Queries are padded with [MASK] tokens to a fixed length (32 in the paper). BERT produces vectors for these too; the paper calls this query augmentation, and these extra vectors act as learned "soft expansions" of the query.' },
          { title: 'Run BERT', text: 'BERT outputs one contextualized vector (768 numbers for BERT-base) per token.' },
          { title: 'Shrink and normalise', text: 'A linear layer projects each vector down to a small size (128 in the paper) and each is scaled to length 1, so dot product = cosine similarity.' },
          { title: 'Filter (documents)', text: 'Vectors for punctuation tokens in documents are dropped to save space. Document vectors are computed once, offline, and stored.' },
        ] },
        { type: 'p', text: 'So a 10-token query becomes a 32 × 128 matrix E_q, and a 60-token passage becomes roughly a 60 × 128 matrix E_d. Keep these shapes in mind: they explain both ColBERT\'s precision and its index size.' },
      ],
    },
    {
      id: 'maxsim',
      title: 'The MaxSim operation, and why max, not average',
      blocks: [
        { type: 'formula', expr: 'S(q, d) = ∑ᵢ maxⱼ ( E_qᵢ · E_dⱼ )', where: [['E_qᵢ', 'vector of the i-th query token (unit length)'], ['E_dⱼ', 'vector of the j-th document token (unit length)'], ['maxⱼ', 'best match for query token i among all document tokens'], ['∑ᵢ', 'add the best matches over all query tokens']], caption: 'The ColBERT score. Each query token "votes" with its single best match in the document.' },
        { type: 'p', text: 'Picture a grid: query tokens as rows, document tokens as columns, and each cell is the cosine similarity of that pair. MaxSim takes the largest value in each **row**, then adds up the row maxima. Below is the grid for our toy query "capital of france" against the document "Paris is the capital of France".' },
        { type: 'matrix', title: 'Token similarity grid: query (rows) vs document (columns)', rows: ['capital', 'of', 'france'], cols: ['Paris', 'is', 'the', 'capital', 'of', 'France'], values: [[0.2, 0.63, 0.85, 0.99, 0.63, 0.1], [0.75, 1.0, 0.94, 0.69, 1.0, 0.69], [0.99, 0.63, 0.45, 0.22, 0.63, 0.99]], format: 'num', caption: 'Values computed from the toy 3-d vectors in the code below. Row maxima are 0.99, 1.00 and 0.99, so S = 2.99 (shown rounded).' },
        { type: 'p', text: 'Why take the **max** for each query token rather than an average over all document tokens? A relevant passage usually contains a strong match for each important query term *somewhere*, surrounded by many words unrelated to that term. Averaging would drown that one strong match in a sea of weak ones and would punish longer documents simply for having more words. The max asks the right question per query term: "is there good evidence for this term anywhere in the document?" Then the **sum** over query terms rewards documents that cover *all* parts of the query, not just one.' },
        { type: 'check', question: 'A document mentions "capital" strongly but has nothing about France. What happens to the "france" row in the MaxSim grid, and to the total score?', answer: 'The "france" row\'s maximum will be low because no document token is similar to it, so that query term contributes little. The total score drops, which is what we want: the document covers only part of the query.' },
      ],
    },
    {
      id: 'code-and-ranking',
      title: 'Ranking documents, with code',
      blocks: [
        { type: 'p', text: 'To rank, we compute S(q, d) for each candidate and sort. The script below does MaxSim for two documents with tiny 3-d token vectors, then computes the training loss for the pair (we explain that loss in the next section).' },
        { type: 'code', lang: 'python', title: 'maxsim.py', code: `import numpy as np

def unit(rows):                       # ColBERT L2-normalises every token vector
    m = np.array(rows, dtype=float)
    return m / np.linalg.norm(m, axis=1, keepdims=True)

# Toy 3-d token embeddings (real ColBERT uses 128-d, one per token)
query = {"tokens": ["capital", "of", "france"],
         "E": unit([[1, .1, 0], [.2, .2, .2], [0, 1, .1]])}
docs = {
    "Paris is the capital of France": unit(
        [[.1, .9, .2], [.1, .1, .1], [.2, .1, .1], [.9, .2, 0], [.2, .2, .2], [0, .9, .2]]),
    "France borders Spain": unit([[0, .9, .2], [.3, .1, .8], [.1, .2, .9]]),
}

def maxsim(Q, D):
    sim = Q @ D.T                      # every query token vs every doc token
    best = sim.max(axis=1)             # keep the best match per query token
    return best, best.sum()

scores = {}
for text, D in docs.items():
    best, s = maxsim(query["E"], D)
    scores[text] = s
    print(f"{text:32} per-token max = {np.round(best, 2)}  score = {s:.2f}")

# Training signal: softmax over (positive, negative), loss = -log p(positive)
pos, neg = scores["Paris is the capital of France"], scores["France borders Spain"]
p_pos = np.exp(pos) / (np.exp(pos) + np.exp(neg))
print(f"p(positive) = {p_pos:.3f}   loss = {-np.log(p_pos):.3f}")`, output: `Paris is the capital of France   per-token max = [0.99 1.   0.99]  score = 2.99
France borders Spain             per-token max = [0.36 0.81 0.99]  score = 2.16
p(positive) = 0.696   loss = 0.362`,
          walkthrough: [
            { lines: [3, 5], note: 'ColBERT normalises every token vector to length 1, so dot products are cosine similarities.' },
            { lines: [7, 14], note: 'Toy token matrices: 3 query tokens, a 6-token relevant passage and a 3-token passage that mentions France but not its capital.' },
            { lines: [16, 19], note: 'MaxSim: the full similarity grid Q · Dᵀ, the max over document tokens for each query token, then the sum.' },
            { lines: [21, 25], note: 'Score both documents and show each query token\'s best match.' },
            { lines: [27, 30], note: 'Softmax over the positive and negative scores, and the cross-entropy loss −log p(positive).' },
          ] },
        { type: 'p', text: 'The relevant passage scores 2.99; the other scores 2.16 because "capital" finds only a weak match (0.36). Notice also that the filler token "of" matched well in *both* documents (1.00 and 0.81): common words carry little signal, and real ColBERT learns to give them less distinctive vectors.' },
      ],
    },
    {
      id: 'training',
      title: 'Training with positives and negatives: the loss with small numbers',
      blocks: [
        { type: 'p', text: 'ColBERT is trained on **triples** ⟨q, d⁺, d⁻⟩: a query, a **positive** passage (relevant) and a **negative** passage (not relevant). In the paper these come from MS MARCO. The model scores both passages with MaxSim, turns the two scores into probabilities with a softmax, and is penalised by how little probability it gives to the positive. This is a pairwise softmax cross-entropy loss.' },
        { type: 'formula', expr: 'L = −log( exp(S(q,d⁺)) / (exp(S(q,d⁺)) + exp(S(q,d⁻))) )', where: [['S(q,d⁺)', 'MaxSim score of the positive passage'], ['S(q,d⁻)', 'MaxSim score of the negative passage'], ['L', 'small when the positive clearly outscores the negative']] },
        { type: 'p', text: 'With our numbers: S⁺ = 2.99, S⁻ = 2.16. The gap is 0.83. p(positive) = exp(2.99) / (exp(2.99) + exp(2.16)) = 1 / (1 + exp(−0.83)) ≈ 0.696, and L = −log 0.696 ≈ 0.362. If training widened the gap to 3, p would be about 0.95 and the loss about 0.05. Gradients from this loss flow back through MaxSim (only through the winning cell of each row), the projection layer and BERT, nudging token vectors so relevant matches get more similar and misleading matches less similar.' },
        { type: 'p', text: 'The choice of negatives matters enormously. Random negatives are too easy. **Hard negatives**, passages that look relevant but are not, teach the fine distinctions. Later work (ColBERTv2) also used **distillation**, training ColBERT to imitate the scores of a stronger cross-encoder.' },
      ],
    },
    {
      id: 'retrieval-at-scale',
      title: 'Fast retrieval at scale, and the cost of a bigger index',
      blocks: [
        { type: 'p', text: 'Because document vectors are precomputed, ColBERT can be used two ways. As a **reranker**, it scores e.g. the top 1,000 BM25 results using stored document vectors, so only the short query needs a BERT pass at query time. As an **end-to-end retriever**, it searches the whole collection:' },
        { type: 'flow', title: 'End-to-end ColBERT retrieval', nodes: [
          { label: 'Encode query', detail: 'One BERT pass gives 32 query token vectors.' },
          { label: 'ANN per token', detail: 'Each query vector searches an approximate nearest-neighbour index (FAISS in the paper) over all document token vectors and returns its closest token vectors.' },
          { label: 'Collect candidates', detail: 'Map those token vectors back to their documents; the union is the candidate set.' },
          { label: 'Exact MaxSim', detail: 'Load each candidate\'s full token matrix and compute the exact score.' },
          { label: 'Top-k', detail: 'Sort by score and return the best passages.' },
        ] },
        { type: 'p', text: 'The price is **storage**. A single-vector index stores one vector per passage; ColBERT stores one per token. Illustrative arithmetic: 8.8 million passages × about 70 tokens × 128 dimensions × 2 bytes (16-bit floats) ≈ 158 GB, versus about 27 GB for one 768-d float32 vector per passage, or roughly 2 GB for 128-d 16-bit single vectors. The exact figure depends on passage length and precision, but "tens of times larger than single-vector" is the right intuition. Much later work focuses on shrinking this.' },
        { type: 'chart', kind: 'hbar', title: 'Index size for 8.8M passages (illustrative estimate)', xLabel: 'GB', unit: ' GB', labels: ['Single vector, 128-d fp16', 'Single vector, 768-d fp32', 'ColBERT, 70 tokens × 128-d fp16'], series: [ { name: 'Size', values: [2.3, 27, 158] } ], caption: 'Back-of-envelope estimates from the arithmetic above, not measured numbers.' },
      ],
    },
    {
      id: 'results-and-legacy',
      title: 'The results, and where ColBERT led',
      blocks: [
        { type: 'p', text: 'On MS MARCO passage ranking, the paper reported that ColBERT\'s effectiveness was competitive with BERT cross-encoder rerankers and better than all non-BERT baselines, while running about two orders of magnitude faster and using about four orders of magnitude fewer FLOPs per query. That combination, close to cross-encoder quality at a fraction of the cost, is why the paper became so influential.' },
        { type: 'timeline', title: 'The late-interaction family', items: [
          { when: '2020', title: 'ColBERT', text: 'Late interaction with MaxSim over BERT token vectors; reranking and end-to-end retrieval.' },
          { when: '2021–2022', title: 'ColBERTv2', text: 'Residual compression shrinks the index several-fold; training with hard negatives and distillation from a cross-encoder.' },
          { when: '2022', title: 'PLAID', text: 'A faster search engine for ColBERTv2 that prunes candidates using centroid information before exact scoring.' },
          { when: '2024', title: 'ColPali and multi-vector everywhere', text: 'Late interaction applied to images of document pages; multi-vector support appears in several vector databases and libraries.' },
        ] },
        { type: 'callout', tone: 'example', title: 'Using it today', text: 'Libraries such as the Stanford ColBERT repository and RAGatouille make it easy to index and search with ColBERT models, and several vector databases now support multi-vector (late interaction) search. It is popular for RAG when a single-vector bi-encoder misses fine-grained matches but a cross-encoder over a big shortlist is too slow. Check current tooling, as support is evolving quickly.' },
        { type: 'callout', tone: 'warn', title: 'Limits and pitfalls', text: 'Index size and memory are the big costs; plan storage before indexing millions of documents. Long documents produce many vectors; chunk them. Query length is fixed (padding/truncation), so very long queries get cut. And like any learned retriever, it can underperform out of domain; compare against BM25 + a reranker on your own data.' },
      ],
    },
    {
      id: 'scoring-cost-in-numbers',
      title: 'Going one level deeper',
      blocks: [
        { type: 'p', text: 'The speed claim becomes easy to believe once we count the work for one query that reranks 1,000 candidate passages. The sizes follow the lesson (32 query vectors, about 70 document tokens, 128 dimensions); the arithmetic is rough and illustrative.' },
        { type: 'steps', title: 'Counting the work for one query', items: [
          { title: 'Encode the query once', text: 'One BERT pass over 32 tokens. This is the only neural network pass ColBERT needs at query time.' },
          { title: 'One similarity grid', text: '32 query vectors × 70 document vectors = 2,240 dot products for one passage.' },
          { title: 'Cost of one grid', text: 'Each dot product is 128 multiply-adds, so 2,240 × 128 = 286,720, about 0.29 million multiply-adds per passage.' },
          { title: 'All 1,000 candidates', text: '2.24 million dot products, about 287 million multiply-adds. For a GPU that is one modest matrix multiplication.' },
          { title: 'The cross-encoder instead', text: '1,000 full BERT passes over the query and passage joined together. Every pass runs all 12 layers of BERT-base over roughly 100 tokens, and costs billions of operations on its own.' },
        ] },
        { type: 'table', caption: 'Reranking 1,000 candidates for one query.', head: ['', 'Cross-encoder', 'ColBERT'], rows: [
          ['BERT passes at query time', '1,000', '1'],
          ['Document work at query time', 'Full encoding of every candidate', 'Load stored token vectors'],
          ['Scoring per passage', 'Inside the model', '2,240 dot products'],
          ['Stored per passage', 'Nothing', 'About 70 × 128 numbers'],
        ] },
        { type: 'p', text: 'The work did not vanish. It moved to indexing time, where every document went through BERT once, and to storage. It also created a new bottleneck: the 1,000 candidates have 70,000 token vectors between them, about 18 MB at 2 bytes per number (70,000 × 128 × 2), and all of it has to be fetched for every query. If those vectors live on a slow disk, fetching them can take longer than scoring them. That is why later systems put so much effort into compressing the vectors and into pruning candidates before the exact MaxSim step.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will put three ways of scoring side by side on the same token vectors: ColBERT\'s **MaxSim**, the "fairer" **average** over all document tokens, and a **single pooled vector** per text, as a bi-encoder would use. Three small documents are built to pull the methods apart: a focused one, a long one with the same two matches buried in filler, and one that covers only half of the query.' },
        { type: 'code', lang: 'python', title: 'practice_maxsim_vs_pooling.py', code: `import numpy as np

def unit(rows):
    m = np.array(rows, dtype=float)
    return m / np.linalg.norm(m, axis=1, keepdims=True)

# Toy 3-d token vectors. Axes: [warranty, battery, filler]. Illustrative.
Q = unit([[1, 0, 0], [0, 1, 0]])                 # query: "warranty battery"
docs = {
    "focused (2 tokens)": unit([[.9, .1, 0], [.1, .9, 0]]),
    "long (8 tokens)":    unit([[.9, .1, 0], [.1, .9, 0]] + [[0, .1, 1]] * 6),
    "half (3 tokens)":    unit([[1, 0, 0], [.9, 0, .1], [1, .1, 0]]),
}

def maxsim(Q, D):                                # ColBERT: best match per query token
    return (Q @ D.T).max(axis=1).sum()

def avgsim(Q, D):                                # the tempting alternative: average
    return (Q @ D.T).mean(axis=1).sum()

def pooled(Q, D):                                # single-vector model: one vector each
    q, d = Q.mean(axis=0), D.mean(axis=0)
    return float(q @ d / (np.linalg.norm(q) * np.linalg.norm(d)))

print(f"{'document':20} {'MaxSim':>7} {'AvgSim':>7} {'pooled':>7}")
for name, D in docs.items():
    print(f"{name:20} {maxsim(Q, D):7.2f} {avgsim(Q, D):7.2f} {pooled(Q, D):7.2f}")`, output: `document              MaxSim  AvgSim  pooled
focused (2 tokens)      1.99    1.10    1.00
long (8 tokens)         1.99    0.35    0.31
half (3 tokens)         1.10    1.03    0.73`,
          walkthrough: [
            { lines: [7, 13], note: 'A two-token query and three documents. "long" holds the same two matching tokens as "focused" plus six filler tokens. "half" only talks about the warranty.' },
            { lines: [15, 19], note: 'MaxSim takes the best match per query token and sums. AvgSim replaces the max with the mean over all document tokens.' },
            { lines: [21, 23], note: 'The single-vector model: average all token vectors of each text into one vector, then take one cosine.' },
            { lines: [25, 27], note: 'Print the three scores for each document.' },
          ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Change `* 6` to `* 60` so the long document has 60 filler tokens. Predict which of its three scores stays the same and which fall further.',
          'In the "half" document, change the last token to `[0, 1, 0]` (a battery token). Predict its new MaxSim score before you run it.',
          'Add a third query token `[0, 0, 1]`, as if the query contained a common filler word. Predict which document gains the most MaxSim, and why that is not a good reason to rank it higher.',
        ] },
        { type: 'check', question: 'The long document contains exactly the same two matching tokens as the focused one. MaxSim gives both 1.99, but the pooled score drops from 1.00 to 0.31. What does this tell us about single-vector models and long passages?', answer: 'Mean pooling lets every token vote on the final vector. Six filler tokens outvote two useful ones, so the vector points mostly at "filler" and the match is diluted. MaxSim only uses the best-matching token for each query term, so extra unrelated text does not lower the score.' },
        { type: 'check', question: 'The "half" document covers only the warranty, yet under AvgSim it almost ties with the focused document (1.03 against 1.10). Why is that a ranking problem, and how does MaxSim avoid it?', answer: 'AvgSim rewards "half" for being all about one term: its three tokens all match "warranty", so that row has a high average, and the missing "battery" barely shows. MaxSim sums the best match for each query token, so the "battery" row adds only 0.10 and the total falls to 1.10 against 1.99. A document must cover every query term to score well.' },
      ],
    },
    {
      id: 'quick-summary',
      title: 'Quick summary',
      blocks: [
        { type: 'list', ordered: true, items: [
          'Cross-encoders are accurate but slow; single-vector bi-encoders are fast but coarse.',
          'ColBERT encodes query and document separately into one vector per token (late interaction).',
          'MaxSim: each query token takes its best cosine match in the document; sum over query tokens.',
          'Trained on (query, positive, negative) triples with a softmax cross-entropy loss.',
          'Document vectors are precomputed, enabling ANN-based end-to-end retrieval, at the cost of a much larger index.',
        ] },
      ],
    },
  ],
  quiz: [
    { q: 'What does "late interaction" mean in ColBERT?', options: ['Query and document are joined and read together from the first layer', 'Texts are encoded separately; token vectors meet only when scoring', 'The model waits for user click feedback before it scores anything', 'Only the very last BERT layer is trained, the rest stay frozen'], answer: 1, explain: 'Separate encoding allows documents to be precomputed; the interaction (MaxSim) happens after encoding.' },
    { q: 'Query token similarities to a document\'s tokens are: token A → [0.2, 0.9, 0.4], token B → [0.7, 0.1, 0.3]. What is the MaxSim score?', options: ['1.6', '2.6', '0.43', '1.1'], answer: 0, explain: 'Take each row\'s maximum: 0.9 for A and 0.7 for B. Sum: 0.9 + 0.7 = 1.6.' },
    { q: 'Our single-vector search misses passages matching specific terms in long questions, and a cross-encoder over 1,000 candidates is too slow. Why might ColBERT help?', options: ['It needs no index of any kind to search', 'It stores less data than single-vector models', 'It matches per token with precomputed vectors', 'It writes the final answers directly itself'], answer: 2, explain: 'Token-level MaxSim captures term-specific matches that one pooled vector loses, while precomputed document vectors avoid per-pair BERT passes.' },
    { q: 'Compared with a single-vector bi-encoder, what is ColBERT\'s main cost?', options: ['It cannot run on a GPU at all', 'It needs labelled data at query time', 'It works only for English passages', 'A far bigger index: one vector per token'], answer: 3, explain: 'One vector per token instead of one per passage multiplies storage by roughly the passage length, which is why compression became a major follow-up topic.' },
    { q: 'A colleague suggests replacing max with average in MaxSim "to be fairer to every token". What is the main problem?', options: ['Strong term matches get diluted by unrelated tokens', 'Averages cannot be computed efficiently on GPUs', 'Average and max give identical results for unit vectors', 'It would make the stored index several times larger'], answer: 0, explain: 'Max asks whether good evidence for each query term exists anywhere. Averaging spreads that evidence over all document tokens (and penalises long documents), so it gets drowned out.' },
  ],
  takeaways: [
    'ColBERT encodes query and document independently into one vector per token, then scores them with MaxSim.',
    'MaxSim = sum over query tokens of the best cosine match among document tokens; max captures "is this term covered anywhere?".',
    'It is trained on (query, positive, negative) triples with a softmax cross-entropy loss; hard negatives matter.',
    'Precomputed document vectors make it far cheaper than a cross-encoder, but the index is many times larger than single-vector.',
    'Follow-ups such as ColBERTv2 and PLAID compress the index and speed up search; late interaction is now used for images too.',
  ],
  terms: [
    { term: 'ColBERT', def: 'Contextualized Late interaction over BERT: a multi-vector retrieval model scored with MaxSim.' },
    { term: 'Late interaction', def: 'Encoding texts separately and letting their token vectors interact only at scoring time.' },
    { term: 'MaxSim', def: 'For each query token, the highest similarity to any document token; summed over the query.' },
    { term: 'Contextualized embedding', def: 'A token vector that depends on the surrounding words.' },
    { term: 'Hard negative', def: 'A non-relevant passage that looks relevant, used to sharpen training.' },
    { term: 'Query augmentation', def: 'Padding the query with [MASK] tokens whose vectors act as learned query expansions.' },
  ],
};
