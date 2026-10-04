export default {
  id: 'how-does-sglang-work',
  minutes: 27,
  hook: 'When an AI agent calls the same model twenty times with almost the same long prompt, why should the GPU redo all that work twenty times?',
  summary: 'SGLang is an open-source LLM serving engine plus a small Python language for writing multi-call LLM programs. Its runtime keeps the KV cache of past requests in a radix tree (RadixAttention) so any later request that shares a prefix reuses that work automatically, and it schedules requests to maximise those cache hits. Together with continuous batching, fast structured (JSON/regex) decoding and many performance features, it delivers high throughput, especially for agents, few-shot prompts and multi-turn chat.',
  sections: [
    {
      id: 'what-is-sglang',
      title: 'What is SGLang',
      blocks: [
        { type: 'p', text: '**SGLang** is an open-source system for running large language models fast. It was introduced by researchers from LMSYS (with members from Stanford and UC Berkeley) in the paper *SGLang: Efficient Execution of Structured Language Model Programs* (Zheng et al., first released in December 2023 and published at NeurIPS 2024). The name stands for **Structured Generation Language**.' },
        { type: 'p', text: 'SGLang has two parts that are designed together:' },
        { type: 'list', items: [
          'A **backend runtime**: a high-performance serving engine (like vLLM) that runs models on GPUs and exposes an OpenAI-compatible API.',
          'A **frontend language**: a small set of Python primitives for writing programs that call the model many times, branch, run in parallel and constrain outputs.',
        ] },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a librarian who remembers your research', text: 'Each time you ask a normal librarian a question, they re-read the whole background file from scratch. An SGLang-style librarian keeps a tree of everything already read. If your new question starts with the same file, they jump straight to the new part. The more your questions share, the faster they get.' },
        { type: 'p', text: 'Our running example: a shopping **agent** that, for every user, sends the same long instructions and tool descriptions, adds a few worked examples, and then calls the model several times in a loop (plan, call a tool, read the result, answer), often asking for JSON output.' },
      ],
    },
    {
      id: 'generation-recap',
      title: 'A quick recap of how an LLM generates text',
      blocks: [
        { type: 'p', text: 'An LLM turns text into **tokens**, then generates one token at a time. First comes **prefill**: the whole prompt is processed in one pass, and for every token in every layer the model computes **keys** and **values** (vectors that later tokens attend to). Those are stored in the **KV cache**. Then comes **decode**: each new token is produced by attending over the KV cache, and its own keys and values are appended.' },
        { type: 'p', text: 'Prefill work grows with prompt length. For a 3,000-token prompt, computing those keys and values is a large chunk of the total cost and is what makes **time to first token** slow. The key fact for this lesson: the KV entries for a token depend only on that token and the tokens **before** it. So two prompts that begin with the same tokens have identical KV entries for that shared beginning (the **prefix**).' },
      ],
    },
    {
      id: 'the-problem',
      title: 'The problem SGLang solves',
      blocks: [
        { type: 'p', text: 'Real LLM applications are rarely one prompt and one answer. They are **LLM programs**: agents that loop, multi-turn chats, few-shot prompts with fixed examples, tree-of-thought searches that branch, retrieval pipelines that reuse documents. These programs share a lot of prefix:' },
        { type: 'list', items: [
          'Every agent call repeats the same system prompt and tool descriptions.',
          'Every turn of a chat repeats the entire conversation so far.',
          'Every few-shot request repeats the same examples.',
          'Branches of a search share the reasoning that came before the branch point.',
        ] },
        { type: 'p', text: 'A typical engine of the time threw away a request\'s KV cache as soon as it finished, so the next call recomputed the same prefix from scratch. Writing these programs was also clumsy: developers glued together string templates, many API calls and manual parallelism, and the engine could not see the structure to optimise it. SGLang attacks both problems: reuse the KV cache across calls, and give programmers a language whose structure the runtime can exploit.' },
        { type: 'check', question: 'In our agent, the instructions plus tool descriptions are 2,000 tokens and each step adds about 200 new tokens. On step 5, roughly what fraction of the prompt was already computed in earlier steps?', answer: 'About 2,800 of 3,000 tokens (around 93%): the 2,000-token instructions plus the 800 tokens of steps 1–4 are an exact prefix of step 5\'s prompt. Only the newest 200 tokens truly need prefill if the cache is reused.' },
      ],
    },
    {
      id: 'radix-attention',
      title: 'RadixAttention: the heart of SGLang',
      blocks: [
        { type: 'p', text: 'A **radix tree** is a compact prefix tree. Each edge is labelled with a sequence of tokens, and any path from the root spells out a token sequence. Sequences that share a beginning share the same path until they differ, at which point the tree **branches**. (It is "compact" because a chain of single-child nodes is merged into one edge.)' },
        { type: 'p', text: '**RadixAttention** stores the KV cache in exactly such a tree. The tokens on each edge are paired with their cached keys and values, which live in GPU memory in a paged layout. Instead of discarding a finished request\'s KV cache, SGLang keeps it in the tree, so it can serve later requests.' },
        { type: 'flow', title: 'Shapes the radix tree takes for our agent', nodes: [
          { label: 'Root', detail: 'The empty sequence.' },
          { label: 'System prompt', detail: 'One shared edge: instructions + tool descriptions, reused by every user and every step.' },
          { label: 'Few-shot examples', detail: 'Another shared edge for requests that add the same worked examples.' },
          { label: 'Per-user branch', detail: 'The tree branches per conversation: each user\'s history is its own path below the shared prefix.' },
          { label: 'Per-step growth', detail: 'Each new agent step extends that user\'s path with the tool result and the model\'s reply.' },
        ] },
        { type: 'p', text: 'GPU memory is limited, so the tree cannot grow forever. SGLang evicts using **LRU** (least recently used): when memory is needed it removes **leaf** nodes that have not been used for the longest time, working upward. Nodes that a running request is currently using are protected by a **reference count** and are never evicted.' },
      ],
    },
    {
      id: 'reusing-past-work',
      title: 'How RadixAttention reuses past work',
      blocks: [
        { type: 'steps', title: 'What happens when a request arrives', items: [
          { title: 'Match the longest prefix', text: 'Walk the radix tree with the request\'s tokens and find the longest path that matches.' },
          { title: 'Reuse its KV cache', text: 'The matched tokens already have keys and values in GPU memory. Lock those nodes (increase their reference count) so they are not evicted.' },
          { title: 'Prefill only the rest', text: 'Run prefill only for the unmatched suffix, attending to the reused KV entries as if they had just been computed.' },
          { title: 'Decode and insert', text: 'Generate the answer as usual; the new prompt suffix and output tokens become new nodes in the tree.' },
          { title: 'Release, keep, maybe evict', text: 'When the request ends, unlock its nodes. They stay cached for future requests until LRU eviction needs the space.' },
        ] },
        { type: 'p', text: 'The runtime also uses **cache-aware scheduling**. When many requests are waiting, SGLang prefers those with the **longest matched prefix** rather than strict arrival order. Requests that share a prefix then run close together in time, while their shared nodes are still in memory, which raises the hit rate. (Pure longest-prefix-first can starve some requests, so real schedulers balance it with fairness.)' },
        { type: 'code', lang: 'python', title: 'prefix_cache.py', code: `# A tiny prefix tree (trie) over tokens: the idea behind RadixAttention's cache.
# A real radix tree merges single-child chains into one edge; the matching logic is the same.
class Node:
    def __init__(self):
        self.children = {}          # token -> Node (each node = KV cache of one token)

root = Node()

def match_and_insert(tokens):
    node, hit = root, 0
    for i, tok in enumerate(tokens):
        if tok in node.children and hit == i:
            hit += 1                # this token's KV is already cached: reuse it
        node = node.children.setdefault(tok, Node())
    return hit                      # number of prompt tokens we do not recompute

system = "You are a helpful support agent .".split()
shots = "Q: refund ? A: 30 days . Q: shipping ? A: 5 days .".split()
requests = [
    system + shots + "Q: warranty ?".split(),          # few-shot request 1
    system + shots + "Q: returns ?".split(),           # same examples, new question
    system + "User: hi Bot: hello".split(),            # chat turn 1
    system + "User: hi Bot: hello User: reset password ?".split(),  # chat turn 2
    "Translate to French : cat".split(),               # unrelated prompt
]
total = cached = 0
for r in requests:
    hit = match_and_insert(r)
    total, cached = total + len(r), cached + hit
    print(f"{len(r):2d} tokens, {hit:2d} reused from cache -> prefill only {len(r) - hit:2d}")
print(f"overall cache hit rate: {cached}/{total} = {cached / total:.0%}")

# Jump-forward decoding: in a JSON template, fixed text needs no model call.
template = ['{"name": "', None, '", "age": ', None, '}']   # None = model must generate
fixed = sum(len(p) for p in template if p)
print(f"characters appended without the model: {fixed}; free slots to generate: {template.count(None)}")`, output: `24 tokens,  0 reused from cache -> prefill only 24
24 tokens, 22 reused from cache -> prefill only  2
11 tokens,  7 reused from cache -> prefill only  4
15 tokens, 11 reused from cache -> prefill only  4
 5 tokens,  0 reused from cache -> prefill only  5
overall cache hit rate: 40/79 = 51%
characters appended without the model: 21; free slots to generate: 2`, walkthrough: [
          { lines: [3, 7], note: 'Each node stands for one cached token\'s KV entries; children are keyed by the next token. A real radix tree compresses chains, but matching works the same way.' },
          { lines: [9, 15], note: 'Walk the tree along the request. Count tokens that were already present as a continuous prefix (those are reused), and insert the new ones for future requests.' },
          { lines: [17, 25], note: 'Five requests: two few-shot prompts with the same examples, two turns of one chat, and one unrelated prompt.' },
          { lines: [26, 31], note: 'The second few-shot request reuses 22 of 24 tokens; chat turn 2 reuses all of turn 1. Overall about half of all prompt tokens skip prefill, even in this tiny example.' },
          { lines: [33, 36], note: 'A preview of structured decoding: in a fixed JSON template, the literal parts can be appended without asking the model.' },
        ] },
      ],
    },
    {
      id: 'frontend-language',
      title: 'The frontend language of SGLang',
      blocks: [
        { type: 'p', text: 'SGLang\'s frontend is a **domain-specific language embedded in Python**. You write an ordinary Python function decorated with `@sgl.function`; inside it you build up a prompt state `s` and call a few primitives:' },
        { type: 'table', caption: 'Core frontend primitives', head: ['Primitive', 'What it does'], rows: [
          ['`s += "text"` / `sgl.system()`, `sgl.user()`, `sgl.assistant()`', 'Append text or chat-role messages to the prompt state'],
          ['`sgl.gen("name", ...)`', 'Call the model to generate text, with options such as max_tokens, stop strings or a regex; the result is stored under "name"'],
          ['`sgl.select("name", choices=[...])`', 'Let the model pick the most likely option from a fixed list'],
          ['`s.fork(n)`', 'Split the state into n copies that continue in parallel (sharing the prefix)'],
          ['`.run(...)` / `.run_batch([...])`', 'Execute the program for one input or a batch of inputs'],
        ] },
        { type: 'code', lang: 'python', title: 'agent_step.py (requires the sglang package and a running server; no output shown)', code: `import sglang as sgl

@sgl.function
def triage(s, question):
    s += sgl.system("You are a support agent for an online shop.")
    s += sgl.user(question)
    s += sgl.assistant("Category: " + sgl.select("cat", choices=["refund", "shipping", "other"]))
    forks = s.fork(2)                       # two answers in parallel, sharing the prefix
    for f in forks:
        f += sgl.user("Draft a short reply.")
        f += sgl.assistant(sgl.gen("reply", max_tokens=60))
    s += "Chosen reply: " + forks[0]["reply"]

sgl.set_default_backend(sgl.RuntimeEndpoint("http://localhost:30000"))
state = triage.run(question="My parcel is late, can I get a refund?")
print(state["cat"])
print(state.text())` },
        { type: 'p', text: 'This reads like a normal program, but the interpreter can see its structure: the shared system prompt, the `select` with a fixed choice list, and the two forks that share everything before the fork. Calls run asynchronously, independent branches are sent in parallel, and the shared prefix is computed only once thanks to RadixAttention. The frontend can also target other backends, such as OpenAI-compatible APIs, though the runtime optimisations need the SGLang runtime.' },
      ],
    },
    {
      id: 'runtime-and-batching',
      title: 'How the runtime and frontend work together, and continuous batching',
      blocks: [
        { type: 'p', text: 'The frontend and runtime are a co-design. The frontend turns a program into a stream of generation calls that naturally share prefixes; the runtime turns those shared prefixes into cache hits. Forked branches in particular reach the runtime as near-identical requests, so it computes their common part once.' },
        { type: 'p', text: 'Inside the runtime, SGLang uses **continuous batching** like vLLM: at every decoding step the scheduler removes finished requests and adds waiting ones, so the GPU batch stays full. Memory for the KV cache is managed in pages, and the radix tree sits on top of that pool. Long prompts are split into chunks (**chunked prefill**) so they do not block decoding of other users. Newer versions also overlap the CPU-side scheduling of the next batch with the GPU work of the current one (described as a zero-overhead scheduler), so the GPU is not left waiting on Python code.' },
        { type: 'viz', name: 'continuous-batching', caption: 'Continuous batching refills GPU slots the moment a request finishes, instead of waiting for the slowest one.' },
      ],
    },
    {
      id: 'structured-output',
      title: 'Structured output and faster decoding',
      blocks: [
        { type: 'p', text: 'Agents often need output in a strict shape: JSON matching a schema, or text matching a **regular expression**. **Constrained decoding** enforces this by turning the regex or grammar into a **finite state machine (FSM)**: a set of states and allowed transitions. At each step, tokens that would break the pattern are masked out before sampling, so the output is always valid.' },
        { type: 'p', text: 'Normal constrained decoding still generates **one token per step**, even where the pattern leaves no choice. In `{"name": "`, after the opening brace, every character up to the opening quote of the value is fixed. SGLang\'s paper introduced a **compressed FSM**: chains of states with only one possible transition are merged, so the engine can append the whole fixed string at once (**jump-forward decoding**) and only call the model where there is a real choice.' },
        { type: 'p', text: 'In our tiny template above, 21 characters of fixed JSON are appended for free and the model is only needed for the 2 value slots. On a large schema with long keys this saves many decode steps. (Modern SGLang versions use fast grammar backends such as XGrammar for the masking; the exact backend and jump-forward behaviour depend on version and settings.)' },
        { type: 'callout', tone: 'warn', title: 'Common mistake', text: 'Jumping forward over fixed text must respect tokenization. The model would normally tokenize `"name": "` in a particular way, and appending characters in a different split can produce unusual tokens that slightly hurt quality. SGLang handles this with retokenization at the boundaries; if you build constrained decoding yourself, watch for this subtle issue.' },
      ],
    },
    {
      id: 'end-to-end-and-features',
      title: 'A simple end-to-end picture, and more features',
      blocks: [
        { type: 'steps', title: 'One agent step, end to end', items: [
          { title: 'Program runs', text: 'The frontend (or a plain OpenAI-style client) sends a request: shared instructions + this user\'s history + the new tool result, asking for JSON.' },
          { title: 'Prefix match', text: 'The runtime finds the longest cached prefix in the radix tree: the instructions and the earlier steps of this user\'s conversation.' },
          { title: 'Schedule', text: 'Cache-aware scheduling places the request into the continuous batch, near others sharing the same prefix.' },
          { title: 'Short prefill', text: 'Only the new tool result is prefilled; everything else is reused.' },
          { title: 'Constrained decode', text: 'The compressed FSM masks invalid tokens and jumps over fixed JSON text; the model fills in the values.' },
          { title: 'Return and cache', text: 'The JSON streams back; the new tokens join the radix tree for the next step.' },
        ] },
        { type: 'p', text: 'Beyond its original ideas, SGLang has grown into a full production engine. Features include an OpenAI-compatible server (`python -m sglang.launch_server --model-path <model>`), tensor, pipeline, data and expert parallelism for very large mixture-of-experts models, speculative decoding with EAGLE-style drafters, quantization (FP8, INT4, AWQ, GPTQ and more), multi-LoRA serving, multimodal models, and **prefill-decode disaggregation** (running the two phases on separate GPU pools). The paper reported up to 6.4× higher throughput than earlier systems on workloads with lots of prefix sharing and structure; gains on simple one-shot traffic are smaller.' },
        { type: 'callout', tone: 'example', title: 'Real-world use', text: 'SGLang is used to serve large open models in production by AI labs, cloud providers and companies, and is a popular choice for agentic and reasoning workloads, where long shared prompts and multi-step loops make RadixAttention pay off.' },
      ],
    },
    {
      id: 'sglang-vs-vllm',
      title: 'How SGLang compares to vLLM',
      blocks: [
        { type: 'p', text: 'SGLang and vLLM are the two leading open-source GPU serving engines, and they learn from each other. Both use paged KV memory, continuous batching, chunked prefill, speculative decoding and quantization, and both offer OpenAI-compatible servers. vLLM later added **automatic prefix caching** (hash-based block reuse), and SGLang\'s radix cache was designed around reuse from the start.' },
        { type: 'compare', title: 'SGLang vs vLLM', options: [
          { name: 'SGLang', summary: 'Serving runtime built around a radix-tree prefix cache, plus a frontend language for LLM programs.', pros: ['RadixAttention reuse with cache-aware scheduling', 'Frontend DSL with fork, select, gen', 'Fast constrained decoding'], cons: ['Frontend benefits require writing SGLang programs', 'Feature details change quickly between versions'], bestFor: 'Agents, multi-turn chat, few-shot and structured-output workloads' },
          { name: 'vLLM', summary: 'Serving engine built around PagedAttention, with very broad model and hardware support.', pros: ['PagedAttention pioneer', 'Huge model catalogue and hardware support', 'Large ecosystem'], cons: ['Prefix reuse is block-hash based rather than a radix tree', 'No built-in program language'], bestFor: 'General-purpose high-throughput serving' },
        ], rows: [ ['Core memory idea', 'Radix tree over paged KV', 'Paged KV blocks + hashed prefix caching'], ['Program language', 'Yes (Python DSL)', 'No (API only)'], ['Structured output', 'Compressed FSM / grammar backends', 'Grammar backends'], ['API server', 'OpenAI-compatible', 'OpenAI-compatible'] ], verdict: 'Both are excellent. Benchmark your own traffic: heavy prefix sharing and structured agent loops often favour SGLang; breadth of models and hardware often favours vLLM.' },
        { type: 'callout', tone: 'tip', title: 'When SGLang\'s edge shrinks', text: 'If every request is unique (no shared system prompt, no history, no examples), there is little to reuse and RadixAttention gives little benefit. Put stable content (instructions, tools, examples) at the very start of prompts and variable content at the end, or prefix reuse will never trigger.' },
      ],
    },
    {
      id: "eviction-by-hand",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "We said the radix tree evicts least recently used leaves and protects nodes that a running request is using. Let us walk through one eviction with small numbers. The numbers are illustrative, and to keep it simple a node is evicted whole. The cache can hold 4,000 tokens of KV. The tree has one shared node S, the agent's instructions (2,000 tokens), with three user branches below it." },
        { type: "table", caption: "The tree before the new request arrives (3,900 of 4,000 tokens used)", head: ["Node", "Tokens", "Last used", "In use right now?"], rows: [
          ["S (shared instructions)", "2,000", "just now", "Yes, by user C's request"],
          ["A (user A's history)", "900", "long ago", "No"],
          ["B (user B's history)", "600", "a while ago", "No"],
          ["C (user C's history)", "400", "just now", "Yes"]
        ] },
        { type: "steps", title: "A new user D arrives with S plus 500 new tokens", items: [
          { title: "Match the prefix", text: "D's prompt matches S, so 2,000 tokens are reused. D locks S, so S now has two users: C's request and D's." },
          { title: "Check the space", text: "D needs 500 new tokens. 3,900 + 500 = 4,400, which is 400 over the limit." },
          { title: "List what may be evicted", text: "Only leaves can go, so S is safe while it has children. C is a leaf but it is locked. That leaves A and B." },
          { title: "Evict the least recently used leaf", text: "A was used longest ago. Evicting it frees 900 tokens: 3,000 remain, and with D's 500 the tree holds 3,500." },
          { title: "What if A were locked too?", text: "Then B goes instead: 3,300 + 500 = 3,800, which still fits. If A, B and C were all in use, nothing could be evicted and D would have to wait." }
        ] },
        { type: "p", text: "Notice what this policy protects. The shared instructions are the most valuable node, because every request reuses them, and they are also the hardest to evict: they are not a leaf, and they are touched by every request. What gets dropped is the private tail of a user who has gone quiet. If user A comes back later, only A's 900 tokens must be prefilled again, not the 2,000 shared ones." },
        { type: "p", text: "This also explains a symptom to watch for. If the hit rate is low although prompts share a long prefix, the cache may be too small for the number of active branches, so tails are evicted before their users return." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "The lesson claimed that serving requests with the longest matched prefix first raises the hit rate. We will test that claim on a toy cache. Two agents, X and Y, each send three requests that begin with their own 20-token prompt. The requests arrive interleaved. The cache is so small that it can hold only one request's tokens at a time. Our toy counts each cached sequence in full, while a real radix tree would store a shared prefix once." },
        { type: "code", lang: "python", title: "practice_cache_aware.py", code: `# Cache-aware scheduling with a small prefix cache (a toy model of the idea).
from collections import OrderedDict
CAPACITY = 30                 # tokens of KV the cache may hold (tiny on purpose)

def shared(a, b):             # length of the common prefix of two token tuples
    n = 0
    while n < min(len(a), len(b)) and a[n] == b[n]:
        n += 1
    return n

def serve(queue, cache_aware):
    cache, queue, prefilled, log = OrderedDict(), list(queue), 0, []
    def match(req):           # longest prefix of this request already in the cache
        return max((shared(req[1], c) for c in cache), default=0)
    while queue:
        req = max(queue, key=match) if cache_aware else queue[0]
        queue.remove(req)
        name, tokens = req
        hit = match(req)
        prefilled += len(tokens) - hit          # only the unmatched part is prefilled
        log.append(f"{name}:{hit}")
        cache[tokens] = True                    # keep this request's KV for later
        while sum(len(c) for c in cache) > CAPACITY:
            cache.popitem(last=False)           # evict the least recently used entry
    return log, prefilled

X = tuple(f"x{i}" for i in range(20))           # 20-token prompt of agent X
Y = tuple(f"y{i}" for i in range(20))           # 20-token prompt of agent Y
queue = [("X1", X + ("a",)), ("Y1", Y + ("b",)), ("X2", X + ("c",)),
         ("Y2", Y + ("d",)), ("X3", X + ("e",)), ("Y3", Y + ("f",))]
for label, aware in [("arrival order", False), ("longest prefix first", True)]:
    log, prefilled = serve(queue, aware)
    print(f"{label:20s} served as name:reused -> {' '.join(log)}")
    print(f"{'':20s} tokens prefilled: {prefilled} of {sum(len(t) for _, t in queue)}")`, output: `arrival order        served as name:reused -> X1:0 Y1:0 X2:0 Y2:0 X3:0 Y3:0
                     tokens prefilled: 126 of 126
longest prefix first served as name:reused -> X1:0 X2:20 X3:20 Y1:0 Y2:20 Y3:20
                     tokens prefilled: 46 of 126`, walkthrough: [
          { lines: [1, 9], note: "A cache limit of 30 tokens, and a helper that counts how many leading tokens two sequences share." },
          { lines: [11, 17], note: "The scheduler. In arrival order it takes the first waiting request. In cache-aware mode it takes the request whose prefix matches the cache best." },
          { lines: [18, 25], note: "Serve the request: reuse the matched tokens, prefill the rest, store its tokens, and evict the least recently used entries when over the limit." },
          { lines: [27, 34], note: "Six interleaved requests from two agents, served in both orders." }
        ] },
        { type: "p", text: "In arrival order every request finds the other agent's tokens in the cache, so nothing is reused and all 126 tokens are prefilled. With the longest prefix first, the X requests run back to back, then the Y requests, and only 46 tokens are prefilled. Now change it:" },
        { type: "list", items: [
          "Set `CAPACITY = 100`. Predict the tokens prefilled in arrival order. Does the scheduling order still matter when the cache is roomy?",
          "Append four more X requests to `queue`. Predict the position at which `Y1` is served under longest prefix first. What problem does this show?",
          "Put the changing part first: build each request as `(\"a\",) + X` instead of `X + (\"a\",)`, and so on. Predict the reuse in both orders."
        ] },
        { type: "check", question: "With a large cache, both orders prefill the same number of tokens. So when exactly does cache-aware scheduling earn its keep?", answer: "When the cache cannot hold every active prefix at once. Then the order decides whether a prefix is still in memory when the next request that needs it runs. Grouping requests that share a prefix lets them all use it before it is evicted. With plenty of memory nothing is evicted, so the order no longer changes the hit rate." },
        { type: "check", question: "In the worked example, why is it reasonable that user A's history is evicted while the shared instructions S stay, even though S is five times larger and would free far more space?", answer: "The cost of an eviction is the prefill work needed when the tokens are wanted again. S is wanted by every request, so dropping it would force 2,000 tokens of prefill almost at once, for everybody. A's tail is wanted only if A returns. Evicting unused leaves first drops the tokens that are least likely to be needed soon." }
      ]
    },
  ],
  quiz: [
    { q: "What does RadixAttention store in its radix tree?", options: ["The model weights for each layer, organised by attention head", "The KV cache of earlier token sequences, organised by their shared prefixes", "A list of user IDs together with their current rate limits", "The tokenizer's vocabulary, organised as a tree of shared character prefixes"], answer: 1, explain: "RadixAttention keeps finished requests' KV cache in a radix tree keyed by token sequences, so later requests that share a prefix can reuse it instead of recomputing prefill." },
    { q: "An agent puts the current date and time at the very start of every prompt, before its long fixed instructions. Why is SGLang's cache hit rate poor?", options: ["SGLang cannot cache prompts longer than 1,000 tokens, and these are longer", "The radix tree only reuses few-shot examples, not system instructions", "The prefix differs every time, so matching stops early and the instructions are never reused", "Timestamps break the tokenizer, so each prompt is split into different tokens"], answer: 2, explain: "Reuse needs an identical prefix. A changing timestamp at the start makes every prompt diverge immediately. Moving variable content after the fixed instructions restores reuse." },
    { q: 'In the code example, the second few-shot request has 24 tokens and 22 are reused. How many tokens need prefill?', options: ['2', '22', '24', '46'], answer: 0, explain: 'Only the unmatched suffix is prefilled: 24 − 22 = 2 tokens. The 22 shared tokens (system prompt, examples and "Q:") already have their KV entries in the tree.' },
    { q: "What is the purpose of SGLang's compressed finite state machine in constrained decoding?", options: ["To compress the model weights so constrained decoding fits in memory", "To shrink the KV cache by half when the output must follow a schema", "To translate the user's prompt into a regular expression that the model must then follow", "To merge forced single-path steps so fixed text like JSON keys is added at once"], answer: 3, explain: "Constraints become an FSM; wherever only one continuation is allowed, the compressed FSM jumps forward over the whole fixed string. The model is called only where there is a real choice." },
    { q: "Which statement about SGLang vs vLLM is accurate?", options: ["vLLM has no prefix caching at all, so only SGLang can reuse shared prompts", "Both use paged KV and continuous batching; SGLang adds radix-tree reuse and a frontend language", "SGLang offers no OpenAI-compatible server, so clients must use its own API", "SGLang runs only on CPUs, while vLLM is the engine built for GPU serving"], answer: 1, explain: "The engines share many techniques. vLLM has automatic prefix caching via block hashing; SGLang's radix tree and cache-aware scheduling, plus its DSL, are its distinctive features. Both provide OpenAI-compatible servers and target GPUs." },
  ],
  takeaways: [
    'Real LLM apps are programs with many calls that share long prefixes; recomputing them wastes most prefill work.',
    'RadixAttention keeps the KV cache in a radix tree, reuses the longest matching prefix and evicts with LRU.',
    'Cache-aware scheduling runs requests with shared prefixes together to raise hit rates.',
    'The frontend DSL (gen, select, fork) exposes program structure so the runtime can parallelise and reuse.',
    'Compressed FSMs speed up JSON/regex output by jumping over fixed text; put stable prompt parts first to benefit from reuse.',
  ],
  terms: [
    { term: 'SGLang', def: 'An open-source LLM serving runtime plus a Python-embedded language for structured, multi-call LLM programs.' },
    { term: 'Radix tree', def: 'A compact prefix tree where shared beginnings of sequences share one path and branches occur where they differ.' },
    { term: 'RadixAttention', def: 'SGLang\'s technique of storing and reusing KV cache across requests in a radix tree.' },
    { term: 'Cache-aware scheduling', def: 'Ordering waiting requests to favour those with long cached prefixes, so reuse happens before eviction.' },
    { term: 'Constrained decoding', def: 'Masking tokens during generation so output always matches a regex, grammar or JSON schema.' },
    { term: 'Jump-forward decoding', def: 'Appending text the constraint fully determines in one step, without asking the model token by token.' },
  ],
};
