export default {
  id: 'system-design',
  minutes: 40,
  hook: 'Your code works perfectly on your laptop; what has to change when ten million people use it at the same time?',
  summary: 'System design is deciding how the parts of a software system (clients, servers, databases, caches, queues and the network between them) fit together so it meets its requirements for scale, speed, reliability and cost. We need it because one machine eventually runs out of capacity and fails, and every choice to fix that brings trade-offs. This lesson builds the core vocabulary: scaling, load balancing, caching, CDNs, databases, replication, sharding, consistent hashing, queues, CAP, and back-of-the-envelope estimation. It then shows what changes when one component is a language model: estimates in tokens and GPUs, new building blocks such as a model gateway, a nine-part process for AI design questions, a worked gateway design, and how a design answer is judged.',
  sections: [
    {
      id: 'what-is',
      title: 'What is system design?',
      blocks: [
        { type: 'p', text: '**System design** is the process of defining the **architecture** of a software system: which components it has, what each one is responsible for, how they talk to each other, and how data flows and is stored, so that the whole thing meets its requirements. Writing a function is about *how to compute something*; system design is about *where computation and data live, and what happens when there is a lot of it or when parts fail*.' },
        { type: 'p', text: 'We usually split requirements into two kinds. **Functional requirements** are what the system does ("users can shorten a URL", "users can send a message"). **Non-functional requirements** are how well it does it: **scalability** (handle growth), **latency** (how fast one request is answered), **throughput** (how many requests per second), **availability** (fraction of time it works), **durability** (data is not lost), **consistency** (everyone sees the same data), plus security and cost.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like designing a restaurant', text: 'A home cook can feed four people with one stove. A restaurant serving 500 guests needs several cooks (horizontal scaling), a host who seats people evenly (load balancer), pre-made sauces (cache), a pantry with a stock system (database), order tickets on a rail (message queue), and a plan for when a cook is sick (redundancy). The recipes (code) barely change; the organisation around them is the design.' },
        { type: 'p', text: 'Our running example will be a **URL shortener**: a service that turns a long link into a short one like `sho.rt/aZ3k9` and redirects anyone who visits it. It is small enough to understand fully, and it touches nearly every concept.' },
      ],
    },
    {
      id: 'why',
      title: 'Why do we need it?',
      blocks: [
        { type: 'p', text: 'Start with the simplest design: one server running our app and its database. It works for a demo. Then reality arrives:' },
        { type: 'list', items: [
          '**Capacity runs out.** One machine has finite CPU, memory, disk and network. At some traffic level, requests queue up and latency explodes.',
          '**Single point of failure.** If that one machine crashes, or its disk dies, or we deploy a bug, the whole service is down and data may be lost.',
          '**Distance.** Users far from the server wait for light to cross the planet on every request; a round trip across an ocean commonly takes 100 ms or more.',
          '**Uneven load.** Traffic spikes (a link goes viral) and some data is far more popular than the rest.',
          '**Cost.** Over-building wastes money; under-building loses users.',
        ] },
        { type: 'p', text: 'System design gives us a toolbox to address these problems and, just as important, a habit of naming the **trade-offs**. Adding a cache makes reads faster but can serve stale data. Copying data to several machines improves availability but makes consistency harder. There is rarely one right answer; there is a best answer for given requirements.' },
        { type: 'chart', kind: 'hbar', title: 'Allowed downtime per year by availability target', xLabel: 'Hours of downtime per year', unit: ' h', labels: ['99% ("two nines")', '99.9% ("three nines")', '99.99% ("four nines")', '99.999% ("five nines")'], series: [ { name: 'Downtime', values: [87.6, 8.76, 0.876, 0.0876] } ], caption: 'Computed as (1 − availability) × 8,760 hours. Four nines allows about 53 minutes a year; five nines about 5 minutes. Each extra nine usually costs significantly more engineering.' },
        { type: 'p', text: 'System design is also a standard part of software engineering interviews, where the candidate designs a well-known system (a URL shortener, a chat app, a news feed, or, as in the previous lesson, a voice AI agent) and explains the trade-offs out loud. For AI roles the prompt is usually an AI product, such as a chatbot over company documents. The second half of this lesson covers what that adds.' },
      ],
    },
    {
      id: 'request-path',
      title: 'Required concepts, part 1: the path of a request',
      blocks: [
        { type: 'p', text: 'Let us follow one click on `sho.rt/aZ3k9` and name each component it touches. Click each node for details.' },
        { type: 'flow', title: 'A request through a typical web system', nodes: [
          { label: 'Client', detail: 'The browser or mobile app. It starts the request. In the **client-server model**, clients ask and servers answer.' },
          { label: 'DNS', detail: 'The Domain Name System translates sho.rt into an IP address, like a phone book. Answers are cached for a time (the TTL) by browsers and resolvers.' },
          { label: 'CDN / edge', detail: 'A Content Delivery Network keeps copies of static or cacheable responses on servers near users, so many requests never reach our data center.' },
          { label: 'Load balancer', detail: 'Spreads incoming requests across many identical app servers (round-robin, least-connections, or by hash), and stops sending traffic to unhealthy ones.' },
          { label: 'App servers', detail: 'Run our code. Kept **stateless** (no user data stored only in their memory), so any server can handle any request and we can add or remove servers freely.' },
          { label: 'Cache', detail: 'An in-memory key-value store such as Redis or Memcached holding hot data (aZ3k9 → long URL). Memory reads take well under a millisecond.' },
          { label: 'Database', detail: 'The durable source of truth. Checked only on a cache miss; the result is then put in the cache for next time.' },
        ] },
        { type: 'p', text: '**Vertical vs horizontal scaling.** *Vertical scaling* (scaling up) means a bigger machine: more CPU and RAM. It is simple but has a ceiling and keeps a single point of failure. *Horizontal scaling* (scaling out) means more machines behind a load balancer. It has no hard ceiling and survives individual failures, but requires stateless servers and distributed data, which is harder.' },
        { type: 'p', text: '**Caching** stores the result of expensive work so the next request is cheap. Common pattern: **cache-aside** (read from cache; on a miss read the database and fill the cache). Key decisions are what to cache, how long (TTL, time to live), what to evict when full (often LRU, least recently used), and how to keep it fresh when data changes (invalidate or update on write). The **hit rate** is the fraction of requests served from cache; with a 95% hit rate, the database sees only 5% of reads.' },
        { type: 'check', question: 'Our shortener gets 1,000 redirect requests per second and the cache hit rate is 90%. How many reads per second reach the database? What if the hit rate rises to 99%?', answer: 'At 90%: 10% of 1,000 = 100 reads/s. At 99%: 1% = 10 reads/s. A small improvement in hit rate cuts database load by 10×, which is why caching is so powerful for read-heavy systems.' },
      ],
    },
    {
      id: 'data-concepts',
      title: 'Required concepts, part 2: storing data at scale',
      blocks: [
        { type: 'p', text: '**SQL vs NoSQL.** Relational (SQL) databases such as PostgreSQL and MySQL store tables with a fixed schema, support joins and **ACID transactions** (atomic, consistent, isolated, durable: a group of changes all happen or none do). NoSQL is an umbrella for other models: key-value (Redis, DynamoDB), document (MongoDB), wide-column (Cassandra), graph (Neo4j). Many NoSQL systems were built to scale horizontally first and relax some guarantees to do so.' },
        { type: 'p', text: '**Replication** keeps copies of the same data on several machines. In the common **leader-follower** (primary-replica) setup, all writes go to the leader, which streams changes to followers; reads can be served by followers. This adds read capacity and survives a machine loss. If replication is **asynchronous**, a follower can lag slightly, so a user might not see their own write immediately; this is **eventual consistency**.' },
        { type: 'p', text: '**Sharding** (partitioning) splits data across machines so each holds only part of it: users A–M on shard 1, N–Z on shard 2, or more commonly by a hash of the key. It scales writes and storage, but cross-shard queries and transactions become hard, and a "hot" key can overload one shard.' },
        { type: 'p', text: '**Consistent hashing** solves a sharding problem. The naive rule `shard = hash(key) % N` reshuffles almost every key when N changes, which would mean moving most of the data. Consistent hashing places servers and keys on a circular "ring" of hash values; each key belongs to the next server clockwise. Adding a server only takes over the keys between it and its neighbour, about 1/N of them. **Virtual nodes** (many points per server on the ring) even out the load.' },
        { type: 'p', text: '**CAP theorem.** In a distributed data store, when a **network partition** happens (some machines cannot talk to others), we must choose between **consistency** (every read sees the latest write, or gets an error) and **availability** (every request gets a non-error response, possibly stale). We cannot have both during the partition. Banks lean to consistency; a social feed leans to availability. When there is no partition, the trade-off becomes latency vs consistency (the PACELC extension).' },
        { type: 'p', text: '**Message queues** (Kafka, RabbitMQ, SQS and others) let one component put work in a queue and another process it later. This **decouples** producers from consumers, absorbs traffic spikes, and enables retries. Our shortener could push click events to a queue so analytics never slows down redirects.' },
      ],
    },
    {
      id: 'code',
      title: 'Code: estimation and consistent hashing',
      blocks: [
        { type: 'p', text: 'Two skills every system designer uses: quick **back-of-the-envelope estimates**, and understanding why consistent hashing beats modulo sharding. Both fit in a few lines of standard-library Python.' },
        { type: 'code', lang: 'python', title: 'design_basics.py', code: `# Two system-design building blocks with the standard library only.
import bisect, hashlib

# 1) Back-of-the-envelope: a URL shortener
daily_new_urls = 1_000_000
reads_per_write = 100
qps_write = daily_new_urls / 86_400
qps_read = qps_write * reads_per_write
storage_5y_gb = daily_new_urls * 365 * 5 * 500 / 1e9   # ~500 bytes per record
print(f"writes/s ~ {qps_write:.0f}, reads/s ~ {qps_read:,.0f}, 5-year storage ~ {storage_5y_gb:,.0f} GB")

# 2) Sharding keys across servers: modulo vs consistent hashing
def h(s):
    return int(hashlib.md5(s.encode()).hexdigest(), 16)

keys = [f"user{i}" for i in range(10_000)]

def modulo(n):
    return {k: h(k) % n for k in keys}

def ring(n, vnodes=100):                 # each server gets 100 points on a ring
    points = sorted((h(f"s{s}#{v}"), s) for s in range(n) for v in range(vnodes))
    hashes = [p[0] for p in points]
    def owner(k):
        i = bisect.bisect(hashes, h(k)) % len(points)   # next point clockwise
        return points[i][1]
    return {k: owner(k) for k in keys}

for name, f in [("modulo", modulo), ("consistent", ring)]:
    before, after = f(4), f(5)                      # add a 5th server
    moved = sum(before[k] != after[k] for k in keys) / len(keys)
    print(f"{name:10s} hashing: {moved:.1%} of keys move when 4 -> 5 servers")`,
          output: `writes/s ~ 12, reads/s ~ 1,157, 5-year storage ~ 912 GB
modulo     hashing: 79.7% of keys move when 4 -> 5 servers
consistent hashing: 19.4% of keys move when 4 -> 5 servers`,
          walkthrough: [
            { lines: [4, 10], note: 'One million new links per day ÷ 86,400 seconds ≈ 12 writes/s. With 100 reads per write, about 1,157 reads/s, so the system is read-heavy: caching matters. Five years × 500 bytes ≈ 0.9 TB: fits on one database server, but replicas are still needed for availability.' },
            { lines: [12, 16], note: 'A stable hash function (MD5 here, used for spreading keys, not security) and 10,000 sample keys.' },
            { lines: [18, 19], note: 'Modulo sharding: shard = hash % N. Simple, but N appears in the formula, so changing N reassigns most keys.' },
            { lines: [21, 27], note: 'Consistent hashing: each server is hashed to 100 points on a ring (virtual nodes). A key goes to the first server point clockwise from its own hash, found with binary search.' },
            { lines: [29, 32], note: 'Going from 4 to 5 servers moves about 80% of keys with modulo, but only about 20% (the ideal 1/5) with consistent hashing.' },
          ] },
        { type: 'chart', kind: 'bar', title: 'Keys that must move when adding a 5th server', yLabel: 'Percent of keys', unit: '%', labels: ['Modulo hashing', 'Consistent hashing', 'Ideal (1/N)'], series: [ { name: 'Keys moved', values: [79.7, 19.4, 20] } ], caption: 'From the script output; the ideal is the new server\'s fair share, 1/5 = 20%.' },
      ],
    },
    {
      id: 'more-concepts',
      title: 'Required concepts, part 3: reliability and communication',
      blocks: [
        { type: 'list', items: [
          '**Redundancy and failover:** run at least two of everything important, and switch to a standby automatically when the primary fails. Health checks detect failure.',
          '**Rate limiting:** cap requests per user or IP (for example with a token bucket) to protect the system from abuse and overload.',
          '**Monolith vs microservices:** a monolith is one deployable application; microservices split it into small services that deploy independently. Microservices help large teams scale development but add network calls, partial failures and operational overhead.',
          '**API design:** REST over HTTP with JSON is common; gRPC uses binary messages for fast service-to-service calls. Real-time features use WebSocket or Server-Sent Events, which the next lesson compares.',
          '**Idempotency:** an operation that is safe to repeat (retrying "set status = paid" is fine; retrying "add $10" is not without an idempotency key).',
          '**Observability:** logs, metrics and traces so we can see latency percentiles (p50, p95, p99), error rates and saturation, and find the bottleneck.',
        ] },
        { type: 'compare', title: 'Vertical vs horizontal scaling', options: [
          { name: 'Vertical (scale up)', summary: 'Buy a bigger machine.', pros: ['No code changes', 'Simple operations', 'Transactions stay local'], cons: ['Hard upper limit', 'Single point of failure', 'Big machines cost disproportionately more'], bestFor: 'Early stage, databases that are hard to shard, quick relief' },
          { name: 'Horizontal (scale out)', summary: 'Add more machines and spread the load.', pros: ['Near-unlimited growth', 'Survives machine failures', 'Uses cheap commodity servers'], cons: ['Needs stateless services and distributed data', 'Network, consistency and coordination complexity'], bestFor: 'Web/app tiers, caches, large-scale storage' },
        ], rows: [
          ['Ceiling', 'Largest available machine', 'Practically none'],
          ['Failure impact', 'Whole service', 'One node of many'],
          ['Complexity', 'Low', 'Higher'],
        ], verdict: 'Most systems scale the stateless app tier horizontally from the start, and scale the database vertically first, adding replicas and then shards when needed.' },
        { type: 'callout', tone: 'tip', title: 'Latency numbers worth remembering (orders of magnitude)', text: 'Reading from memory: nanoseconds to around a microsecond. A read from a fast SSD: tens to hundreds of microseconds. A round trip inside one data center: roughly half a millisecond. A round trip across a continent or ocean: tens to over a hundred milliseconds. Exact values depend on hardware, but the ratios explain why caches and CDNs work.' },
      ],
    },
    {
      id: "ai-systems",
      title: "What changes when a model sits inside the system",
      blocks: [
        { type: "p", text: "Everything above still applies to an AI product. A chatbot is still clients, a load balancer, stateless servers, a cache, a database and queues. But one box in the diagram is now a **model**, and that box does not behave like normal code. Design interviews for AI roles spend most of their time on these differences." },
        { type: "table", caption: "A classic web service next to a service that calls a large language model (LLM)", head: ["Aspect", "Classic web service", "Service with an LLM inside"], rows: [
          ["Unit of work", "One request", "One **token** (a word piece). Requests differ a lot in how many tokens they use"],
          ["Time per request", "Milliseconds", "Seconds, usually **streamed** to the user token by token"],
          ["Scarce resource", "CPU and database connections", "GPU memory and GPU time, or the rate limit of a model provider"],
          ["Cost", "Per machine-hour, nearly the same for every request", "Per token, so a long prompt costs many times more than a short one"],
          ["Correctness", "Same input, same output; unit tests prove it", "Output varies and can be wrong; we need an **evaluation set** and metrics"],
          ["Typical failure", "An error code or a timeout", "A fluent, confident, wrong answer returned with a success code"],
        ] },
        { type: "p", text: "These rows explain most design choices in AI systems. Long streamed requests keep connections open, so we balance load by **active requests**, not by request count. Cost per token means we count and limit tokens, not only requests. Silent wrong answers mean monitoring must look at answer quality, not only at error rates." },
        { type: "p", text: "AI systems also bring a few new building blocks. Each one has a classic cousin, so the vocabulary from the earlier sections carries over." },
        { type: "table", caption: "Building blocks of AI systems", head: ["Building block", "What it does", "Classic cousin"], rows: [
          ["Model gateway", "One entry point for all model calls: keys, quotas, routing, retries, fallback, logging", "API gateway"],
          ["Model server", "Runs the model on GPUs and batches many requests together", "App server"],
          ["Embedding model and vector index", "Turn text into vectors and find the nearest ones, for search by meaning", "Search index"],
          ["Reranker", "A slower, more exact model that re-orders the top search results", "Ranking stage"],
          ["Semantic cache", "Reuses an old answer when a new question means the same thing", "Key-value cache"],
          ["Guardrails", "Checks on input and output: abuse, private data, policy, hidden instructions", "Input validation"],
          ["Batch queue", "Runs work that is not urgent, such as embedding documents or nightly evaluations, away from live requests", "Message queue and workers"],
          ["Trace and evaluation store", "Keeps prompts, retrieved text, outputs and scores, so we can measure quality and debug", "Logs and metrics"],
        ] },
        { type: "callout", tone: "note", title: "One shape to remember: the funnel", text: "Many ML systems share one shape. A cheap step picks a few hundred candidates out of millions, then an expensive model orders only those. Search, recommendation feeds and document question-answering all work this way: retrieve, then rank. When a design looks too slow or too costly, ask whether a cheap first stage can shrink the work for the expensive one." },
        { type: "check", question: "Our service streams answers that take between 1 and 30 seconds. A teammate sets the load balancer to round-robin, and one model server ends up overloaded while others are idle. Why, and what is a better rule?", answer: "Round-robin gives every server the same number of new requests, but the requests are not equal. A server that happened to receive several 30-second answers is still busy when its next turn comes. With long streamed requests we route by load: send each new request to the server with the fewest active requests or the shortest queue." },
      ],
    },
    {
      id: "ai-estimation",
      title: "Back-of-the-envelope numbers for AI systems",
      blocks: [
        { type: "p", text: "Estimates for AI systems need a few extra numbers. Treat every figure in this table as an **order of magnitude**. Real values change with the model, the hardware and the vendor, and prices change often. In an interview we say the number, say it is rough, and move on." },
        { type: "table", caption: "Rough numbers for AI estimates. Illustrative orders of magnitude, not measurements.", head: ["Quantity", "Rough figure", "Why it matters"], rows: [
          ["Tokens and words", "1,000 tokens is about 750 English words", "Turns pages of text into tokens"],
          ["Reading speed of a person", "About 5 tokens per second", "Streaming faster than this already feels smooth"],
          ["Output speed for one user", "Tens of tokens per second; a few hundred on fast setups", "Sets how long a full answer takes"],
          ["Time to first token", "A few hundred milliseconds up to a few seconds", "Grows with prompt length and with queueing"],
          ["Model weights in memory", "Parameters × bytes per parameter: 8 billion × 2 bytes = 16 GB", "Decides which GPU the model fits on"],
          ["KV cache per request", "Roughly 0.1 MB per token of context for an 8-billion-parameter model", "Decides how many requests fit next to the weights"],
          ["One embedding vector", "Dimensions × 4 bytes: 1,024 numbers ≈ 4 KB", "One million chunks need about 4 GB"],
          ["Vector search", "Milliseconds to tens of milliseconds", "Rarely the slow part"],
          ["Reranking a few dozen candidates", "Tens to a few hundred milliseconds", "Usually affordable, and it improves quality"],
          ["Hosted model price", "Under one dollar to tens of dollars per million tokens; output usually costs a few times more than input", "Look up the current price list; never state a remembered price as fact"],
        ] },
        { type: "p", text: "The **KV cache** is the work a model saves for the tokens it has already read, so it does not redo that work for every new token. It lives in GPU memory, one copy per request in progress. Let us turn these numbers into a sized design for a chat service." },
        { type: "code", lang: "python", title: "ai_capacity.py", code: `# Rough sizing for an LLM chat service. Every input is an assumption we say out loud.
import math

daily_requests, peak_factor = 2_000_000, 4
in_tokens, out_tokens = 1_500, 300
first_token_s, tokens_per_s = 0.4, 40      # illustrative speeds seen by one user

avg_qps = daily_requests / 86_400
peak_qps = avg_qps * peak_factor
latency_s = first_token_s + out_tokens / tokens_per_s
in_flight = peak_qps * latency_s           # requests being served at the same moment
print(f"avg {avg_qps:.0f} req/s, peak {peak_qps:.0f} req/s, {latency_s:.1f} s each "
      f"-> {in_flight:.0f} requests in flight at peak")

# Option A: host an 8B-parameter model ourselves on 80 GB GPUs.
weights_gb = 8e9 * 2 / 1e9                 # 16-bit weights = 2 bytes per parameter
kv_gb = 128 * 1024 * (in_tokens + out_tokens) / 1e9   # 128 KiB of KV cache per token
fit = int((80 * 0.9 - weights_gb) / kv_gb)            # keep 10% of memory free
by_memory = math.ceil(in_flight / fit)
gpu_tokens_per_s = 2_000                   # illustrative batched output of one GPU
by_speed = math.ceil(peak_qps * out_tokens / gpu_tokens_per_s)
print(f"weights {weights_gb:.0f} GB, KV cache {kv_gb:.2f} GB per request, {fit} requests fit per GPU")
print(f"GPUs needed: {by_memory} by memory, {by_speed} by speed "
      f"-> {max(by_memory, by_speed) + 1} with one spare")

# Option B: call a hosted API, billed per token (illustrative prices per 1M tokens).
price_in, price_out = 0.50, 2.00
per_request = (in_tokens * price_in + out_tokens * price_out) / 1e6
print(f"hosted API: \${per_request:.5f} per request, \${per_request * daily_requests:,.0f} per day")`,
          output: `avg 23 req/s, peak 93 req/s, 7.9 s each -> 731 requests in flight at peak
weights 16 GB, KV cache 0.24 GB per request, 237 requests fit per GPU
GPUs needed: 4 by memory, 14 by speed -> 15 with one spare
hosted API: $0.00135 per request, $2,700 per day`,
          walkthrough: [
            { lines: [4, 6], note: "The assumptions: two million requests a day, a peak four times the average, 1,500 tokens in and 300 out. The two speeds are illustrative; we would measure them." },
            { lines: [8, 13], note: "A web request is over in milliseconds. This one takes about 8 seconds, so at 93 requests per second there are about 731 requests open at once. Requests in flight = arrival rate × time each one takes." },
            { lines: [15, 19], note: "Memory limit. The weights take 16 GB. Each request in progress needs about 0.24 GB of KV cache for its 1,800 tokens, so about 237 requests fit on one 80 GB GPU. By memory alone, 4 GPUs would do." },
            { lines: [20, 24], note: "Speed limit. At peak we must produce 93 × 300 ≈ 27,800 output tokens per second. If one GPU produces about 2,000 tokens per second across its whole batch, we need 14. We take the larger of the two limits and add a spare." },
            { lines: [26, 29], note: "The hosted option has no GPUs to size. Cost is tokens × price. At these illustrative prices one request costs about a seventh of a cent and a day costs about $2,700." },
          ] },
        { type: "chart", kind: "bar", title: "GPUs needed at peak, by which limit we look at", yLabel: "GPUs", labels: ["By memory", "By speed", "Chosen, with one spare"], series: [ { name: "GPUs", values: [4, 14, 15] } ], caption: "From the script output, which uses illustrative speeds. Checking only memory would leave the service more than three times too small." },
        { type: "p", text: "Two points are worth saying out loud. First, memory asked for 4 GPUs and speed asked for 14, so we check **both** limits and take the larger. Second, we cannot say which option is cheaper without real prices: the hosted bill grows with every token, while GPUs cost the same whether they are busy or idle. We do that sum with current numbers instead of guessing." },
        { type: "check", question: "The product team agrees to cap answers at 150 output tokens instead of 300. Using the method in the script, how many GPUs does the speed limit ask for now?", answer: "Peak output becomes 93 requests per second × 150 tokens ≈ 13,900 tokens per second. At 2,000 tokens per second per GPU that is 6.9, so 7 GPUs, or 8 with a spare. Output length is one of the strongest levers in an LLM system, because output tokens are the slowest to produce and usually the most expensive." },
      ],
    },
    {
      id: 'how-to-approach',
      title: 'How to approach a design problem',
      blocks: [
        { type: 'steps', title: 'A repeatable process', items: [
          { title: 'Clarify requirements', text: 'Ask what the system must do and for whom. Agree on functional requirements and the non-functional targets: scale, latency, availability, consistency.' },
          { title: 'Estimate', text: 'Requests per second (reads vs writes), storage over years, bandwidth. These numbers tell you whether you need caching, sharding or queues.' },
          { title: 'Define the API and data model', text: 'For the shortener: POST /shorten {url} returns a code; GET /{code} redirects. Table: code → long_url, created_at, owner.' },
          { title: 'Draw the high-level design', text: 'Clients, load balancer, stateless app servers, cache, database, and any queues or background workers.' },
          { title: 'Deep-dive the hard parts', text: 'For the shortener: generating unique short codes without collisions, cache strategy for hot links, and sharding the table.' },
          { title: 'Address bottlenecks and failures', text: 'What happens if the cache or a database node dies? Where is the single point of failure? How do we monitor it?' },
        ] },
        { type: 'callout', tone: 'example', title: 'The URL shortener, designed', text: 'Stateless app servers behind a load balancer; a Redis cache in front of a replicated database (read-heavy at about 100:1); short codes from a unique ID counter encoded in base 62 (a–z, A–Z, 0–9), so 7 characters give 62⁷ ≈ 3.5 trillion codes; click events pushed to a queue for analytics; a CDN or edge cache for the most viral links.' },
      ],
    },
    {
      id: "ai-design-framework",
      title: "The process for an ML or GenAI design question",
      blocks: [
        { type: "p", text: "The six steps above work for any system. When the prompt is an AI product, such as 'design a chatbot over our company documents', interviewers expect a few more stops: how we measure success, where the data comes from, how we evaluate, and how we keep the system safe. A nine-part version covers them. The example column uses **RAG** (retrieval-augmented generation): fetch the relevant text first, then let the model answer from it." },
        { type: "table", caption: "Nine parts of an AI design answer", head: ["Part", "Question to answer", "Example: a chatbot over company documents"], rows: [
          ["1. Requirements", "Who uses it, for what, at what scale, and what must it never do?", "5,000 staff ask about internal policies; answers show sources; document permissions are respected"],
          ["2. Success metrics", "Which numbers tell us it works, for the business and for the model?", "Share of questions solved without a ticket; answer correctness on a test set"],
          ["3. Data", "What are the sources? How fresh and clean are they? Who may see what?", "Wiki pages and PDFs, updated daily, with an access list per document"],
          ["4. Architecture", "What is the pipeline from input to output?", "Offline: parse, chunk, embed, index. Online: retrieve, rerank, generate"],
          ["5. Serving", "Hosted API or our own GPUs? Streaming? Batching?", "A hosted model behind a gateway, with streamed answers"],
          ["6. Evaluation", "How do we test before launch and after every change?", "A fixed set of real questions with known answers; score retrieval and the final answer separately"],
          ["7. Cost and latency", "What is the budget per request in tokens, money and milliseconds?", "Keep only the best few chunks; cache the fixed part of the prompt"],
          ["8. Safety", "What can go wrong, on purpose or by accident?", "A document that contains orders for the model (prompt injection); a leaked restricted file; private data in logs"],
          ["9. Monitoring", "How do we notice a quality drop in production?", "A daily sample of answers is scored; user feedback; latency and cost dashboards"],
        ] },
        { type: "callout", tone: "tip", title: "Spending the 45 minutes", text: "A common split: about 5 minutes on requirements and metrics, 5 on estimates, 10 on the high-level design, 15 on one or two deep dives, and the rest on evaluation, safety and monitoring. Say this plan at the start and ask whether the interviewer wants a different focus." },
        { type: "p", text: "Most prompts in AI design rounds come from a short list. Each has a **hard part** that the interviewer wants to reach. Find it early and spend the deep-dive time there." },
        { type: "table", caption: "Common design prompts and where the difficulty sits", head: ["Prompt", "The hard part", "Do not forget"], rows: [
          ["Chatbot over company documents (RAG)", "Retrieval quality: chunking, keyword plus vector search, reranking", "Permissions per document, citations, saying 'I do not know'"],
          ["Customer-support agent that can act", "Safe actions: what it may do, limits, approval", "Human handoff, an audit log, actions that are safe to retry"],
          ["Semantic search", "Index size, freshness, filters applied together with vector search", "Exact terms such as product codes still need keyword search"],
          ["LLM gateway or inference service", "Fair limits, routing, fallback, streaming at scale", "Cost per team, time to first token, behaviour under overload"],
          ["Recommendation feed", "The funnel: candidate generation, then ranking, then business rules", "New users and new items, feedback loops, an online A/B test"],
          ["Content moderation", "Speed against accuracy: cheap filters first, costly models after", "Human review for unclear cases, appeals, abuse patterns that change"],
          ["Code assistant", "Choosing which code goes in the prompt; very low latency for completions", "Running generated code in a sandbox; keeping secrets out of prompts"],
        ] },
      ],
    },
    {
      id: "worked-llm-gateway",
      title: "Worked design: an LLM gateway",
      blocks: [
        { type: "p", text: "**Prompt:** 'Forty product teams in our company call language models. Each team manages its own keys, retries and logs. Design one shared service that all model calls go through.' This is a good first AI design to practise, because it is classic system design with AI-shaped numbers." },
        { type: "steps", title: "The first ten minutes", items: [
          { title: "Clarify", text: "We ask: which models, hosted or our own? Is streaming needed (yes)? What must be fair between teams (each team has a budget)? What may be logged (prompts can hold private data)? How available must it be (more than any single provider)?" },
          { title: "Agree on metrics", text: "Latency added by the gateway itself (target: a few milliseconds), availability, share of requests served by a fallback, cost per team, and time to first token as the user sees it." },
          { title: "Estimate", text: "We reuse the script: about 93 requests per second and about 730 open streams at peak. The gateway does no model work, so a handful of small stateless servers is enough. The real limits are the provider's rate limit and our GPUs." },
          { title: "Define the API", text: "One endpoint shaped like a chat call: team key, model name or task label, messages, maximum output tokens, stream flag. A request ID lets us recognise a retry of the same call." },
          { title: "Sketch the design", text: "Stateless gateway servers behind a load balancer. A shared in-memory store for counters and caches. A queue that feeds a log store. Behind the gateway: model providers and our own model servers." },
        ] },
        { type: "flow", title: "One request through the gateway", nodes: [
          { label: "Authenticate", detail: "Check the team key. Load the team's limits and the models it may use." },
          { label: "Check limits", detail: "Three limits: requests per minute, **tokens per minute**, and requests in flight. Over a limit, we answer 'too many requests' with a wait time. We do not queue forever." },
          { label: "Cache", detail: "An exact-match cache returns a stored answer for an identical request. A semantic cache is optional and riskier. Caches are kept per team, so an answer never crosses a permission line." },
          { label: "Route", detail: "Pick a model: the one asked for, or a cheap one for easy tasks and a strong one for hard tasks. Skip targets that are failing right now." },
          { label: "Call and stream", detail: "Send the call with a timeout. Pass tokens to the client as they arrive, so the user sees the first words quickly." },
          { label: "Fall back", detail: "If the call fails before any token was sent, retry once after a short random delay, then try the backup model. After tokens have been sent, we cannot switch silently." },
          { label: "Record", detail: "Count the tokens used, add the cost to the team's total, and push a trace to the log queue with private data masked." },
        ] },
        { type: "viz", name: "llm-routing", caption: "Move the threshold. Sending more queries to the small model cuts cost, and at some point quality drops. A gateway is the natural place to make this choice once for every team." },
        { type: "table", caption: "Design decisions and their trade-offs", head: ["Decision", "Choice", "Why, and what it costs"], rows: [
          ["What to limit", "Tokens per minute and requests in flight, not only requests per minute", "One request can cost 100 times more than another. We need a token estimate before the call and a correction after it"],
          ["Where counters live", "A shared in-memory store, plus a small local allowance on each gateway server", "Servers stay stateless. If the store is down we must choose: let traffic through and risk overspending, or block it"],
          ["Retries", "One or two at most, with growing random delays", "Unlimited retries turn a small provider slowdown into a flood"],
          ["Fallback", "A second provider or a smaller model of our own, behind a circuit breaker", "Answer quality may differ, and the backup can be hit by the same traffic spike"],
          ["Caching", "Exact-match first; semantic only for public, repeatable questions", "A false semantic hit returns the wrong answer with full confidence"],
          ["Logging", "Asynchronous, through a queue, with masking", "Traces are needed for debugging and evaluation, but must never slow or block a request"],
        ] },
        { type: "p", text: "A **circuit breaker** stops sending calls to a target that keeps failing, waits, then tests it with a few calls before using it again. It protects our users, who get a fast failure or a fallback instead of a long timeout, and it gives the struggling provider room to recover." },
        { type: "compare", title: "Hosted model API vs our own model servers", options: [
          { name: "Hosted API", summary: "Pay a provider per token.", pros: ["No GPUs to run", "Strong models from day one", "Cost follows usage"], cons: ["Rate limits we do not control", "Data leaves our network", "The price per token does not fall as we grow"], bestFor: "New products, low or spiky traffic, tasks that need the strongest models" },
          { name: "Own model servers", summary: "Run open models on GPUs we rent or own.", pros: ["Data stays inside", "Full control of latency and versions", "Cheap per token when GPUs are kept busy"], cons: ["Capacity planning and on-call work", "Idle GPUs still cost money", "Usually smaller models"], bestFor: "Steady high traffic, strict data rules, narrow tasks a small model handles well" },
        ], rows: [
          ["Scaling limit", "The provider's quota", "The GPUs we can get"],
          ["Cost shape", "Per token", "Per GPU-hour, used or not"],
          ["Who handles outages", "The provider, plus our fallback", "We do"],
        ], verdict: "Many teams start hosted and later move steady, simple traffic to their own servers. The gateway makes that switch invisible to product teams." },
        { type: "p", text: "**Failures to raise before we are asked.** The provider slows down: timeouts and the circuit breaker stop requests from piling up. One team sends a burst: its own limit stops it and other teams are unaffected. The counter store dies: we fall back to local limits. A stream breaks half-way: the client gets a clear error and may retry with the same request ID. A gateway server dies: it is stateless, so the load balancer sends traffic to the other copies." },
        { type: "check", question: "A team's nightly job sends 5,000 long prompts at once, and the daytime chat product slows down. Both use the gateway. Name two design changes that prevent this.", answer: "First, limits per team on tokens per minute and on requests in flight, so one team cannot take the whole provider quota. Second, separate urgent from non-urgent traffic: the nightly job goes to a low-priority batch queue and runs when there is spare capacity. Reserving part of the quota for interactive traffic is a third option." },
      ],
    },
    {
      id: "how-design-is-judged",
      title: "How a design answer is judged",
      blocks: [
        { type: "p", text: "Interviewers do not hold a list of correct boxes. They look for evidence on a few **signals** and write down what they saw. The same signals are used at every level. What changes is how much we are expected to drive without help." },
        { type: "table", caption: "Signals in a design round", head: ["Signal", "Weak evidence", "Strong evidence"], rows: [
          ["Finding the problem", "Starts drawing at once", "Asks about users, scale and limits; names the hard part of this prompt"],
          ["Sound design", "A list of popular tools", "A simple pipeline where every part has a reason to exist"],
          ["Trade-offs", "One option, presented as the only one", "Two options, what each costs, and a choice tied to the requirements"],
          ["Numbers", "No estimates", "Rough traffic, tokens, memory and cost that change a decision"],
          ["Evaluation and operations", "Stops at 'then the model answers'", "Says how quality is measured, what can fail, and how we would notice"],
          ["Communication", "Long silences or a long monologue", "States a plan, thinks aloud, checks in, uses hints well"],
        ] },
        { type: "p", text: "At a junior or mid level, a clear and correct design of a bounded system is the goal, and the interviewer usually leads the deep dive. At a senior level we are expected to lead: choose the one or two areas that make this system hard, go deep there with detail from experience, and bring up failure modes and monitoring before anyone asks." },
      ],
    },
    {
      id: 'mistakes',
      title: 'Common mistakes',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Mistake: jumping to a complex architecture', text: 'Drawing microservices, Kafka and five databases for a system with 12 writes per second is over-engineering. Start from requirements and estimates, design the simplest thing that meets them, and add complexity only where the numbers demand it.' },
        { type: 'list', items: [
          '**Skipping requirements.** Designing before knowing scale or consistency needs leads to the wrong trade-offs.',
          '**Stateful app servers.** Storing sessions in server memory breaks when the load balancer sends the user elsewhere; keep state in a shared store.',
          '**Forgetting cache invalidation.** Updated data that stays cached causes users to see stale results.',
          '**Ignoring failure modes.** Every component can fail; ask what happens when it does.',
          '**Treating CAP as "pick any two" at all times.** The choice is forced only during a network partition.',
          '**Treating the model as a normal function.** It is slow, it costs money per token and it is sometimes wrong. It needs timeouts, limits, a fallback and an evaluation plan.',
          '**Estimating requests but not tokens.** Two services with the same requests per second can differ many times over in cost and in GPUs needed.',
          '**No plan for measuring quality.** Checking a few answers by hand does not survive the first prompt change. Name a test set and a metric.',
        ] },
        { type: 'check', question: 'A teammate wants to shard the URL table across 50 database servers on day one. Using the estimate from the code, is that justified?', answer: 'Probably not. About 12 writes/s, 1,157 reads/s and under 1 TB in five years fit a single primary database with read replicas and a cache. Sharding adds complexity we do not yet need; plan for it, but add it when growth requires.' },
      ],
    },
    {
      id: "worked-capacity-availability",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "Estimates are only useful if they turn into decisions. Let us take the shortener's numbers from the code (about 1,157 reads per second on average) and size the system. Three inputs below are **illustrative** assumptions that we would measure in real life: peak traffic is 5× the average, one app server handles 1,000 requests per second, and one app server is up 99% of the time." },
        { type: "steps", title: "From estimate to a sized design", items: [
          { title: "Design for the peak, not the average", text: "1,157 × 5 ≈ **5,800 requests per second** at peak. A link going viral does not wait for our average." },
          { title: "Count app servers", text: "5,800 / 1,000 = 5.8, so 6 servers carry the peak. Add one spare so that losing a server does not overload the rest: **7 servers** (often written N + 1)." },
          { title: "Size the cache", text: "Each record is about 500 bytes. Caching the 10 million hottest links needs 10,000,000 × 500 bytes = **5 GB** of memory, which fits on one cache machine." },
          { title: "What the cache buys", text: "At a 90% hit rate, the database sees 10% of peak reads: about 580 per second instead of 5,800. That is the difference between needing shards and not needing them." },
          { title: "Availability of redundant copies", text: "One server at 99% is down 1% of the time. Two independent servers are both down 1% × 1% = 0.01% of the time, so the pair is up **99.99%**. Redundancy multiplies the *failure* chances." },
          { title: "Availability of a chain", text: "A request needs the load balancer **and** the app tier **and** the database. If they are up 99.99%, 99.99% and 99.9%, the chain is up 0.9999 × 0.9999 × 0.999 ≈ **99.88%**. Parts in a row multiply the *success* chances, so the chain is weaker than its weakest part." },
        ] },
        { type: "table", caption: "Two rules of availability arithmetic", head: ["Arrangement", "Rule", "Example"], rows: [
          ["In parallel (any one copy is enough)", "1 − (chance that all copies fail)", "Two 99% servers → 1 − 0.01 × 0.01 = 99.99%"],
          ["In series (every part is needed)", "Multiply the availabilities", "99.99% × 99.99% × 99.9% ≈ 99.88%"],
        ] },
        { type: "p", text: "Two lessons. First, the weakest part in a chain sets the ceiling: here the database at 99.9%. Adding more app servers will not lift the total; replicating the database will. Second, the parallel rule assumes failures are **independent**. Two servers in the same rack, or running the same buggy release, fail together, and the real number is worse than the formula says." },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build the cache-aside pattern with an **LRU cache** and feed it traffic shaped like real link clicks: a few links are extremely popular and most are rarely visited. We measure the hit rate for three cache sizes, then check the availability arithmetic from the worked example." },
        { type: "code", lang: "python", title: "practice_cache_hit_rate.py", code: `# An LRU cache in front of a "database", fed with realistic skewed traffic.
import random
from collections import OrderedDict
random.seed(7)

N_URLS, N_REQUESTS = 10_000, 50_000
# A few links are very popular, most are rarely clicked (weight = 1 / rank).
weights = [1 / rank for rank in range(1, N_URLS + 1)]
requests = random.choices(range(N_URLS), weights=weights, k=N_REQUESTS)

def run(capacity):
    cache, hits = OrderedDict(), 0
    for code in requests:
        if code in cache:
            hits += 1
            cache.move_to_end(code)              # mark as most recently used
        else:                                    # miss: read the database...
            cache[code] = "long url"             # ...and fill the cache
            if len(cache) > capacity:
                cache.popitem(last=False)        # evict the least recently used
    return hits / N_REQUESTS

print("cache size  share of URLs  hit rate  database reads")
for capacity in (100, 1_000, 5_000):
    hit = run(capacity)
    print(f"{capacity:10,} {capacity / N_URLS:13.0%} {hit:9.1%} "
          f"{round((1 - hit) * N_REQUESTS):15,}")

# Availability: parts in a chain multiply; redundant copies multiply failures.
one = 0.99                                       # one app server, illustrative
pair = 1 - (1 - one) ** 2                        # down only if both are down
chain = 0.9999 * pair * 0.999                    # load balancer -> apps -> database
print(f"one server {one:.2%} | two in parallel {pair:.2%} | whole chain {chain:.2%}")`, output: `cache size  share of URLs  hit rate  database reads
       100            1%     39.2%          30,401
     1,000           10%     67.4%          16,296
     5,000           50%     85.2%           7,423
one server 99.00% | two in parallel 99.99% | whole chain 99.88%`,
          walkthrough: [
            { lines: [6, 9], note: "10,000 short links and 50,000 clicks. Link number 1 is the most popular; the link at rank r is clicked in proportion to 1 / r. This kind of skew is typical of real traffic." },
            { lines: [11, 21], note: "Cache-aside with LRU eviction. On a hit we move the entry to the 'recently used' end. On a miss we read the database, store the result, and evict the entry that has gone unused the longest if the cache is over capacity." },
            { lines: [23, 27], note: "A cache holding just 1% of the links serves 39% of requests. Holding 10% serves 67%. Each further step in size buys less." },
            { lines: [30, 33], note: "The two availability rules: two 99% servers in parallel give 99.99%, and the chain of load balancer, app pair and a 99.9% database gives 99.88%." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Make every link equally popular: `weights = [1] * N_URLS`. Predict the hit rate for the cache holding 10% of the links. What does this say about when caching works?",
          "Replace the LRU policy with 'evict a random entry' (for example, delete `random.choice(list(cache))`). Predict whether the hit rate for the 1,000-entry cache goes up, down or stays about the same.",
          "Change the database in the chain from `0.999` to `0.9999`. Predict the new chain availability. Then try three app servers instead of two and see which change helps more.",
        ] },
        { type: "check", question: "In the run above, a cache with 1% of the links already served 39% of requests, yet going from 10% to 50% of the links only raised the hit rate from 67% to 85%. Why do the gains shrink?", answer: "Because popularity is very uneven. The first entries we cache are the most-clicked links, and each one removes a lot of database reads. Later entries are rarely clicked links, so each adds little. Past some point, extra cache memory buys almost nothing, and the remaining misses are for the long tail of links that are clicked once in a while. This is also why uniform traffic caches badly: no small set of keys is hot." },
        { type: "check", question: "Our chain is 99.88% available and the business wants 99.95%. A teammate proposes adding a third and a fourth app server. Will that reach the target?", answer: "No. The app pair is already at 99.99%; making it 99.9999% changes the product by almost nothing. The chain is held back by the 99.9% database: even with perfect app servers the total would be about 0.9999 × 0.999 ≈ 99.89%. To reach 99.95% we must improve the weakest part, for example with a replica and automatic failover for the database." },
      ],
    },
  ],
  quiz: [
    { q: 'Which of these is a non-functional requirement?', options: ['Users can create a short link with an optional custom alias', '99.9% availability with p95 latency under 100 ms', 'Users can delete their links', 'Links redirect to the original URL'], answer: 1, explain: 'Availability and latency describe how well the system works, so they are non-functional. The others describe what the system does (functional).' },
    { q: 'An LLM service has a peak of 50 requests per second. Each answer is 200 output tokens. One GPU produces about 2,000 output tokens per second across its batch. How many GPUs does the speed limit ask for, before spares?', options: ['5', '10', '2', '40'], answer: 0, explain: 'Peak output is 50 × 200 = 10,000 tokens per second. Divided by 2,000 per GPU that is 5. 40 comes from dividing 2,000 by 50, which mixes up the units.' },
    { q: 'We shard data with hash(key) % N and must add one server to grow from 4 to 5. What problem should we expect, and what fixes it?', options: ['Most keys move; consistent hashing would move only about 1/N of them', 'No keys move, since existing keys keep their old shard; nothing to fix', 'All keys move to the new server; switch to vertical scaling instead', 'The hash function breaks for N = 5; replace it with a bigger machine'], answer: 0, explain: 'Because N is in the formula, changing it reassigns most keys (about 80% in our test). Consistent hashing moved only about 20%, the new server\'s fair share.' },
    { q: 'What best contrasts rate limiting a classic API with rate limiting an API that calls an LLM?', options: ['A classic API needs limits for each user, while an LLM API needs none at all', 'Both only need a cap on the number of requests per second for each user', 'LLM calls differ a lot in cost and time, so we also cap tokens and open requests', 'LLM APIs are limited mostly by disk space, so we cap the stored bytes for each user'], answer: 2, explain: 'One LLM request can use 100 times more tokens than another and can stay open for many seconds. A cap on request count alone does not protect the budget or the GPUs, so we also limit tokens per minute and requests in flight.' },
    { q: 'A colleague says: "CAP means a distributed database always gives up one of consistency, availability or partition tolerance." What is the more accurate statement?', options: ['CAP applies only to single-machine databases, not to distributed ones', 'During a network partition, it must choose between consistency and availability', 'With a fast enough network we can have all three properties at once', 'CAP stands for caching, availability and performance, not consistency'], answer: 1, explain: 'Partitions cannot be ruled out in distributed systems; the forced choice is between consistency and availability during one. Without a partition, a system can be both consistent and available.' },
  ],
  takeaways: [
    'System design decides components, responsibilities, data flow and storage so a system meets functional and non-functional requirements.',
    'We need it because single machines run out of capacity, fail, and are far from users; every fix has trade-offs.',
    'Core vocabulary: DNS, CDN, load balancer, stateless servers, cache, SQL/NoSQL, replication, sharding, consistent hashing, queues, CAP.',
    'Estimate first: requests per second, read/write ratio and storage tell you what you actually need.',
    'Start simple and add complexity only where numbers or failure modes demand it.',
    'With a model in the system, estimate tokens, GPU memory and GPU speed, and add success metrics, data, evaluation, safety and monitoring to the design process.',
  ],
  terms: [
    { term: 'Load balancer', def: 'A component that spreads incoming requests across several servers and skips unhealthy ones.' },
    { term: 'Horizontal scaling', def: 'Adding more machines to share the load, instead of making one machine bigger.' },
    { term: 'Cache', def: 'Fast storage, usually in memory, holding copies of frequently used data.' },
    { term: 'Replication', def: 'Keeping copies of the same data on several machines for availability and read capacity.' },
    { term: 'Sharding', def: 'Splitting a dataset across machines so each stores only part of it.' },
    { term: 'Consistent hashing', def: 'Assigning keys to servers on a hash ring so adding or removing a server moves only about 1/N of keys.' },
    { term: 'Model gateway', def: 'One shared entry point for model calls that handles keys, limits, routing, retries, fallback and logging.' },
    { term: 'CAP theorem', def: 'During a network partition, a distributed store must choose between consistency and availability.' },
  ],
};
