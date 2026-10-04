export default {
  id: 'how-does-hybrid-search-work',
  minutes: 20,
  hook: 'Keyword search finds "E1042" but misses "my printer won\'t print bills"; semantic search does the opposite. What if we did not have to choose?',
  summary: 'Hybrid search runs keyword search (usually BM25) and semantic (vector) search on the same query and merges the two ranked lists into one. The most popular merge is Reciprocal Rank Fusion, which adds up 1 / (k + rank) from each list and ignores raw scores; the alternative is to normalise both score scales and blend them with a weight. The result catches both exact terms and paraphrases.',
  sections: [
    {
      id: 'keyword-search',
      title: 'Keyword search, and why it is not enough alone',
      blocks: [
        { type: 'p', text: 'Our running example: the support search for an office printer company. Customers type things like "E1042 invoice printing fails" or "my printer won\'t print bills".' },
        { type: 'p', text: '**Keyword search** (lexical search) finds documents that contain the query\'s words. It uses an **inverted index** (word → list of documents) and ranks with **BM25**, a formula that rewards documents where query words appear often (**term frequency**), especially rare words (**inverse document frequency**, so "E1042" counts far more than "the"), and slightly penalises very long documents.' },
        { type: 'formula', expr: 'BM25(q, d) = ∑ IDF(w) · tf(w,d)·(k₁+1) / (tf(w,d) + k₁·(1 − b + b·|d|/avgdl))', where: [['w', 'each word of the query q'], ['tf(w,d)', 'how many times w appears in document d'], ['IDF(w)', 'large when few documents contain w'], ['|d| / avgdl', 'document length relative to the average'], ['k₁, b', 'tuning constants, commonly k₁ ≈ 1.2–2.0 and b = 0.75']] },
        { type: 'p', text: 'Strengths: exact matching of codes, names and jargon; fast; no model needed; easy to explain. Weakness: it only matches **spelling**. "Won\'t print bills" shares no word with "invoice printing problems", so keyword search ranks that article poorly or not at all.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like two detectives', text: 'One detective checks fingerprints: exact, never confused, but useless if the suspect wore gloves. The other reads behaviour and motive: good with vague clues, but can be fooled by a lookalike. A smart chief listens to both and trusts the suspects both detectives point at.' },
      ],
    },
    {
      id: 'semantic-search',
      title: 'Semantic search, and why it is not enough alone',
      blocks: [
        { type: 'p', text: '**Semantic search** embeds the query and every document into vectors with an embedding model and returns the documents whose vectors are closest (usually by cosine similarity). It understands that "won\'t print bills" means "invoice printing fails". It handles synonyms, paraphrases and even other languages.' },
        { type: 'p', text: 'Its weakness is the mirror image. An embedding summarises general meaning, so specific rare tokens can get blurred. "E1042" might embed close to every other error-code article, and the exact one may not come first. Product SKUs, people\'s names, version numbers and new jargon the model never saw in training are common trouble spots. Semantic search also struggles to explain *why* something matched.' },
        { type: 'check', question: 'Which search would you trust more for the query "firmware 4.2.17 release notes", and why?', answer: 'Keyword search. The important part is the exact version string 4.2.17, which BM25 matches exactly, while an embedding might treat all firmware release notes as nearly the same meaning.' },
      ],
    },
    {
      id: 'what-is-hybrid',
      title: 'What is hybrid search, and how it runs both searches',
      blocks: [
        { type: 'p', text: '**Hybrid search** runs both a keyword search and a semantic search for the same query and combines their results into one ranked list. Documents that score well in either list can surface, and documents that score well in **both** rise to the top.' },
        { type: 'flow', title: 'The hybrid search pipeline', nodes: [
          { label: 'Query', detail: '"E1042 invoice printing fails"' },
          { label: 'BM25 search', detail: 'The inverted index returns its top N documents with BM25 scores (e.g. N = 50).' },
          { label: 'Vector search', detail: 'The query is embedded; the vector index returns its top N documents with cosine scores. This runs in parallel with BM25.' },
          { label: 'Fuse', detail: 'The two lists are merged with Reciprocal Rank Fusion or a weighted score blend.' },
          { label: 'Top-k results', detail: 'The final list goes to the user, or to a reranker and then an LLM in RAG.' },
        ] },
        { type: 'p', text: 'The two retrievers are independent, so they can run **in parallel**, and total latency is roughly the slower of the two plus a tiny merge step. Each retriever usually returns more candidates than we finally need (say 50 each for a final 10), so that good documents from one side are not cut too early.' },
        { type: 'p', text: 'Many systems support this natively: Elasticsearch and OpenSearch, Weaviate, Qdrant, Milvus, Vespa, Pinecone (with sparse-dense vectors) and PostgreSQL with full-text search plus pgvector. The API names and defaults differ, so check the docs of the system you use.' },
      ],
    },
    {
      id: 'combining-lists',
      title: 'How the two result lists are combined',
      blocks: [
        { type: 'p', text: 'Merging is harder than it looks because the two scores live on **different scales**. BM25 scores are unbounded: 1.8 might be high for one query and low for another. Cosine similarities sit roughly between 0 and 1, and for many models almost everything lands between 0.3 and 0.9. Adding them directly would let whichever scale is larger dominate. There are two standard fixes: **ignore the scores and use ranks** (RRF), or **normalise the scores** onto a common scale before blending.' },
        { type: 'viz', name: 'hybrid-search', caption: 'Keyword and vector lists merged with Reciprocal Rank Fusion. Move the weight slider to favour one retriever and watch the final order change.' },
      ],
    },
    {
      id: 'rrf',
      title: 'Reciprocal Rank Fusion (RRF)',
      blocks: [
        { type: 'p', text: '**Reciprocal Rank Fusion** (Cormack, Clarke and Büttcher, 2009) gives each document a score based only on its **position** in each list. Rank 1 earns the most, and the reward shrinks slowly as rank grows. A document missing from a list gets nothing from that list.' },
        { type: 'formula', expr: 'RRF(d) = ∑ᵢ 1 / (k + rankᵢ(d))', where: [['rankᵢ(d)', 'position of document d in list i (1 = first)'], ['k', 'a smoothing constant; 60 is the common default from the original paper'], ['∑ᵢ', 'sum over the retrievers (here: BM25 and vector)']] },
        { type: 'p', text: 'Small numbers: BM25 ranks our documents C, A, D, B. Vector search ranks them C, B, A, D. Document A is 2nd and 3rd: 1/62 + 1/63 = 0.01613 + 0.01587 = **0.0320**. Document B is 4th and 2nd: 1/64 + 1/62 = 0.01563 + 0.01613 = **0.0318**. So A edges out B, because it was decent in both lists, while B was great in one and last in the other. C is first in both and wins with 2/61 ≈ 0.0328.' },
        { type: 'steps', title: 'RRF step by step', items: [
          { title: 'Get both ranked lists', text: 'Run BM25 and vector search; keep each list\'s order, throw away the scores.' },
          { title: 'Score each appearance', text: 'For every document in every list, compute 1 / (60 + rank).' },
          { title: 'Add up per document', text: 'Sum the contributions from both lists. Missing from a list = 0 from that list.' },
          { title: 'Sort', text: 'Order documents by the summed score and return the top k.' },
        ] },
        { type: 'p', text: 'Why is RRF so popular? It needs **no score calibration**, has essentially one knob (k), is robust across queries, and works for any number of lists. Its downside: it throws away *how much* better the first result was than the second. If BM25 found one exact match with a huge score, RRF only knows "it was rank 1".' },
        { type: 'check', question: 'With k = 60, how much does being rank 1 vs rank 10 in one list change a document\'s RRF score?', answer: '1/61 ≈ 0.0164 vs 1/70 ≈ 0.0143, a difference of only about 0.002. The large k flattens the curve, so agreement between lists matters more than a top spot in just one.' },
      ],
    },
    {
      id: 'weighted-combination',
      title: 'Weighted score combination and normalisation',
      blocks: [
        { type: 'p', text: 'The other approach keeps the scores but first puts both on a 0-to-1 scale. The simplest method is **min-max normalisation**: in each list, the best score becomes 1, the worst becomes 0, and the rest are scaled in between. Then we blend with a weight α (alpha):' },
        { type: 'formula', expr: 'hybrid(d) = α · vec_norm(d) + (1 − α) · bm25_norm(d)', where: [['α', 'weight between 0 and 1; α = 1 is pure vector search, α = 0 pure keyword'], ['x_norm', '(x − min) / (max − min) within that query\'s result list']] },
        { type: 'p', text: 'Example: BM25 scores are C = 1.78, A = 1.42, D = 0.78, B = 0. Min-max gives C = 1, A ≈ 0.80, D ≈ 0.44, B = 0. Vector scores C = 0.83, B = 0.62, A = 0.58, D = 0.40 become C = 1, B ≈ 0.51, A ≈ 0.42, D = 0. With α = 0.5, A gets 0.5·0.42 + 0.5·0.80 ≈ 0.61. Other options include z-score normalisation (subtract the mean, divide by the standard deviation) or using known theoretical score ranges.' },
        { type: 'p', text: 'Weighted blending keeps score strength and gives an intuitive dial, but min-max is sensitive to outliers and to how many results each list returns, and the best α varies by dataset. Tune α on a set of real queries with known good answers; values around 0.5 to 0.7 toward vector are a common starting point, but there is no universal best value.' },
      ],
    },
    {
      id: 'code',
      title: 'Code you can run: BM25 + vectors + RRF',
      blocks: [
        { type: 'p', text: 'This script scores four printer-support documents with a real BM25 implementation, uses made-up cosine scores for the vector side (we have no embedding model here), then fuses them with RRF and with a weighted blend.' },
        { type: 'code', lang: 'python', title: 'hybrid_search.py', code: `import math

docs = {"A": "error E1042 when printing invoices",
        "B": "printer shows a paper jam warning",
        "C": "how to fix invoice printing problems",
        "D": "E1042 firmware update notes"}
query = "E1042 invoice printing fails"

def bm25(query, docs, k1=1.5, b=0.75):          # classic keyword scoring
    toks = {i: d.lower().split() for i, d in docs.items()}
    avg = sum(len(t) for t in toks.values()) / len(toks)
    out = {}
    for i, t in toks.items():
        s = 0.0
        for w in query.lower().split():
            n = sum(w in x for x in toks.values())       # docs containing w
            if n == 0: continue
            idf = math.log(1 + (len(toks) - n + 0.5) / (n + 0.5))
            tf = t.count(w)
            s += idf * tf * (k1 + 1) / (tf + k1 * (1 - b + b * len(t) / avg))
        out[i] = s
    return out

kw = bm25(query, docs)
vec = {"A": 0.58, "B": 0.62, "C": 0.83, "D": 0.40}  # pretend cosine scores
kw_rank = sorted(kw, key=kw.get, reverse=True)
vec_rank = sorted(vec, key=vec.get, reverse=True)
print("BM25   :", {d: round(kw[d], 2) for d in kw_rank})
print("vector :", vec_rank)

# Reciprocal Rank Fusion: only ranks matter, k = 60 by convention
rrf = {d: 1 / (60 + kw_rank.index(d) + 1) + 1 / (60 + vec_rank.index(d) + 1) for d in docs}
print("RRF    :", {d: round(s, 4) for d, s in sorted(rrf.items(), key=lambda x: -x[1])})

# Weighted fusion: min-max normalise each list to 0..1 first, then blend
def norm(s):
    lo, hi = min(s.values()), max(s.values())
    return {d: (v - lo) / (hi - lo) for d, v in s.items()}
nk, nv, alpha = norm(kw), norm(vec), 0.5
mix = {d: alpha * nv[d] + (1 - alpha) * nk[d] for d in docs}
print("alpha=.5:", {d: round(s, 2) for d, s in sorted(mix.items(), key=lambda x: -x[1])})`, output: `BM25   : {'C': 1.78, 'A': 1.42, 'D': 0.78, 'B': 0.0}
vector : ['C', 'B', 'A', 'D']
RRF    : {'C': 0.0328, 'A': 0.032, 'B': 0.0318, 'D': 0.0315}
alpha=.5: {'C': 1.0, 'A': 0.61, 'B': 0.26, 'D': 0.22}`,
          walkthrough: [
            { lines: [3, 7], note: 'Four documents and a query that mixes an exact code (E1042) with ordinary words.' },
            { lines: [9, 22], note: 'BM25: for each query word, IDF (rarer words count more) times a saturating term-frequency factor adjusted for document length.' },
            { lines: [24, 29], note: 'Keyword scores from BM25 and pretend cosine scores from a vector search, each turned into a ranked list.' },
            { lines: [31, 33], note: 'RRF: add 1 / (60 + rank) from each list. Raw scores are ignored.' },
            { lines: [35, 41], note: 'Weighted fusion: min-max normalise each score list to 0..1, then blend with alpha = 0.5.' },
          ] },
        { type: 'p', text: 'Notice document **B** ("paper jam warning"): vector search ranks it 2nd because it is about printers, but it has nothing to do with E1042 or invoices, and BM25 gives it 0. Both fusion methods push it below **A**, the article that actually mentions the error code. That is hybrid search doing its job. Also note "invoices" in A does not match "invoice" in the query: real keyword engines apply **stemming** to fix that.' },
      ],
    },
    {
      id: 'compare-and-real-world',
      title: 'Choosing a fusion method, and hybrid search in the real world',
      blocks: [
        { type: 'compare', title: 'Three ways to search',
          options: [
            { name: 'Keyword only', summary: 'BM25 over an inverted index.', pros: ['Exact codes and names', 'Cheap, explainable'], cons: ['Misses paraphrases'], bestFor: 'Catalogues of IDs, logs, legal search' },
            { name: 'Semantic only', summary: 'Embeddings + nearest neighbours.', pros: ['Understands meaning', 'Cross-language'], cons: ['Blurs rare exact terms'], bestFor: 'Conversational questions' },
            { name: 'Hybrid (RRF or weighted)', summary: 'Both, then fuse.', pros: ['Covers both blind spots', 'Robust across query types'], cons: ['Two indexes to run and keep in sync', 'Fusion needs some tuning'], bestFor: 'Most RAG and site search in production' },
          ],
          rows: [
            ['"E1042 printing fails"', 'Good', 'Fair', 'Good'],
            ['"won\'t print bills"', 'Poor', 'Good', 'Good'],
            ['Extra infrastructure', 'Inverted index', 'Model + vector index', 'Both'],
          ],
          verdict: 'Start with hybrid + RRF (k = 60) as a strong default; switch to a tuned weighted blend only if evaluation shows it helps.' },
        { type: 'table', caption: 'RRF vs weighted blending.', head: ['Aspect', 'RRF', 'Weighted (normalised scores)'], rows: [
          ['Uses', 'Ranks only', 'Score values'],
          ['Calibration needed', 'No', 'Yes: normalise, tune α'],
          ['Keeps score gaps', 'No', 'Yes'],
          ['Robust to outliers', 'Yes', 'Min-max is sensitive'],
        ] },
        { type: 'callout', tone: 'example', title: 'Hybrid search in practice', text: '**E-commerce** search mixes exact SKU and brand matches with descriptive queries like "warm waterproof jacket for kids". **Enterprise RAG** over manuals and tickets combines error codes with natural questions. **Legal and medical** search needs exact terms (statute numbers, drug names) plus concept matching. A common modern recipe is: hybrid retrieval of about 50–100 candidates, then a **reranker** to pick the final top 5–10.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Adding raw BM25 and cosine scores without normalising (one scale silently dominates). Returning only the top 5 from each retriever before fusing, so good candidates are cut early. Tuning α on a handful of queries. Forgetting that the keyword side needs proper text processing (lowercasing, stemming, language analysers). Letting the two indexes drift out of sync when documents are updated or deleted.' },
      ],
    },
  ],
  quiz: [
    { q: 'Why can\'t we simply add a BM25 score and a cosine similarity to combine them?', options: ['BM25 scores are always negative, so the sum is meaningless', 'They sit on different, uncalibrated scales, so one dominates', 'Cosine similarity values cannot be added to anything at all', 'Adding two numbers per document would be far too slow'], answer: 1, explain: 'BM25 is unbounded and query-dependent while cosine sits roughly in 0..1. Fusion needs ranks (RRF) or normalisation first.' },
    { q: 'With k = 60, document X is rank 1 in BM25 and absent from the vector list. Document Y is rank 3 in both. Which has the higher RRF score?', options: ['X, about 0.0164 vs 0.0159', 'They are exactly equal', 'X, because rank 1 always wins', 'Y, about 0.0317 vs 0.0164'], answer: 3, explain: 'X: 1/61 ≈ 0.0164. Y: 1/63 + 1/63 ≈ 0.0317. Agreement between two retrievers beats a single top rank.' },
    { q: 'Our product search returns vaguely related items for exact SKU queries like "KX-2210-B", though natural questions work well. What should we change?', options: ['Remove the vector search and keep only the language model', 'Increase the embedding dimension from 768 to 3,072 numbers', 'Add a BM25 retriever and fuse it with the vector results', 'Lower the RRF constant k to 0 so rank 1 counts much more'], answer: 2, explain: 'Exact-term failure is the classic weakness of pure semantic search. Hybrid search adds keyword matching while keeping semantic matching for natural questions.' },
    { q: 'In weighted hybrid search with hybrid = α·vec + (1 − α)·bm25, what does α = 0 mean?', options: ['Pure keyword (BM25) ranking', 'Pure vector ranking', 'Equal weight on both lists', 'Results come back in random order'], answer: 0, explain: 'With α = 0 the vector term vanishes and only the normalised BM25 score counts.' },
    { q: 'A colleague claims RRF is better than weighted blending in every way. What is a real drawback of RRF?', options: ['It needs a neural network trained on labelled queries', 'It cannot merge more than two ranked lists at once', 'It works only when both lists use cosine similarity', 'It ignores score gaps and uses only rank positions'], answer: 3, explain: 'RRF\'s simplicity comes from discarding score magnitudes. A dominant exact match and a narrow winner both count only as "rank 1".' },
  ],
  takeaways: [
    'Keyword search (BM25) nails exact terms; semantic search handles meaning; each covers the other\'s blind spot.',
    'Hybrid search runs both retrievers, usually in parallel, and fuses their ranked lists.',
    'RRF scores each document as ∑ 1 / (k + rank), with k = 60 by default, and needs no score calibration.',
    'Weighted fusion normalises scores (e.g. min-max) and blends them with α; it keeps score gaps but needs tuning.',
    'A strong production recipe: hybrid retrieval of many candidates, then a reranker for the final top results.',
  ],
  terms: [
    { term: 'BM25', def: 'A keyword ranking formula based on term frequency, inverse document frequency and document length.' },
    { term: 'Hybrid search', def: 'Running keyword and vector search together and merging their results.' },
    { term: 'Reciprocal Rank Fusion', def: 'Merging ranked lists by summing 1 / (k + rank) for each document.' },
    { term: 'Min-max normalisation', def: 'Rescaling scores so the lowest becomes 0 and the highest becomes 1.' },
    { term: 'Alpha (α)', def: 'The weight that balances vector and keyword scores in a weighted hybrid blend.' },
    { term: 'Stemming', def: 'Reducing words to a root form so "invoices" matches "invoice".' },
  ],
};
