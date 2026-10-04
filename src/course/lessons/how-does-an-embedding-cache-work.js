export default {
  id: 'how-does-an-embedding-cache-work',
  minutes: 22,
  hook: 'Every night our RAG pipeline re-embeds 2 million chunks, and 98% of them have not changed since yesterday. Why are we paying for the same numbers again?',
  summary: 'An embedding cache stores the vector computed for a piece of text so the same text never has to be embedded twice. The cache key is a hash of the exact text together with the model name (and version), the value is the vector, and a lookup either hits (return the stored vector) or misses (call the model, store the result). Eviction rules such as LRU and TTL keep it bounded, and it can live in memory, on disk or in a shared store like Redis.',
  sections: [
    {
      id: 'embedding-recap',
      title: 'What is an embedding, and how do we get one?',
      blocks: [
        { type: 'p', text: 'An **embedding** is a list of numbers (a vector), for example 768 or 1,536 floating-point values, that represents the meaning of a piece of text. Texts with similar meaning get vectors that are close together. Embeddings power semantic search, RAG, clustering, deduplication and recommendations.' },
        { type: 'p', text: 'To get one, we send text to an **embedding model**: either a hosted API (we pay per token and wait for a network round trip) or a model we run ourselves on a CPU or GPU (we pay in hardware and compute time). Either way, each call takes real time (from a few milliseconds locally to tens or hundreds of milliseconds over the network) and real money or compute.' },
        { type: 'p', text: 'One property makes caching possible: for a fixed model, embedding is (for practical purposes) **deterministic**. The same text through the same model version gives the same vector. Tiny floating-point differences can occur across hardware or batch sizes, but they are far too small to matter for search. So if we have computed it once, we can reuse it.' },
      ],
    },
    {
      id: 'what-and-why',
      title: 'What is an embedding cache, and why do we need one?',
      blocks: [
        { type: 'p', text: 'An **embedding cache** is a key-value store that remembers "this text, with this model, gives this vector". Before calling the embedding model, we look in the cache. If the vector is there (a **cache hit**), we use it immediately. If not (a **cache miss**), we call the model, then save the result for next time.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a translator\'s notebook', text: 'A translator who keeps a notebook of sentences already translated never translates "Thank you for your order" twice. They look it up in a second. The notebook must note which *language pair* each entry is for, or a French translation might be handed out for a German request. In an embedding cache, the model name plays that role.' },
        { type: 'p', text: 'Where does repeated text come from? More places than we expect:' },
        { type: 'list', items: [
          '**Re-indexing**: nightly or on-deploy pipelines re-process whole document collections where most chunks are unchanged.',
          '**Popular queries**: many users ask "how do I reset my password" with exactly the same words.',
          '**Duplicate content**: boilerplate footers, legal disclaimers, repeated FAQ answers across pages.',
          '**Experiments**: re-running an evaluation or a chunking experiment over the same texts.',
          '**Retries and crashes**: a pipeline that fails at 80% should not pay again for the first 80%.',
        ] },
        { type: 'p', text: 'The benefits are direct: **lower cost** (fewer paid tokens), **lower latency** (a memory lookup is microseconds; a network call is milliseconds), **fewer rate-limit problems** with hosted APIs, and **faster re-indexing**.' },
      ],
    },
    {
      id: 'cache-key',
      title: 'The core idea and the cache key: hash of text plus model',
      blocks: [
        { type: 'p', text: 'The heart of any cache is the **key**: the label we look things up by. For embeddings, the key must change whenever the vector *could* change, and stay the same otherwise. Two things determine the vector: the exact **text** and the exact **model** (name and version, plus any settings that affect output, such as the output dimension or a "query" vs "document" mode).' },
        { type: 'p', text: 'Texts can be long, so instead of using the raw text as the key, we use a **hash**: a function such as SHA-256 that turns any input into a fixed-length fingerprint (64 hexadecimal characters for SHA-256). The same input always gives the same hash; any change, even one character, gives a completely different hash; and accidental collisions are astronomically unlikely.' },
        { type: 'formula', expr: 'key = SHA-256( model_name + "|" + model_version + "|" + text )', where: [['model_name, model_version', 'e.g. "embed-model" and "v2": changing the model must change the key'], ['text', 'the exact string sent to the model, after any normalisation we apply'], ['"|"', 'a separator so "ab"+"c" and "a"+"bc" cannot collide']] },
        { type: 'callout', tone: 'warn', title: 'The most dangerous bug: forgetting the model in the key', text: 'If the key is only hash(text), then after upgrading the embedding model the cache keeps returning **old-model vectors**. New queries are embedded with the new model, old documents come from the cache with the old model, and similarity search silently becomes garbage, because vectors from different models are not comparable. Always include the model identity (and version) in the key, or use a separate cache namespace per model.' },
        { type: 'p', text: 'Should we normalise text before hashing (trim spaces, lowercase)? Trimming whitespace is usually safe. Lowercasing is not, unless the model itself is case-insensitive, because "Apple" and "apple" may get different vectors. A good rule: hash exactly the string we send to the model.' },
        { type: 'check', question: 'Two chunks differ only by a trailing space: "Refunds take 5 days" vs "Refunds take 5 days ". Will they share a cache entry?', answer: 'Not if we hash the raw strings: one character of difference produces a completely different SHA-256 hash, so it is a miss. If we strip whitespace before both hashing and embedding, they become the same string and share an entry.' },
      ],
    },
    {
      id: 'request-flow',
      title: 'The request flow: a hit and a miss',
      blocks: [
        { type: 'flow', title: 'Looking up an embedding', nodes: [
          { label: 'Text arrives', detail: 'A chunk to index or a user query, e.g. "reset password".' },
          { label: 'Build the key', detail: 'SHA-256 of model + version + text.' },
          { label: 'Look up', detail: 'Check the cache for this key (and that the entry has not expired).' },
          { label: 'Hit: return', detail: 'Return the stored vector at once. No model call.' },
          { label: 'Miss: embed and store', detail: 'Call the model, save key → vector (with a timestamp), evict an old entry if full, return the vector.' },
        ] },
        { type: 'steps', title: 'The same flow in words', items: [
          { title: 'Hash', text: 'Compute the key from the model identity and the text.' },
          { title: 'Check', text: 'If the key is present and fresh, it is a hit: return the vector and mark the entry as recently used.' },
          { title: 'Compute on miss', text: 'Otherwise call the embedding model. In batch pipelines, collect all misses and embed them in one batched call.' },
          { title: 'Store', text: 'Save the new vector with the time it was created.' },
          { title: 'Evict if needed', text: 'If the cache is over its size limit, remove the entry chosen by the eviction policy.' },
        ] },
        { type: 'p', text: 'For indexing pipelines the batch version matters: hash all chunks, look up all keys at once, send only the misses to the model in batches, then write them back. If 98% of 2 million chunks are unchanged, we embed 40,000 chunks instead of 2 million.' },
      ],
    },
    {
      id: 'eviction',
      title: 'Eviction: LRU and TTL',
      blocks: [
        { type: 'p', text: 'A cache cannot grow forever. A 1,536-dimension float32 vector is about 6 KB; 10 million of them is about 60 GB. **Eviction** decides what to throw away. Two rules are common, and often combined:' },
        { type: 'list', items: [
          '**LRU (Least Recently Used)**: when the cache is full, remove the entry that has gone longest without being used. Popular texts stay; one-off texts fall out. Implemented with a hash map plus a usage-ordered list (Python\'s `OrderedDict` does both).',
          '**TTL (Time To Live)**: each entry expires after a fixed time, e.g. 1 hour or 30 days. After that it is treated as missing and recomputed. TTL bounds how long stale data can survive, for example if a model is silently updated behind the same name.',
        ] },
        { type: 'p', text: 'Other policies exist, such as **LFU** (Least Frequently Used, evict the entry with the fewest hits) and size-based limits. For embeddings of a stable model, entries never become "wrong" as long as the key includes the model version, so many teams use long TTLs or none at all, and rely on LRU or disk space limits.' },
        { type: 'code', lang: 'python', title: 'embedding_cache.py', code: `import hashlib
from collections import OrderedDict

MODEL = "embed-model-v2"         # placeholder model name
api_calls = 0

def slow_embed(text):            # stand-in for a paid embedding API call
    global api_calls
    api_calls += 1
    return [len(text) / 100, text.count(" ") / 10]

class EmbeddingCache:
    def __init__(self, capacity=3, ttl=3600):
        self.data, self.capacity, self.ttl = OrderedDict(), capacity, ttl

    def key(self, text):         # same text + same model -> same key
        return hashlib.sha256(f"{MODEL}|{text}".encode()).hexdigest()[:12]

    def get(self, text, now):
        k = self.key(text)
        if k in self.data:
            if now - self.data[k][1] < self.ttl:
                self.data.move_to_end(k)          # mark as recently used
                return self.data[k][0], "hit", ""
            status = "stale"                      # too old: recompute
        else:
            status = "miss"
        vec = slow_embed(text)
        self.data[k] = (vec, now)
        self.data.move_to_end(k)
        evicted = ""
        if len(self.data) > self.capacity:        # full: drop least recently used
            evicted = "evicts " + self.data.popitem(last=False)[0]
        return vec, status, evicted

cache = EmbeddingCache()
events = [(0, "reset password"), (5, "refund policy"), (9, "reset password"),
          (12, "track order"), (20, "store hours"), (30, "refund policy"),
          (4000, "refund policy")]        # t=4000s: older than the 1h TTL
for t, text in events:
    _, status, evicted = cache.get(text, now=t)
    print(f"t={t:<5} {status:5} {text!r:17} key={cache.key(text)} {evicted}".rstrip())
print(f"requests={len(events)}  api_calls={api_calls}")`, output: `t=0     miss  'reset password'  key=b043a4f1675e
t=5     miss  'refund policy'   key=fac0cddb8a88
t=9     hit   'reset password'  key=b043a4f1675e
t=12    miss  'track order'     key=1b6e8ca0b362
t=20    miss  'store hours'     key=c03e18c5b18c evicts fac0cddb8a88
t=30    miss  'refund policy'   key=fac0cddb8a88 evicts b043a4f1675e
t=4000  stale 'refund policy'   key=fac0cddb8a88
requests=7  api_calls=6`,
          walkthrough: [
            { lines: [4, 10], note: 'A stand-in for the real embedding call that counts how often it is called (each call would cost money and time).' },
            { lines: [12, 17], note: 'The cache: an OrderedDict that remembers usage order, a capacity of 3 entries and a TTL of 3,600 seconds. The key is a SHA-256 hash of model + text (shortened to 12 characters for display).' },
            { lines: [19, 27], note: 'Lookup: a fresh entry is a hit and moves to the "most recently used" end. An entry older than the TTL is stale. Otherwise it is a miss.' },
            { lines: [28, 34], note: 'On a miss or stale entry: embed, store with a timestamp, and if over capacity pop the least recently used entry from the front.' },
            { lines: [36, 43], note: 'Replay 7 requests with timestamps (seconds) and count real embedding calls.' },
          ] },
        { type: 'p', text: 'Read the trace: at t=9 "reset password" is a **hit**. At t=20 the cache holds 3 entries, so adding "store hours" evicts the least recently used, "refund policy". At t=30 "refund policy" is a miss again and evicts "reset password". At t=4000 "refund policy" is in the cache but older than the 1-hour TTL, so it is **stale** and recomputed. 7 requests cost 6 calls here because the cache is tiny; real caches with thousands of entries and repetitive traffic reach much higher hit rates.' },
        { type: 'check', question: 'In the trace, why was "refund policy" evicted at t=20 even though "reset password" was added earlier?', answer: 'LRU evicts the least recently *used*, not the oldest *added*. "reset password" was used again at t=9, so it was fresher than "refund policy", last used at t=5.' },
      ],
    },
    {
      id: 'where-it-lives',
      title: 'Where the cache lives: memory or disk',
      blocks: [
        { type: 'compare', title: 'Cache storage options',
          options: [
            { name: 'In-process memory', summary: 'A dict / LRU map inside the app.', pros: ['Fastest (microseconds)', 'Zero setup'], cons: ['Lost on restart', 'Not shared between servers', 'Limited by RAM'], bestFor: 'Single process, hot queries, notebooks' },
            { name: 'Local disk', summary: 'SQLite, a key-value file store, or files.', pros: ['Survives restarts', 'Large and cheap'], cons: ['Slower than RAM (still far faster than an API)', 'One machine only'], bestFor: 'Batch indexing jobs and experiments' },
            { name: 'Shared store', summary: 'Redis, a database table, or object storage.', pros: ['Shared by all workers', 'Persistent, scalable'], cons: ['Network hop', 'Another service to run'], bestFor: 'Production fleets and distributed pipelines' },
          ],
          rows: [
            ['Survives restart', 'No', 'Yes', 'Yes'],
            ['Shared across servers', 'No', 'No', 'Yes'],
          ],
          verdict: 'Common pattern: a small in-memory LRU in front of a shared persistent store (two-level cache).' },
        { type: 'p', text: 'Storage size matters. Vectors can be stored as float32 (4 bytes per number), float16 (2 bytes), or compressed. Store them in a compact binary form rather than as JSON text, which can be several times bigger.' },
      ],
    },
    {
      id: 'benefits-and-real-world',
      title: 'Benefits and the embedding cache in the real world',
      blocks: [
        { type: 'chart', kind: 'bar', title: 'Embedding calls for a nightly re-index of 2M chunks', yLabel: 'Model calls', labels: ['No cache', 'Cache, 90% unchanged', 'Cache, 98% unchanged'], series: [ { name: 'Calls', values: [2000000, 200000, 40000] } ], caption: 'Simple arithmetic: calls = chunks × share that changed. The real share depends on how often your documents change.' },
        { type: 'callout', tone: 'example', title: 'Real-world use', text: 'LangChain offers a `CacheBackedEmbeddings` wrapper that stores vectors in a key-value store, namespaced by model, keyed by a hash of the text. Teams commonly keep embeddings in Redis or in a database table keyed by content hash. Data pipelines use content hashes to skip unchanged documents entirely. Some vector databases and RAG frameworks offer similar "skip if unchanged" ingestion features; check the current docs.' },
        { type: 'p', text: 'An embedding cache is different from a **semantic cache** (the next lesson). An embedding cache reuses a *vector* only for the **exact same text**. A semantic cache reuses a whole *LLM answer* for a **similar** question, which is riskier and saves far more per hit.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Leaving the model or version out of the key. Hashing a different string from the one actually embedded (e.g. hashing before adding a prefix like "query: "). Storing vectors as JSON text and running out of memory. No size limit, so the cache grows forever. Caching per-user text containing personal data without thinking about retention and deletion rules.' },
      ],
    },
    {
      id: 'worked-example-cache-value',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: 'Is the cache worth building? Let us put numbers on the nightly job from the start of this lesson. The price and the speed below are illustrative; plug in your own.' },
        { type: 'steps', title: 'The nightly re-index, in numbers', items: [
          { title: 'Size of the job', text: '2,000,000 chunks × 300 tokens each = 600 million tokens for one full run.' },
          { title: 'Cost with no cache', text: 'At an illustrative $0.02 per million tokens: 600 × 0.02 = $12 per night, about $360 per month.' },
          { title: 'Cost with a cache', text: '98% of chunks are unchanged, so we embed 40,000 chunks, or 12 million tokens: $0.24 per night.' },
          { title: 'Time', text: 'If the model embeds 2,000 chunks per second, a full run takes 1,000 seconds (about 17 minutes). The 40,000 misses take 20 seconds, plus the time to hash and look up 2 million keys.' },
          { title: 'Storage', text: '2,000,000 vectors × 1,536 numbers × 4 bytes ≈ 12.3 GB as float32. That is too much to hold inside every worker process, so the cache belongs in a shared store.' },
        ] },
        { type: 'p', text: 'The storage number explains the "two-level" pattern from the comparison above. A small in-memory map answers the hottest keys at once, and a big shared store holds everything else.' },
        { type: 'flow', title: 'A two-level lookup', nodes: [
          { label: 'Key', detail: 'Hash of model + version + text, as before.' },
          { label: 'Level 1: memory', detail: 'A small LRU map inside the process. Answers in microseconds, but holds only recent keys.' },
          { label: 'Level 2: shared store', detail: 'Redis or a database table. One network hop, shared by all workers. On a hit, the vector is also copied up into level 1.' },
          { label: 'Model', detail: 'Called only when both levels miss. The new vector is written to level 2 and level 1.' },
          { label: 'Vector', detail: 'Returned to the caller, whichever level it came from.' },
        ] },
        { type: 'p', text: 'One caution before building this for **query** traffic: measure the hit rate first, as hits / (hits + misses) on real logs. Re-indexing repeats almost everything, so the cache pays off at once. User queries may repeat far less. If only 5% of queries are exact repeats, the cache removes only 5% of the calls.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'The earlier code handled one text at a time. Now we build the **batch** version used by indexing pipelines: hash every chunk, find the misses, embed only those in one batched call, and write them back. We replay four nightly runs, including one where the embedding model is upgraded.' },
        { type: 'code', lang: 'python', title: 'practice_batch_cache.py', code: `import hashlib

calls = 0
def embed_batch(texts):                 # stand-in for one batched model call
    global calls
    calls += len(texts)
    return [[len(t), t.count(" ")] for t in texts]

def key(model, text):                   # model identity is part of the key
    return hashlib.sha256(f"{model}|{text}".encode()).hexdigest()

def index(chunks, model, cache):
    todo = {}                           # unique misses: key -> text
    for c in chunks:
        if key(model, c) not in cache:
            todo[key(model, c)] = c
    for k, vec in zip(todo, embed_batch(list(todo.values()))):   # embed misses only
        cache[k] = vec
    return [cache[key(model, c)] for c in chunks], len(todo)

monday = ["Refunds take 5 days.", "Shipping takes 2 days.", "Reset your password.",
          "Contact support by chat.", "Refunds take 5 days."]      # note the duplicate
tuesday = monday[:3] + ["Contact support by chat or phone."]       # one chunk edited

cache = {}
runs = [("Mon, model v1", monday, "embed-v1"), ("Tue, model v1", tuesday, "embed-v1"),
        ("Wed, model v1", tuesday, "embed-v1"), ("Thu, model v2", tuesday, "embed-v2")]
for label, chunks, model in runs:
    _, embedded = index(chunks, model, cache)
    saved = 1 - embedded / len(chunks)
    print(f"{label}: {len(chunks)} chunks, embedded {embedded}, calls saved {saved:.0%}")
print(f"total model calls = {calls}, cache entries = {len(cache)}")`, output: `Mon, model v1: 5 chunks, embedded 4, calls saved 20%
Tue, model v1: 4 chunks, embedded 1, calls saved 75%
Wed, model v1: 4 chunks, embedded 0, calls saved 100%
Thu, model v2: 4 chunks, embedded 4, calls saved 0%
total model calls = 9, cache entries = 9`,
          walkthrough: [
            { lines: [3, 10], note: 'A stand-in model that counts how many texts it embeds, and a key built from the model name and the exact text.' },
            { lines: [12, 19], note: 'The batch indexer: collect the unique misses, embed them in one call, store them, then read every vector back from the cache.' },
            { lines: [21, 27], note: 'Monday has five chunks, two of them identical. Tuesday keeps three and edits one. Four runs follow; the last one switches to model v2.' },
            { lines: [28, 32], note: 'For each run, print how many chunks were really embedded and the share of model calls we avoided.' },
          ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Add a trailing space to one of the Tuesday chunks. Predict how many chunks are embedded on Tuesday now.',
          'Change `key` so it ignores the model: hash only `text`. Predict the Thursday line, and explain why the "100% saved" it reports is bad news.',
          'Add a fifth run, `("Fri, model v1", monday, "embed-v1")`. Monday contains the old "Contact support by chat." chunk that was edited on Tuesday. Predict how many chunks are embedded on Friday.',
        ] },
        { type: 'check', question: 'On Thursday all 4 chunks were embedded again although no text changed. Is the cache broken?', answer: 'No, it is doing its job. The model name is part of the key, so under model v2 none of the keys exist yet and every chunk is a miss. That is what keeps old-model vectors out of the new index. The v1 entries are still stored (9 entries in total) and now only waste space until they are evicted or their namespace is cleared.' },
        { type: 'check', question: 'On Monday the cache started empty, and the list had 5 chunks, but only 4 were embedded. The cache could not have helped yet. What saved the fifth call?', answer: 'Removing duplicates inside the batch. Two chunks had the same text, so they had the same key, and the dictionary of misses kept one entry for both. Without that step, a cold cache would send both copies to the model, because the lookup for each happens before either result is stored.' },
      ],
    },
  ],
  quiz: [
    { q: 'What should an embedding cache key be built from?', options: ['The length of the text plus the current date', 'A hash of the text plus the model name and version', 'The embedding vector itself, rounded to 2 decimals', 'The user ID and the time the request arrived'], answer: 1, explain: 'The vector depends on both the exact text and the model. Including the model identity prevents returning vectors from an old model.' },
    { q: 'After upgrading to a new embedding model, search quality collapsed even though the cache hit rate stayed high. What is the most likely cause?', options: ['The TTL was too long, so entries stayed far too fresh', 'LRU evicted the most popular entries first by mistake', 'SHA-256 hashing is too slow for the new, bigger model', 'The key ignores the model, so old vectors were reused'], answer: 3, explain: 'A key based on text alone returns old-model vectors after the upgrade. Mixing vectors from different models makes similarity meaningless.' },
    { q: 'A nightly job embeds 2,000,000 chunks, of which 3% changed since yesterday. With a perfect cache, how many embedding calls are needed?', options: ['60,000', '2,000,000', '600,000', '6,000'], answer: 0, explain: '3% of 2,000,000 = 60,000. Unchanged chunks hit the cache.' },
    { q: 'What is the difference between LRU and TTL eviction?', options: ['They are two names for exactly the same policy', 'LRU drops by creation age; TTL drops the least used', 'LRU drops the least recently used; TTL drops by age', 'LRU only works on disk, while TTL only works in RAM'], answer: 2, explain: 'LRU is about usage order under a size limit. TTL is about maximum age regardless of usage.' },
    { q: 'A teammate says: "An embedding cache will return a stored vector for \'How do I reset my password?\' when the user types \'how to reset password\'." Is that right?', options: ['Yes, because the two questions mean the same thing', 'Yes, because hashing ignores the exact wording', 'Only if the TTL is long enough to keep the entry', 'No: different text means a different key, a miss'], answer: 3, explain: 'Hashing makes any change in the string a different key. Matching similar questions is what a semantic cache does.' },
  ],
  takeaways: [
    'Embedding the same text with the same model gives the same vector, so we can compute it once and reuse it.',
    'Key = hash(model + version + exact text); leaving the model out silently corrupts search after an upgrade.',
    'A hit returns the stored vector; a miss calls the model and stores the result; batch the misses in pipelines.',
    'LRU keeps the cache bounded by evicting the least recently used entry; TTL expires entries after a set time.',
    'Caches can live in memory, on disk or in a shared store like Redis; they cut cost, latency and re-index time.',
  ],
  terms: [
    { term: 'Embedding cache', def: 'A key-value store that maps (model, text) to its previously computed vector.' },
    { term: 'Cache hit / miss', def: 'Whether the requested key is already in the cache (hit) or must be computed (miss).' },
    { term: 'Hash (SHA-256)', def: 'A function that turns any input into a fixed-length fingerprint that changes completely if the input changes.' },
    { term: 'LRU', def: 'Least Recently Used eviction: remove the entry unused for the longest time.' },
    { term: 'TTL', def: 'Time To Live: an entry expires a fixed time after it was stored.' },
    { term: 'Cache namespace', def: 'A separate key space, e.g. one per embedding model, so entries never mix.' },
  ],
};
