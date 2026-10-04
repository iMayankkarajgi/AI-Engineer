export default {
  id: 'system-design',
  minutes: 27,
  hook: 'Your code works perfectly on your laptop; what has to change when ten million people use it at the same time?',
  summary: 'System design is deciding how the parts of a software system (clients, servers, databases, caches, queues and the network between them) fit together so it meets its requirements for scale, speed, reliability and cost. We need it because one machine eventually runs out of capacity and fails, and every choice to fix that brings trade-offs. This lesson builds the core vocabulary: scaling, load balancing, caching, CDNs, databases, replication, sharding, consistent hashing, queues, CAP, and back-of-the-envelope estimation.',
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
        { type: 'p', text: 'System design is also a standard part of software engineering interviews, where the candidate designs a well-known system (a URL shortener, a chat app, a news feed, or, as in the previous lesson, a voice AI agent) and explains the trade-offs out loud.' },
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
    { q: 'A service receives 2,000 reads per second and its cache hit rate is 95%. How many reads per second hit the database?', options: ['1,900', '200', '95', '100'], answer: 3, explain: 'Misses are 5% of 2,000 = 100 per second. 1,900 is the number served by the cache.' },
    { q: 'We shard data with hash(key) % N and must add one server to grow from 4 to 5. What problem should we expect, and what fixes it?', options: ['Most keys move; consistent hashing would move only about 1/N of them', 'No keys move, since existing keys keep their old shard; nothing to fix', 'All keys move to the new server; switch to vertical scaling instead', 'The hash function breaks for N = 5; replace it with a bigger machine'], answer: 0, explain: 'Because N is in the formula, changing it reassigns most keys (about 80% in our test). Consistent hashing moved only about 20%, the new server\'s fair share.' },
    { q: 'What best contrasts horizontal and vertical scaling?', options: ['Vertical adds more machines; horizontal adds CPU and memory to one machine', 'Both remove every single point of failure, so the choice is just about cost', 'Horizontal adds machines and survives failures; vertical grows one box up to a limit', 'Horizontal needs stateful servers, so that each node keeps its own sessions'], answer: 2, explain: 'Scaling out adds machines (needs stateless services and distributed data); scaling up buys a bigger box, simpler but limited and still a single point of failure.' },
    { q: 'A colleague says: "CAP means a distributed database always gives up one of consistency, availability or partition tolerance." What is the more accurate statement?', options: ['CAP applies only to single-machine databases, not to distributed ones', 'During a network partition, it must choose between consistency and availability', 'With a fast enough network we can have all three properties at once', 'CAP stands for caching, availability and performance, not consistency'], answer: 1, explain: 'Partitions cannot be ruled out in distributed systems; the forced choice is between consistency and availability during one. Without a partition, a system can be both consistent and available.' },
  ],
  takeaways: [
    'System design decides components, responsibilities, data flow and storage so a system meets functional and non-functional requirements.',
    'We need it because single machines run out of capacity, fail, and are far from users; every fix has trade-offs.',
    'Core vocabulary: DNS, CDN, load balancer, stateless servers, cache, SQL/NoSQL, replication, sharding, consistent hashing, queues, CAP.',
    'Estimate first: requests per second, read/write ratio and storage tell you what you actually need.',
    'Start simple and add complexity only where numbers or failure modes demand it.',
  ],
  terms: [
    { term: 'Load balancer', def: 'A component that spreads incoming requests across several servers and skips unhealthy ones.' },
    { term: 'Horizontal scaling', def: 'Adding more machines to share the load, instead of making one machine bigger.' },
    { term: 'Cache', def: 'Fast storage, usually in memory, holding copies of frequently used data.' },
    { term: 'Replication', def: 'Keeping copies of the same data on several machines for availability and read capacity.' },
    { term: 'Sharding', def: 'Splitting a dataset across machines so each stores only part of it.' },
    { term: 'Consistent hashing', def: 'Assigning keys to servers on a hash ring so adding or removing a server moves only about 1/N of keys.' },
    { term: 'CAP theorem', def: 'During a network partition, a distributed store must choose between consistency and availability.' },
  ],
};
