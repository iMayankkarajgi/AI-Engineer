export default {
  id: 'how-does-approximate-nearest-neighbor-ann-search-work',
  minutes: 27,
  hook: 'How can a search engine find the 10 most similar items among a billion vectors in a few milliseconds, without looking at almost any of them?',
  summary: 'Nearest neighbour search finds the stored vectors closest to a query. Doing it exactly means comparing against every vector, which is too slow at scale, so Approximate Nearest Neighbor (ANN) search uses an index to look at only a small, promising part of the data. Four families do this: trees (KD-tree), hashing (LSH), clustering (IVF) and graphs (HNSW), each trading a little accuracy (recall) for a lot of speed.',
  sections: [
    {
      id: 'what-is-nn-search',
      title: 'What is nearest neighbor search?',
      blocks: [
        { type: 'p', text: '**Nearest neighbor search** is a simple question: given a point, which stored points are closest to it? When we ask for the k closest, it is called **k-nearest neighbor (k-NN) search**. It powers "find similar" everywhere: similar products, similar songs, similar photos, and the retrieval step of RAG, where we fetch the text chunks most related to a user\'s question.' },
        { type: 'p', text: 'Our running example: a music app with 50 million songs. Each song is described by a vector, and a listener has just played a song. We want the 10 songs that "sound most like it" in under 20 milliseconds, for thousands of listeners at once.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like finding a friend in a stadium', text: 'Checking every seat in a stadium for your friend is exact but slow. If you know they are in the north stand, row 20-something, you check a tiny area and almost always find them. ANN search is that "check the likely area" trick, done for points in space.' },
      ],
    },
    {
      id: 'vectors-and-closeness',
      title: 'Turning things into numbers and measuring closeness',
      blocks: [
        { type: 'p', text: 'Computers cannot compare "songs" or "sentences" directly, so we turn each item into a **vector**, a list of numbers. Modern systems use an **embedding model**, a neural network trained so that similar items get nearby vectors. A song might become 128 numbers, a sentence 768 numbers. Each item is now a point in a space with that many dimensions.' },
        { type: 'p', text: '"Closeness" needs a formula. The three common ones are **Euclidean distance** (straight-line distance, smaller is closer), **cosine similarity** (the angle between vectors, 1 is identical direction) and the **dot product** (angle and length together, bigger is closer). For vectors scaled to length 1, all three put results in the same order, so the choice mostly follows what the embedding model was trained with.' },
        { type: 'formula', expr: 'd(q, x) = √∑ᵢ (qᵢ − xᵢ)²', where: [['q', 'the query vector'], ['x', 'a stored vector'], ['i', 'runs over every dimension, e.g. 1…768']], caption: 'Euclidean distance. Each distance costs about one multiply-add per dimension.' },
      ],
    },
    {
      id: 'naive-approach',
      title: 'The naive approach and why it fails',
      blocks: [
        { type: 'p', text: 'The naive (brute force) way computes the distance from the query to every stored vector, then sorts and keeps the top k. It is perfectly accurate and easy to write. The problem is cost. With N vectors of d dimensions, one query does about **N × d** multiply-adds. For our 50 million songs with d = 128 that is 6.4 billion operations per query, and it also has to stream about 25 GB of float32 numbers through memory. Multiply by thousands of queries per second and it is far too slow and expensive.' },
        { type: 'p', text: 'Why not just sort the data cleverly, as databases do for numbers? In 1 or 2 dimensions that works. In hundreds of dimensions we hit the **curse of dimensionality**: space is so vast that points tend to be roughly equally far from each other, and tricks that cut the search space in low dimensions stop pruning much. Exact methods end up checking most of the data anyway. This is the reason approximate methods exist.' },
        { type: 'check', question: 'If we double the number of stored vectors, how does the cost of brute-force search per query change?', answer: 'It roughly doubles. Brute force does one distance computation per stored vector, so cost grows linearly with N. ANN indexes grow much more slowly, which is why they matter at scale.' },
      ],
    },
    {
      id: 'what-is-ann',
      title: 'What is ANN search, and the speed vs accuracy trade-off',
      blocks: [
        { type: 'p', text: '**Approximate Nearest Neighbor (ANN) search** returns neighbours that are *very likely* the true nearest ones, while examining only a small part of the data. It does this with an **index**, a structure built ahead of time that tells the search where to look. The word "approximate" means the result might occasionally miss a true neighbour or include the 11th-best instead of the 10th.' },
        { type: 'p', text: 'We measure how good it is with **recall@k**: the share of the true top-k that the ANN search returned. If the true top 10 contains songs A to J and ANN returns 9 of them plus one other song, recall@10 = 0.9. Every ANN method has knobs that trade speed for recall: search more and recall goes up, but so does latency. In practice teams pick a target such as "recall@10 ≥ 0.95 at under 10 ms".' },
        { type: 'chart', kind: 'line', title: 'Recall@10 vs work per query (IVF, measured in the code below)', xLabel: 'Distance computations per query', yLabel: 'Recall@10', series: [ { name: 'IVF (nprobe 1, 2, 5, 10)', points: [[338, 0.74], [570, 0.94], [1203, 1.0], [2081, 1.0]] }, { name: 'Brute force', points: [[10000, 1.0], [10000, 1.0]] } ], caption: 'Real numbers from our 10,000-vector toy run. Recall climbs fast as we search a few more clusters; brute force needs 10,000 computations for perfect recall.' },
        { type: 'callout', tone: 'note', title: 'Why "almost right" is good enough', text: 'Embeddings are themselves approximate: the 11th nearest song is usually just as good a suggestion as the 10th. Losing a tiny bit of recall rarely changes what a user sees, while a 10–100× speed-up changes what we can afford to build.' },
      ],
    },
    {
      id: 'trees-and-hashing',
      title: 'Approach 1 and 2: trees (KD-tree) and hashing (LSH)',
      blocks: [
        { type: 'p', text: '**KD-tree** (k-dimensional tree, Bentley, 1975) splits space with cuts along one dimension at a time. The root cuts on dimension 1 at the median value, its children cut on dimension 2, and so on, giving a binary tree of boxes. A search walks down to the box holding the query, checks those points, then backtracks into neighbouring boxes only if they could contain something closer. In 2 to roughly 20 dimensions this skips most of the data. In hundreds of dimensions the backtracking explodes and it behaves almost like brute force, so KD-trees are rare for modern embeddings (they remain great for maps and 3-D geometry).' },
        { type: 'p', text: '**LSH (Locality-Sensitive Hashing)** uses hash functions designed so that *nearby* vectors are *likely* to get the same hash, the opposite of normal hashing, which scatters similar inputs. A classic version for cosine similarity draws random hyperplanes: each plane gives one bit (which side is the vector on?), and, say, 16 planes give a 16-bit bucket ID. Similar vectors fall on the same side of most planes, so they often share a bucket. At query time we only check vectors in the query\'s bucket. Using several independent hash tables raises the chance of catching true neighbours. LSH has strong theory behind it, but in practice it often needs many tables (lots of memory) to reach high recall, so graph and cluster methods usually win on dense embeddings.' },
        { type: 'p', text: 'Tiny LSH example with 2 planes: vector `[0.9, 0.2]` is on the + side of plane 1 and the + side of plane 2, so its bucket is `11`. Vector `[0.8, 0.3]` gets `11` too. Vector `[−0.5, 0.9]` gets `01`. A query near the first two lands in bucket `11` and never looks at the third.' },
      ],
    },
    {
      id: 'ivf-and-hnsw',
      title: 'Approach 3 and 4: clustering (IVF) and graphs (HNSW)',
      blocks: [
        { type: 'p', text: '**IVF (Inverted File index)** groups vectors into clusters with k-means. Each cluster has a centroid and an "inverted list" of its members, like the index at the back of a book that maps each word to its pages. To search, we compare the query with all centroids, pick the `nprobe` nearest clusters and run brute force only inside them. With 1,000 clusters and nprobe = 10 we touch about 1% of the data. Neighbours sitting just across a cluster border are the ones we can miss.' },
        { type: 'viz', name: 'ann-search', caption: 'Switch between brute force and IVF and move the nprobe slider. Watch the number of distance computations and the recall change together.' },
        { type: 'p', text: '**HNSW (Hierarchical Navigable Small World)** is a graph method (Malkov and Yashunin, 2016). Every vector is a node linked to a handful of near neighbours. Nodes also appear on higher layers with decreasing probability, so the top layer is a sparse "express" network and the bottom layer contains everyone. Search starts at an entry point on the top layer and greedily moves to whichever neighbour is closer to the query. When no neighbour is closer, it drops one layer and continues. On the bottom layer it keeps a small list of the best candidates (size set by a parameter often called `ef`) and returns the top k. It is the default in many vector databases because it gives high recall at low latency, at the cost of extra memory for the links.' },
        { type: 'steps', title: 'An HNSW search, step by step', items: [
          { title: 'Enter at the top', text: 'Start at a fixed entry node on the highest, sparsest layer.' },
          { title: 'Greedy hop', text: 'Look at the current node\'s neighbours and move to the one closest to the query. Repeat while it improves.' },
          { title: 'Drop a layer', text: 'When no neighbour is closer, go down one layer, starting from the same node, where links are shorter and denser.' },
          { title: 'Widen the search at the bottom', text: 'On layer 0 keep a candidate list of size ef and explore neighbours of the best candidates.' },
          { title: 'Return top-k', text: 'Return the k closest candidates found. A bigger ef means higher recall but slower queries.' },
        ] },
        { type: 'flow', title: 'From coarse to fine in HNSW', nodes: [
          { label: 'Layer 2', detail: 'A few nodes with long links: we cross the whole space in a couple of hops.' },
          { label: 'Layer 1', detail: 'More nodes, shorter links: we refine the region.' },
          { label: 'Layer 0', detail: 'Every vector, short links to close neighbours: we search the neighbourhood carefully.' },
          { label: 'Top-k', detail: 'The best candidates from the bottom layer are returned to the caller.' },
        ] },
      ],
    },
    {
      id: 'code-example',
      title: 'A simple code example',
      blocks: [
        { type: 'p', text: 'Let us build an IVF index from scratch with numpy and measure it against brute force on 10,000 vectors with 32 dimensions. The data has 20 natural groups, like real embeddings, which tend to form topical clusters.' },
        { type: 'code', lang: 'python', title: 'ivf_from_scratch.py', code: `import numpy as np

rng = np.random.default_rng(0)
# 20 "topics" so the data has real clusters, like real embeddings do
centers = rng.normal(size=(20, 32))
X = np.vstack([c + 0.4 * rng.normal(size=(500, 32)) for c in centers])  # 10,000 vectors
Q = X[rng.choice(len(X), 50, replace=False)] + 0.3 * rng.normal(size=(50, 32))
k = 10

# --- Exact (brute force): compare the query with every vector ---
def exact(q):
    return np.argsort(((X - q) ** 2).sum(1))[:k]

# --- IVF: split the space into nlist cells with a few rounds of k-means ---
nlist = 50
C = X[rng.choice(len(X), nlist, replace=False)]
for _ in range(10):
    assign = np.argmin(((X[:, None, :] - C[None]) ** 2).sum(2), axis=1)
    C = np.array([X[assign == j].mean(0) if (assign == j).any() else C[j] for j in range(nlist)])
lists = [np.where(assign == j)[0] for j in range(nlist)]   # inverted lists

def ivf(q, nprobe):
    near_cells = np.argsort(((C - q) ** 2).sum(1))[:nprobe]
    cand = np.concatenate([lists[j] for j in near_cells])
    best = cand[np.argsort(((X[cand] - q) ** 2).sum(1))[:k]]
    return best, nlist + len(cand)          # distance computations done

print(f"brute force: {len(X)} distance computations per query, recall@10 = 1.00")
for nprobe in [1, 2, 5, 10]:
    rec, work = [], []
    for q in Q:
        got, n = ivf(q, nprobe)
        rec.append(len(set(got) & set(exact(q))) / k)
        work.append(n)
    print(f"IVF nprobe={nprobe:2}: {np.mean(work):7.0f} computations, recall@10 = {np.mean(rec):.2f}")`, output: `brute force: 10000 distance computations per query, recall@10 = 1.00
IVF nprobe= 1:     338 computations, recall@10 = 0.74
IVF nprobe= 2:     570 computations, recall@10 = 0.94
IVF nprobe= 5:    1203 computations, recall@10 = 1.00
IVF nprobe=10:    2081 computations, recall@10 = 1.00`,
          walkthrough: [
            { lines: [3, 8], note: 'Make 10,000 clustered vectors and 50 queries that sit near real data points. Fixed seed, so the run is repeatable.' },
            { lines: [10, 12], note: 'The exact baseline: distance to every vector, then the 10 smallest. This is our "truth" for recall.' },
            { lines: [14, 20], note: 'Build IVF: 10 rounds of k-means to place 50 centroids, then store which vectors belong to each centroid (the inverted lists).' },
            { lines: [22, 26], note: 'Search: find the nprobe nearest centroids, gather their members, brute-force only those. We count centroid checks plus candidate checks as the work done.' },
            { lines: [28, 35], note: 'For several nprobe values, average recall@10 and work over the 50 queries.' },
          ] },
        { type: 'p', text: 'With nprobe = 2, IVF finds 94% of the true top-10 while doing about 570 computations instead of 10,000, roughly 17× less work. With nprobe = 5 it matches brute force on this easy data at about one eighth of the work. Real embedding data is less neatly clustered, so in practice we need a higher nprobe for the same recall; the shape of the trade-off is the same.' },
      ],
    },
    {
      id: 'where-ann-is-used',
      title: 'Where ANN search is used',
      blocks: [
        { type: 'list', items: [
          '**RAG and semantic search**: fetch the passages closest in meaning to a question.',
          '**Recommendations**: "more like this" for songs, videos, products and news.',
          '**Image, audio and video search**: find similar photos, reverse image search, duplicate detection.',
          '**Fraud and anomaly detection**: a transaction far from all known normal patterns is suspicious.',
          '**Deduplication**: find near-identical documents or records in huge datasets before training.',
        ] },
        { type: 'p', text: 'Common tools: FAISS (a library with flat, IVF, PQ and HNSW indexes), hnswlib, Annoy (random-projection trees, from Spotify), ScaNN (from Google), and vector databases such as Milvus, Qdrant, Weaviate, Pinecone and pgvector that build on these ideas.' },
      ],
    },
    {
      id: 'picking-a-method',
      title: 'Picking the right method',
      blocks: [
        { type: 'compare', title: 'The four ANN families',
          options: [
            { name: 'KD-tree', summary: 'Recursive axis-aligned cuts.', pros: ['Exact search possible', 'Simple'], cons: ['Breaks down in high dimensions'], bestFor: 'Low-dimensional data such as maps, 3-D points' },
            { name: 'LSH', summary: 'Hash so neighbours collide.', pros: ['Theoretical guarantees', 'Easy to stream new data'], cons: ['Many tables for high recall', 'Memory hungry'], bestFor: 'Very large, streaming or near-duplicate detection' },
            { name: 'IVF (+PQ)', summary: 'Search only nearby clusters.', pros: ['Low memory, especially with PQ', 'Simple nprobe knob'], cons: ['Needs training (k-means)', 'Misses border neighbours'], bestFor: 'Huge collections where memory matters' },
            { name: 'HNSW', summary: 'Greedy walk on a layered graph.', pros: ['High recall at low latency', 'No training step'], cons: ['Extra memory for links', 'Slower to build and update'], bestFor: 'Default choice for most dense embedding search' },
          ],
          rows: [
            ['Good in 768-D?', 'No', 'OK', 'Yes', 'Yes'],
            ['Main knob', 'leaf size', 'tables, bits', 'nlist, nprobe', 'M, ef'],
          ],
          verdict: 'Start with HNSW for most workloads; move to IVF-PQ when memory becomes the bottleneck; use brute force when data is small.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Never measuring recall: always compare ANN results against brute force on a sample of queries. Tuning on toy data: real embeddings cluster less neatly. Forgetting that **filters** (e.g. only in-stock items) can starve an ANN search of results. Rebuilding IVF centroids rarely: if the data drifts, clusters stop fitting.' },
        { type: 'check', question: 'Our app has 3,000 FAQ vectors and very low traffic. Should we tune an HNSW index?', answer: 'Probably not. 3,000 vectors × 768 dims is only about 2.3 million multiply-adds per query, which a laptop does in a millisecond or so. Brute force is exact, simpler and fast enough. ANN pays off when N or traffic is large.' },
      ],
    },
    {
      id: 'worked-example-graph-walk',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: 'The HNSW section talked about a "greedy hop" and a "candidate list of size ef". Let us trace both by hand on one tiny layer of six songs, A to F. The number next to each song is its distance to the query (smaller is closer; illustrative numbers). The true nearest neighbour is **F**.' },
        { type: 'table', caption: 'A six-node graph. Links go both ways.', head: ['Song', 'Distance to query', 'Linked to'], rows: [
          ['A (entry point)', '9', 'B, D'],
          ['B', '5', 'A, C'],
          ['C', '4', 'B'],
          ['D', '6', 'A, E'],
          ['E', '2', 'D, F'],
          ['F', '1', 'E'],
        ] },
        { type: 'steps', title: 'Search with ef = 1 (pure greedy)', items: [
          { title: 'Start at A', text: 'A is at distance 9. Its neighbours are B (5) and D (6). B is closer, so we move to B.' },
          { title: 'Move to C', text: 'From B we see C (4), which is closer than B. We move to C.' },
          { title: 'Stuck', text: 'The only neighbour of C is B, which is farther away. Greedy search stops and returns C. It never saw F. C is a **local minimum**: a dead end that looks best from where we stand.' },
        ] },
        { type: 'steps', title: 'Search with ef = 3', items: [
          { title: 'Visit A', text: 'We remember its neighbours. Best three seen so far: B (5), D (6), A (9).' },
          { title: 'Expand B', text: 'B is the closest node not yet expanded. We see C (4). Best three: C (4), B (5), D (6).' },
          { title: 'Expand C', text: 'Nothing new. With ef = 1 we stopped here.' },
          { title: 'Expand D', text: 'D is still on the list of three, so it gets its turn. We see E (2). Best three: E (2), C (4), B (5).' },
          { title: 'Expand E', text: 'We see F (1). Best three: F (1), E (2), C (4). Nothing closer is left to expand, so we return F.' },
        ] },
        { type: 'p', text: 'Count the work. With ef = 1 we computed 4 distances (A, B, D, C) and got the wrong answer. With ef = 3 we computed all 6 and got the right one. On six songs that is no saving at all, but in a graph of millions the same dial decides whether we look at a few hundred nodes or a few thousand. A wider list keeps second-best paths alive, and that is where the extra recall comes from.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'The lesson coded IVF. Now we build the hashing family: a small **LSH** index with random hyperplanes. Each table turns a vector into an 8-bit bucket ID. We search only the buckets the query falls into, and we watch what adding more tables does to recall and to the work done.' },
        { type: 'code', lang: 'python', title: 'practice_lsh.py', code: `import numpy as np

rng = np.random.default_rng(1)
# 2,000 vectors in 16-D that form 10 loose groups (illustrative data)
centers = rng.normal(size=(10, 16))
X = np.vstack([c + 0.5 * rng.normal(size=(200, 16)) for c in centers])
Q = X[rng.choice(len(X), 40, replace=False)] + 0.2 * rng.normal(size=(40, 16))
k = 5

def cosine_top(q, rows):                      # exact search inside a set of rows
    sims = (X[rows] @ q) / (np.linalg.norm(X[rows], axis=1) * np.linalg.norm(q))
    return set(rows[np.argsort(-sims)[:k]])

def build_table(n_bits):                      # one LSH table = n_bits random planes
    planes = rng.normal(size=(n_bits, 16))
    weights = 2 ** np.arange(n_bits)
    codes = (X @ planes.T > 0) @ weights      # each vector's bucket id
    return planes, weights, codes

def lsh_search(q, tables):
    cand = np.zeros(len(X), dtype=bool)
    for planes, weights, codes in tables:     # union of the query's buckets
        cand |= codes == (planes @ q > 0) @ weights
    rows = np.where(cand)[0]
    return cosine_top(q, rows), len(rows)

all_rows = np.arange(len(X))
for n_tables in [1, 2, 4, 8]:
    tables = [build_table(8) for _ in range(n_tables)]
    rec, work = [], []
    for q in Q:
        got, n = lsh_search(q, tables)
        rec.append(len(got & cosine_top(q, all_rows)) / k)
        work.append(n)
    print(f"{n_tables} table(s): {np.mean(work):6.0f} vectors checked, recall@5 = {np.mean(rec):.2f}")`, output: `1 table(s):     31 vectors checked, recall@5 = 0.33
2 table(s):     61 vectors checked, recall@5 = 0.56
4 table(s):    132 vectors checked, recall@5 = 0.78
8 table(s):    187 vectors checked, recall@5 = 0.92`,
          walkthrough: [
            { lines: [3, 8], note: '2,000 clustered vectors and 40 queries placed near real data points. The seed is fixed so the run repeats exactly.' },
            { lines: [10, 12], note: 'Exact cosine top-5 inside a given set of rows. Called on all rows it is our ground truth; called on a bucket it is the LSH answer.' },
            { lines: [14, 18], note: 'One table: 8 random planes. Each plane gives one bit (which side is the vector on?). The 8 bits are packed into a bucket ID from 0 to 255.' },
            { lines: [20, 25], note: 'Search: hash the query in every table, collect all vectors that share a bucket with it in any table, and rank only those.' },
            { lines: [27, 35], note: 'Try 1, 2, 4 and 8 tables. Report the average number of vectors checked and recall@5 against the exact answer.' },
          ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Change `build_table(8)` to `build_table(4)`. There are now only 16 buckets per table. Predict what happens to "vectors checked" and to recall with 1 table.',
          'Change it to `build_table(12)` (4,096 buckets). Predict whether one table now finds more or fewer of the true neighbours, and why more bits make buckets "pickier".',
          'Change the query noise from `0.2` to `1.0` on line 7, so queries sit farther from the stored points. Predict whether recall with 8 tables goes up or down before you run it.',
        ] },
        { type: 'check', question: 'One table has 256 buckets for 2,000 vectors, which is about 8 vectors per bucket if they were spread evenly. Yet one table checked 31 vectors per query on average. Why?', answer: 'The data is clustered, so the buckets are far from even. Vectors in the same group fall on the same side of most planes and pile into a few crowded buckets, while many buckets stay empty. Our queries sit near stored points, so they land in the crowded buckets.' },
        { type: 'check', question: 'Going from 1 table to 8 tables raised recall@5 from 0.33 to 0.92. Besides checking more vectors, what did we pay for that?', answer: 'Memory and hashing work. Every table stores a bucket ID for every vector and its own set of planes, so 8 tables is about 8 times the index. Each query is also hashed 8 times. This is the reason LSH often needs a lot of memory to reach high recall.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does recall@10 = 0.9 mean for an ANN search?', options: ['90% of queries returned their results in under 10 ms', 'On average, 9 of the true 10 nearest neighbours were found', 'The 10th result has a cosine similarity of exactly 0.9', 'The index keeps 90% of all vectors and drops the other 10%'], answer: 1, explain: 'Recall@k compares the returned top-k with the true top-k from brute force. It measures accuracy, not speed, similarity values or storage.' },
    { q: 'Our IVF index misses some obviously similar songs. Latency has plenty of headroom. What is the most direct fix?', options: ['Lower nprobe so that fewer clusters are searched per query', 'Switch to a KD-tree, which is exact in high dimensions', 'Raise nprobe so more nearby clusters are searched', 'Delete the centroids and put vectors in random buckets'], answer: 2, explain: 'Missed neighbours often sit in clusters next to the query\'s cluster. Searching more clusters raises recall at some extra cost, which we can afford here. KD-trees do not work well in high dimensions.' },
    { q: 'In the code, nprobe = 2 did about 570 computations versus 10,000 for brute force, with recall 0.94. Roughly how much less work is that?', options: ['About 2×', 'About 17×', 'About 170×', 'About 1.06×'], answer: 1, explain: '10,000 / 570 ≈ 17.5. The 50 centroid comparisons are already included in the 570.' },
    { q: 'Why are KD-trees rarely used for 768-dimensional text embeddings, while HNSW is common?', options: ['KD-trees only support cosine similarity, not Euclidean distance', 'KD-trees cannot hold more than about one million points', 'In high dimensions their pruning fails and search nears brute force', 'HNSW is an exact method, while KD-trees are only approximate'], answer: 2, explain: 'The curse of dimensionality makes KD-tree backtracking visit most of the tree. HNSW (approximate) keeps working well in hundreds of dimensions.' },
    { q: 'A colleague says LSH works like a normal hash table: it scatters similar inputs into different buckets. What is wrong?', options: ['LSH is built so similar vectors tend to share a bucket', 'LSH does not use buckets or hash functions of any kind', 'LSH only ever finds exact duplicates, never neighbours', 'Nothing is wrong; that is exactly how LSH is designed'], answer: 0, explain: 'Locality-sensitive hashing deliberately makes collisions likely for nearby vectors, so a query only needs to check its own bucket (in each hash table).' },
  ],
  takeaways: [
    'Exact nearest neighbour search costs one distance per stored vector, which is too slow for millions of vectors and high traffic.',
    'ANN search uses an index to examine only a promising slice of the data, trading a little recall for a big speed-up.',
    'KD-trees cut space by axes (good in low dimensions), LSH hashes neighbours together, IVF searches nearby clusters, HNSW walks a layered graph.',
    'Every method has a speed vs recall knob (nprobe, ef, number of hash tables); tune it against brute-force ground truth.',
    'HNSW is the usual default; IVF-PQ when memory is tight; brute force when data is small.',
  ],
  terms: [
    { term: 'k-NN search', def: 'Finding the k stored points closest to a query point.' },
    { term: 'ANN search', def: 'Nearest neighbour search that is allowed to be slightly inexact in exchange for large speed-ups.' },
    { term: 'Recall@k', def: 'Fraction of the true top-k neighbours that a search returned.' },
    { term: 'Curse of dimensionality', def: 'In very high dimensions distances become similar and space-cutting tricks prune poorly.' },
    { term: 'LSH', def: 'Locality-sensitive hashing: hashes built so that nearby vectors tend to share a bucket.' },
    { term: 'IVF', def: 'Inverted file index: cluster vectors with k-means and search only the nprobe nearest clusters.' },
    { term: 'HNSW', def: 'Hierarchical Navigable Small World graph: greedy search on layered neighbour graphs.' },
  ],
};
