export default {
  id: 'how-does-a-reranker-work',
  minutes: 25,
  hook: 'Vector search found 50 "relevant" passages in 20 milliseconds, but the one that actually answers the question is sitting at position 17. How do we get it to the top?',
  summary: 'A reranker is a second, more precise model that re-scores a short list of candidates from a fast first-stage search. First-stage retrievers (BM25, bi-encoders) score documents independently of the query, which is fast but loose; a cross-encoder reranker reads the query and each document together and judges relevance much more accurately, at a much higher cost per document. Two-stage retrieval gets most of the accuracy of the slow model at close to the speed of the fast one.',
  sections: [
    {
      id: 'what-is-a-reranker',
      title: 'What is a reranker?',
      blocks: [
        { type: 'p', text: 'Our running example: a RAG assistant for a company\'s HR policies. An employee asks *"Can I carry unused vacation days into next year?"* Vector search returns 50 passages about vacation: how to request leave, public holidays, sick days, and somewhere in there the carry-over rule. The LLM will only see the top 5. If the carry-over passage is 17th, the answer will be wrong or vague.' },
        { type: 'p', text: 'A **reranker** is a model that takes the query and a **short list of candidate documents** and reorders them by how well each one actually answers the query. It does not search the whole collection; it only re-scores what the first search found. Its output is a new ranking (and usually a relevance score per document), and we keep the top few.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like hiring', text: 'A recruiter skims 1,000 CVs for keywords in an afternoon and shortlists 30. Then a hiring manager reads those 30 carefully, maybe interviews them, and picks the best 3. The skim is fast but rough; the careful read is slow but accurate. Nobody can interview 1,000 people, and nobody should hire from keywords alone.' },
      ],
    },
    {
      id: 'two-stage-retrieval',
      title: 'Where a reranker sits: the two-stage retrieval idea',
      blocks: [
        { type: 'p', text: '**Two-stage retrieval** splits search into a cheap, wide first stage and an expensive, narrow second stage.' },
        { type: 'flow', title: 'A RAG pipeline with a reranker', nodes: [
          { label: 'Query', detail: '"Can I carry unused vacation days into next year?"' },
          { label: 'Stage 1: retrieve', detail: 'BM25, vector search or hybrid search over millions of chunks returns the top 50–100 candidates in milliseconds.' },
          { label: 'Stage 2: rerank', detail: 'A cross-encoder scores each (query, candidate) pair and reorders the list.' },
          { label: 'Top-k', detail: 'Keep the best 3–10 passages after reranking.' },
          { label: 'LLM', detail: 'The LLM reads the query plus these passages and writes the answer.' },
        ] },
        { type: 'p', text: 'The first stage is optimised for **recall**: make sure the right document is *somewhere* in the candidate list. The second stage is optimised for **precision**: make sure the very top positions are the right ones. Recall means "did we find it at all?"; precision@k means "of the top k results, how many are relevant?".' },
      ],
    },
    {
      id: 'why-first-stage-is-loose',
      title: 'Why first-stage retrieval is fast but not precise',
      blocks: [
        { type: 'p', text: 'The speed of vector search comes from one design choice: the document vectors are computed **before** any query arrives. The query is embedded alone, the documents were embedded alone, and the search just compares two vectors. The model never sees the query and the document *together*.' },
        { type: 'p', text: 'That means one vector of 768 numbers must summarise everything a passage could be relevant for, without knowing what will be asked. Fine details get squeezed out: negation ("days **cannot** be carried over"), conditions ("only for staff hired before 2024"), which entity does what to whom. Two passages about vacation days look almost identical as vectors even if only one answers this question. BM25 has a similar limit: it counts word matches but does not understand them.' },
        { type: 'check', question: 'Why can a bi-encoder store document vectors in advance, while a cross-encoder cannot?', answer: 'A bi-encoder encodes each document independently of any query, so the vector is the same for every future query and can be precomputed. A cross-encoder\'s score depends on the query and document read together, so it can only be computed once the query is known.' },
      ],
    },
    {
      id: 'bi-vs-cross-encoder',
      title: 'Bi-encoder vs cross-encoder',
      blocks: [
        { type: 'p', text: 'An **encoder** here is a Transformer model (BERT-like) that reads text and produces vectors. The two designs differ in *what* it reads at once.' },
        { type: 'p', text: 'A **bi-encoder** encodes the query and document **separately** into one vector each and scores them with cosine similarity or a dot product. It is used for the first stage. A **cross-encoder** concatenates them into one input, like `[CLS] query [SEP] document [SEP]`, runs the full Transformer over both, and outputs a single relevance score from a small classification head. Inside, every query word can attend to every document word in every layer (this is **cross-attention** between the two texts via self-attention over the joined input), so it can notice that "carry into next year" matches "roll over to the following calendar year" and that "cannot" flips the meaning.' },
        { type: 'compare', title: 'Bi-encoder vs cross-encoder',
          options: [
            { name: 'Bi-encoder', summary: 'Encode query and document separately; compare vectors.', pros: ['Document vectors precomputed once', 'Searches millions of docs in ms with ANN', 'One model call per query'], cons: ['No word-level interaction between query and doc', 'Misses fine details such as negation'], bestFor: 'First-stage retrieval over the whole collection' },
            { name: 'Cross-encoder', summary: 'Read query + document together; output one score.', pros: ['Much more accurate relevance judgement', 'Sees every query-document word interaction'], cons: ['One full model pass per (query, doc) pair', 'Nothing can be precomputed', 'Far too slow for a whole collection'], bestFor: 'Reranking the top 20–200 candidates' },
          ],
          rows: [
            ['Input', 'Query alone, doc alone', 'Query and doc joined'],
            ['Output', 'Two vectors, then cosine', 'One relevance score'],
            ['Cost for 1M docs per query', '1 encode + ANN search', '1M model passes'],
          ],
          verdict: 'Use the bi-encoder to find candidates and the cross-encoder to judge them. That division of labour is the whole idea of reranking.' },
        { type: 'p', text: 'The landmark demonstration that a BERT cross-encoder makes a strong reranker was Nogueira and Cho\'s 2019 work on passage re-ranking (often called monoBERT), which reranked BM25 candidates on the MS MARCO benchmark and improved results by a large margin over earlier methods.' },
      ],
    },
    {
      id: 'scoring-step-by-step',
      title: 'How a reranker scores documents, step by step',
      blocks: [
        { type: 'steps', title: 'Inside a cross-encoder reranker', items: [
          { title: 'Take the candidates', text: 'Receive the query and the top N candidates (say 50) from the first stage.' },
          { title: 'Build pairs', text: 'Create 50 inputs: [CLS] query [SEP] candidate_i [SEP]. Long candidates are truncated to the model\'s maximum length (often 512 tokens).' },
          { title: 'Run the model on each pair', text: 'The Transformer reads each pair jointly; pairs are processed in batches on a GPU for speed.' },
          { title: 'Read off a score', text: 'A small head on top outputs one number per pair, a relevance logit, sometimes squashed to 0..1 with a sigmoid.' },
          { title: 'Sort and cut', text: 'Sort the 50 candidates by this score and keep the top k (say 5). Optionally drop any below a minimum score.' },
        ] },
        { type: 'p', text: 'Small example with illustrative numbers. Stage-1 cosine scores: "How to request leave" 0.82, "Public holidays 2026" 0.80, "Carry-over of unused days" 0.78. A cross-encoder might score the same three as 0.10, 0.03 and 0.94: once the model reads the question and the passage together, the carry-over passage is obviously the answer and moves from 3rd to 1st.' },
        { type: 'callout', tone: 'note', title: 'Scores are for sorting, not for comparing across queries', text: 'Raw reranker scores are mainly meaningful *within* one query\'s candidate list. Some vendors calibrate them to 0..1 so a threshold is usable, but a "0.6" for one query is not necessarily as good as a "0.6" for another. Test before using a fixed cut-off.' },
      ],
    },
    {
      id: 'trade-off',
      title: 'The accuracy vs latency and cost trade-off',
      blocks: [
        { type: 'p', text: 'Every extra candidate we rerank costs one more model pass. More candidates mean a better chance that the right document is in the list (higher recall going in), but also more latency and more money. The simulation below makes this concrete.' },
        { type: 'code', lang: 'python', title: 'two_stage_simulation.py', code: `import numpy as np

rng = np.random.default_rng(42)
N_DOCS, N_QUERIES, TOP = 10_000, 200, 5

def simulate(first_k):
    hits, calls = 0, 0
    for _ in range(N_QUERIES):
        relevant = np.zeros(N_DOCS)
        relevant[rng.choice(N_DOCS, 5, replace=False)] = 1.0   # 5 truly relevant docs
        # Stage 1 (bi-encoder): cheap but noisy score for every doc
        fast = relevant + rng.normal(0, 0.3, N_DOCS)
        if first_k == 0:                       # no reranker at all
            final = np.argsort(-fast)[:TOP]
        else:
            cand = np.argsort(-fast)[:first_k]  # shortlist
            # Stage 2 (cross-encoder): precise but one model call per candidate
            precise = relevant[cand] + rng.normal(0, 0.15, len(cand))
            calls += len(cand)
            final = cand[np.argsort(-precise)[:TOP]]
        hits += relevant[final].sum()
    return hits / (N_QUERIES * TOP), calls / N_QUERIES

for k in [0, 20, 100, 1000]:
    p, c = simulate(k)
    label = "stage 1 only" if k == 0 else f"rerank top {k}"
    print(f"{label:15} precision@5 = {p:.2f}   reranker calls/query = {c:.0f}")`, output: `stage 1 only    precision@5 = 0.44   reranker calls/query = 0
rerank top 20   precision@5 = 0.68   reranker calls/query = 20
rerank top 100  precision@5 = 0.84   reranker calls/query = 100
rerank top 1000 precision@5 = 0.99   reranker calls/query = 1000`,
          walkthrough: [
            { lines: [3, 4], note: '10,000 documents, 200 simulated queries, and we keep the top 5 for the LLM.' },
            { lines: [8, 12], note: 'Each query has 5 truly relevant documents. Stage 1 sees relevance through heavy noise (sd 0.3), like a fast but loose bi-encoder.' },
            { lines: [13, 14], note: 'Without a reranker, the noisy stage-1 top 5 is the final answer.' },
            { lines: [15, 20], note: 'With a reranker: shortlist the top first_k, re-score them with a much less noisy judge (sd 0.15), and count one model call per candidate.' },
            { lines: [21, 27], note: 'Precision@5 = share of the final 5 that are truly relevant, averaged over queries, for several shortlist sizes.' },
          ] },
        { type: 'chart', kind: 'bar', title: 'Precision@5 vs reranker calls per query (simulated, from the code above)', yLabel: 'Precision@5', labels: ['No reranker (0 calls)', 'Rerank 20', 'Rerank 100', 'Rerank 1000'], series: [ { name: 'Precision@5', values: [0.44, 0.68, 0.84, 0.99] } ], caption: 'Simulated, illustrative noise levels. The shape is what matters: reranking a modest shortlist gives a big jump; going from 100 to 1000 candidates costs 10× more calls for a smaller gain.' },
        { type: 'p', text: 'In real systems, typical shortlist sizes are 20 to 200. Small cross-encoders (MiniLM-sized, tens of millions of parameters) can rerank 100 short passages in tens of milliseconds on a GPU; larger rerankers or LLM-based rerankers are slower and pricier. The right number depends on your latency budget, so measure end-to-end quality and latency together.' },
        { type: 'check', question: 'In the simulation, why does reranking the top 20 give lower precision than reranking the top 100, even though the reranker is equally accurate in both cases?', answer: 'Because the reranker can only reorder what stage 1 handed it. With a shortlist of 20, some relevant documents never made it into the list, so no amount of reranking can recover them. A larger shortlist raises the recall going into stage 2.' },
      ],
    },
    {
      id: 'late-interaction',
      title: 'Late-interaction models like ColBERT',
      blocks: [
        { type: 'p', text: 'There is a middle ground between bi- and cross-encoders. **Late-interaction** models such as **ColBERT** (Khattab and Zaharia, 2020) encode the query and document separately, like a bi-encoder, but keep **one vector per token** instead of one per text. At scoring time, each query token finds its most similar document token (the **MaxSim** operation), and these best matches are summed. Document token vectors can be precomputed, so it is much faster than a cross-encoder, and the token-level matching makes it more precise than a single-vector bi-encoder. The price is a much larger index. ColBERT gets its own lesson next.' },
        { type: 'table', caption: 'Where each model type fits (general behaviour, not benchmark numbers).', head: ['Model type', 'Interaction', 'Precompute docs?', 'Typical role'], rows: [
          ['Bi-encoder', 'None (one vector each)', 'Yes', 'First-stage retrieval'],
          ['Late interaction (ColBERT)', 'Token-level, after encoding', 'Yes (many vectors)', 'Retrieval or reranking'],
          ['Cross-encoder', 'Full, inside every layer', 'No', 'Reranking a shortlist'],
          ['LLM reranker', 'Full, plus reasoning', 'No', 'High-value, low-volume reranking'],
        ] },
      ],
    },
    {
      id: 'real-examples-and-rag',
      title: 'Real rerankers, and why they matter for RAG',
      blocks: [
        { type: 'callout', tone: 'example', title: 'Rerankers you will meet', text: 'Open models: the `cross-encoder/ms-marco-MiniLM` family in the Sentence-Transformers library, BAAI\'s `bge-reranker` models, Jina\'s rerankers and mixedbread\'s rerankers. Hosted APIs: Cohere Rerank, Voyage AI rerankers and reranking features in cloud search services. LLMs can also rerank by being prompted to order passages (listwise reranking, as in RankGPT). Names and versions change often, so check current model cards and benchmarks such as BEIR or MTEB-style reranking leaderboards.' },
        { type: 'p', text: 'Why do rerankers matter so much for RAG specifically? An LLM\'s context is limited and costly, and LLMs tend to use information at the start and end of the context better than the middle. So **what we put in the top 3–5 slots** largely decides the answer quality. A reranker lets us retrieve generously (high recall) but pass only a few, highly relevant passages (high precision). It often also reduces hallucinations, because irrelevant but similar-looking passages are pushed out of the context.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Reranking too few candidates (the right document never reaches the reranker). Reranking too many (latency explodes). Feeding chunks longer than the reranker\'s max length, so the important part gets truncated. Using an English-only reranker on multilingual content. Assuming reranker scores are calibrated across queries. Never measuring: compare answer quality with and without the reranker on real questions.' },
        { type: 'p', text: 'When might we skip a reranker? If the first stage is already precise enough for the task (measure it), if latency budgets are extremely tight, or if the collection is tiny enough to send everything to the LLM. Otherwise, adding a reranker is one of the cheapest, most reliable upgrades to a RAG system.' },
      ],
    },
    {
      id: 'worked-example-shortlist-budget',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: 'How many candidates should we rerank? We do not have to guess. Two measurements, a latency budget and the recall of stage 1 at different depths, give the answer. All numbers here are illustrative.' },
        { type: 'steps', title: 'Choosing the shortlist size', items: [
          { title: 'Set the budget', text: 'Our HR assistant must have its passages ready within 200 ms, before the LLM starts writing. Stage 1 takes 30 ms, so the reranker may use 170 ms.' },
          { title: 'Measure reranker speed', text: 'On our hardware the reranker scores 100 passages in 120 ms, so about 1.2 ms per passage. 170 / 1.2 ≈ 140 passages fit in the budget.' },
          { title: 'Measure stage-1 recall by depth', text: 'On a test set, check how often the right passage is somewhere in the top N of stage 1, for several N. See the table.' },
          { title: 'Read the ceiling', text: 'Stage-1 recall at N is a ceiling for the whole system. If the right passage is in the shortlist only 70% of the time, no reranker can do better than 70%.' },
          { title: 'Pick N', text: 'Going from 20 to 50 buys 18 points of recall for 36 ms. Going from 100 to 200 buys 2 points for 120 ms and breaks the budget. We pick N = 100, or 50 if we want headroom.' },
        ] },
        { type: 'table', caption: 'Illustrative measurements for one system.', head: ['Shortlist N', 'Stage-1 recall at N', 'Rerank time'], rows: [
          ['20', '0.70', '24 ms'],
          ['50', '0.88', '60 ms'],
          ['100', '0.93', '120 ms'],
          ['200', '0.95', '240 ms'],
        ] },
        { type: 'p', text: 'One more thing to check while we are measuring: **truncation**. Suppose the reranker reads at most 512 tokens per pair. With a 20-token query and a few special tokens, only about the first 490 tokens of the passage are read. If our chunks are 800 tokens long and the carry-over rule sits in the last paragraph, the reranker never sees it and scores the chunk low. To spot this, log the token length of each pair. To fix it, use shorter chunks, or split a long chunk into pieces and keep the best piece score.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will run a complete two-stage search on five real sentences. Stage 1 uses pretend bi-encoder scores. Stage 2 is a tiny stand-in for a cross-encoder: it reads the query and the passage **together** and counts the short phrases (neighbouring word pairs) they share. A real cross-encoder is a neural network, but the shape of the pipeline is the same.' },
        { type: 'code', lang: 'python', title: 'practice_two_stage.py', code: `query = "can i carry unused vacation days into next year"

# (passage, pretend stage-1 cosine score from a bi-encoder). Illustrative numbers.
candidates = [
    ("how to request vacation days for next year", 0.84),
    ("vacation days and sick days are tracked separately", 0.81),
    ("unused vacation days carry into next year up to five days", 0.79),
    ("public holidays for next year are in the calendar", 0.70),
    ("parking permits are renewed every year", 0.35),
]

def pairs(text):                       # neighbouring word pairs = short phrases
    w = text.split()
    return set(zip(w, w[1:]))

def careful_score(q, passage):         # stand-in cross-encoder: reads both together
    return len(pairs(q) & pairs(passage))

def two_stage(shortlist_size):
    shortlist = sorted(candidates, key=lambda c: -c[1])[:shortlist_size]     # stage 1
    reranked = sorted(shortlist, key=lambda c: -careful_score(query, c[0]))  # stage 2
    return reranked[0][0], len(shortlist)

for passage, s1 in candidates:
    print(f"stage1={s1:.2f}  careful={careful_score(query, passage)}  {passage}")
print("stage 1 only ->", candidates[0][0])
for n in [2, 3, 5]:
    best, calls = two_stage(n)
    print(f"rerank top {n} -> {best}  ({calls} reranker calls)")`, output: `stage1=0.84  careful=2  how to request vacation days for next year
stage1=0.81  careful=1  vacation days and sick days are tracked separately
stage1=0.79  careful=4  unused vacation days carry into next year up to five days
stage1=0.70  careful=1  public holidays for next year are in the calendar
stage1=0.35  careful=0  parking permits are renewed every year
stage 1 only -> how to request vacation days for next year
rerank top 2 -> how to request vacation days for next year  (2 reranker calls)
rerank top 3 -> unused vacation days carry into next year up to five days  (3 reranker calls)
rerank top 5 -> unused vacation days carry into next year up to five days  (5 reranker calls)`,
          walkthrough: [
            { lines: [3, 10], note: 'Five passages with pretend stage-1 scores. The passage that answers the question is only third.' },
            { lines: [12, 17], note: 'The careful scorer. It needs both texts at once: it counts word pairs such as ("vacation", "days") that appear in the query and in the passage.' },
            { lines: [19, 22], note: 'Two stages: keep the best shortlist_size passages by stage-1 score, then reorder only those with the careful scorer.' },
            { lines: [24, 29], note: 'Print both scores for every passage, then the top result with no reranker and with shortlists of 2, 3 and 5.' },
          ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Change the stage-1 score of the carry-over passage from `0.79` to `0.60`. Predict the smallest shortlist size that still finds it.',
          'Change the query to `"are sick days tracked separately"`. Work out the careful score of each passage by hand, then predict the winner when we rerank the top 5.',
          'Replace the body of `careful_score` with a plain shared-word count: `len(set(q.split()) & set(passage.split()))`. Predict whether the right passage still wins, and which passages now tie.',
        ] },
        { type: 'check', question: 'Reranking the top 5 cost 5 calls and gave the same top result as reranking the top 3. Does that mean a shortlist of 3 is the right setting?', answer: 'Not from one query. Here the right passage happened to be third in stage 1. For the next query it may be 4th or 40th, and we cannot know in advance. The shortlist size should come from stage-1 recall measured over many queries, weighed against the latency budget.' },
        { type: 'check', question: 'With a shortlist of 2 the pipeline returned the same wrong passage as stage 1 alone, even though the careful scorer gives the right passage the highest score of all (4). What does that tell us about where to look when a reranked system fails?', answer: 'Look at stage 1 first. The reranker never saw the right passage, so its quality did not matter. Before blaming or swapping the reranker, check whether the right passage is in the shortlist at all.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does a reranker do in a search pipeline?', options: ['Embeds the entire document collection ahead of time', 'Re-scores the first-stage shortlist with a more precise model', 'Replaces the vector database with a learned keyword index', 'Writes the final answer text that the user reads'], answer: 1, explain: 'A reranker only sees the shortlist the first stage returns and reorders it more accurately. It does not index or search the full collection, and it does not generate text.' },
    { q: 'Our RAG bot often misses the right HR passage even with a reranker. Logs show it usually sits at position 30–40 in stage 1, and we rerank the top 20. What should we try first?', options: ['Rerank only the top 5 candidates to save time', 'Swap the cross-encoder reranker for a bi-encoder', 'Send more candidates to the reranker, e.g. 50–100', 'Lower the LLM temperature so answers are steadier'], answer: 2, explain: 'A reranker can only promote documents it receives. Widening the shortlist raises recall going into stage 2, at some extra latency.' },
    { q: 'In the simulation, going from reranking 100 to 1000 candidates raised precision@5 from 0.84 to 0.99. How many times more reranker calls did that cost?', options: ['1.2×', '10×', '100×', '0.84×'], answer: 1, explain: '1000 / 100 = 10× more model passes per query, for a smaller absolute gain than the first jump from 0 to 20 or 100 candidates.' },
    { q: 'Which statement correctly contrasts a bi-encoder and a cross-encoder?', options: ['A cross-encoder precomputes document vectors; a bi-encoder cannot', 'Both read the query and the document together in one input', 'A bi-encoder is the more accurate but also the slower of the two', 'A bi-encoder encodes texts separately; a cross-encoder reads both'], answer: 3, explain: 'Separate encoding is what makes bi-encoders fast and precomputable; joint reading is what makes cross-encoders accurate but expensive.' },
    { q: 'A teammate proposes running the cross-encoder directly on all 2 million chunks so we can drop the first stage. What is the problem?', options: ['It needs a full model pass per chunk for every query', 'Cross-encoders cannot score more than 100 documents', 'Cross-encoders are less accurate than plain BM25 search', 'Cross-encoders need every chunk vector stored in a vector DB'], answer: 0, explain: 'Cross-encoder scores depend on the query, so nothing can be precomputed: 2 million model passes per query is impractical. That is why it is used only on a shortlist.' },
  ],
  takeaways: [
    'A reranker re-scores a shortlist from a fast first stage with a slower, more precise model.',
    'Two-stage retrieval: stage 1 maximises recall over the whole collection; stage 2 maximises precision at the top.',
    'Bi-encoders encode query and document separately (fast, precomputable); cross-encoders read them together (accurate, expensive).',
    'Shortlist size trades quality against latency and cost; a reranker cannot recover documents stage 1 missed.',
    'Late-interaction models like ColBERT sit between the two, matching at the token level with precomputed vectors.',
  ],
  terms: [
    { term: 'Reranker', def: 'A model that reorders a short list of retrieved candidates by relevance to the query.' },
    { term: 'Two-stage retrieval', def: 'A cheap wide search for candidates followed by an expensive precise re-scoring.' },
    { term: 'Bi-encoder', def: 'A model that encodes query and document separately into vectors compared by similarity.' },
    { term: 'Cross-encoder', def: 'A model that reads query and document together and outputs a single relevance score.' },
    { term: 'Precision@k', def: 'The fraction of the top k results that are relevant.' },
    { term: 'Late interaction', def: 'Encoding texts separately into token vectors and matching them at scoring time, as in ColBERT.' },
  ],
};
