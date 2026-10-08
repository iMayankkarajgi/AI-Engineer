export default {
  id: 'ai-engineering-interview-prep',
  minutes: 40,
  hook: 'You understand the material. Can you explain KV caching in 60 seconds, estimate the cost of a chatbot on a whiteboard, and design a RAG system while someone asks "why?" after every box you draw?',
  summary: 'AI engineering interviews usually combine general and practical coding, ML and LLM fundamentals, an AI system design round, a deep dive on your past projects, behavioural questions and sometimes a take-home. Interviewers score the evidence you give on a few signals: understanding the problem, depth, judgement, evaluation, production sense and communication. This lesson shows the round structure, model answers from every module, a practical coding task, two worked designs (a RAG support assistant and an agent that takes actions), and a 30-day revision plan.',
  sections: [
    {
      id: 'interview-structure',
      title: 'How AI engineering interviews are structured',
      blocks: [
        { type: 'p', text: 'An **AI engineer** builds products on top of models: prompting, retrieval, agents, fine-tuning, evaluation, and serving. Interviews try to answer three questions about you: Do you understand how these systems work? Can you build and debug them? Can you make good trade-offs under real constraints like cost, latency and safety?' },
        { type: 'p', text: 'Formats vary a lot between companies, levels and teams, so treat the table below as a typical shape, not a fixed rule. Always ask the recruiter what each round covers; that is a normal, expected question.' },
        { type: "p", text: "For applied AI roles, the weight has moved in the last few years. Classic machine learning theory takes a smaller share. Questions about LLM applications take a larger one: retrieval, agents, evaluation, cost and latency. General coding is still there. Roles closer to research or model training keep more maths and more classic ML." },
        { type: "table", caption: "The rounds you are likely to meet", head: ["Round", "What it tests", "How to prepare"], rows: [
          ["Recruiter / hiring-manager screen", "Motivation, background, rough fit and level", "A crisp 2-minute story of your experience and one project, with numbers: data size, latency, cost, quality before and after"],
          ["General coding", "Data structures and algorithms at medium difficulty, clean code, testing, talking while you work", "Practise Python until syntax never slows you down; solve timed problems aloud"],
          ["Practical AI coding", "Building a small piece of an LLM application: a text chunker, a retriever, an output parser, a rate limiter, an evaluation script, parallel API calls with retries", "Build each of these once from scratch; see the coding-round section below"],
          ["ML fundamentals", "Overfitting, metrics, losses, regularisation, backpropagation, attention", "Use the 60-second answer structure and the question bank below"],
          ["LLM / GenAI depth", "How RAG, agents, fine-tuning, inference and evaluation work, and how they fail", "The question bank; expect 'why?' and 'what breaks?' after every answer"],
          ["AI system design", "Designing an end-to-end AI product under constraints", "The framework, the prompt list and the two worked designs in this lesson"],
          ["Project deep dive", "Depth and honesty about something you actually built", "Know your numbers, what failed, what you would change, and which part was yours"],
          ["Behavioural", "Collaboration, ownership, handling ambiguity and mistakes", "Prepare 5–6 stories in Situation, Task, Action, Result form"],
          ["Take-home or work sample (some companies)", "A realistic task done in a few hours, alone or in a live session", "A small solution with a measured result beats a large one with none; see the take-home section"],
        ] },
        { type: "flow", title: "A typical loop", nodes: [
          { label: "Screen", detail: "About 30 minutes. Background and motivation. Ask about the format of later rounds." },
          { label: "Technical screen", detail: "Coding, often with a few fundamentals questions, 45–60 minutes. Some companies use a timed online test or a take-home here instead." },
          { label: "Onsite / virtual loop", detail: "Three to six rounds over one or two days: coding, fundamentals, LLM depth, system design, project deep dive, behavioural." },
          { label: "Debrief and offer", detail: "Interviewers compare written notes against a rubric. Clear communication helps every score." },
        ] },
        { type: "p", text: "Not every company runs every round. A small start-up may run three: a screen, one long practical session and a talk with the founders. A large company may run five or six. Some companies now let you use an AI coding assistant in one round and watch how you direct it and check its work. Ask which rules apply before each round." },
        { type: 'callout', tone: 'analogy', title: 'Think like a senior colleague, not a student', text: 'A student tries to recite the right answer. A senior colleague thinks aloud, asks what matters, states assumptions, offers options with trade-offs, and picks one. Interviewers are asking themselves: "Would I want this person in our design review?"' },
      ],
    },
    {
      id: "how-you-are-scored",
      title: "How interviewers score you",
      blocks: [
        { type: "p", text: "After each round the interviewer writes notes against a **rubric**: a short list of **signals** with a rating for each, often on a scale from 'strong no' to 'strong yes'. A hiring group then reads all the notes together. So the goal in a round is not to finish first or to say the most. It is to leave clear evidence for each signal." },
        { type: "table", caption: "Signals that appear on most rubrics", head: ["Signal", "What the interviewer asks themselves", "How to give evidence"], rows: [
          ["Problem solving", "Did they understand the problem before solving it?", "Restate the task, ask two or three sharp questions, state your assumptions"],
          ["Technical depth", "Do they know the mechanism, or only the name?", "Explain how it works and when it fails; give one number"],
          ["Judgement", "Do their choices fit the constraints?", "Offer two options, name the cost of each, pick one and say why"],
          ["Evaluation mindset", "Do they know how to tell whether it works?", "Bring up test sets, metrics and monitoring without being asked"],
          ["Production sense", "Have they thought about cost, latency, safety and failure?", "Mention tokens, money, milliseconds, fallbacks and limits"],
          ["Communication", "Could I follow them? Did they use my hints?", "Give a plan first, think aloud, check in every few minutes"],
          ["Ownership", "What did *they* do, and what did they learn?", "Say 'I' for your part and 'we' for the team; include a failure and its fix"],
        ] },
        { type: "table", caption: "The same signals, a different bar by level", head: ["Level", "What is expected", "A typical gap"], rows: [
          ["Junior", "Correct basics, clean code, a clear answer to a well-defined question; learns quickly from hints", "Recites definitions without the mechanism"],
          ["Mid-level", "Designs a bounded system end to end; leads the first half of a design round", "A good design with no evaluation or cost"],
          ["Senior", "Turns a vague prompt into requirements and targets; drives the round; goes deep in two areas; raises failure modes first", "Stays broad and waits to be asked"],
        ] },
        { type: "callout", tone: "note", title: "Rubrics are not public, the principle is stable", text: "Rubrics differ between companies and are rarely published, so treat these tables as the common pattern, not a rule. The idea underneath does not change: interviewers can only score what they hear. A correct thought you did not say aloud earns nothing." },
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
        { type: 'p', text: 'Below are high-frequency questions grouped by course module, followed by two groups that interviewers add on top: evaluation and production, and projects and behaviour. Try to answer each aloud in 60 seconds **before** opening the model answer. The model answers are deliberately compact: they are what a strong first answer sounds like, not everything there is to say.' },
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
          { label: "Evaluation and production", blocks: [
            { type: "list", items: ["How would you build an evaluation set for a new LLM feature?", "When can you trust an LLM as a judge?", "Quality dropped after a model version update. What do you do?", "How would you cut the cost of an LLM feature by half?", "How do you reduce hallucinations?", "How do you get reliable structured output?"] },
            { type: "deeper", title: "Model answers", blocks: [
              { type: "p", text: "**Evaluation set:** collect real or realistic inputs, about a hundred to start. Include easy, hard and out-of-scope cases, and every failure we already know about. For each one, write the expected answer or the facts a good answer must contain. Pick metrics per stage; for RAG that is retrieval recall first, then answer correctness and faithfulness. Freeze the set, run it on every change, and add each new production failure to it." },
              { type: "p", text: "**LLM as judge:** a second model scores outputs against a written rubric. Trust it only after comparing it with human labels on a sample. If the judge and people agree most of the time, use it for scale and keep spot checks. Ask for a narrow decision, such as 'is this claim supported by the context, yes or no', not a vague score from 1 to 10. Known weak spots: a judge can favour long or confident answers, and its own behaviour can change when its model version changes." },
              { type: "p", text: "**Regression after a model update:** confirm it on the offline evaluation set, not from a few stories. Run the old and the new model on the same inputs and read the cases that flipped. Common causes are a changed output format, different refusal behaviour, and prompts that were tuned to quirks of the old model. Short term, go back to the previous version if we can. Then fix the prompts, re-run the set and roll out to a small share of traffic first. The lasting fix is to pin model versions and run the evaluation before every switch." },
              { type: "p", text: "**Halving cost:** measure where the tokens go first. The usual levers, from least to most effort: a shorter prompt and fewer retrieved chunks; a cap on output length; prompt caching for the fixed start of the prompt; routing easy requests to a smaller model; caching repeated questions; batch processing for work that is not urgent; and last, a small fine-tuned model for one narrow task. Check quality on the evaluation set after each change." },
              { type: "p", text: "**Hallucinations:** ground the answer in retrieved sources and instruct the model to answer only from them. Require citations and verify that they point to text we really retrieved. Let the system abstain when retrieval scores are low. Keep the context short and relevant. For high-risk answers, add an output check for unsupported claims. We lower the rate and we measure it; we do not promise zero." },
              { type: "p", text: "**Structured output:** describe the schema, use the provider's structured-output or tool-calling mode when there is one, validate every response in code, and on failure retry once with the error message included. Keep schemas small and flat. Never pass unvalidated model output to a later step." },
            ] },
          ] },
          { label: "Projects and behavioural", blocks: [
            { type: "list", items: ["Walk me through a project you are proud of.", "Tell me about a time something you shipped failed.", "Tell me about a disagreement on a technical choice.", "How do you decide what to do when the goal is vague?", "Why this team?"] },
            { type: "deeper", title: "Model answers", blocks: [
              { type: "p", text: "**Project walk-through:** two minutes, in this order. The problem and who had it. Your own part. The design in three boxes. How you measured it, with numbers before and after. The hardest bug or trade-off. What you would do differently. Expect follow-ups on every number you say, on cost and latency, and on why you did not pick the obvious alternative." },
              { type: "p", text: "**A failure:** pick a real one. Say what broke and how you noticed, what you did in the first hour, what the root cause was, and which guard you added so it cannot happen silently again: a test, an alert or an evaluation case. Do not blame others, and do not offer a fake failure such as 'I work too hard'." },
              { type: "p", text: "**A disagreement:** show that you looked for evidence instead of winning by rank or by volume. You wrote down both options, agreed on a test or a metric, ran it, and went with the result, including when the result was not your option." },
              { type: "p", text: "**Vague goals:** turn the goal into a target we can measure, find the cheapest experiment that could show the idea is wrong, give it a time limit, and report what you learned. Mention that you checked with the user or stakeholder early." },
              { type: "p", text: "**Why this team:** one specific thing about their product or their problems, one thing you have done that maps to it, and one thing you want to learn. Keep it honest and short." },
            ] },
          ] },
        ] },
        { type: 'callout', tone: 'note', title: 'More practice questions', text: 'Revisit any module whose quiz challenged you. Quiz scores persist, so you can track your weakest areas in the Dashboard and target them before your interview.' },
      ],
    },
    {
      id: "coding-round",
      title: "The coding round: what it really asks",
      blocks: [
        { type: "p", text: "Most loops still include one general coding problem. Many now add a **practical** task that looks like a small slice of the daily job. Prepared candidates stand out on the second kind, because the same tasks come back again and again." },
        { type: "table", caption: "Practical coding tasks that are commonly reported", head: ["Task", "What it checks", "Details that earn credit"], rows: [
          ["Split text into chunks with overlap", "Careful loops and edge cases", "Do not cut inside a word or sentence; handle text shorter than one chunk"],
          ["Top-k search over vectors", "Cosine similarity, sorting, numpy", "Normalise once; avoid a full sort when k is small"],
          ["Parse and validate model output", "Defensive coding", "Handle broken JSON, missing fields and wrong types; retry with a limit"],
          ["Call an API many times in parallel", "Async code, retries, timeouts", "Cap the number of calls in flight; wait longer after each failure; keep results in order"],
          ["Rate limiter for an LLM API", "State, time, clear thinking", "Limit tokens as well as requests; tell the caller how long to wait"],
          ["A small evaluation script", "Metrics and honest measurement", "Recall@k, MRR, exact match; print the failures, not only the average"],
          ["Attention or softmax in numpy", "Fundamentals in code", "Array shapes, the mask, numerical stability"],
        ] },
        { type: "steps", title: "How to work through a practical task", items: [
          { title: "Restate and ask", text: "'So I limit by tokens per minute, for each API key, and I tell the caller how long to wait. Should a request over the limit wait or fail?' Two questions, not ten." },
          { title: "Agree on the interface", text: "Write the function or class signature and one example call before any logic." },
          { title: "Write the simplest correct version", text: "Plain data structures. Say the time and memory cost. Leave the clever version for later." },
          { title: "Test with small cases", text: "Run one normal case and two edge cases. Pass in the clock or the random seed, so the test gives the same result every time." },
          { title: "Name what is missing", text: "'In production this needs a lock for threads, a shared store when there are several servers, and a correction once the real token count is known.' We do not have to build it. We have to know it." },
        ] },
        { type: "code", lang: "python", title: "token_budget.py", code: `# A coding-round favourite: limit calls to an LLM API by TOKENS per minute.
class TokenBudget:
    def __init__(self, tokens_per_minute, now=0.0):
        self.capacity = tokens_per_minute
        self.rate = tokens_per_minute / 60          # tokens refilled each second
        self.level = float(tokens_per_minute)       # start with a full bucket
        self.last = now

    def wait_time(self, tokens, now):
        """Take the tokens and return 0, or return the seconds to wait."""
        if tokens > self.capacity:
            raise ValueError("request is larger than the whole budget")
        self.level = min(self.capacity, self.level + (now - self.last) * self.rate)
        self.last = now
        if tokens <= self.level:
            self.level -= tokens
            return 0.0
        return (tokens - self.level) / self.rate

budget = TokenBudget(tokens_per_minute=6_000)
clock = 0.0                                         # a fake clock makes the test repeatable
for i, need in enumerate([2_500, 2_500, 2_500, 500, 4_000], start=1):
    wait = budget.wait_time(need, clock)
    if wait:                                        # sleep, then the retry must succeed
        clock += wait
        assert budget.wait_time(need, clock) == 0.0
    print(f"request {i}: {need:5,} tokens  waited {wait:4.1f} s  sent at t={clock:5.1f} s  "
          f"left in bucket {budget.level:5,.0f}")
    clock += 1.0                                    # the next request arrives a second later

try:
    budget.wait_time(9_000, clock)
except ValueError as err:
    print("rejected:", err)`, output: `request 1: 2,500 tokens  waited  0.0 s  sent at t=  0.0 s  left in bucket 3,500
request 2: 2,500 tokens  waited  0.0 s  sent at t=  1.0 s  left in bucket 1,100
request 3: 2,500 tokens  waited 13.0 s  sent at t= 15.0 s  left in bucket     0
request 4:   500 tokens  waited  4.0 s  sent at t= 20.0 s  left in bucket     0
request 5: 4,000 tokens  waited 39.0 s  sent at t= 60.0 s  left in bucket     0
rejected: request is larger than the whole budget`, walkthrough: [
          { lines: [2, 7], note: "A token bucket. It holds at most one minute of budget and refills at a steady rate: 6,000 tokens per minute is 100 tokens per second." },
          { lines: [9, 12], note: "The interface: ask for some tokens at a given time. A request bigger than the whole bucket can never succeed, so we reject it at once instead of making it wait forever." },
          { lines: [13, 18], note: "Refill for the time that has passed, never above the capacity. If enough tokens are there, take them. If not, return how long the caller must wait: missing tokens divided by the refill rate." },
          { lines: [20, 29], note: "A test with a fake clock. Two requests pass at once. The third finds only 1,200 tokens (1,100 left plus 100 refilled) and waits 13 seconds for the missing 1,300." },
          { lines: [31, 34], note: "The edge case: 9,000 tokens is more than the bucket can ever hold, so the limiter raises an error." },
        ] },
        { type: "p", text: "Notice the fake clock. We pass `now` in, instead of reading the system clock inside the class. That lets us test waiting without waiting, and it shows the interviewer that we write code that can be tested." },
        { type: "callout", tone: "note", title: "When an AI assistant is allowed", text: "Some companies let you use an AI coding tool in this round. Then the code is not the only thing being scored. The interviewer watches what you ask for, whether you read what comes back, whether you catch a mistake, and whether you can explain and test every line you keep. Treat the tool as a fast junior colleague: give it small, clear tasks and review all of its work. If the rules are not stated, ask." },
        { type: "check", question: "In the run above, request 5 needed 4,000 tokens and waited 39 seconds, although the limit is 6,000 tokens per minute. Why so long?", answer: "The bucket was empty after request 4 at t = 20 s. One second later it had refilled only 100 tokens. The request needed 3,900 more, and 3,900 / 100 = 39 seconds. A token budget is shared by everything sent in the last minute, so a large request right after a burst waits a long time. This is one reason to keep batch jobs and interactive traffic in separate buckets." },
      ],
    },
    {
      id: 'system-design-round',
      title: 'The AI system design round',
      blocks: [
        { type: 'p', text: 'In this round you get an open problem, such as "Design a support assistant for our help centre" or "Design a code-review bot", and 35–60 minutes. There is no single right answer. The interviewer watches **how you structure the problem**, whether your choices fit the requirements, and whether you can explain trade-offs and failure modes.' },
        { type: "steps", title: "A framework that works for most AI design questions", items: [
          { title: "Clarify requirements (5 min)", text: "Users and use cases, scale (users, requests per day), latency target, accuracy bar, languages, privacy and compliance, budget, and what the system must never do. Write them down." },
          { title: "Define success (2 min)", text: "One business metric, such as tickets avoided or time saved, and one or two quality metrics, such as answer correctness or retrieval recall. Agree on them before designing." },
          { title: "Estimate (3 min)", text: "Requests per second at peak, tokens per request, daily cost, memory. Rough numbers drive model choice and architecture." },
          { title: "Data and knowledge (3 min)", text: "Sources, size, freshness, quality and permissions. For classic ML this means labels and features. For LLM applications it means documents, tools and what goes into the context." },
          { title: "High-level design (8 min)", text: "Draw the main pipeline: input, guardrails, retrieval, model, tools, output, logging. Name the components and say why each one is there." },
          { title: "Deep dives (15 min)", text: "Go deep where the interviewer leans in, typically retrieval quality, model choice and serving, or the safety of agents and tools." },
          { title: "Evaluation (5 min)", text: "Offline eval set and metrics, online metrics, LLM-as-judge with human calibration, regression tests before every change." },
          { title: "Reliability, safety, cost, monitoring (5 min)", text: "Fallbacks, timeouts, rate limits, caching, prompt-injection defences, PII handling. Then how we notice trouble: sampled quality scores, user feedback, latency percentiles and cost per request, with a release to a small share of users first." },
          { title: "Summarise and iterate", text: "Recap the design, the main risks, and what you would build first versus later." },
        ] },
        { type: "p", text: "The prompts repeat across companies. Each one is built to test one main skill. Recognise it early, and use the deep-dive time on it." },
        { type: "table", caption: "Prompts that come up again and again", head: ["Prompt", "What it is really testing", "A strong deep dive"], rows: [
          ["Chatbot over company documents", "Retrieval quality and grounded answers", "Chunking, hybrid search, reranking, permissions, abstaining"],
          ["Support agent that can take actions", "Safe tool use", "Allowed actions, limits, approval, audit log, handoff"],
          ["Enterprise or semantic search", "Indexing at scale and ranking", "Filters, freshness, keyword plus vector search, evaluation with labelled queries"],
          ["LLM gateway or inference service", "Serving under load", "Token limits, routing, fallback, batching, streaming"],
          ["Code-review or coding assistant", "Context selection and trust", "Which code goes in the prompt, sandboxed runs, a diff for a human to review"],
          ["Content moderation", "Speed against accuracy at high volume", "Cheap filters first, a model for unclear cases, human review, appeals"],
          ["Recommendation feed", "The retrieve-then-rank funnel", "Candidate generation, a ranking model, new users and items, online tests"],
          ["'Quality dropped. Find out why.'", "Debugging with evidence", "The triage method in the debugging section of this lesson"],
        ] },
        { type: "table", caption: "Rough numbers to keep in your head. Orders of magnitude only; they vary by model and vendor.", head: ["Quantity", "Rough figure"], rows: [
          ["1,000 tokens", "About 750 English words"],
          ["Comfortable streaming speed", "Above about 5 tokens per second, the text keeps up with a reader"],
          ["Output speed for one user", "Tens of tokens per second; a few hundred on fast setups"],
          ["Time to first token", "A few hundred milliseconds to a few seconds, growing with prompt length"],
          ["Vector search", "Milliseconds to tens of milliseconds"],
          ["Reranking a few dozen candidates", "Tens to a few hundred milliseconds"],
          ["Model weights in memory", "Parameters × bytes per parameter: 8 billion at 16 bits is 16 GB"],
          ["Price of hosted models", "Under a dollar to tens of dollars per million tokens; output costs a few times more than input"],
        ] },
        { type: "callout", tone: "warn", title: "Say prices as rough, never as fact", text: "Prices and speeds change every few months. In an interview, say 'on the order of a dollar per million tokens for a mid-sized model, and I would check the current price list'. A confident, exact, wrong number is worse than an honest range. The code below marks its prices as illustrative for the same reason." },
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
      id: "worked-agent-design",
      title: "A second walkthrough: an agent that can issue refunds",
      blocks: [
        { type: "p", text: "**Prompt:** 'Extend the support assistant so it can issue refunds.' Interviewers like this follow-up because one sentence changes the risk completely. A read-only assistant can only *say* something wrong. An agent that acts can *do* something wrong, with real money." },
        { type: "steps", title: "What we add, in the order we would say it", items: [
          { title: "Define the allowed actions", text: "A short list of tools: look up an order, check refund eligibility, create a refund. Each has a strict schema. Nothing else is possible, whatever the prompt says." },
          { title: "Put the rules in code, not in the prompt", text: "Eligibility (within 30 days, item returned, amount no larger than the amount paid) is checked by the refund service. The model proposes; the service decides." },
          { title: "Scope every call to the user", text: "The tool receives the logged-in user's ID from our backend, never from the model. The agent cannot touch another customer's order." },
          { title: "Add limits and approval", text: "Small refunds go through automatically. Above a set amount, or for a customer who asks often, the agent prepares the case and a person approves it." },
          { title: "Make actions safe to retry", text: "Each refund call carries an **idempotency key**: one unique ID per intended refund. If the agent or the network retries, the service sees the same key and pays once." },
          { title: "Log and evaluate the whole path", text: "Store every tool call with its arguments and result. Test on scripted cases: eligible, not eligible, another customer's order, and a message that tries to give the agent new instructions." },
        ] },
        { type: "flow", title: "The refund agent loop", loop: true, nodes: [
          { label: "Understand", detail: "The model reads the message and the history and works out what the customer wants." },
          { label: "Propose a tool call", detail: "The model outputs a tool name and arguments. This is a request, not an action." },
          { label: "Check in code", detail: "Our runtime validates the arguments, the user scope, the refund rules and the step limit. It can refuse." },
          { label: "Run or ask a person", detail: "Allowed and small: run it with an idempotency key. Large or unusual: put it in a queue for approval." },
          { label: "Observe", detail: "The result goes back to the model as data. The loop repeats until there is a final answer or the step limit is reached." },
        ] },
        { type: "table", caption: "What we measure for an agent", head: ["Metric", "Why it matters"], rows: [
          ["Task success rate on scripted cases", "Did the right refund happen, and only that one?"],
          ["Wrong-action rate", "The number that must stay near zero; a single case deserves an investigation"],
          ["Handoff rate", "Too high and the agent adds little. Too low and we should check that it is not guessing"],
          ["Steps and tokens per task", "Agents loop, so cost and latency grow with every step"],
          ["Tool error rate", "Timeouts and bad arguments point to weak tool descriptions or weak services"],
        ] },
        { type: "check", question: "An interviewer asks: why not just write 'never refund more than the order total' in the system prompt? What is the answer?", answer: "A prompt is a request to the model, not a guarantee. The model can make a mistake, and a customer message or a document can contain text that pushes it to ignore the rule. A check inside the refund service always runs and cannot be argued with. We still put the rule in the prompt, so the model explains the policy correctly, but the code is what enforces it." },
      ],
    },
    {
      id: 'worked-debugging',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: 'Besides "design X", many loops include a **debugging question**: "Our support bot\'s answer quality dropped last week. How would you find out why?" There is no diagram to draw. The interviewer wants to see a method. The strongest move is to refuse to guess, and to split the failures by pipeline stage first.' },
        { type: 'steps', title: 'A method you can say out loud', items: [
          { title: 'Pin down the symptom', text: '"Which metric dropped, by how much, and since when? Thumbs-down rate, escalations, or the offline eval?" A vague complaint becomes a number and a date.' },
          { title: 'Ask what changed', text: '"What shipped around that date? A prompt edit, a model version, a re-index, a new document source, a traffic shift?" Most regressions follow a change.' },
          { title: 'Collect failing examples', text: 'Pull a sample of bad answers, say 100, with their full traces: rewritten query, retrieved chunks, prompt, tool calls and final answer.' },
          { title: 'Triage by stage', text: 'For each one ask in order: was the right chunk retrieved? If yes, did the answer use it correctly? If the question was out of scope, did the bot abstain?' },
          { title: 'Fix the biggest bucket', text: 'Work on the stage that explains the most failures. Do not start with the stage that is most fun to fix.' },
          { title: 'Prove it and guard it', text: 'Re-run the offline eval, check that nothing else got worse, and add the failing cases to the regression set.' },
        ] },
        { type: 'chart', kind: 'hbar', title: 'Triage of 100 failed answers', xLabel: 'Failures', labels: ['Right chunk not retrieved', 'Chunk retrieved, answer wrong', 'Out of scope, should have abstained', 'Tool call failed or timed out'], series: [ { name: 'Count', values: [55, 25, 12, 8] } ], caption: 'Illustrative numbers for the worked example. More than half of the failures happen before the LLM writes a word.' },
        { type: 'p', text: 'With these numbers the conclusion writes itself: 55 of 100 failures are retrieval misses, so changing the generation prompt or the model cannot fix more than 45. We would look at the retrieval stage first. Did the re-index drop documents? Did a new chunk size split answers in half? Are the missed questions full of product codes that vector search handles badly?' },
        { type: 'table', caption: 'Each bucket points to a different fix', head: ['Bucket', 'First things to check', 'Typical fix'], rows: [
          ['Right chunk not retrieved', 'Index freshness, chunking, query rewrite, filters', 'Hybrid search, better chunks, fix the ingest'],
          ['Chunk retrieved, answer wrong', 'Too many distracting chunks, unclear instructions, conflicting documents', 'Rerank and keep fewer chunks, tighten the prompt, show document dates'],
          ['Should have abstained', 'Score threshold, out-of-scope examples in the eval set', 'Abstain below a rerank score, add a handoff path'],
          ['Tool failure', 'Timeouts, error handling, argument validation', 'Retries with limits, clear error messages back to the model'],
        ] },
        { type: 'callout', tone: 'tip', title: 'A sentence worth memorising', text: '"Before I change anything, I would measure where the failures are, because a fix aimed at the wrong stage cannot help." Said early, it tells the interviewer you debug with evidence.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will write the triage step as code, the kind of small utility a coding round might ask for. Ten test questions come with recorded results. For each one we decide which stage failed, and we repeat this for three settings of k, the number of retrieved chunks placed in the prompt. Watch how the *mix* of failures shifts as k grows.' },
        { type: 'code', lang: 'python', title: 'practice_failure_triage.py', code: `# Failure triage for a RAG bot: WHICH stage broke each wrong answer?
# Ten test questions with recorded results (illustrative data).
#   gold_rank: position of the correct chunk in the search results (None = never found)
#   max_k:     the answer is right only if the model reads at most this many chunks
#              (0 = it misreads the chunk even alone; 9 = extra chunks never distract it)
RESULTS = [(1, 9), (1, 9), (2, 9), (1, 3), (3, 9),
           (4, 9), (None, 9), (2, 0), (5, 9), (1, 3)]
CHUNK_TOKENS = 400

def triage(gold_rank, max_k, k):
    """Classify one question when the top k chunks are put in the prompt."""
    if gold_rank is None or gold_rank > k:
        return "retrieval miss"        # the right chunk never reached the model
    if k > max_k:
        return "generation error"      # it was there, but the answer is still wrong
    return "correct"

print(" k  correct  retrieval miss  generation error  recall@k  context tokens")
for k in (1, 3, 5):
    counts = {"correct": 0, "retrieval miss": 0, "generation error": 0}
    for gold_rank, max_k in RESULTS:
        counts[triage(gold_rank, max_k, k)] += 1
    recall = 1 - counts["retrieval miss"] / len(RESULTS)
    print(f"{k:2d}  {counts['correct']:7d}  {counts['retrieval miss']:14d}  "
          f"{counts['generation error']:16d}  {recall:8.2f}  {k * CHUNK_TOKENS:14,d}")`, output: ` k  correct  retrieval miss  generation error  recall@k  context tokens
 1        4               6                 0      0.40             400
 3        6               3                 1      0.70           1,200
 5        6               1                 3      0.90           2,000`, walkthrough: [
          { lines: [6, 8], note: 'The recorded results. Each question has the rank of its correct chunk and the largest number of chunks the model can read before it gets the answer wrong.' },
          { lines: [10, 16], note: 'The triage rule, checked in pipeline order. First: did the right chunk reach the model? Only then: did the model answer correctly with it?' },
          { lines: [19, 22], note: 'For k = 1, 3 and 5, classify all ten questions and count each outcome.' },
          { lines: [23, 25], note: 'Print the counts, the retrieval recall@k, and the context tokens that k chunks cost on every request.' },
        ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Add `10` to the list of k values. Predict the number of correct answers and the recall before you run it. Is the best recall also the best system?',
          'Simulate adding a reranker that keeps distracting chunks out: change both `(1, 3)` entries to `(1, 9)`. Predict the new "correct" count at k = 5.',
          'Simulate better retrieval instead: change `(None, 9)` to `(2, 9)` and `(5, 9)` to `(2, 9)`. Predict which k gains the most, and compare with the reranker change. Which fix would you ship first at k = 3?',
        ] },
        { type: 'check', question: 'k = 3 and k = 5 both get 6 of 10 correct. Are the two systems equally good, and would the same fix help both?', answer: 'No. At k = 3 the main problem is retrieval: 3 misses and 1 generation error, so better search is the next step. At k = 5 retrieval is nearly solved (recall 0.90) but 3 answers go wrong because extra chunks distract the model, so reranking or a tighter prompt is the next step. k = 5 also costs 2,000 context tokens per request instead of 1,200. The same accuracy can hide very different failure mixes, which is why we triage before fixing.' },
        { type: 'check', question: 'At k = 1 the recall is 0.40 and there are zero generation errors. A teammate concludes "the LLM is perfect, only search is broken". What is wrong with that conclusion?', answer: 'The model was only tested on the 4 questions where the right chunk arrived, and with a single chunk there was nothing to distract it. End-to-end accuracy can never be higher than retrieval recall, so the generator\'s weaknesses stay hidden until retrieval improves. At k = 5 the same model makes 3 generation errors. We can only judge a later stage on the cases the earlier stage passed through.' },
      ],
    },
    {
      id: "take-home-and-deep-dive",
      title: "Take-homes, work samples and the project deep dive",
      blocks: [
        { type: "p", text: "Some companies replace a live round with a **take-home** (a task done in your own time, usually a few hours) or a **work sample** (a realistic task done in a live session). A common brief: 'Here are 200 documents and 30 questions. Build something that answers them, and tell us how good it is.' AI tools can now write most of the code, so reviewers look less at how much code there is and more at your decisions and your measurements." },
        { type: "table", caption: "What reviewers of a take-home look for", head: ["Reviewers look for", "What that means in practice"], rows: [
          ["It runs", "One command to install and one to run; pinned dependencies; no secret keys in the repository"],
          ["A measured result", "A small evaluation with numbers, even 30 hand-checked cases, and a simple baseline to compare against"],
          ["Honest error analysis", "Five failures you looked at, and what caused each one"],
          ["Clear trade-offs", "A short write-up: what you chose, what you skipped and why, what you would do with one more week"],
          ["Sensible scope", "A simple pipeline that works beats an ambitious one that half works"],
          ["You can defend it", "In the follow-up call you can explain any line, including lines an AI tool wrote"],
        ] },
        { type: "p", text: "The **project deep dive** applies the same idea to your own past work. The interviewer picks one project and keeps asking 'why?' and 'how do you know?' until they reach the edge of what you understand. Prepare one project to this depth:" },
        { type: "list", items: [
          "**The numbers:** data size, traffic, latency, cost per request, quality before and after.",
          "**The decisions:** two real choices you made, each with the option you rejected and the reason.",
          "**The failure:** something that went wrong, how you found it, and what you changed.",
          "**Your part:** what you built yourself, and what teammates built.",
          "**The next step:** what you would do differently today.",
        ] },
        { type: "callout", tone: "warn", title: "Do not inflate", text: "A deep dive is designed to find the edge of your knowledge. If you claim a part you did not build, three follow-up questions will show it, and that costs more than the claim gained. 'A teammate built the index; I owned the evaluation' is a perfectly good answer." },
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
          { when: 'Days 27–30', title: 'System design and mock interviews', text: 'Modules 16–17 skim, then three timed system designs (RAG assistant, an agent that takes actions, an LLM gateway), one practical coding task a day, one full mock loop with a friend, polish your project stories, rest the day before.' },
        ] },
        { type: 'table', caption: 'Weekly checkpoints', head: ['End of week', 'You should be able to'], rows: [
          ['Week 1', 'Explain overfitting, precision/recall and backprop in 60 seconds each, without notes'],
          ['Week 2', 'Write attention from scratch and explain √dₖ, masking, multi-head, RoPE, temperature and top-p'],
          ['Week 3', 'Compare LoRA vs full fine-tuning, RLHF vs DPO, and build and evaluate a small RAG pipeline'],
          ['Week 4', 'Run a 45-minute system design with estimates, evaluation, safety and cost, and tell three project stories with numbers'],
        ] },
        { type: "p", text: "Short on time? With two weeks, halve each block and keep the last four days as they are. With one week, skip the first two blocks. Spend the week on the question bank aloud, one practical coding task a day, and two timed designs." },
        { type: "callout", tone: "tip", title: "Three habits that matter more than the calendar", text: "Practise **aloud**, because knowing an answer and saying it clearly in a minute are different skills. Do at least two **mock interviews** with another person on your weakest round, not your favourite one. And build one small project end to end with an evaluation, because it feeds the coding round, the design round and the deep dive at once." },
      ],
    },
    {
      id: 'final-tips',
      title: 'Common mistakes and final tips',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Mistakes that sink otherwise strong candidates', text: 'Jumping into a design without clarifying requirements. Naming tools ("we use a vector DB and LangChain") without explaining why. Never mentioning evaluation. Ignoring cost, latency and safety. Bluffing on a detail instead of reasoning aloud. Talking for five minutes without checking whether the interviewer wants depth or breadth. Stating a price or a benchmark number as exact fact. Giving an agent tools with no limits on what it may do. Claiming project work that was not yours.' },
        { type: 'list', items: [
          '**Lead with structure.** "I\'ll cover requirements, a rough estimate, the pipeline, then go deep on retrieval and evaluation. Sound good?"',
          '**Find the hard part.** Every prompt has one area that makes it difficult. Name it early and spend the deep-dive time there.',
          '**Quantify.** Even rough numbers (tokens, QPS, dollars, milliseconds) show engineering judgement. Say that they are rough.',
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
      q: 'We are asked to extend a read-only support assistant so that it can issue refunds. What should the design add first?',
      options: ["A larger embedding model and a bigger vector index for the policies", "Limits, approval and safe retries on the actions it may take", "A much longer system prompt that tells the model to be very careful", "Fine-tuning on old refund chats, so that the model never gets it wrong"],
      answer: 1,
      explain: 'An agent that acts can do real damage, so the rules live in code: a short list of allowed tools, checks in the refund service, approval above a limit, and an idempotency key so a retry pays once. A careful prompt is a request to the model, not a guarantee.',
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
    'Typical rounds: general and practical coding, fundamentals, LLM depth, AI system design, project deep dive, behavioural, sometimes a take-home. Formats vary, so ask.',
    'Interviewers score evidence on signals such as depth, judgement, evaluation and communication. They can only score what you say aloud.',
    'Answer concepts in about 60 seconds: definition, problem, mechanism, trade-offs, example.',
    'In system design: clarify, define success, estimate, sketch the pipeline, go deep on the hard part, evaluate, then cover safety, cost and monitoring.',
    'A read-only assistant needs good retrieval and abstention; an agent that acts also needs allowed tools, checks in code, approval and safe retries.',
    'Quantify with rough numbers, offer trade-offs, measure before fixing, and practise aloud with mock interviews.',
  ],
  terms: [
    { term: 'System design round', def: 'An interview where you design an end-to-end system under stated requirements and explain trade-offs.' },
    { term: 'Back-of-envelope estimate', def: 'A quick rough calculation of traffic, tokens, memory or cost used to guide design decisions.' },
    { term: 'Recall@k', def: 'The fraction of queries for which a correct item appears in the top k retrieved results.' },
    { term: 'MRR', def: 'Mean Reciprocal Rank: the average of 1 / rank of the first correct result across queries.' },
    { term: 'Golden set', def: 'A curated set of inputs with expected outputs used to evaluate a system repeatedly.' },
    { term: 'Rubric', def: 'The list of signals, each with a rating, that an interviewer fills in after a round.' },
    { term: 'Idempotency key', def: 'A unique ID sent with an action so that a retry of the same action is carried out only once.' },
    { term: 'Abstention', def: 'When a system declines to answer, or hands off to a human, because it is not confident.' },
  ],
};
