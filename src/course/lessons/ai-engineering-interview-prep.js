export default {
  id: 'ai-engineering-interview-prep',
  minutes: 35,
  hook: 'You understand the material. Can you explain KV caching in 60 seconds, estimate the cost of a chatbot on a whiteboard, and design a RAG system while someone asks "why?" after every box you draw?',
  summary: 'AI engineering interviews usually combine coding, fundamentals questions, an AI system design round, a deep dive on your past projects, and behavioural questions. Concept answers land best when they follow a short structure: definition, problem it solves, how it works, trade-offs, example. The system design round rewards a clear process: clarify requirements, estimate, sketch the pipeline, go deep on retrieval, evaluation, safety, latency and cost. This lesson gives model answers from every module, a fully worked design of a RAG support assistant, and a 30-day revision plan.',
  sections: [
    {
      id: 'interview-structure',
      title: 'How AI engineering interviews are structured',
      blocks: [
        { type: 'p', text: 'An **AI engineer** builds products on top of models: prompting, retrieval, agents, fine-tuning, evaluation, and serving. Interviews try to answer three questions about you: Do you understand how these systems work? Can you build and debug them? Can you make good trade-offs under real constraints like cost, latency and safety?' },
        { type: 'p', text: 'Formats vary a lot between companies, levels and teams, so treat the table below as a typical shape, not a fixed rule. Always ask the recruiter what each round covers; that is a normal, expected question.' },
        { type: 'table', head: ['Round', 'What it tests', 'How to prepare'], rows: [
          ['Recruiter / hiring-manager screen', 'Motivation, background, rough fit', 'A crisp 2-minute story of your experience and one project you are proud of'],
          ['Coding', 'Practical programming: data structures, sometimes writing a small LLM/RAG utility, parsing, async API calls', 'Practise Python fluently; be ready to write clean, tested code while talking'],
          ['ML / LLM fundamentals', 'Concepts from this course: attention, sampling, fine-tuning, RAG, inference, evaluation', 'Use the 60-second answer structure and the question bank below'],
          ['AI system design', 'Designing an end-to-end AI product under constraints', 'Practise the framework and the worked RAG design in this lesson'],
          ['Project deep dive', 'Depth and honesty about something you actually built', 'Know your numbers: data size, metrics before and after, what failed and why'],
          ['Behavioural', 'Collaboration, ownership, handling ambiguity and mistakes', 'Prepare 5–6 stories in Situation, Task, Action, Result form'],
        ] },
        { type: 'flow', title: 'A typical loop', nodes: [
          { label: 'Screen', detail: '30 minutes. Background and motivation. Ask about the format of later rounds.' },
          { label: 'Technical screen', detail: 'Coding or fundamentals, often 45–60 minutes.' },
          { label: 'Onsite / virtual loop', detail: 'Several rounds in one or two days: coding, fundamentals, system design, project deep dive, behavioural.' },
          { label: 'Debrief and offer', detail: 'Interviewers compare notes against a rubric; clear communication helps every score.' },
        ] },
        { type: 'callout', tone: 'analogy', title: 'Think like a senior colleague, not a student', text: 'A student tries to recite the right answer. A senior colleague thinks aloud, asks what matters, states assumptions, offers options with trade-offs, and picks one. Interviewers are asking themselves: "Would I want this person in our design review?"' },
      ],
    },
    {
      id: 'sixty-seconds',
      title: 'Explaining a concept clearly in 60 seconds',
      blocks: [
        { type: 'p', text: 'Most concept questions ("What is X?", "Why do we need Y?", "X vs Y?") are best answered in about a minute, then expanded only if the interviewer asks. A reliable structure:' },
        { type: 'steps', title: 'The five-part answer', items: [
          { title: '1. Define it in one sentence', text: 'Plain words first. "RAG retrieves relevant documents and adds them to the prompt so the model answers from them."' },
          { title: '2. The problem it solves', text: '"LLMs do not know private or recent data and can hallucinate."' },
          { title: '3. How it works', text: 'Three or four steps, with a key detail that shows depth. "Chunk and embed documents offline; at query time embed the question, retrieve top-k by similarity, often hybrid with keyword search and a reranker, then generate with citations."' },
          { title: '4. Trade-offs and when not to use it', text: '"Quality depends on retrieval; adds latency and tokens; not the right tool for changing tone or format, that is fine-tuning."' },
          { title: '5. A concrete example or number', text: '"In a support bot, updating a policy document fixes answers immediately, no retraining."' },
        ] },
        { type: 'compare', title: 'Weak vs strong answer to "What is a KV cache?"', options: [
          { name: 'Weak answer', summary: '"It is a cache that makes LLMs faster by storing stuff."', pros: ['Short'], cons: ['Vague: which stuff?', 'No mechanism', 'No trade-off, so no sign of depth'], bestFor: 'Nothing; it invites a follow-up that exposes gaps' },
          { name: 'Strong answer', summary: 'Definition, problem, mechanism, trade-off, number.', pros: ['Precise', 'Shows you know why it matters', 'Opens a good follow-up conversation'], cons: ['Needs practice to say in a minute'], bestFor: 'Every fundamentals round' },
        ], rows: [
          ['What it stores', 'Not said', 'Keys and values of all previous tokens, per layer and per KV head'],
          ['Why', 'Not said', 'Without it, each new token would recompute attention inputs for the whole prefix'],
          ['Trade-off', 'Not said', 'Memory grows linearly with context length and batch size; this limits concurrency'],
          ['Related ideas', 'None', 'GQA shrinks it; paged attention manages it; quantising it saves memory'],
        ], verdict: 'Aim for the right-hand column. Depth is shown by the mechanism and the trade-off, not by length.' },
        { type: 'callout', tone: 'tip', title: 'Handling "I don\'t know"', text: 'Say what you do know and reason from first principles: "I have not used that method, but if it is a speculative decoding variant, I would expect it to trade extra draft compute for fewer target-model passes..." Honest reasoning scores far better than bluffing, which interviewers spot quickly.' },
        { type: 'check', question: 'Practise: in one sentence each, give parts 1 and 4 of the five-part answer for "What is LoRA?"', answer: 'Definition: LoRA fine-tunes a model by freezing its weights and training small low-rank matrices B·A added to chosen weight matrices. Trade-off: it trains a tiny fraction of the parameters and adapters are small to store and swap, but with a small rank it may underperform full fine-tuning on tasks that need large changes.' },
      ],
    },
    {
      id: 'must-know-questions',
      title: 'Must-know questions from every module',
      blocks: [
        { type: 'p', text: 'Below are high-frequency questions grouped by course module. Try to answer each aloud in 60 seconds **before** opening the model answer. The model answers are deliberately compact: they are what a strong first answer sounds like, not everything there is to say.' },
        { type: 'tabs', items: [
          { label: 'ML foundations', blocks: [
            { type: 'list', items: ['What is overfitting and how do you reduce it?', 'Precision vs recall: when do you favour each?', 'L1 vs L2 regularisation?', 'Why use log loss rather than MSE for classification?'] },
            { type: 'deeper', title: 'Model answers', blocks: [
              { type: 'p', text: '**Overfitting:** the model fits noise in the training data, so training error is low and validation error is high. Fixes: more data, simpler model, regularisation (L1/L2, dropout), early stopping, data augmentation, better features. Always diagnose using a held-out validation set.' },
              { type: 'p', text: '**Precision vs recall:** precision = TP / (TP + FP), how trustworthy the positive predictions are; recall = TP / (TP + FN), how many real positives we caught. The threshold trades one for the other. Favour precision when false alarms are costly (auto-blocking payments), recall when misses are costly (screening, retrieval for RAG).' },
              { type: 'p', text: '**L1 vs L2:** both add a weight penalty. L1 (λ∑|w|) drives many weights to exactly zero, giving sparse models and feature selection; L2 (λ∑w²) shrinks all weights smoothly and handles correlated features well. Choose λ on validation data.' },
              { type: 'p', text: '**Log loss vs MSE:** with a sigmoid, log loss is convex and its gradient is simply (p − y)·x, so confident mistakes get strong corrections. MSE with a sigmoid is non-convex and its gradients vanish when the sigmoid saturates.' },
            ] },
          ] },
          { label: 'Deep learning', blocks: [
            { type: 'list', items: ['How does backpropagation work?', 'What causes vanishing gradients and how are they mitigated?', 'BatchNorm vs LayerNorm: why do Transformers use LayerNorm (or RMSNorm)?', 'What does dropout do at training vs inference time?'] },
            { type: 'deeper', title: 'Model answers', blocks: [
              { type: 'p', text: '**Backpropagation:** apply the chain rule from the loss backwards through each layer, computing ∂L/∂w for every parameter while reusing intermediate results, then update with gradient descent. Cost is roughly a small multiple of the forward pass.' },
              { type: 'p', text: '**Vanishing gradients:** gradients are products of many per-layer derivatives; if these are below 1 (e.g. saturated sigmoids) the product shrinks towards zero and early layers stop learning. Mitigations: ReLU-family activations, residual connections, normalisation layers, careful initialisation, and gated or attention-based architectures instead of plain RNNs.' },
              { type: 'p', text: '**BatchNorm vs LayerNorm:** BatchNorm normalises each feature across the batch, so it depends on batch statistics and behaves differently at inference. LayerNorm normalises across the features of each token independently, so it works with any batch size and variable-length sequences. RMSNorm drops the mean-centring step and only rescales by the root mean square, which is cheaper and works well in many modern LLMs.' },
              { type: 'p', text: '**Dropout:** during training it randomly zeroes a fraction p of activations and scales the survivors by 1/(1 − p) (inverted dropout), which discourages co-adaptation and reduces overfitting. At inference it is turned off and nothing is dropped.' },
            ] },
          ] },
          { label: 'Transformers', blocks: [
            { type: 'list', items: ['Explain self-attention.', 'Why scale attention scores by √dₖ?', 'What is causal masking?', 'Why multi-head attention?', 'What problem does RoPE solve?'] },
            { type: 'deeper', title: 'Model answers', blocks: [
              { type: 'p', text: '**Self-attention:** each token produces a query, key and value by linear projections. Scores are QKᵀ / √dₖ, a softmax turns each row into weights, and the output is the weighted sum of values. Every token can gather information from every other token in one step, and all positions are computed in parallel.' },
              { type: 'p', text: '**√dₖ scaling:** if query and key components have variance about 1, their dot product has variance about dₖ. Large scores push softmax into saturation (almost one-hot), where gradients are tiny. Dividing by √dₖ keeps score variance near 1.' },
              { type: 'p', text: '**Causal mask:** in decoder-only LLMs, token t must not see tokens after t, otherwise training would leak the answer. We set scores above the diagonal to −∞ before the softmax, so their weights become 0.' },
              { type: 'p', text: '**Multi-head:** several attention heads with smaller dimensions run in parallel, each able to learn a different relationship (syntax, coreference, position), then their outputs are concatenated and projected. Cost is similar to one big head.' },
              { type: 'p', text: '**RoPE:** rotary position embeddings rotate query and key vectors by angles that depend on position, so their dot product depends on the relative distance between tokens. It injects position into attention without adding position vectors to the input and has become standard in many open LLMs.' },
            ] },
          ] },
          { label: 'Generation and architecture', blocks: [
            { type: 'list', items: ['How do temperature, top-k and top-p differ?', 'What is Mixture of Experts?', 'What is GQA and why does it matter for inference?', 'Why is FlashAttention faster if it computes exact attention?'] },
            { type: 'deeper', title: 'Model answers', blocks: [
              { type: 'p', text: '**Sampling:** temperature divides logits before softmax: below 1 sharpens the distribution, above 1 flattens it. Top-k keeps only the k most likely tokens; top-p (nucleus) keeps the smallest set whose probabilities sum to p, so the candidate count adapts to the model\'s confidence. They are often combined.' },
              { type: 'p', text: '**MoE:** replaces a dense feed-forward layer with many expert networks and a router that sends each token to its top-k experts (often 1 or 2). Total parameters can be huge while active parameters per token stay small. Trade-offs: all experts must still sit in memory, routing needs load balancing, and serving is more complex.' },
              { type: 'p', text: '**GQA:** grouped-query attention lets several query heads share one key/value head. Quality stays close to full multi-head attention, but the KV cache shrinks by the group factor, allowing longer contexts and bigger batches. MQA is the extreme with one shared KV head.' },
              { type: 'p', text: '**FlashAttention:** attention is limited by memory traffic, not arithmetic. FlashAttention tiles the computation so blocks of Q, K and V stay in fast on-chip SRAM and uses an online softmax, never writing the full N × N score matrix to slower GPU memory (HBM). Same result, far fewer memory reads and writes.' },
            ] },
          ] },
          { label: 'Fine-tuning and alignment', blocks: [
            { type: 'list', items: ['When would you fine-tune instead of using RAG or prompting?', 'How does LoRA work?', 'RLHF vs DPO?', 'What is catastrophic forgetting?'] },
            { type: 'deeper', title: 'Model answers', blocks: [
              { type: 'p', text: '**Fine-tune vs RAG vs prompting:** start with prompting. Use RAG for knowledge that changes or must be cited. Fine-tune to change behaviour: consistent format, tone, domain style, or to make a smaller, cheaper model reliable at one narrow task. They combine well.' },
              { type: 'p', text: '**LoRA:** freeze W and learn ΔW = B·A where B is d × r and A is r × k with small rank r. Only A and B are trained, often well under 1% of parameters; B starts at zero so training begins from the original model. Adapters can be merged into W for zero extra inference cost, or swapped per customer. QLoRA trains LoRA adapters on top of a quantised base model to save memory.' },
              { type: 'p', text: '**RLHF vs DPO:** RLHF trains a reward model from human preference pairs, then optimises the LLM against it with RL (classically PPO) plus a KL penalty to stay close to a reference model. DPO skips the explicit reward model and RL loop, optimising a classification-style loss directly on preference pairs. DPO is simpler and more stable; RL-based methods can be more flexible, for example with online data or verifiable rewards (GRPO for reasoning).' },
              { type: 'p', text: '**Catastrophic forgetting:** training on new data overwrites weights that encoded earlier skills. Mitigations: lower learning rates, mixing in some original data (replay), parameter-efficient methods like LoRA, and regularisation towards the original weights.' },
            ] },
          ] },
          { label: 'RAG and vector search', blocks: [
            { type: 'list', items: ['How do you choose a chunking strategy?', 'What is hybrid search and why use it?', 'What does a reranker add?', 'How does approximate nearest neighbour search work?', 'How do you evaluate a RAG system?'] },
            { type: 'deeper', title: 'Model answers', blocks: [
              { type: 'p', text: '**Chunking:** chunks must be small enough to be specific and large enough to be self-contained. Start with structure-aware splitting (headings, paragraphs) of a few hundred tokens with some overlap, attach metadata (title, section, date), then tune size by measuring retrieval recall on real questions.' },
              { type: 'p', text: '**Hybrid search:** combine keyword search (BM25) with vector search, then merge results, often with Reciprocal Rank Fusion. Keywords catch exact terms like error codes and product IDs; vectors catch paraphrases.' },
              { type: 'p', text: '**Reranker:** a cross-encoder reads the query and each candidate together and scores relevance more accurately than comparing separate embeddings. It is too slow for the whole corpus, so retrieve ~50 candidates cheaply, rerank, keep the top 5.' },
              { type: 'p', text: '**ANN:** exact search compares the query with every vector, which is too slow at scale. ANN indexes trade a little recall for big speedups: IVF clusters vectors and searches only nearby clusters; HNSW builds a multi-layer proximity graph and walks it greedily; product quantisation compresses vectors.' },
              { type: 'p', text: '**RAG evaluation:** evaluate retrieval and generation separately. Retrieval: recall@k and MRR against a labelled set of question-to-chunk pairs. Generation: faithfulness (is every claim supported by the retrieved context?), answer relevance and correctness, often scored with an LLM-as-judge calibrated against human labels. Track latency and cost too.' },
            ] },
          ] },
          { label: 'Agents and MCP', blocks: [
            { type: 'list', items: ['What is an agent loop?', 'How does function calling work?', 'What is MCP?', 'When would you NOT use an agent?'] },
            { type: 'deeper', title: 'Model answers', blocks: [
              { type: 'p', text: '**Agent loop:** the LLM receives the goal and available tools, decides an action, the runtime executes it, the result is appended to the context, and the loop repeats until the model produces a final answer or hits a limit (steps, time, budget).' },
              { type: 'p', text: '**Function calling:** we describe tools with names, descriptions and JSON schemas. The model outputs a structured call (tool name + arguments) instead of text; our code validates and executes it and returns the result to the model. The model never runs code itself.' },
              { type: 'p', text: '**MCP:** the Model Context Protocol is an open standard that lets AI applications (clients) connect to tool and data providers (servers) in one consistent way. Servers expose tools, resources and prompts. It solves the N × M integration problem; it does not decide when tools are used.' },
              { type: 'p', text: '**When not to use an agent:** when the steps are known in advance, a fixed workflow (prompt chain) is cheaper, faster, easier to test and more reliable. Use agents when the path genuinely depends on intermediate results, and add step limits, permissions and human approval for risky actions.' },
            ] },
          ] },
          { label: 'Inference, eval and safety', blocks: [
            { type: 'list', items: ['Prefill vs decode?', 'How do continuous batching and paged attention improve throughput?', 'How does speculative decoding speed things up without changing outputs?', 'What does quantization trade off?', 'What is prompt injection and how do you defend against it?'] },
            { type: 'deeper', title: 'Model answers', blocks: [
              { type: 'p', text: '**Prefill vs decode:** prefill processes the whole prompt in parallel and is compute-bound; it determines time to first token. Decode generates one token at a time, reading all weights and the KV cache for each token, so it is memory-bandwidth-bound; it determines tokens per second.' },
              { type: 'p', text: '**Continuous batching and paged attention:** continuous batching schedules at the level of each decoding step, so finished requests leave and new ones join immediately instead of waiting for the slowest request in a static batch. Paged attention stores the KV cache in fixed-size blocks like virtual-memory pages, eliminating most fragmentation so more requests fit in memory. vLLM popularised both.' },
              { type: 'p', text: '**Speculative decoding:** a small draft model proposes several tokens; the large target model checks them all in one forward pass and accepts the longest agreeing prefix, using a rejection-sampling rule that keeps the output distribution identical to the target model\'s. Speedup depends on the acceptance rate.' },
              { type: 'p', text: '**Quantization:** storing weights (and sometimes activations or the KV cache) in fewer bits, e.g. INT8 or 4-bit, cuts memory and often speeds up memory-bound decoding. The cost is some accuracy loss, usually small at 8-bit and more model- and method-dependent at 4-bit, so always evaluate on your task.' },
              { type: 'p', text: '**Prompt injection:** untrusted text (a user message, or a web page or document the model reads) contains instructions that hijack the model. Defences are layered: treat all retrieved content as data, give tools least privilege, require confirmation for sensitive actions, filter inputs and outputs, separate system instructions clearly, and monitor. No single defence is complete.' },
            ] },
          ] },
        ] },
        { type: 'callout', tone: 'note', title: 'More practice questions', text: 'Revisit any module whose quiz challenged you. Quiz scores persist, so you can track your weakest areas in the Dashboard and target them before your interview.' },
      ],
    },
    {
      id: 'system-design-round',
      title: 'The AI system design round',
      blocks: [
        { type: 'p', text: 'In this round you get an open problem, such as "Design a support assistant for our help centre" or "Design a code-review bot", and 45–60 minutes. There is no single right answer. The interviewer watches **how you structure the problem**, whether your choices fit the requirements, and whether you can explain trade-offs and failure modes.' },
        { type: 'steps', title: 'A framework that works for most AI design questions', items: [
          { title: 'Clarify requirements (5 min)', text: 'Users and use cases, scale (users, requests/day), latency target, accuracy bar, languages, data sources and freshness, privacy and compliance, budget. Write them down.' },
          { title: 'Estimate (3 min)', text: 'Requests per second at peak, tokens per request, daily cost, memory. Rough numbers drive model choice and architecture.' },
          { title: 'High-level design (10 min)', text: 'Draw the main pipeline: input, guardrails, retrieval, model, tools, output, logging. Name the components.' },
          { title: 'Deep dives (15 min)', text: 'Go deep where the interviewer leans in, typically retrieval quality, model choice, agent/tool safety, or serving.' },
          { title: 'Evaluation (5 min)', text: 'Offline eval set and metrics, online metrics, LLM-as-judge with human calibration, regression tests before every change.' },
          { title: 'Reliability, safety, cost (5 min)', text: 'Fallbacks, timeouts, rate limits, caching, prompt-injection defences, PII handling, monitoring and alerting.' },
          { title: 'Summarise and iterate', text: 'Recap the design, the main risks, and what you would build first versus later.' },
        ] },
        { type: 'code', lang: 'python', title: 'back_of_envelope.py', code: `# Back-of-envelope numbers for a RAG support assistant (all inputs are assumptions)
daily_users, msgs_per_user = 20_000, 3
prompt_tokens = 300 + 5 * 400 + 200        # system prompt + 5 chunks of 400 + chat/question
output_tokens = 250
price_in, price_out = 0.50, 2.00           # illustrative $ per 1M tokens (varies by model)

requests = daily_users * msgs_per_user
avg_qps = requests / 86_400
peak_qps = avg_qps * 5                     # assume peak traffic is 5x the average
cost = requests * (prompt_tokens * price_in + output_tokens * price_out) / 1e6
print(f"requests/day {requests:,}  avg QPS {avg_qps:.2f}  peak QPS {peak_qps:.1f}")
print(f"tokens/request {prompt_tokens} in + {output_tokens} out  ->  ~\${cost:,.0f}/day")

# KV-cache memory per token for a Llama-3-8B-like config (fp16 = 2 bytes)
layers, kv_heads, head_dim, bytes_ = 32, 8, 128, 2
kv_per_token = 2 * layers * kv_heads * head_dim * bytes_    # 2 = keys and values
print(f"KV cache: {kv_per_token / 1024:.0f} KiB/token, "
      f"{kv_per_token * (prompt_tokens + output_tokens) / 2**20:.0f} MiB per request")

# Retrieval evaluation: did the right chunk appear in the top k results?
gold = ["refund-02", "ship-07", "acct-01", "refund-05"]
retrieved = [["refund-02", "refund-01", "ship-03"],
             ["ship-01", "ship-07", "ship-02"],
             ["acct-04", "acct-02", "pay-01"],
             ["refund-05", "refund-02", "acct-01"]]
for k in (1, 3):
    hits = sum(g in r[:k] for g, r in zip(gold, retrieved))
    print(f"recall@{k} = {hits}/{len(gold)} = {hits / len(gold):.2f}")
mrr = sum(1 / (r.index(g) + 1) if g in r else 0 for g, r in zip(gold, retrieved)) / len(gold)
print(f"MRR = {mrr:.3f}")`, output: `requests/day 60,000  avg QPS 0.69  peak QPS 3.5
tokens/request 2500 in + 250 out  ->  ~$105/day
KV cache: 128 KiB/token, 344 MiB per request
recall@1 = 2/4 = 0.50
recall@3 = 3/4 = 0.75
MRR = 0.625`, walkthrough: [
          { lines: [1, 5], note: 'State assumptions out loud: users, messages, prompt size (dominated by retrieved chunks) and prices. The prices are illustrative; real prices vary widely by model and vendor.' },
          { lines: [7, 12], note: 'Traffic and cost. 60,000 requests/day is under 1 request/second on average, about 3.5 at a 5× peak. Input tokens dominate the bill, so shrinking retrieved context or caching the shared prompt prefix pays off.' },
          { lines: [14, 18], note: 'If we self-host, the KV cache matters: 2 (K and V) × 32 layers × 8 KV heads × 128 dims × 2 bytes = 128 KiB per token, about 344 MiB for one 2,750-token request. That number bounds how many concurrent requests fit on a GPU.' },
          { lines: [20, 30], note: 'A tiny retrieval eval: recall@k asks whether the right chunk is in the top k; MRR averages 1/rank of the right chunk (1 + 1/2 + 0 + 1) / 4 = 0.625. Question 3 is a retrieval failure that no LLM can fix.' },
        ] },
        { type: 'check', question: 'Per request, the estimate uses 2,500 input tokens at $0.50 per million and 250 output tokens at $2.00 per million. Which is the bigger cost driver, and what is one design change that reduces it?', answer: 'Input: 2,500 × $0.50 / 1M = $0.00125 per request, versus 250 × $2.00 / 1M = $0.0005 for output, so input is about 70% of the cost. Retrieve fewer or shorter chunks (a reranker helps keep only the best 3), and use prompt caching for the fixed system prompt.' },

      ],
    },
    {
      id: 'worked-design',
      title: 'A worked system design: a RAG support assistant',
      blocks: [
        { type: 'p', text: '**Prompt:** "Design an AI assistant that answers customer questions using our help centre (about 5,000 articles) and can check order status. 20,000 daily users. Answers must be accurate and cite sources. P95 latency to first token under 2 seconds."' },
        { type: 'p', text: '**1. Clarify.** We would ask: Which languages? How often do articles change (daily)? Can the bot take actions or only read (read-only order lookup for now)? What should happen when it is unsure (hand off to a human)? Any PII constraints (order data must not be logged in plain text)? We assume English, daily updates, read-only tools, human handoff available.' },
        { type: 'flow', title: 'Offline: the ingestion pipeline', nodes: [
          { label: 'Sources', detail: 'Help-centre CMS, policy PDFs, FAQ pages. A change feed triggers re-ingestion when an article is edited.' },
          { label: 'Parse and clean', detail: 'Extract text, keep headings and tables, drop navigation boilerplate.' },
          { label: 'Chunk', detail: 'Structure-aware chunks of a few hundred tokens with small overlap; each chunk keeps title, URL, section, product and last-updated metadata.' },
          { label: 'Embed and index', detail: 'Embed chunks into a vector index (HNSW) and also index them for BM25 keyword search. Version the index so a bad ingest can be rolled back.' },
        ] },
        { type: 'flow', title: 'Online: answering a question', nodes: [
          { label: 'Input guardrails', detail: 'Authenticate the user, rate-limit, detect abuse and obvious prompt-injection attempts, redact sensitive data from logs.' },
          { label: 'Understand', detail: 'A small, fast model classifies intent (policy question, order status, complaint, out of scope) and rewrites the question using chat history.' },
          { label: 'Retrieve', detail: 'Hybrid search (BM25 + vectors, merged with RRF) returns ~40 candidates, filtered by metadata such as product and region.' },
          { label: 'Rerank', detail: 'A cross-encoder reranker keeps the best 3–5 chunks. If the top score is below a threshold, we do not guess.' },
          { label: 'Generate', detail: 'The LLM answers only from the provided chunks, cites them, and calls the read-only order-status tool when needed. Responses are streamed.' },
          { label: 'Output checks', detail: 'Verify citations exist, check for policy violations and PII leaks, and hand off to a human when confidence is low or the user asks.' },
        ] },
        { type: 'table', caption: 'Key decisions and why', head: ['Decision', 'Choice', 'Reason / trade-off'], rows: [
          ['Knowledge approach', 'RAG, not fine-tuning', 'Articles change daily and answers need citations'],
          ['Retrieval', 'Hybrid search + reranker', 'Order numbers and product codes need keywords; paraphrased questions need vectors; reranker boosts precision of the final 3–5 chunks'],
          ['Model', 'A mid-sized hosted model; a small model for intent routing', 'Meets quality and latency; routing simple queries to a cheaper model cuts cost'],
          ['Tools', 'Read-only order lookup via a tool or MCP server, user-scoped', 'Least privilege: the bot can only see the logged-in user\'s orders'],
          ['Latency', 'Streaming, prompt caching for the fixed system prompt, a semantic cache for very common questions', 'Keeps time to first token low; cache must be invalidated when articles change'],
          ['Unsure answers', 'Abstain and offer a human handoff', 'A wrong policy answer costs more than a handoff'],
        ] },
        { type: 'chart', kind: 'hbar', title: 'Latency budget to first token', xLabel: 'Milliseconds', unit: ' ms', labels: ['Guardrails + auth', 'Intent + query rewrite (small model)', 'Hybrid retrieval', 'Rerank 40 candidates', 'LLM prefill to first token', 'Network and overhead'], series: [ { name: 'Budget', values: [50, 300, 80, 150, 600, 150] } ], caption: 'Illustrative budget totalling about 1.3 seconds, leaving headroom under a 2-second P95. Real numbers depend on models, hardware and region; measure them.' },
        { type: 'p', text: '**Evaluation.** Build a golden set of a few hundred real (anonymised) questions with the correct source articles and reference answers, including tricky and out-of-scope ones. Offline metrics: retrieval recall@5 and MRR; answer faithfulness and correctness scored by an LLM judge calibrated against human ratings; abstention rate on out-of-scope questions. Online: resolution rate without handoff, thumbs up/down, escalations, latency percentiles and cost per conversation. Run the offline suite on every prompt, model or index change.' },
        { type: 'p', text: '**Failure modes to mention.** Retrieval misses (fix chunking, add hybrid search, add synonyms); stale answers (change-feed re-indexing, show last-updated dates); hallucinated citations (verify that cited chunk IDs were actually retrieved); prompt injection via user text or documents (treat retrieved text as data, least-privilege tools); cost spikes (rate limits, caching, routing); model provider outage (timeouts and a fallback model or graceful "please contact support").' },
        { type: 'compare', title: 'Three ways to give the assistant knowledge', options: [
          { name: 'Long-context stuffing', summary: 'Put many articles directly into a very long prompt.', pros: ['Simple to build', 'No retrieval errors if everything fits'], cons: ['5,000 articles will not fit', 'High cost and latency per request', 'Models can miss facts buried in the middle'], bestFor: 'Small, stable document sets' },
          { name: 'RAG', summary: 'Retrieve the few most relevant chunks per question.', pros: ['Scales to large corpora', 'Fresh knowledge', 'Citations'], cons: ['Retrieval quality is a new failure point', 'More components to run'], bestFor: 'Our case: large, changing help centre' },
          { name: 'Fine-tuning', summary: 'Train the model on help-centre content.', pros: ['Can learn tone and format', 'Shorter prompts'], cons: ['Unreliable for facts', 'Retraining for every policy change', 'No citations'], bestFor: 'Style and behaviour, alongside RAG' },
        ], verdict: 'RAG for knowledge, optionally light fine-tuning for tone later. Saying why the alternatives lose is exactly what interviewers want to hear.' },
      ],
    },
    {
      id: 'thirty-day-plan',
      title: 'A 30-day revision plan',
      blocks: [
        { type: 'p', text: 'Assume about 1.5–2 hours per weekday and a little more at weekends. Every day: revise the lessons, then answer 5 questions aloud using the five-part structure, recording yourself once a week to check clarity.' },
        { type: 'timeline', title: 'Four weeks to interview-ready', items: [
          { when: 'Days 1–4', title: 'Foundations', text: 'Module 1–2: the six words, supervised vs unsupervised, regression, features, precision/recall, losses, regularisation, RL, contrastive learning.' },
          { when: 'Days 5–8', title: 'Deep learning', text: 'Module 3: neurons, gradient descent, backprop, cross-entropy, dropout, normalisation, RNNs. Derive backprop for a tiny network on paper.' },
          { when: 'Days 9–13', title: 'Transformers and generation', text: 'Modules 4–5: tokenisation, embeddings, attention maths, causal masks, multi-head, RoPE, sampling, streaming. Implement attention in numpy.' },
          { when: 'Days 14–16', title: 'Modern architectures and model types', text: 'Modules 6–7: MoE, GQA, sliding window, FlashAttention, SLMs, reasoning models.' },
          { when: 'Days 17–19', title: 'Training and alignment', text: 'Module 8: fine-tuning, LoRA, distillation, RLHF, PPO, DPO, GRPO. Be able to compare them in a table.' },
          { when: 'Days 20–23', title: 'Prompting, RAG and agents', text: 'Modules 9–12: context engineering, vector search, chunking, hybrid search, reranking, agents, function calling, MCP, frameworks. Build a tiny RAG app end to end.' },
          { when: 'Days 24–26', title: 'Inference, evaluation, safety', text: 'Modules 13–15: KV cache, batching, paged attention, speculative decoding, quantization, evals, LLM-as-judge, guardrails, prompt injection.' },
          { when: 'Days 27–30', title: 'System design and mock interviews', text: 'Modules 16–17 skim, then two timed system designs (RAG assistant, agent for internal tools), one full mock loop with a friend, polish your project stories, rest the day before.' },
        ] },
        { type: 'table', caption: 'Weekly checkpoints', head: ['End of week', 'You should be able to'], rows: [
          ['Week 1', 'Explain overfitting, precision/recall and backprop in 60 seconds each, without notes'],
          ['Week 2', 'Write attention from scratch and explain √dₖ, masking, multi-head, RoPE, temperature and top-p'],
          ['Week 3', 'Compare LoRA vs full fine-tuning, RLHF vs DPO, and build and evaluate a small RAG pipeline'],
          ['Week 4', 'Run a 45-minute system design with estimates, evaluation, safety and cost, and tell three project stories with numbers'],
        ] },
      ],
    },
    {
      id: 'final-tips',
      title: 'Common mistakes and final tips',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Mistakes that sink otherwise strong candidates', text: 'Jumping into a design without clarifying requirements. Naming tools ("we use a vector DB and LangChain") without explaining why. Never mentioning evaluation. Ignoring cost, latency and safety. Bluffing on a detail instead of reasoning aloud. Talking for five minutes without checking whether the interviewer wants depth or breadth.' },
        { type: 'list', items: [
          '**Lead with structure.** "I\'ll cover requirements, a rough estimate, the pipeline, then go deep on retrieval and evaluation. Sound good?"',
          '**Quantify.** Even rough numbers (tokens, QPS, dollars, milliseconds) show engineering judgement.',
          '**Always offer a trade-off.** "We could also do X; it is cheaper but loses Y; given the 2-second target I would choose Z."',
          '**Bring evaluation into every answer.** "How would we know it worked?" is the question behind most follow-ups.',
          '**Use your projects.** A real story ("our recall@5 was 0.62 until we added hybrid search, then 0.81") beats a textbook definition.',
          '**Keep learning current.** This field moves fast; read release notes and papers for the tools you claim, and say when something varies by vendor or model.',
        ] },
        { type: 'callout', tone: 'example', title: 'Keep practising', text: 'Revisit any lesson in this course whose quiz you found hard, track your progress in the Dashboard, and keep building projects that touch inference, RAG, and agents. Good luck!' },
      ],
    },
  ],
  quiz: [
    {
      q: 'Which order best follows the five-part structure for answering a concept question?',
      options: ["Example first, then history, trade-offs, definition, and mechanism", "Definition, problem it solves, how it works, trade-offs, example", "Mechanism first, then code, definition, benchmark, and conclusion", "Trade-offs first, then definition, example, history, and mechanism"],
      answer: 1,
      explain: 'Start with a plain one-sentence definition, say why it exists, explain the mechanism, give trade-offs and when not to use it, then ground it with an example or number.',
    },
    {
      q: 'In a system design round, an interviewer says "Design a support assistant for our help centre." What should you do first?',
      options: ["Draw a vector database and choose an embedding model", "Write the system prompt and test it on a few questions", "Ask about users, scale, latency, data freshness and limits", "Propose fine-tuning a model on the help-centre articles"],
      answer: 2,
      explain: 'Requirements drive every later choice. Jumping straight into components is one of the most common mistakes.',
    },
    {
      q: 'A retrieval eval has 4 questions. The correct chunk is ranked 1st, 2nd, not retrieved, and 1st. What is the MRR?',
      options: ['0.625', '0.75', '0.50', '0.875'],
      answer: 0,
      explain: 'MRR averages 1/rank, using 0 when not found: (1 + 0.5 + 0 + 1) / 4 = 0.625. 0.75 is recall@3 and 0.50 is recall@1.',
    },
    {
      q: 'For the help-centre assistant, why is RAG preferred over fine-tuning as the main way to supply knowledge?',
      options: ["Fine-tuning cannot change the tone of a model's answers", "RAG never makes mistakes, so it is always the safer choice", "Fine-tuned models are always slower and costlier to serve", "Articles change daily and need citations; RAG handles both"],
      answer: 3,
      explain: 'RAG fits changing, citable knowledge. Fine-tuning is better for behaviour such as tone and format, and can be added later alongside RAG.',
    },
    {
      q: 'A candidate says: "Evaluation is a detail; in a design interview I should focus only on the architecture." Why is this a mistake?',
      options: ["Interviewers only ever care about evaluation, not design", "Without an eval plan you cannot show the system works", "Evaluation matters only for classical ML, not for LLMs", "Architecture never matters much in AI system design"],
      answer: 1,
      explain: 'LLM systems fail in subtle ways, so evaluation is central. Strong candidates describe how quality, latency and cost will be measured and protected over time.',
    },
  ],
  takeaways: [
    'Typical rounds: coding, fundamentals, AI system design, project deep dive and behavioural; formats vary, so ask.',
    'Answer concepts in about 60 seconds: definition, problem, mechanism, trade-offs, example.',
    'In system design: clarify, estimate, sketch the pipeline, deep dive, evaluate, then cover safety, latency and cost.',
    'For a RAG assistant: hybrid retrieval, reranking, grounded generation with citations, abstention and human handoff, and a golden eval set.',
    'Quantify, offer trade-offs, and bring evaluation into every answer.',
    'Follow a structured 30-day plan and practise aloud with mock interviews.',
  ],
  terms: [
    { term: 'System design round', def: 'An interview where you design an end-to-end system under stated requirements and explain trade-offs.' },
    { term: 'Back-of-envelope estimate', def: 'A quick rough calculation of traffic, tokens, memory or cost used to guide design decisions.' },
    { term: 'Recall@k', def: 'The fraction of queries for which a correct item appears in the top k retrieved results.' },
    { term: 'MRR', def: 'Mean Reciprocal Rank: the average of 1 / rank of the first correct result across queries.' },
    { term: 'Golden set', def: 'A curated set of inputs with expected outputs used to evaluate a system repeatedly.' },
    { term: 'Abstention', def: 'When a system declines to answer, or hands off to a human, because it is not confident.' },
  ],
};
