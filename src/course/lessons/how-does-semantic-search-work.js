export default {
  id: 'how-does-semantic-search-work',
  minutes: 18,
  hook: 'A customer types "I forgot my login" and the perfect help article is called "How to reset your password". They share zero words. How can search still find it?',
  summary: 'Keyword search matches the exact words of a query, so it misses synonyms and paraphrases. Semantic search turns the query and every document into embeddings (vectors that capture meaning), stores them in a vector database, and returns the documents whose vectors are closest to the query vector, usually by cosine similarity. Approximate nearest neighbour indexes keep this fast for millions of documents.',
  sections: [
    {
      id: 'keyword-search',
      title: 'What is keyword search, and where does it fail?',
      blocks: [
        { type: 'p', text: '**Keyword search** (also called lexical search) finds documents that contain the words in the query. Behind the scenes it builds an **inverted index**: a table that maps each word to the list of documents containing it, like the index at the back of a book. To answer "refund policy", it looks up the lists for "refund" and "policy" and ranks documents by how often and how distinctively those words appear. The classic ranking formula is **BM25**, which rewards rare words and repeated matches and adjusts for document length.' },
        { type: 'p', text: 'Keyword search is fast, cheap, explainable and excellent for exact things: product codes, error numbers, names. But it only understands **spelling**, not **meaning**. Its main failure modes:' },
        { type: 'list', items: [
          '**Synonyms**: "car" vs "automobile", "login" vs "password", "cheap" vs "affordable".',
          '**Paraphrases**: "how do I get my money back" vs "refund policy".',
          '**Different languages**: "reset password" vs "restablecer contraseña".',
          '**Word ambiguity**: "apple" the fruit vs Apple the company, "Python" the snake vs the language.',
        ] },
        { type: 'callout', tone: 'analogy', title: 'Think of it like two kinds of librarian', text: 'The keyword librarian only fetches books whose titles contain your exact words. The semantic librarian listens to what you *mean* and brings books about that idea, even if the titles use completely different words.' },
      ],
    },
    {
      id: 'what-is-semantic-search',
      title: 'What is semantic search?',
      blocks: [
        { type: 'p', text: '**Semantic search** finds results by **meaning** instead of exact words. "Semantic" simply means "related to meaning". The trick is to represent every piece of text as a point in a space where distance reflects difference in meaning. Then "find documents about the same thing as my question" becomes "find the points closest to my question\'s point".' },
        { type: 'p', text: 'Our running example is the help centre of an online shop. With semantic search, "I forgot my login" lands near "How to reset your password", "Can I get my money back?" lands near "Refund policy", and "where is my parcel" lands near "Track your order", even though none of these pairs share an important word.' },
      ],
    },
    {
      id: 'embeddings',
      title: 'What is an embedding, and why similar meanings sit close together',
      blocks: [
        { type: 'p', text: 'An **embedding** is a list of numbers (a vector) that an **embedding model** produces from a piece of text. Modern text embedding models are neural networks, usually Transformer encoders, that output a fixed-size vector such as 384, 768 or 1,536 numbers, whatever the input length.' },
        { type: 'p', text: 'How do similar meanings end up close? Through training. The model is shown huge numbers of pairs that should match (a question and its answer, a title and its article, two paraphrases) and pairs that should not. A **contrastive** training objective pulls matching pairs closer and pushes non-matching pairs apart. After enough examples, the model has learned to place text by its meaning, so "forgot my login" and "reset my password" end up in the same neighbourhood.' },
        { type: 'viz', name: 'embedding-space', caption: 'A 2-D map of word embeddings. Click any word to see its nearest neighbours: words with related meanings cluster together.' },
        { type: 'p', text: 'Each individual number is usually not human-readable ("dimension 213 = sports" is not how it works). Meaning is spread across all dimensions. In our code below we cheat and use 3 readable axes, *account*, *money* and *delivery*, so we can see what is going on.' },
        { type: 'callout', tone: 'note', title: 'Same model for everything', text: 'The query and the documents must be embedded by the **same model**. Some models also expect a prefix (for example "query: " vs "passage: ") or have separate query and document modes; follow the model card, because skipping this can noticeably hurt results.' },
      ],
    },
    {
      id: 'cosine-similarity',
      title: 'Measuring closeness with cosine similarity',
      blocks: [
        { type: 'p', text: 'To rank documents we need a number for "how close". The most common is **cosine similarity**, the cosine of the angle between two vectors. It ranges from −1 (opposite) through 0 (unrelated) to 1 (same direction). It ignores length, which is useful because longer texts should not automatically look "more similar".' },
        { type: 'formula', expr: 'cos(q, d) = (q · d) / (‖q‖ ‖d‖)', where: [['q · d', 'dot product: ∑ qᵢ dᵢ'], ['‖q‖', 'length of q: √∑ qᵢ²'], ['range', '−1 to 1; higher means more similar']] },
        { type: 'p', text: 'Small example: `q = [0.7, 0.05, 0.1]` (forgot my login) and `d = [0.9, 0, 0]` (reset password). Dot product = 0.7·0.9 = 0.63. Lengths: ‖q‖ ≈ 0.709, ‖d‖ = 0.9. Cosine = 0.63 / (0.709 · 0.9) ≈ 0.99. A refund document like `[0.03, 0.83, 0.1]` gets a cosine near 0.1: very different meaning.' },
        { type: 'viz', name: 'vector-similarity', caption: 'Drag the two vectors. Cosine similarity depends only on the angle; dot product and Euclidean distance also react to length.' },
        { type: 'check', question: 'If we scale every embedding to length 1 when we store it, which cheaper calculation gives exactly the same ranking as cosine similarity?', answer: 'The plain dot product. For unit-length vectors the denominator ‖q‖‖d‖ is 1, so cosine similarity equals q · d. Many systems normalise at insert time for this reason.' },
      ],
    },
    {
      id: 'vector-database-and-flow',
      title: 'The vector database and the full semantic search flow',
      blocks: [
        { type: 'p', text: 'We need somewhere to keep millions of document vectors and search them quickly. That is a **vector database**: it stores each vector with an ID and metadata (the original text, URL, date, language, permissions) and answers "give me the k nearest vectors to this one". Examples include Pinecone, Weaviate, Milvus, Qdrant, Chroma, pgvector for PostgreSQL, and vector search in Elasticsearch or OpenSearch.' },
        { type: 'p', text: 'Semantic search has two phases. **Indexing** happens ahead of time, once per document (and again when it changes). **Querying** happens on every search and must be fast.' },
        { type: 'flow', title: 'Indexing phase (offline)', nodes: [
          { label: 'Documents', detail: 'Help articles, product pages, tickets: the content we want to be searchable.' },
          { label: 'Chunk', detail: 'Long documents are split into passages of a few hundred tokens so each vector covers one idea.' },
          { label: 'Embed', detail: 'The embedding model turns every chunk into a vector.' },
          { label: 'Store', detail: 'Vectors, IDs and metadata go into the vector database, which builds an index.' },
        ] },
        { type: 'steps', title: 'Query phase (every search)', items: [
          { title: 'User types a query', text: '"I forgot my login".' },
          { title: 'Embed the query', text: 'The same embedding model turns the query into a vector q.' },
          { title: 'Nearest neighbour search', text: 'The vector database finds the k stored vectors with the highest cosine similarity to q, applying any metadata filters.' },
          { title: 'Return results', text: 'IDs map back to the original documents, shown to the user or passed to an LLM in a RAG system.' },
          { title: 'Optionally rerank', text: 'A slower, more precise model can reorder the top results (covered in the reranker lesson).' },
        ] },
      ],
    },
    {
      id: 'code',
      title: 'Code you can run: keyword vs semantic',
      blocks: [
        { type: 'p', text: 'This script compares keyword overlap and cosine similarity on our help-centre example. The "embedding model" is a tiny hand-made table of word vectors with 3 readable axes, *account*, *money* and *delivery*. A sentence vector is the average of its word vectors. Real models learn hundreds of axes and handle word order and context, but the ranking idea is the same.' },
        { type: 'code', lang: 'python', title: 'keyword_vs_semantic.py', code: `import numpy as np

docs = ["How to reset your password",
        "Refund policy for returned items",
        "Track where your parcel is right now"]
query = "I forgot my login"

# Toy word vectors over 3 meaning axes: [account, money, delivery].
# A real embedding model learns ~768 such axes from billions of sentences.
W = {"reset": [.8, 0, 0], "password": [1, 0, 0], "login": [.9, 0, 0],
     "forgot": [.5, .1, .2], "refund": [0, 1, 0], "returned": [0, .7, .3],
     "items": [0, .3, .3], "policy": [.1, .5, 0], "track": [0, 0, .9],
     "parcel": [0, .1, 1], "now": [0, 0, .2]}
STOP = {"how", "to", "your", "i", "my", "for", "where", "is", "right"}

def words(t):
    return [w for w in t.lower().split() if w not in STOP]

def keyword_score(q, d):            # count shared words
    return len(set(words(q)) & set(words(d)))

def embed(t):                       # average the word vectors, then normalise
    v = np.mean([W[w] for w in words(t) if w in W], axis=0)
    return v / np.linalg.norm(v)

q_vec = embed(query)
print("query words:", words(query))
for d in docs:
    cos = float(q_vec @ embed(d))   # unit vectors, so dot = cosine
    print(f"{d:40} keyword={keyword_score(query, d)}  cosine={cos:.2f}")`, output: `query words: ['forgot', 'login']
How to reset your password               keyword=0  cosine=0.99
Refund policy for returned items         keyword=0  cosine=0.14
Track where your parcel is right now     keyword=0  cosine=0.14`,
          walkthrough: [
            { lines: [3, 6], note: 'Three help articles and a query that shares no content words with any of them.' },
            { lines: [8, 14], note: 'Our toy "embedding model": each known word has a 3-number vector. Stop words such as "my" and "to" are ignored.' },
            { lines: [16, 20], note: 'Keyword score: how many non-stop words the query and document share.' },
            { lines: [22, 24], note: 'Embedding: average the word vectors and scale to length 1.' },
            { lines: [26, 30], note: 'Score each document both ways. Because the vectors have length 1, the dot product is the cosine.' },
          ] },
        { type: 'p', text: 'Keyword search scores **0** for every document: it cannot tell which one is right. Semantic search gives the password article **0.99** and the others about **0.14**, a clear winner. That is the whole promise of semantic search in one table.' },
      ],
    },
    {
      id: 'ann-at-scale',
      title: 'Approximate nearest neighbour for speed at scale',
      blocks: [
        { type: 'p', text: 'Comparing the query with every stored vector (brute force) is exact but slow: 10 million vectors × 768 numbers is about 7.7 billion multiply-adds for one query. Vector databases therefore use **Approximate Nearest Neighbour (ANN)** indexes such as HNSW (a layered graph) or IVF (search only the nearest clusters). They look at a tiny fraction of the data and still return almost exactly the true top results; the share of true neighbours found is called **recall**.' },
        { type: 'viz', name: 'ann-search', caption: 'Brute force vs an IVF index. Increase nprobe to search more clusters: recall rises, and so does work.' },
        { type: 'p', text: 'For a few thousand documents, brute force is fine. ANN matters when we have millions of chunks or many queries per second. The next two lessons go deeper into ANN and into combining keyword and semantic search.' },
      ],
    },
    {
      id: 'compare-and-real-world',
      title: 'Keyword vs semantic search, and semantic search in the real world',
      blocks: [
        { type: 'compare', title: 'Keyword search vs semantic search',
          options: [
            { name: 'Keyword (BM25)', summary: 'Matches the exact words in the query.', pros: ['Exact IDs, codes, names', 'Fast and cheap, no model', 'Easy to explain why a result matched'], cons: ['Misses synonyms and paraphrases', 'No cross-language matching'], bestFor: 'Part numbers, error codes, legal terms, known titles' },
            { name: 'Semantic (embeddings)', summary: 'Matches the meaning of the query.', pros: ['Handles paraphrase and synonyms', 'Works across languages with multilingual models', 'Great for natural questions'], cons: ['Can miss exact rare terms', 'Needs an embedding model and vector index', 'Harder to explain'], bestFor: 'Natural-language questions, FAQs, RAG' },
          ],
          rows: [
            ['"I forgot my login"', 'No match', 'Finds "reset password"'],
            ['"error E1042"', 'Exact hit', 'May return generic error docs'],
            ['Infrastructure', 'Inverted index', 'Embedding model + vector DB'],
          ],
          verdict: 'Each covers the other\'s blind spot. Many production systems combine them: that is hybrid search, the next lesson.' },
        { type: 'callout', tone: 'example', title: 'Where semantic search is used', text: '**RAG chatbots** use it to fetch passages for the LLM. **Help centres and e-commerce** use it so shoppers find products described in their own words. **Enterprise search** finds internal documents across teams that use different jargon. **Code search** finds functions by describing what they do. **Recommendations** find "more like this" content.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes and limits', text: 'Embedding the query and documents with **different models**. Embedding whole long documents as one vector, which blurs many topics together (chunk them). Trusting semantic search for **exact identifiers** like order numbers. Never evaluating: build a small set of real queries with known correct answers and measure how often the right document is in the top 5. Also remember that "similar" is not "correct": a document can be on-topic yet outdated or wrong.' },
        { type: 'check', question: 'A user searches for "SKU 88-4410-B" and semantic search returns three general articles about product codes, but not the product itself. Why, and what would fix it?', answer: 'Embeddings capture general meaning, so a rare code may embed close to generic "product code" text rather than to the exact item. Keyword search (or a hybrid of keyword and semantic) matches the exact string and would find the product.' },
      ],
    },
  ],
  quiz: [
    { q: 'What makes semantic search different from keyword search?', options: ['It searches only document titles and headings, never the main body text', 'It ranks by similarity of meaning using embeddings, not shared words', 'It requires the query to contain exact phrases from the document', 'It needs no index at all because it reads every document live'], answer: 1, explain: 'Semantic search compares embedding vectors, so documents with the same meaning but different words can match. It still uses an index (a vector index).' },
    { q: 'Our help-centre bot finds "refund policy" for "how do I get a refund" but fails for "can I get my money back". Which change most directly fixes this?', options: ['Add more stop words to the keyword index', 'Switch to semantic (or hybrid) search', 'Raise BM25\'s k1 parameter to reward repeats', 'Shorten the refund article to one paragraph'], answer: 1, explain: 'The failing query is a paraphrase with no shared key words. Only meaning-based matching (alone or combined with keywords) handles that.' },
    { q: 'q = [1, 0] and d = [0.6, 0.8]. What is their cosine similarity?', options: ['0.6', '0.8', '1.4', '0.48'], answer: 0, explain: 'q · d = 1·0.6 + 0·0.8 = 0.6. Both vectors have length 1, so the cosine is 0.6 / (1·1) = 0.6.' },
    { q: 'Which statement about the two phases of semantic search is correct?', options: ['Documents are embedded on every query; the query is embedded once at startup', 'Only the query is embedded; the documents are matched by their keywords', 'Documents and queries may use different embedding models without harm', 'Documents are embedded at indexing time; each query at search time, same model'], answer: 3, explain: 'Indexing embeds documents once (and on updates); querying embeds the query each time. Both must use the same model.' },
    { q: 'A teammate says: "Semantic search is strictly better than keyword search, so we can delete our keyword index." Why is this a mistake?', options: ['Semantic search is always slower than any keyword search', 'Semantic search cannot handle questions over ten words long', 'Semantic search can miss exact codes and IDs that BM25 finds', 'Keyword search understands synonyms better than embeddings'], answer: 2, explain: 'Embeddings generalise meaning and can blur exact strings. Keyword search remains the most reliable way to match codes, names and IDs, which is why hybrid search is popular.' },
  ],
  takeaways: [
    'Keyword search matches spelling; it fails on synonyms, paraphrases and other languages.',
    'Semantic search embeds queries and documents into vectors so that similar meanings sit close together.',
    'Closeness is usually measured with cosine similarity; with unit vectors it equals the dot product.',
    'Documents are embedded and stored in a vector database ahead of time; each query is embedded and matched at search time.',
    'ANN indexes keep semantic search fast at scale, and combining it with keyword search covers exact terms.',
  ],
  terms: [
    { term: 'Keyword search', def: 'Search that matches the exact words of the query, usually ranked with BM25.' },
    { term: 'Inverted index', def: 'A map from each word to the documents that contain it.' },
    { term: 'Semantic search', def: 'Search that ranks results by similarity of meaning using embeddings.' },
    { term: 'Embedding', def: 'A fixed-length vector a model produces so similar meanings get nearby vectors.' },
    { term: 'Cosine similarity', def: 'The cosine of the angle between two vectors; 1 means the same direction.' },
    { term: 'Vector database', def: 'A store for vectors and metadata that answers nearest-neighbour queries fast.' },
  ],
};
