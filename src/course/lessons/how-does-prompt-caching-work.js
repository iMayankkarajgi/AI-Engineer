export default {
  id: "how-does-prompt-caching-work",
  minutes: 22,
  hook: "If our chatbot sends the same 20,000-token manual with every question, why should the model read it from scratch every single time?",
  summary: "When an LLM reads a prompt it computes internal key and value tensors for every token. Prompt caching stores those tensors for a prompt prefix so the next request that starts with exactly the same tokens can skip that work. The result is lower latency and much cheaper input tokens, as long as we put the stable content first and keep it byte-for-byte identical.",
  sections: [
    {
      id: "prompt-recap",
      title: "What is a prompt, and how does an LLM read it?",
      blocks: [
        { type: "p", text: "A **prompt** is everything we send to a large language model (LLM) in one request: the system prompt (standing instructions), tool definitions, documents, earlier conversation turns and the new user message. The model turns this text into **tokens**, small pieces of text, and processes them in two phases." },
        { type: "list", ordered: true, items: [
          "**Prefill.** The model reads all prompt tokens. In every layer, for every token, it computes a **key** vector and a **value** vector (the K and V of attention). These are stored in the **KV cache**, a block of GPU memory for this request.",
          "**Decode.** The model generates the answer one token at a time. Each new token attends to all the stored keys and values instead of recomputing them."
        ] },
        { type: "p", text: "Prefill work grows with prompt length. A 24,000-token prompt means 24,000 tokens' worth of keys and values in every layer before the first answer token can appear. That is why long prompts have a slow **time to first token (TTFT)** and why providers charge for input tokens." },
        { type: "callout", tone: "analogy", title: "Think of it like a chef's mise en place", text: "A restaurant does not chop onions from scratch for every order. It preps the common ingredients once, keeps them ready for a while, and only cooks the part that is unique to each dish. Prompt caching preps the shared start of our prompts once and reuses it for every order that begins the same way." }
      ]
    },
    {
      id: "what-is-caching",
      title: "What is prompt caching, and why do we need it?",
      blocks: [
        { type: "p", text: "**Prompt caching** (also called prefix caching or context caching) means the provider keeps the KV cache of a prompt's beginning after a request finishes. When a later request starts with the **same prefix**, the model loads those stored keys and values and only runs prefill on the new tokens at the end." },
        { type: "p", text: "Our running example: Acme's support bot. Every request contains a 4,000-token system prompt plus a 20,000-token product manual, followed by a 50-token customer question. Without caching, every question pays to process 24,050 tokens. With caching, after the first request only the 50 new tokens need full processing." },
        { type: "list", items: [
          "**Chatbots** resend the whole conversation on every turn; each turn shares everything before it with the previous turn.",
          "**RAG and document Q&A** resend the same long document for many questions.",
          "**Agents** resend a long system prompt and tool list on every step of their loop, often dozens of times per task.",
          "**Coding assistants** resend large chunks of the same codebase again and again."
        ] },
        { type: "p", text: "In all these cases most of each prompt is a repeat. Caching turns that repeated work into a cheap lookup." }
      ]
    },
    {
      id: "core-idea",
      title: "The core idea: a prefix's keys and values never change",
      blocks: [
        { type: "p", text: "Why is reuse even allowed? Because LLMs use **causal attention**: token number i can only look at tokens 1 to i, never at later tokens. So the keys and values for the first 24,000 tokens depend only on those 24,000 tokens. Whatever we append afterwards cannot change them. Two prompts that share the same first N tokens have **identical** KV tensors for those N tokens." },
        { type: "steps", title: "What happens on a cached request", items: [
          { title: "Hash the prefix", text: "The serving system computes a fingerprint (hash) of the prompt's leading tokens, often in fixed-size blocks." },
          { title: "Look it up", text: "If a stored KV cache with that fingerprint exists and has not expired, it is a **cache hit**. Otherwise it is a **cache miss**." },
          { title: "Reuse or compute", text: "On a hit, the stored keys and values are loaded. On a miss, prefill runs normally and the result is saved for next time (a **cache write**)." },
          { title: "Prefill only the new part", text: "The model runs prefill on the tokens after the cached prefix, here the 50-token question." },
          { title: "Decode as usual", text: "Answer generation is unchanged. Caching changes speed and cost, never the content of the answer." }
        ] },
        { type: "flow", title: "One request through a prompt cache", nodes: [
          { label: "Prompt", detail: "System prompt + manual (stable) + question (new)." },
          { label: "Hash prefix", detail: "Fingerprint the stable leading tokens." },
          { label: "Lookup", detail: "Hit: load stored KV. Miss: compute KV and store it." },
          { label: "Prefill tail", detail: "Only the new tokens at the end are processed from scratch." },
          { label: "Decode", detail: "Generate the answer exactly as without caching." }
        ] },
        { type: "viz", name: "prompt-caching", caption: "Slide the shared-prefix share up and watch latency and cost fall for cached requests. The bigger the stable part of the prompt, the bigger the win." }
      ]
    },
    {
      id: "exact-prefix-rule",
      title: "The exact-prefix rule",
      blocks: [
        { type: "p", text: "A cache hit needs the prompt to match **exactly, from the very first token**, up to the cached point. Matching is on tokens, not meaning. One changed character changes the tokens there, and because every later key and value depends on all earlier tokens, everything after that point must be recomputed." },
        { type: "list", items: [
          "Changing “Acme” to “ACME” in the system prompt → miss for the whole prompt.",
          "Putting today's date or a request ID at the **top** of the prompt → a miss on every new date or ID.",
          "Reordering tool definitions or JSON keys between requests → miss.",
          "Changing only the user question at the **end** → hit on everything before it."
        ] },
        { type: "callout", tone: "tip", title: "Order the prompt from most stable to least stable", text: "Tools and system instructions first, then large reference documents and few-shot examples, then the conversation history, and the new user message last. Anything that changes per request (timestamps, user names, retrieved snippets) goes as late as possible." },
        { type: "check", question: "Pause and predict: we add “Current time: 10:42:07” as the first line of the system prompt. What happens to our cache hit rate?", answer: "It drops to roughly zero. The first tokens differ on every request, so no request shares a prefix with an earlier one. Moving the timestamp to the end (or removing it) restores the hits." }
      ]
    },
    {
      id: "write-read-ttl",
      title: "Cache write vs cache read, and TTL",
      blocks: [
        { type: "p", text: "Providers price the two events differently. A **cache write** happens on a miss: the prefix is processed and stored. A **cache read** happens on a hit: the stored prefix is reused. Stored caches do not live forever. The **TTL (time to live)** is how long a cache entry survives without being used; each hit usually resets the clock." },
        { type: "table", caption: "How major APIs approach caching (as of 2026; details and prices change, so check current docs)", head: ["Provider", "How it is turned on", "Pricing idea", "Lifetime"], rows: [
          ["Anthropic (Claude)", "Explicit: mark cache breakpoints with `cache_control`", "Writes cost more than normal input (1.25× for the 5-minute TTL); reads cost about 0.1×", "5 minutes by default, refreshed on each hit; a 1-hour option at a higher write price"],
          ["OpenAI", "Automatic for long prompts (from 1,024 tokens)", "No write surcharge; cached input tokens are discounted, by an amount that depends on the model", "Typically minutes of inactivity; longer at off-peak times"],
          ["Google (Gemini)", "Implicit (automatic) caching on recent models, plus explicit context caches", "Discounted cached tokens; explicit caches also pay for storage time", "Explicit caches have a TTL we set"],
          ["Self-hosted (vLLM, SGLang)", "Automatic prefix caching in the server", "No price, just saved GPU work", "Until evicted from GPU memory"]
        ] },
        { type: "p", text: "There is usually a **minimum length** to cache (for example around 1,024 tokens on many models), because caching a tiny prefix saves almost nothing." },
        { type: "deeper", title: "The break-even math", blocks: [
          { type: "formula", expr: "cost(n calls) = P · B · w + (n − 1) · P · B · r + n · N · B", where: [["P", "prefix tokens (24,000)"], ["N", "new tokens per call (50)"], ["B", "base price per input token"], ["w, r", "write and read multipliers (1.25 and 0.10 here)"], ["n", "number of calls within the TTL"]] },
          { type: "p", text: "Without caching each call costs (P + N) · B. With w = 1.25 and r = 0.10, two calls already cost 1.35 · P · B for the prefix instead of 2 · P · B. So caching pays for itself as soon as the prefix is reused **once** within the TTL. If a prefix is never reused, we pay the 25% write premium for nothing." }
        ] }
      ]
    },
    {
      id: "code",
      title: "Code you can run: a toy prefix cache with prices",
      blocks: [
        { type: "p", text: "This simulation hashes the exact prefix text as the cache key and applies illustrative prices: $3 per million input tokens, writes at 1.25×, reads at 0.10×." },
        { type: "code", lang: "python", title: "prefix_cache.py", code: `import hashlib

BASE = 3.00 / 1_000_000      # illustrative $ per input token
WRITE, READ = 1.25, 0.10     # illustrative multipliers: cache write, cache read
cache = {}                   # prefix hash -> tokens stored

def run(prefix_blocks, new_tokens):
    # The cache key is a hash of the EXACT prefix text
    text = "".join(t for t, _ in prefix_blocks)
    n_prefix = sum(n for _, n in prefix_blocks)
    key = hashlib.sha256(text.encode()).hexdigest()[:10]
    if key in cache:
        status, mult = "HIT ", READ
    else:
        cache[key] = n_prefix
        status, mult = "MISS", WRITE
    cost = n_prefix * BASE * mult + new_tokens * BASE
    plain = (n_prefix + new_tokens) * BASE
    print(f"{status} key={key} cost=\${cost:.4f}  (no caching: \${plain:.4f})")
    return cost

system = ("You are the support bot for Acme...", 4_000)
manual = ("<product manual text>", 20_000)

total = sum(run([system, manual], new_tokens=50) for _ in range(4))
print(f"4 calls: \${total:.4f} with caching vs \${4 * 24_050 * BASE:.4f} without")

# Change ONE character in the system prompt -> new hash -> cache miss
run([("You are the support bot for ACME...", 4_000), manual], new_tokens=50)`, output: `MISS key=6a42db1fb8 cost=$0.0902  (no caching: $0.0722)
HIT  key=6a42db1fb8 cost=$0.0074  (no caching: $0.0722)
HIT  key=6a42db1fb8 cost=$0.0074  (no caching: $0.0722)
HIT  key=6a42db1fb8 cost=$0.0074  (no caching: $0.0722)
4 calls: $0.1122 with caching vs $0.2886 without
MISS key=da6706aa2f cost=$0.0902  (no caching: $0.0722)`,
          walkthrough: [
            { lines: [3, 5], note: "Illustrative prices and an empty cache (a dict from prefix hash to size)." },
            { lines: [7, 11], note: "The key is a SHA-256 hash of the exact prefix text, so any change produces a different key." },
            { lines: [12, 16], note: "Hit: price the prefix at the read rate. Miss: store it and price it at the write rate." },
            { lines: [17, 20], note: "New tokens always pay full price. We also print what the call would cost without caching." },
            { lines: [22, 26], note: "Four questions share the same 24,000-token prefix: one miss, then three hits." },
            { lines: [28, 29], note: "Changing “Acme” to “ACME” gives a new hash and a full-price miss again." }
          ] },
        { type: "chart", kind: "bar", title: "Cost of one request in the simulation", yLabel: "US dollars", unit: " $", labels: ["No caching", "Cache miss (write)", "Cache hit (read)"], series: [ { name: "Cost per call", values: [0.0722, 0.0902, 0.0074] } ], caption: "From the code output above, using illustrative prices. The first call costs more than no caching; every hit after it costs about a tenth." },
        { type: "check", question: "From the output: across 4 calls we paid $0.1122 instead of $0.2886. Why is the first call more expensive than not caching at all?", answer: "The first call is a cache write, and in this pricing writes cost 1.25× normal input. We pay a small premium once so that later calls can read the prefix at 0.10×. Three hits more than repay it." }
      ]
    },
    {
      id: "what-to-cache",
      title: "What we should put in the cache",
      blocks: [
        { type: "list", items: [
          "**Long system prompts** and behaviour rules that are the same for every user.",
          "**Tool and function definitions** for agents, which can run to thousands of tokens.",
          "**Reference material**: manuals, policies, codebases, long documents users ask many questions about.",
          "**Few-shot examples** that never change.",
          "**Conversation history** in multi-turn chats: each turn's prompt extends the previous one, so with a breakpoint near the end of the history every turn reuses the previous turn's cache."
        ] },
        { type: "p", text: "Do not try to cache content that changes on every request, or short prompts below the minimum length. And remember caching is per exact prefix: two users with different system prompts get separate caches." },
        { type: "compare", title: "Prompt caching vs response caching",
          options: [
            { name: "No caching", summary: "Every request is processed from scratch.", pros: ["Simplest", "No stale data risk"], cons: ["Pays full price for repeated text", "Slow TTFT on long prompts"], bestFor: "Short prompts, little repetition" },
            { name: "Prompt (prefix) caching", summary: "Reuses the computed KV of an identical prompt prefix; the model still generates a fresh answer.", pros: ["Answer quality unchanged", "Big savings on long shared prefixes", "Works for any question"], cons: ["Needs an exact prefix match", "Entries expire after the TTL"], bestFor: "Long shared system prompts, documents, tools, chat history" },
            { name: "Response / semantic caching", summary: "Stores whole answers and returns one when a new question is the same or similar.", pros: ["Skips the model entirely", "Near-zero cost on a hit"], cons: ["Can return a stale or wrong answer for a similar-looking question", "Answers are not personalized"], bestFor: "FAQ-style repeated questions" }
          ],
          rows: [
            ["What is reused", "Nothing", "Prefix keys and values", "The final answer text"],
            ["Model still runs?", "Yes, fully", "Yes, only for new tokens", "No"],
            ["Can change the answer?", "No", "No", "Yes, if the match is wrong"]
          ],
          verdict: "Prompt caching is a safe speed-and-cost optimization with no change in output. Response caching is a bigger shortcut with a correctness risk; they can be combined." }
      ]
    },
    {
      id: "benefits-real-world",
      title: "Benefits, real-world use and pitfalls",
      blocks: [
        { type: "list", items: [
          "**Lower cost.** Cached input tokens are billed at a large discount.",
          "**Lower latency.** Skipping prefill on a long prefix cuts time to first token, often substantially for very long prompts.",
          "**Same output.** The cached keys and values are the same numbers prefill would have produced, so caching is meant to leave answer quality unchanged.",
          "**Enables long-context designs.** Putting a whole manual or codebase in the prompt becomes affordable when it is paid for mostly once."
        ] },
        { type: "callout", tone: "example", title: "Prompt caching in the real world", text: "Coding agents resend a large system prompt, tool list and file contents on every step, so they lean heavily on caching. Chat products place a cache breakpoint at the end of the conversation so each new turn reuses the previous one. Document assistants cache a long contract once and answer many questions about it within minutes. Self-hosted servers like vLLM and SGLang reuse shared prefixes across users who share a system prompt." },
        { type: "callout", tone: "warn", title: "Common mistakes", text: "Putting dynamic content (dates, user IDs, retrieved chunks) before the stable content. Serializing JSON or tools in a different order each time. Assuming a cache survives an hour when the TTL is 5 minutes and traffic is sparse. Not checking the usage fields in the API response, which report how many tokens were read from or written to the cache: if cached tokens show 0, the prefix is not matching." }
      ]
    },
    {
      id: "worked-chat-example",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "Chats are where caching feels most natural, so let us count one. A support chat has a 2,000-token system prompt. Each user message is 100 tokens and each reply is 300 tokens. We place the cache point at the end of every request. All numbers are illustrative." },
        { type: "table", caption: "Input tokens per turn. “Read” tokens come from the cache; “new” tokens are processed and written.", head: ["Turn", "Input tokens", "Read from cache", "New"], rows: [["1", "2,000 + 100 = 2,100", "0", "2,100"], ["2", "2,100 + 300 + 100 = 2,500", "2,100", "400"], ["3", "2,500 + 300 + 100 = 2,900", "2,500", "400"]] },
        { type: "p", text: "Notice that the last reply counts as new input on the next turn. The model wrote it as output. When we send it back, it is fresh prompt text that sits after the cached point." },
        { type: "steps", title: "Pricing the three turns (write 1.25×, read 0.10×, in units of one normal input token)", items: [{ title: "Without caching", text: "2,100 + 2,500 + 2,900 = 7,500 units." }, { title: "Turn 1", text: "Everything is a write: 2,100 × 1.25 = 2,625." }, { title: "Turn 2", text: "2,100 read and 400 written: 210 + 500 = 710." }, { title: "Turn 3", text: "2,500 read and 400 written: 250 + 500 = 750." }, { title: "Total", text: "2,625 + 710 + 750 = 4,085 units, about 46% less than 7,500. The gap widens with every extra turn, because the read part keeps growing while the new part stays at 400." }] },
        { type: "p", text: "The same table explains a classic failure. If the app edits an early message in the middle of a chat, for example by trimming the oldest turn or by re-wording the system prompt, the prefix changes at that point. Every token after it is new again, and that turn is billed like turn 1." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build a cache that works on the blocks of a prompt. For each request it finds the longest run of leading blocks it has seen before, and it forgets entries that were not used for 300 seconds. Token counts are illustrative." },
        { type: "code", lang: "python", title: "practice_block_cache.py", code: `import hashlib

TTL = 300                      # seconds an unused entry survives
cache = {}                     # prefix hash -> time of last use

def key(blocks):
    return hashlib.sha256("|".join(blocks).encode()).hexdigest()[:8]

def request(blocks, sizes, now):
    # Find the longest prefix of blocks that is cached and not expired
    hit = 0
    for i in range(len(blocks), 0, -1):
        k = key(blocks[:i])
        if k in cache and now - cache[k] <= TTL:
            hit = i
            break
    # Store (or refresh) every prefix of this request for later calls
    for i in range(1, len(blocks) + 1):
        cache[key(blocks[:i])] = now
    read, fresh = sum(sizes[:hit]), sum(sizes[hit:])
    print(f"t={now:3}s  cached blocks={hit}  read={read:5}  computed={fresh:5}")

sizes = [4000, 20000, 50]      # illustrative token counts per block
system, manual = "system rules v1", "product manual v7"

request([system, manual, "Q: how do I descale?"], sizes, now=0)
request([system, manual, "Q: is the lid dishwasher safe?"], sizes, now=60)
request([system, manual, "Q: what is the warranty?"], sizes, now=500)
request(["time 10:42", system, manual], [10, 4000, 20000], now=510)
request(["time 10:43", system, manual], [10, 4000, 20000], now=520)`, output: `t=  0s  cached blocks=0  read=    0  computed=24050
t= 60s  cached blocks=2  read=24000  computed=   50
t=500s  cached blocks=0  read=    0  computed=24050
t=510s  cached blocks=0  read=    0  computed=24010
t=520s  cached blocks=0  read=    0  computed=24010`, walkthrough: [{ lines: [3, 7], note: "A TTL, an empty cache, and a key function that hashes a run of leading blocks." }, { lines: [10, 16], note: "Lookup: try the longest prefix first, then shorter ones. An entry counts only if it was used within the TTL." }, { lines: [17, 21], note: "Store or refresh every prefix of this request, then report how many tokens were read from the cache and how many had to be computed." }, { lines: [26, 30], note: "Five requests: a first call, a quick follow-up, a late follow-up, and two calls that put a time string in front." }] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: ["Change the third request from `now=500` to `now=350`. Predict hit or miss before running. Remember that each use resets the clock.", "In the last two requests, move the time block to the end: `[system, manual, \"time 10:42\"]` with sizes `[4000, 20000, 10]`. Predict `read` and `computed` for both.", "Give the second request a new manual, `\"product manual v8\"`. Predict `cached blocks`, `read` and `computed` for it."] },
        { type: "check", question: "Request 3 arrives at t=500 and misses, although the same prefix was a hit at t=60 and no text changed. What happened? And what would one question every 4 minutes have done?", answer: "The entry expired. It was last used at t=60, and 440 seconds passed, which is more than the 300-second TTL. Each use resets the clock, so a question every 240 seconds would have kept the entry alive without end. Sparse traffic caused this miss, not changed text. That is why low-traffic apps see fewer hits than their prompts suggest." },
        { type: "check", question: "Our cache stores every leading run of blocks, not just the whole prompt. Suppose we stored one entry per request, keyed on all its blocks together. What would happen to request 2?", answer: "It would miss. Request 2 ends with a different question, so its full-prompt key was never stored. The saving comes from matching a *prefix* that is shorter than the whole prompt: system plus manual. This is why the stable part must end before the changing part begins, and why real APIs cache up to a marked point or in blocks instead of whole prompts." }
      ]
    }
  ],
  quiz: [
    { q: "What does a prompt cache actually store?", options: ["The model's final answer text for each question it has seen", "The key and value tensors computed for a prompt prefix", "A compressed natural-language summary of the prompt text", "A copy of the model weights so they load faster on the GPU"], answer: 1, explain: "Prompt caching stores the KV tensors from prefill for the prefix, so later requests skip that computation. Storing whole answers is response caching, a different technique." },
    { q: "Our bot's cache hit rate is near 0%. The prompt starts with “Request ID: 8f3a…” followed by a long, fixed system prompt. What should we change?", options: ["Increase the TTL so cache entries live much longer", "Shorten the fixed system prompt to under 1,000 tokens", "Switch to a larger model with a bigger context window", "Move the request ID to the end of the prompt, or drop it"], answer: 3, explain: "The exact-prefix rule: a unique ID at the start makes every prompt different from token one, so nothing matches. Put changing content last." },
    { q: "Prefix of 24,000 tokens, write = 1.25×, read = 0.10×. Over two calls within the TTL, how much do we pay for the prefix, in units of one uncached prefix?", options: ["1.35", "2.00", "1.25", "0.20"], answer: 0, explain: "First call writes (1.25) and the second reads (0.10): 1.35 in total, versus 2.00 without caching. So caching pays off after a single reuse." },
    { q: "How does prompt caching differ from semantic (response) caching?", options: ["Prompt caching returns stored answers for similar questions; semantic caching stores KV tensors", "They are two names for the same mechanism, used by different API providers and frameworks", "Prompt caching still runs the model, so answers are unchanged; semantic caching may skip it", "Prompt caching only helps when two user questions are word-for-word identical to each other"], answer: 2, explain: "Prompt caching reuses prefix computation, then generates a fresh answer for any question. Semantic caching returns an old answer, which can be wrong if the similarity match is off. The first option has them reversed." },
    { q: "Which statement is a misconception?", options: ["Causal attention is what makes prefix reuse valid", "Caching a never-reused prefix can cost a bit more", "Cache entries expire if unused longer than the TTL", "Prompts with the same meaning share a cache hit"], answer: 3, explain: "Caching matches exact tokens, not meaning. Different wording means different tokens and a miss. The other three statements are correct." }
  ],
  takeaways: [
    "Prefill computes keys and values for every prompt token; prompt caching stores them for a prefix and reuses them.",
    "Causal attention makes this safe: a prefix's KV never depends on what comes after it.",
    "Hits need an exact token match from the first token, so put stable content first and dynamic content last.",
    "Writes may cost a little extra, reads cost far less, and entries expire after a TTL refreshed by hits.",
    "Caching lowers cost and time to first token without changing the answer."
  ],
  terms: [
    { term: "Prefill", def: "The phase where the model processes all prompt tokens and builds the KV cache." },
    { term: "KV cache", def: "Stored key and value vectors for processed tokens, reused during generation." },
    { term: "Prompt caching", def: "Keeping the KV cache of a prompt prefix so later requests with the same prefix skip its prefill." },
    { term: "Exact-prefix rule", def: "A cache hit requires the prompt to match token-for-token from the start up to the cached point." },
    { term: "Cache write / cache read", def: "Storing a new prefix on a miss vs reusing a stored prefix on a hit; often priced differently." },
    { term: "TTL", def: "Time to live: how long an unused cache entry is kept before it expires." },
    { term: "Time to first token (TTFT)", def: "Delay between sending a request and receiving the first generated token." }
  ]
};
