export default {
  id: 'how-does-a-vector-database-work',
  minutes: 22,
  hook: 'How does a database find "I forgot my password" when the help article is titled "Reset your login credentials" and the two share no words at all?',
  summary: 'A vector database stores embeddings (lists of numbers that capture meaning) next to the original data and answers one question very fast: which stored vectors are closest to this query vector? It measures closeness with cosine similarity, dot product or Euclidean distance, and uses approximate indexes such as HNSW, IVF and PQ so it does not have to compare the query with every vector.',
  sections: [
    {
      id: 'what-is-a-vector-database',
      title: 'What is a vector database?',
      blocks: [
        { type: 'p', text: 'Imagine we run a support chatbot for an online shop. We have 200,000 help articles, past tickets and product pages. A customer types: *"I forgot my password"*. The best article is titled *"Reset your login credentials"*. A normal text search looks for shared words and finds nothing useful, because the two sentences share no important word. Yet any human sees at once that they mean the same thing.' },
        { type: 'p', text: 'A **vector database** solves exactly this. It is a database built to store **vectors** (lists of numbers) and to answer one kind of question very quickly: *"Which stored vectors are most similar to this new vector?"* If the vectors capture the *meaning* of text, images or audio, then "most similar vector" means "most similar meaning". That is the engine behind semantic search, recommendation and Retrieval-Augmented Generation (RAG), where an LLM is given relevant documents before it answers.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a library arranged by topic, not by title', text: 'A normal database is like a library sorted alphabetically by title: great if you know the exact title, useless if you only know what the book is *about*. A vector database is like a library where every book sits on a giant map, and books about similar things sit near each other. To find something, you walk to the spot on the map that matches your question and look at the books around you.' },
        { type: 'p', text: 'Popular examples include dedicated systems such as Pinecone, Weaviate, Milvus, Qdrant and Chroma, and vector features added to existing databases, such as the `pgvector` extension for PostgreSQL and vector search in Elasticsearch, OpenSearch and Redis. Libraries such as FAISS (from Meta) provide the core search algorithms without the database parts. Feature sets change quickly, so always check the current docs of the one you pick.' },
      ],
    },
    {
      id: 'embeddings-recap',
      title: 'A quick recap of embeddings',
      blocks: [
        { type: 'p', text: 'An **embedding** is a list of numbers that an **embedding model** (a neural network trained for this job) produces from a piece of data. Typical text embeddings have a few hundred to a few thousand numbers; 384, 768, 1024 and 1536 are common sizes. Each list is a point in a high-dimensional space. The model is trained so that inputs with similar meaning land close together and unrelated inputs land far apart.' },
        { type: 'p', text: 'We cannot draw 768 dimensions, but the idea is the same in 2-D. In the map below, click a word and see that its nearest neighbours are words with related meaning. A vector database does this "find the neighbours" step for millions of points.' },
        { type: 'viz', name: 'embedding-space', caption: 'Click a word to highlight its nearest neighbours by cosine similarity. Real embeddings have hundreds of dimensions; this 2-D map shows the same idea.' },
        { type: 'list', items: [
          '"I forgot my password" might become `[0.85, 0.20, 0.05, …]`.',
          '"Reset your login credentials" might become `[0.80, 0.30, 0.10, …]`: close, because the meaning is close.',
          '"Our refund policy" might become `[0.10, 0.90, 0.20, …]`: far away, because the meaning is different.',
        ] },
        { type: 'callout', tone: 'note', title: 'One rule to remember', text: 'Vectors are only comparable if the **same embedding model** made them. A vector from model A and a vector from model B live in different spaces, so their distance means nothing. If we change models, we must re-embed the whole collection.' },
      ],
    },
    {
      id: 'why-normal-databases-fall-short',
      title: 'Why normal databases fall short',
      blocks: [
        { type: 'p', text: 'A relational database such as PostgreSQL or MySQL is brilliant at **exact** questions: `WHERE user_id = 42`, `WHERE price < 20`, `WHERE title LIKE \'%password%\'`. Its indexes (B-trees and hash indexes) work because values can be sorted or matched exactly. Sorting lets the database jump straight to the right place instead of reading every row.' },
        { type: 'p', text: 'Vectors break this. There is no useful way to sort 768-number lists in one line so that "similar" vectors end up next to each other. The question we ask is also different: not "equal to X" but "closest to X", and closeness depends on all 768 numbers at once. A B-tree cannot answer that. Without a special index, the only option is to compute the distance from the query to **every** stored vector, which we will see is too slow at scale.' },
        { type: 'compare', title: 'Traditional database vs vector database',
          options: [
            { name: 'Relational / keyword DB', summary: 'Stores rows; finds exact matches and ranges.', pros: ['Exact filters and joins', 'Transactions, mature tooling', 'Finds exact IDs and codes'], cons: ['No notion of "similar meaning"', 'Keyword search misses synonyms'], bestFor: 'Orders, users, inventory, exact lookups' },
            { name: 'Vector database', summary: 'Stores embeddings; finds nearest neighbours by similarity.', pros: ['Finds similar meaning', 'Works for text, images, audio', 'Fast top-k search over millions of vectors'], cons: ['Results are approximate', 'Needs an embedding model', 'Extra memory for indexes'], bestFor: 'Semantic search, RAG, recommendations' },
          ],
          rows: [
            ['Typical query', '`WHERE id = 42`', '"10 vectors nearest to q"'],
            ['Index type', 'B-tree, hash', 'HNSW, IVF, PQ'],
            ['Answer is', 'Exact', 'Usually approximate (very close to exact)'],
          ],
          verdict: 'They are partners, not rivals. Many real systems keep business data in a relational DB and embeddings in a vector index (sometimes the same product, e.g. PostgreSQL with pgvector).' },
      ],
    },
    {
      id: 'what-it-stores',
      title: 'What a vector database actually stores',
      blocks: [
        { type: 'p', text: 'Each record in a vector database usually has three parts:' },
        { type: 'list', items: [
          '**An ID**, such as `doc-1832#chunk-4`, so we can find, update or delete the record.',
          '**The vector**, e.g. 768 floating-point numbers from the embedding model.',
          '**Metadata (the payload)**: the original text or a link to it, plus fields such as language, source, date, customer tier or access rights.',
        ] },
        { type: 'p', text: 'Metadata matters more than beginners expect. It lets us **filter**: "find the nearest vectors, but only English articles updated in 2026 that this user may see". Vector databases support this as **filtered search**. Some apply the filter before the search (pre-filtering), some after (post-filtering, which can return fewer than k results if most neighbours are filtered out), and good engines blend the filter into the index walk itself. The details differ between products.' },
        { type: 'p', text: 'Around this sit normal database features: inserting and deleting records, persistence to disk, replication, sharding across machines, and access control. These are what separate a vector *database* from a vector *library* like FAISS, which gives us fast search but leaves storage and updates to us.' },
      ],
    },
    {
      id: 'measuring-similarity',
      title: 'How do we measure similarity?',
      blocks: [
        { type: 'p', text: 'To say "closest", we need a number for how close two vectors are. Three measures dominate. Let us use two small vectors: `a = [3, 4]` and `b = [4, 3]`.' },
        { type: 'formula', expr: 'cos(a, b) = (a · b) / (‖a‖ ‖b‖)', where: [['a · b', 'dot product: multiply matching numbers and add, 3·4 + 4·3 = 24'], ['‖a‖', 'length of a: √(3² + 4²) = 5'], ['result', '24 / (5 · 5) = 0.96']], caption: '**Cosine similarity** looks only at the angle between vectors. 1 = same direction, 0 = unrelated (at right angles), −1 = opposite. Length does not matter.' },
        { type: 'formula', expr: 'a · b = ∑ aᵢ bᵢ', where: [['aᵢ bᵢ', 'product of the i-th numbers'], ['example', '3·4 + 4·3 = 24']], caption: '**Dot product** mixes angle and length: a longer vector gets a bigger score even at the same angle. Higher = more similar.' },
        { type: 'formula', expr: 'd(a, b) = √∑ (aᵢ − bᵢ)²', where: [['aᵢ − bᵢ', 'difference in each dimension'], ['example', '√((3−4)² + (4−3)²) = √2 ≈ 1.41']], caption: '**Euclidean (L2) distance** is the straight-line distance between the points. Lower = more similar.' },
        { type: 'viz', name: 'vector-similarity', caption: 'Drag the angle and lengths of two vectors. Watch cosine stay fixed when only length changes, while dot product and Euclidean distance move.' },
        { type: 'p', text: 'Which should we use? Use the measure the embedding model was **trained** with; its documentation says. A handy fact: if every vector is **normalised** to length 1, then cosine similarity equals the dot product, and Euclidean distance ranks results in exactly the same order (because `‖a − b‖² = 2 − 2·cos(a, b)` for unit vectors). That is why many systems normalise once at insert time and then use the cheap dot product.' },
        { type: 'check', question: 'Two vectors point in exactly the same direction, but one is twice as long. What is their cosine similarity, and is their Euclidean distance zero?', answer: 'Cosine similarity is exactly 1, because cosine only looks at direction. Euclidean distance is not zero: the points are at different places along the same line. That is why the choice of metric matters for vectors that are not normalised.' },
      ],
    },
    {
      id: 'nearest-neighbour-problem',
      title: 'The nearest neighbour problem and why brute force is too slow',
      blocks: [
        { type: 'p', text: 'The core task has a name: **k-nearest neighbour (k-NN) search**. Given a query vector `q` and a collection of N vectors, return the k vectors closest to `q`. The obvious way is **brute force** (also called flat or exhaustive search): compute the distance from `q` to every vector, then keep the best k. It is always exactly right.' },
        { type: 'p', text: 'Now count the work. One distance between 768-number vectors needs about 768 multiplications and 768 additions. With N = 10 million vectors that is about 7.7 billion multiply-adds *for one query*, plus reading about 30 GB of float32 numbers from memory (10M × 768 × 4 bytes). With hundreds of queries per second, that cost does not fit a fast, cheap service. Brute force grows linearly: 10× more data means 10× more work per query.' },
        { type: 'chart', kind: 'bar', title: 'Distance computations per query (brute force vs a typical ANN index)', yLabel: 'Computations', labels: ['10K vectors', '1M vectors', '100M vectors'], series: [ { name: 'Brute force', values: [10000, 1000000, 100000000] }, { name: 'ANN index (illustrative)', values: [600, 3000, 15000] } ], caption: 'Brute-force numbers are exact (one per stored vector). ANN numbers are illustrative: the real count depends on index type and settings, but it grows far more slowly than N.' },
        { type: 'callout', tone: 'tip', title: 'Brute force is not always wrong', text: 'For a few thousand to maybe a hundred thousand vectors, brute force with a fast matrix multiply is often quick enough, gives perfect results, and needs no index tuning. Many libraries call this a "flat" index. Reach for ANN when data or traffic grows.' },
      ],
    },
    {
      id: 'ann-and-indexing',
      title: 'Approximate Nearest Neighbour (ANN) and indexing',
      blocks: [
        { type: 'p', text: '**Approximate Nearest Neighbour (ANN)** search gives up a tiny bit of accuracy for a huge gain in speed. Instead of guaranteeing the true top-k, it returns results that are *almost always* the true top-k, while looking at only a small fraction of the data. Quality is measured with **recall@k**: of the true k nearest neighbours, what fraction did the index return? A recall@10 of 0.95 means on average 9.5 of the true top 10 were found.' },
        { type: 'p', text: 'To do this, the database builds an **index**: an extra data structure, built when data is inserted, that lets a query skip most vectors. Three ideas cover most production systems: HNSW (a graph), IVF (clusters) and PQ (compression). They are often combined, for example IVF-PQ.' },
        { type: 'viz', name: 'ann-search', caption: 'Compare brute force with an IVF index. Raise nprobe (how many clusters are searched) and watch distance computations and recall go up together.' },
      ],
    },
    {
      id: 'hnsw-ivf-pq',
      title: 'HNSW, IVF and PQ explained simply',
      blocks: [
        { type: 'p', text: '**HNSW (Hierarchical Navigable Small World)** builds a graph: each vector is a node linked to some of its near neighbours. It stacks several layers. The top layer has few nodes with long links (like motorways); lower layers have more nodes with shorter links (like local streets); the bottom layer has every node. A search starts at the top, greedily hops to whichever neighbour is closest to the query, drops a layer when it cannot improve, and repeats until the bottom, where it explores a small candidate list. HNSW was described by Malkov and Yashunin (2016) and is the default index in many vector databases because it is fast with high recall. Its costs: extra memory for the links, and slower inserts.' },
        { type: 'p', text: '**IVF (Inverted File index)** first groups all vectors into, say, 1,000 clusters with k-means. Each cluster has a centre (centroid) and a list of its members (the "inverted list"). At query time we compare the query with the 1,000 centroids, pick the closest few clusters (the `nprobe` setting), and search only inside them. With nprobe = 10 we search about 1% of the data. The risk: a true neighbour sitting just across a cluster border is missed, which is why raising nprobe raises recall.' },
        { type: 'p', text: '**PQ (Product Quantization)** attacks memory rather than search order. It cuts each vector into, say, 96 sub-vectors of 8 numbers, and for each slot learns 256 typical patterns (a codebook). Each sub-vector is replaced by the 1-byte ID of its closest pattern. A 768-float vector (3,072 bytes) becomes 96 bytes, a 32× saving. Distances are then estimated from small lookup tables. PQ was introduced by Jégou, Douze and Schmid (2011). The price is some precision, so systems often re-check the top candidates with the full vectors.' },
        { type: 'steps', title: 'What happens when a query arrives', items: [
          { title: 'Embed the query', text: 'The same embedding model that built the collection turns "I forgot my password" into a vector q.' },
          { title: 'Apply filters', text: 'Metadata conditions (language = en, tenant = acme) narrow which records may be returned.' },
          { title: 'Walk the index', text: 'HNSW hops through the graph, or IVF picks the nearest clusters, so only a small set of candidates is examined.' },
          { title: 'Score candidates', text: 'Each candidate gets a similarity score (cosine, dot or L2), possibly estimated from PQ codes.' },
          { title: 'Return top-k', text: 'The k best IDs, scores and payloads go back to the app, e.g. to feed an LLM in a RAG pipeline.' },
        ] },
        { type: 'table', caption: 'The three index ideas side by side (behaviour in general; exact numbers depend on settings).', head: ['Index', 'Core idea', 'Main strength', 'Main cost'], rows: [
          ['HNSW', 'Layered graph of neighbours', 'Very fast, high recall', 'Memory for links; slower inserts'],
          ['IVF', 'Search only the nearest clusters', 'Simple, tunable with nprobe', 'Misses neighbours near cluster borders'],
          ['PQ', 'Compress vectors into short codes', 'Big memory savings', 'Approximate distances, lower precision'],
        ] },
        { type: 'check', question: 'An IVF index has 1,000 clusters of roughly equal size, and we set nprobe = 20. Roughly what fraction of the stored vectors does each query compare against in detail?', answer: 'About 20 / 1,000 = 2% of the vectors (plus 1,000 cheap comparisons against the centroids). That is the source of the speed-up, and also why some true neighbours in unsearched clusters can be missed.' },
      ],
    },
    {
      id: 'code-example',
      title: 'A small code example',
      blocks: [
        { type: 'p', text: 'Here is a toy vector store in about 35 lines of numpy. It keeps IDs, text, metadata and vectors; scores with any of the three metrics; and supports a metadata filter. It uses brute force, which is exactly what a "flat" index does. The 3-number vectors are hand-made stand-ins for real embeddings.' },
        { type: 'code', lang: 'python', title: 'tiny_vector_db.py', code: `import numpy as np

# A tiny "vector database": id -> (text, metadata, embedding)
# The 3-number embeddings are hand-made stand-ins for real 768-number ones.
store = {
    "d1": ("How to reset your password", {"lang": "en"}, [0.9, 0.1, 0.0]),
    "d2": ("Change your login credentials", {"lang": "en"}, [0.8, 0.3, 0.1]),
    "d3": ("Our refund policy for orders", {"lang": "en"}, [0.1, 0.9, 0.2]),
    "d4": ("Restablecer la contrasena", {"lang": "es"}, [0.9, 0.2, 0.1]),
    "d5": ("Track the shipping of an order", {"lang": "en"}, [0.0, 0.6, 0.8]),
}
ids = list(store)
M = np.array([store[i][2] for i in ids], dtype=float)   # one row per vector

def search(q, k=2, metric="cosine", where=None):
    q = np.array(q, dtype=float)
    if metric == "cosine":
        s = (M @ q) / (np.linalg.norm(M, axis=1) * np.linalg.norm(q))
    elif metric == "dot":
        s = M @ q
    else:                                   # euclidean: smaller = closer
        s = -np.linalg.norm(M - q, axis=1)  # negate so bigger = better
    hits = []
    for i in np.argsort(-s):                # brute force: score every row
        meta = store[ids[i]][1]
        if where and any(meta.get(f) != v for f, v in where.items()):
            continue                        # metadata filter
        score = -s[i] if metric == "euclidean" else s[i]   # show real distance
        hits.append((ids[i], store[ids[i]][0], round(float(score), 3)))
        if len(hits) == k:
            break
    return hits

query = [0.85, 0.2, 0.05]   # pretend embedding of "I forgot my password"
for metric in ["cosine", "dot", "euclidean"]:
    print(f"{metric:9}", search(query, metric=metric))
print("en only  ", search(query, where={"lang": "en"}))`, output: `cosine    [('d4', 'Restablecer la contrasena', 0.999), ('d1', 'How to reset your password', 0.991)]
dot       [('d4', 'Restablecer la contrasena', 0.81), ('d1', 'How to reset your password', 0.785)]
euclidean [('d4', 'Restablecer la contrasena', 0.071), ('d2', 'Change your login credentials', 0.122)]
en only   [('d1', 'How to reset your password', 0.991), ('d2', 'Change your login credentials', 0.99)]`,
          walkthrough: [
            { lines: [5, 13], note: 'Each record holds text, metadata and a vector. All vectors are stacked into one matrix M so we can score them in one go.' },
            { lines: [15, 22], note: 'The three metrics. Euclidean distance is negated so that "bigger is better" for all three, which keeps the sorting code the same.' },
            { lines: [23, 32], note: 'Brute force: sort every score, skip records that fail the metadata filter, and stop after k hits.' },
            { lines: [34, 37], note: 'Run the same query with each metric, and once with a filter that keeps English articles only.' },
          ] },
        { type: 'p', text: 'Read the output carefully. Cosine and dot product agree on the top two. Euclidean distance puts `d2` second instead of `d1`: these vectors are not normalised, so length changes the answer. The Spanish article `d4` wins on meaning, which is great for a multilingual model, but when the filter `lang = en` is applied it disappears and the English articles take its place. Real systems do the same thing, just with an ANN index instead of a full sort.' },
      ],
    },
    {
      id: 'real-world-and-pitfalls',
      title: 'Real-world applications and common mistakes',
      blocks: [
        { type: 'callout', tone: 'example', title: 'Where vector databases are used', text: '**RAG chatbots** fetch the most relevant document chunks for an LLM. **Semantic search** on sites and in apps finds results by meaning. **Recommendations** find products, songs or articles similar to what a user liked. **Image and audio search** find similar photos or sounds from embeddings of the media. **Deduplication and clustering** find near-duplicate tickets or records. **Anomaly detection** flags items far from all their neighbours.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Mixing vectors from **different embedding models** (or versions) in one index. Using a **metric** the model was not trained for. Forgetting that ANN results are **approximate** and never measuring recall. Relying only on vector search for **exact terms** like order numbers or error codes, where keyword search is better. Ignoring **metadata filters and access rights**, so users can retrieve documents they should not see.' },
        { type: 'p', text: 'When might we *not* need a vector database? If the data is small (a few thousand items), a numpy array or a flat index is enough. If users search for exact identifiers, a keyword index is better. If we already run PostgreSQL and the scale is moderate, an extension like pgvector may save us running a separate system. Choose the simplest tool that meets recall and latency targets.' },
      ],
    },
  ],
  quiz: [
    { q: 'What single question is a vector database built to answer quickly?', options: ['Which stored vectors are most similar to this query vector?', 'Which rows exactly match this ID, sorted by primary key?', 'Which documents contain every single keyword typed in the query?', 'Which embedding model suits this text and language best?'], answer: 0, explain: 'Its core job is nearest-neighbour search over embeddings. Exact ID and keyword matches are what relational and keyword indexes do well; choosing a model is a separate design decision.' },
    { q: 'Our support bot uses a vector DB. After switching to a new embedding model for new articles only, search quality collapses. What is the most likely cause?', options: ['The HNSW graph now has too many layers for new articles to be reached', 'Cosine similarity breaks down once articles get longer than one page', 'Old and new vectors come from different models, so distances are meaningless', 'The metadata filter now runs after the search instead of before it'], answer: 2, explain: 'Vectors are only comparable when the same model made them. Changing models means re-embedding the whole collection. The other options describe real settings, but none would break every query at once.' },
    { q: 'An IVF index has 500 equal-sized clusters over 1,000,000 vectors and nprobe = 5. About how many vectors does a query compare in detail?', options: ['5', '2,000', '10,000', '1,000,000'], answer: 2, explain: 'Each cluster holds about 1,000,000 / 500 = 2,000 vectors; searching 5 clusters means about 10,000 vectors (plus 500 cheap centroid comparisons).' },
    { q: 'Which statement correctly contrasts HNSW and PQ?', options: ['HNSW compresses vectors into short codes; PQ is a layered neighbour graph', 'HNSW is a layered neighbour graph; PQ compresses vectors into short codes', 'Both are exact methods that compare the query with every stored vector', 'PQ is used only for text embeddings and HNSW only for image embeddings'], answer: 1, explain: 'HNSW speeds up search by hopping through a graph. PQ shrinks memory by replacing sub-vectors with codebook IDs. They solve different problems and are often combined with other indexes.' },
    { q: 'A teammate says: "ANN search is approximate, so its results are basically random and we should always use brute force." What is wrong with this?', options: ['Nothing; brute force is the better choice whatever the size of the data', 'ANN is really exact; the word "approximate" is only a marketing label', 'Brute force is less accurate than ANN, so the teammate has it backwards', 'ANN usually reaches high recall, while brute force gets too slow at scale'], answer: 3, explain: 'Well-tuned ANN indexes reach high recall (for example 0.95+) while checking a tiny fraction of the data. Brute force is exact, but its cost grows linearly with the number of vectors.' },
  ],
  takeaways: [
    'A vector database stores embeddings plus IDs and metadata, and finds the nearest vectors to a query fast.',
    'Similarity is measured with cosine similarity, dot product or Euclidean distance; for unit vectors they rank results the same way.',
    'Brute force is exact but costs one distance per stored vector, so it does not scale to millions of vectors and high traffic.',
    'ANN indexes trade a little recall for big speed: HNSW (graph), IVF (clusters) and PQ (compression).',
    'Always use one embedding model per index, use its intended metric, and combine vector search with metadata filters.',
  ],
  terms: [
    { term: 'Vector database', def: 'A database that stores vectors with metadata and answers nearest-neighbour queries quickly.' },
    { term: 'Embedding', def: 'A list of numbers produced by a model so that similar inputs get nearby vectors.' },
    { term: 'Cosine similarity', def: 'The cosine of the angle between two vectors; 1 means same direction, length is ignored.' },
    { term: 'k-NN search', def: 'Finding the k stored vectors closest to a query vector.' },
    { term: 'ANN', def: 'Approximate nearest neighbour search: very fast search that returns almost always the true nearest neighbours.' },
    { term: 'Recall@k', def: 'The fraction of the true top-k neighbours that the search actually returned.' },
    { term: 'HNSW', def: 'A layered graph index that finds neighbours by greedy hops from coarse to fine layers.' },
    { term: 'Product Quantization', def: 'A compression method that replaces sub-vectors with short codebook IDs to save memory.' },
  ],
};
