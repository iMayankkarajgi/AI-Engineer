export default {
  id: 'six-words-of-ai-engineering',
  minutes: 23,
  hook: 'Six words show up in almost every AI job post and product demo: LLM, RAG, MCP, Agent, Fine-tuning and Quantization. What does each one actually do, and how do they click together into one working product?',
  summary: 'An LLM is a model that predicts text; RAG feeds it fresh facts at question time; MCP is a standard plug that connects it to tools and data; an Agent lets it act in a loop; Fine-tuning changes its habits by training; Quantization shrinks it so it runs cheaply. We tour all six through one running example: a support assistant for an online shop.',
  sections: [
    {
      id: 'why-six-words',
      title: 'Why start with six words?',
      blocks: [
        { type: 'p', text: 'AI engineering is the craft of building useful, reliable products on top of AI models. We usually do not train a giant model from scratch. Instead we take an existing model and wrap it with data, tools, and infrastructure so it can solve a real problem for real users.' },
        { type: 'p', text: 'Almost every conversation in this field uses the same six words: **LLM**, **RAG**, **MCP**, **Agent**, **Fine-tuning** and **Quantization**. If we understand what each one means and what problem it solves, the rest of this course becomes a series of deeper dives instead of a pile of jargon.' },
        { type: 'callout', tone: 'analogy', title: 'Think of a new support employee', text: 'Imagine hiring a very well-read new employee for a shop help desk. Their general knowledge and language skill is the **LLM**. Handing them the company handbook to look things up is **RAG**. Giving them a standard login to the order system is **MCP**. Letting them actually take steps on their own (look up the order, issue the refund, email the customer) makes them an **Agent**. Sending them on a training course so they always answer in the company style is **Fine-tuning**. And letting them work from a laptop instead of a huge office is **Quantization**: the same person, in a much smaller footprint.' },
        { type: 'p', text: 'Throughout this lesson we follow one running example: **ShopBot**, a support assistant for an online store. Customers ask things like "Where is my order?" or "Can I get a refund?" and ShopBot must answer correctly, in the company tone, cheaply, and fast. Each of the six words fixes one specific weakness of the plain model.' },
      ],
    },
    {
      id: 'llm',
      title: 'Word 1: LLM, the engine that predicts text',
      blocks: [
        { type: 'p', text: 'A **Large Language Model (LLM)** is a neural network trained on a huge amount of text to do one simple-sounding job: given some text, predict the next small piece of text. Those pieces are called **tokens**. A token is often a word or part of a word; for example "refunds" might be split into "ref" and "unds".' },
        { type: 'p', text: 'The model does not pick a single next token directly. It outputs a probability for every token in its vocabulary, picks one (we learn exactly how in Module 5), appends it, and repeats. Writing a whole answer is just this one step run many times. This is called **autoregressive** generation: each new token depends on all the tokens before it.' },
        { type: 'viz', name: 'temperature', caption: 'An LLM outputs probabilities for the next token. Drag the temperature slider to see how the choice can be made more predictable (low) or more varied (high).' },
        { type: 'p', text: '"Large" refers to the number of **parameters**: the learned numbers (weights) inside the network. Modern LLMs have billions of them. During **pre-training**, the model reads trillions of tokens and adjusts those weights so its next-token guesses get better. Along the way it picks up grammar, facts, reasoning patterns, and coding skill, because all of these help predict text.' },
        { type: 'p', text: 'For ShopBot, the LLM is the part that understands "my parcel never showed up" and writes a polite, fluent reply. But a plain LLM has three big gaps:' },
        { type: 'list', items: [
          '**It does not know our private data.** It was never trained on our refund policy or today\'s order database.',
          '**Its knowledge is frozen** at its training cut-off date.',
          '**It can only produce text.** On its own it cannot look up an order or issue a refund. It may also *hallucinate*: produce a confident answer that is simply wrong.',
        ] },
        { type: 'p', text: 'The next words in our list exist mostly to close these gaps.' },
      ],
    },
    {
      id: 'rag',
      title: 'Word 2: RAG, giving the model the right facts',
      blocks: [
        { type: 'p', text: '**Retrieval-Augmented Generation (RAG)** means: before the LLM answers, we *retrieve* the most relevant pieces of our own documents and paste them into the prompt, so the model *generates* its answer grounded in those facts. The model\'s weights do not change at all; we only change what it reads.' },
        { type: 'flow', title: 'How ShopBot answers with RAG', nodes: [
          { label: 'Question', detail: 'A customer asks: "How many days until my refund arrives?"' },
          { label: 'Retrieve', detail: 'We search the help-centre articles and policy docs for the passages most related to the question. Real systems usually use embeddings and a vector database (Module 10).' },
          { label: 'Augment', detail: 'We build a prompt: instructions + the retrieved passages + the question.' },
          { label: 'Generate', detail: 'The LLM writes an answer using the passages, e.g. "Refunds reach your original card within 5 business days."' },
          { label: 'Cite', detail: 'Good systems also show which article the answer came from, so users and reviewers can check it.' },
        ] },
        { type: 'p', text: 'Why is this so popular? Because updating knowledge is now as easy as updating a document. If the refund window changes from 5 to 7 days, we edit the help article and ShopBot is correct immediately. No training needed. RAG also reduces hallucination, because the model is told to answer from the given text, and it lets us cite sources.' },
        { type: 'check', question: 'Pause and predict: the shop changes its shipping policy this morning. With RAG, what do we need to do so ShopBot answers correctly this afternoon?', answer: 'Just update the shipping document in the knowledge base (and re-index it). RAG reads documents at question time, so the model itself needs no retraining.' },
      ],
    },
    {
      id: 'mcp',
      title: 'Word 3: MCP, a standard plug for tools and data',
      blocks: [
        { type: 'p', text: 'RAG gives the model documents. But ShopBot also needs *live* systems: the order database, the shipping tracker, the refund API. Every app that wants to connect an LLM to every tool used to write custom glue code for each pair. With 5 AI apps and 10 tools that is up to 50 separate integrations.' },
        { type: 'p', text: 'The **Model Context Protocol (MCP)** is an open standard, introduced by Anthropic in late 2024 and now supported by many AI apps and vendors, that defines one common way for AI applications to talk to tools and data sources. A tool provider writes one **MCP server** (for example, "order-system server"). Any AI application that includes an **MCP client** can then use it. Each side is built once, so 5 apps and 10 tools need about 15 pieces instead of 50.' },
        { type: 'callout', tone: 'analogy', title: 'Like USB-C for AI', text: 'Before USB, every device had its own special cable. A standard port means any charger fits any phone. MCP plays that role between AI apps and the tools they use.' },
        { type: 'p', text: 'An MCP server can expose three kinds of things: **tools** (actions the model may call, such as `get_order_status(order_id)`), **resources** (data it may read, such as a file or record), and **prompts** (reusable prompt templates). Messages are exchanged as JSON. Important: MCP is only the *plug*. It does not decide when to call a tool. That decision belongs to the model and the agent around it, which is our next word. We go deep on MCP in Module 11.' },
      ],
    },
    {
      id: 'agent',
      title: 'Word 4: Agent, an LLM that can act in a loop',
      blocks: [
        { type: 'p', text: 'An **AI Agent** is a program where an LLM decides which steps to take, takes them using tools, looks at the results, and keeps going until the goal is done. The key difference from a plain chatbot is the **loop**: a chatbot answers once; an agent can think, act, observe, and repeat.' },
        { type: 'viz', name: 'agent-loop', caption: 'Watch an agent think, call a tool, read the result, and repeat until it can give a final answer.' },
        { type: 'steps', title: 'ShopBot handles "My order #4512 never arrived, please refund me"', items: [
          { title: 'Think', text: 'The LLM reasons: "First I should check the order status."' },
          { title: 'Act', text: 'It calls the tool `get_order_status("4512")`, exposed by the order-system MCP server.' },
          { title: 'Observe', text: 'The tool returns: "Shipped 12 days ago, marked lost by carrier."' },
          { title: 'Think again', text: 'Using the refund policy it retrieved via RAG, it concludes a lost parcel qualifies for a full refund.' },
          { title: 'Act again', text: 'It calls `issue_refund("4512")`. For money-moving actions a careful product would ask a human to approve first.' },
          { title: 'Answer', text: 'It replies to the customer with what happened and when the money will arrive.' },
        ] },
        { type: 'p', text: 'Agents are powerful but riskier: more steps mean more chances to go wrong, more cost, and more latency. Good agents have limits (maximum steps), permission checks for dangerous actions, and logs we can inspect.' },
      ],
    },
    {
      id: 'fine-tuning',
      title: 'Word 5: Fine-tuning, changing the model\'s habits',
      blocks: [
        { type: 'p', text: '**Fine-tuning** means continuing to train an already pre-trained model on a smaller, focused dataset so its weights change. For example, we might fine-tune on a few thousand past support chats that our best human agents wrote, so ShopBot learns our tone, our reply format, and how to handle tricky edge cases.' },
        { type: 'p', text: 'Fine-tuning a whole model updates billions of weights and needs a lot of GPU memory. A popular cheaper method is **LoRA (Low-Rank Adaptation)**: we freeze the original weights and train only small extra matrices, often well under 1% of the parameter count. Module 8 explains this in detail.' },
        { type: 'compare', title: 'RAG vs Fine-tuning: which fixes what?', options: [
          { name: 'RAG', summary: 'Change what the model *reads* at question time.', pros: ['Knowledge updates instantly', 'Can cite sources', 'No training cost'], cons: ['Needs a good search system', 'Uses more prompt tokens per question'], bestFor: 'Facts that change: policies, docs, prices, product catalogues' },
          { name: 'Fine-tuning', summary: 'Change what the model *is* by training its weights.', pros: ['Teaches style, format and behaviour', 'Can shorten prompts', 'Can make a small model good at one narrow task'], cons: ['Needs curated training data', 'Knowledge goes stale until retrained', 'Harder to trace why it said something'], bestFor: 'Tone, output format, domain skills, narrow repeated tasks' },
        ], rows: [
          ['Changes model weights?', 'No', 'Yes'],
          ['Time to update knowledge', 'Minutes (edit a doc)', 'Hours to days (retrain)'],
          ['Good at adding new facts?', 'Yes', 'Unreliable'],
          ['Good at changing style?', 'Somewhat (via instructions)', 'Yes'],
        ], verdict: 'Rule of thumb: RAG for knowledge, fine-tuning for behaviour. Many products use both.' },
        { type: 'callout', tone: 'warn', title: 'Common beginner mistake', text: 'Trying to "teach the model our documents" by fine-tuning on them. Fine-tuning is unreliable for memorising facts, and every policy change would need retraining. Use RAG for facts.' },
      ],
    },
    {
      id: 'quantization',
      title: 'Word 6: Quantization, making the model smaller and cheaper',
      blocks: [
        { type: 'p', text: 'Every parameter is a number stored in memory. In 16-bit floating point (FP16 or BF16) each parameter takes 2 bytes. A model with 7 billion parameters therefore needs about 7 × 2 = 14 GB just to hold its weights. **Quantization** stores those numbers with fewer bits, such as 8-bit or 4-bit integers, by rounding each weight to the nearest value on a coarser grid.' },
        { type: 'chart', kind: 'bar', title: 'Weight memory for a 7-billion-parameter model', yLabel: 'GB', unit: ' GB', labels: ['FP32', 'FP16', 'INT8', 'INT4'], series: [ { name: 'Weights only', values: [28, 14, 7, 3.5] } ], caption: 'Simple arithmetic: parameters × bytes per parameter. Real deployments need extra memory for activations and the KV cache, and 4-bit formats add a little overhead for scale factors.' },
        { type: 'p', text: 'Smaller weights mean the model fits on cheaper GPUs or even laptops and phones, and it often runs faster because moving data through memory is a major bottleneck. The price is a small loss of precision, which usually costs a little quality. 8-bit is usually close to the original; 4-bit is widely used but the quality loss depends on the model and method, so we always measure it.' },
        { type: 'viz', name: 'quantization', caption: 'Lower the bit-width and watch the weights snap to fewer allowed values: memory drops, rounding error grows.' },
      ],
    },
    {
      id: 'code',
      title: 'Try it: toy RAG and toy quantization in Python',
      blocks: [
        { type: 'p', text: 'Here is a tiny, runnable sketch of two of the words. The "retriever" just counts shared words (real systems use embeddings), and the quantizer stores one million fake weights as 8-bit integers.' },
        { type: 'code', lang: 'python', title: 'six_words_demo.py', code: `import numpy as np

# --- RAG: find the help-centre article that best matches the question ---
docs = {
    "refunds": "refunds are issued within 5 business days to the original card",
    "shipping": "standard shipping takes 3 to 7 days and express takes 1 to 2 days",
    "password": "reset your password from the login page using the forgot link",
}
question = "how many days until my refunds arrive"

def overlap(a, b):  # toy retriever: count shared words
    return len(set(a.split()) & set(b.split()))

scores = {name: overlap(question, text) for name, text in docs.items()}
best = max(scores, key=scores.get)
print("retrieval scores:", scores)
print("best article:", best)

# The prompt the LLM would actually receive (retrieved context + question)
prompt = f"Answer using only this context:\\n{docs[best]}\\nQuestion: {question}"
print(prompt)

# --- Quantization: store weights as 8-bit integers instead of 32-bit floats ---
rng = np.random.default_rng(0)
w = rng.normal(0, 0.02, size=1_000_000).astype(np.float32)  # 1M fake weights
scale = np.abs(w).max() / 127                    # map the largest weight to 127
w_int8 = np.round(w / scale).astype(np.int8)     # quantize
w_back = w_int8.astype(np.float32) * scale       # dequantize to use them
print(f"fp32 size: {w.nbytes/1e6:.1f} MB, int8 size: {w_int8.nbytes/1e6:.1f} MB")
print(f"mean absolute error after round trip: {np.abs(w - w_back).mean():.6f}")`, output: `retrieval scores: {'refunds': 2, 'shipping': 1, 'password': 0}
best article: refunds
Answer using only this context:
refunds are issued within 5 business days to the original card
Question: how many days until my refunds arrive
fp32 size: 4.0 MB, int8 size: 1.0 MB
mean absolute error after round trip: 0.000186`, walkthrough: [
          { lines: [3, 9], note: 'Our tiny knowledge base: three help articles, plus the customer question.' },
          { lines: [11, 17], note: 'Retrieval: score each article by shared words and keep the best. "refunds" wins because it shares both "refunds" and "days".' },
          { lines: [19, 21], note: 'Augmentation: the retrieved text is pasted into the prompt. This string is what the LLM would read before generating.' },
          { lines: [23, 26], note: 'Quantization: pick a scale so the largest weight maps to 127, divide, and round to 8-bit integers.' },
          { lines: [27, 29], note: 'Dequantize and compare. Memory is 4× smaller; the average error is tiny compared with typical weight sizes (about 0.016).' },
        ] },
        { type: 'check', question: 'In the output, why does the "shipping" article get a score of 1 even though it is about a different topic?', answer: 'Because it contains the word "days", which also appears in the question. Simple word overlap is easily fooled, which is exactly why real RAG systems use embeddings that compare meaning (Module 10).' },
      ],
    },
    {
      id: 'putting-it-together',
      title: 'How the six fit together in one product',
      blocks: [
        { type: 'p', text: 'Now let us assemble ShopBot. Each word has a clear job, and none of them replaces the others.' },
        { type: 'table', caption: 'ShopBot: which word solves which problem', head: ['Word', 'Problem it solves', 'In ShopBot'], rows: [
          ['LLM', 'We need language understanding and fluent replies', 'The core model that reads the chat and writes answers'],
          ['RAG', 'The model does not know our private, changing facts', 'Retrieves refund and shipping policies before answering'],
          ['MCP', 'Connecting to many tools needs messy custom code', 'Standard connectors to the order system and refund API'],
          ['Agent', 'Some requests need several actions, not one reply', 'Checks the order, decides, issues the refund, confirms'],
          ['Fine-tuning', 'Generic tone and format do not match our brand', 'Trained on our best past chats for tone and structure'],
          ['Quantization', 'Serving a big model for every chat is expensive', 'A 4-bit or 8-bit model served on cheaper GPUs'],
        ] },
        { type: 'flow', title: 'One customer message through the full stack', nodes: [
          { label: 'Customer', detail: '"Order #4512 never arrived. Refund please."' },
          { label: 'Agent loop', detail: 'A fine-tuned, quantized LLM plans the steps.' },
          { label: 'RAG', detail: 'Retrieves the lost-parcel refund policy.' },
          { label: 'MCP tools', detail: 'Calls order lookup and refund tools through MCP servers.' },
          { label: 'Reply', detail: 'Writes a grounded, on-brand answer and logs every step.' },
        ] },
        { type: 'callout', tone: 'tip', title: 'Start simple', text: 'A real team would not build all six on day one. A common order is: prompt a hosted LLM, add RAG for knowledge, add tools and an agent loop when actions are needed, then consider fine-tuning and quantization (or a smaller model) when quality, cost, or latency demand it. We also need **evaluation** (Module 14) to know whether each change actually helped.' },
        { type: 'callout', tone: 'warn', title: 'When not to reach for the fancy words', text: 'If a question can be answered by a simple search or a fixed form, an agent is overkill. If our documents fit easily in the prompt, a full RAG pipeline may not be needed. Every extra component adds cost and new ways to fail.' },
      ],
    },
    {
      id: 'common-mistakes',
      title: 'Common mistakes and how to spot them',
      blocks: [
        { type: 'p', text: 'Most early failures come from reaching for the wrong word. The cure is to name the **symptom** first, and only then pick the tool. A useful habit is to ask three questions in order: is the model missing a *fact*, missing an *ability to act*, or showing the wrong *habit*? Each answer points to a different word.' },
        { type: 'table', caption: 'ShopBot symptoms: the tempting fix and the fix that actually works', head: ['What we observe', 'Tempting but wrong', 'Better fix', 'Why'], rows: [
          ['Bot states an old delivery time', 'Fine-tune on the new document', 'RAG: fix the document and re-index', 'It is a missing fact, and facts change'],
          ['Bot says "I have refunded you" but no refund exists', 'A bigger model', 'Give it a real refund tool and check the tool result', 'Text alone cannot move money; the model only described an action'],
          ['Bot calls the same tool again and again', 'More documents in RAG', 'A step limit and clearer tool results in the agent loop', 'It is a loop-control problem, not a knowledge problem'],
          ['Replies are correct but too long and off-brand', 'More retrieved passages', 'Clearer instructions first, then fine-tuning', 'It is a habit, not a fact'],
          ['Answers are good but each one costs too much', 'Remove RAG', 'A smaller or quantized model, then measure quality again', 'It is a serving-cost problem'],
        ] },
        { type: 'p', text: 'Notice the second row. A plain LLM will happily *write* that it took an action. Only a tool call that returns a result proves the action happened. So in an agent we trust the **observation**, never the model\'s own claim.' },
        { type: 'steps', title: 'A quick diagnosis routine', items: [
          { title: 'Read one failing chat', text: 'Do not guess from averages. Open a real failure and read the full prompt, the retrieved text and every tool call.' },
          { title: 'Check what the model saw', text: 'If the right fact was not in the prompt, the retriever failed. That is a RAG problem.' },
          { title: 'Check what the model did', text: 'If the fact was there but the wrong tool was called, or none was called, that is an agent or tool-description problem.' },
          { title: 'Check how it said it', text: 'If facts and actions were right but tone or format was wrong, improve the instructions, and only then think about fine-tuning.' },
          { title: 'Change one thing, then re-test', text: 'Fix a single component and run the same failing chats again, so we know what helped.' },
        ] },
        { type: 'callout', tone: 'tip', title: 'Cheapest fix first', text: 'Editing a prompt or a document is usually the quickest change. Adding a tool is more work. Fine-tuning needs data and training on top of that. We try the fixes in that order.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will build a tiny agent loop in plain Python. There is no real LLM here: a small rule function plays the part of the model and decides the next step. The tools live in one registry with one common shape, which is the idea behind MCP. Watch how the loop thinks, acts, observes and stops.' },
        { type: 'code', lang: 'python', title: 'practice_agent_loop.py', code: `# A toy agent loop: a rule-based "model" picks tools until it can answer.
ORDERS = {"4512": "lost", "7001": "delivered"}       # fake order database
POLICY = "lost parcels get a full refund"            # fake retrieved document

# Tool registry: one common shape (name -> function), like a tiny MCP server
TOOLS = {
    "get_order_status": lambda order_id: ORDERS.get(order_id, "unknown"),
    "search_policy": lambda query: POLICY,
    "issue_refund": lambda order_id: f"refund sent for {order_id}",
}

def decide(order_id, seen):
    """Stand-in for the LLM: choose the next action from what we know so far."""
    if "get_order_status" not in seen:
        return "get_order_status", order_id
    if seen["get_order_status"] != "lost":
        return "answer", "No refund: the order is " + seen["get_order_status"]
    if "search_policy" not in seen:
        return "search_policy", "lost parcel"
    if "issue_refund" not in seen:
        return "issue_refund", order_id
    return "answer", "Refund issued: " + seen["issue_refund"]

def run_agent(order_id, max_steps=5):
    seen = {}                                        # observations so far
    for step in range(1, max_steps + 1):
        action, arg = decide(order_id, seen)
        if action == "answer":
            return f"step {step}: ANSWER -> {arg}"
        seen[action] = TOOLS[action](arg)            # act, then observe
        print(f"step {step}: {action}({arg!r}) -> {seen[action]!r}")
    return "stopped: step limit reached"

for oid in ("4512", "7001"):
    print(f"--- order {oid} ---")
    print(run_agent(oid))`, output: `--- order 4512 ---
step 1: get_order_status('4512') -> 'lost'
step 2: search_policy('lost parcel') -> 'lost parcels get a full refund'
step 3: issue_refund('4512') -> 'refund sent for 4512'
step 4: ANSWER -> Refund issued: refund sent for 4512
--- order 7001 ---
step 1: get_order_status('7001') -> 'delivered'
step 2: ANSWER -> No refund: the order is delivered`, walkthrough: [
          { lines: [2, 3], note: 'Fake data: two orders and one policy sentence. In a real product these would be a database and a retrieved document.' },
          { lines: [5, 9], note: 'The tool registry. Every tool is reached the same way, by name with one argument. That common shape is what a standard like MCP gives us.' },
          { lines: [12, 22], note: 'The stand-in for the LLM. It looks at the observations so far and picks the next action, or decides it can answer.' },
          { lines: [24, 32], note: 'The agent loop: decide, act, store the observation, repeat. The step limit stops a runaway loop.' },
        ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Change `max_steps=5` to `max_steps=2` in `run_agent`. Predict first: which order still gets an answer, and what does the other one print?',
          'Add an order `"9000": "in transit"` to `ORDERS` and add `"9000"` to the final loop. Predict how many steps it takes and whether the refund tool is called.',
          'Delete the two lines in `decide` that call `search_policy`. Predict what changes in the trace, and say why skipping the policy check would be risky in a real product.',
        ] },
        { type: 'check', question: 'Order 7001 finished in 2 steps but order 4512 needed 4. Nothing in the loop code says "use fewer steps for delivered orders". Where does the difference come from?', answer: 'From the decision function reacting to the observation. After the status tool returned "delivered", it chose to answer at once. The loop is the same for every request; the path through it depends on what the tools return. That is what separates an agent from a fixed script of steps.' },
        { type: 'check', question: 'Suppose `decide` had a bug and always returned `get_order_status`. What would `run_agent` return, and which part of the code protects us?', answer: 'It would call the status tool five times and then return "stopped: step limit reached". The `max_steps` limit in the `for` loop protects us. Without a limit, a confused model could call tools forever and run up cost.' },
      ],
    },
  ],
  quiz: [
    {
      q: 'What does a Large Language Model fundamentally do when it generates an answer?',
      options: ["Looks up a stored answer for the question in a large database", "Predicts next-token probabilities, picks one, and repeats", "Searches the web and copies the most relevant page it finds", "Runs a fixed set of if-then rules written by its engineers"],
      answer: 1,
      explain: 'An LLM generates autoregressively: predict next-token probabilities, choose a token, append it, repeat. It does not look up stored answers or browse unless we connect tools to it.',
    },
    {
      q: 'Our ShopBot keeps quoting last year\'s refund window. The policy document was updated yesterday. What is the most suitable fix?',
      options: ["Fine-tune the model on the new policy document", "Quantize the model to 4-bit so it can run more often", "Use RAG so the bot retrieves the current policy", "Switch to a model with many more parameters"],
      answer: 2,
      explain: 'Changing facts are what RAG is for: the bot reads the current document at question time. Fine-tuning is slow to update and unreliable for adding facts; quantization and size do not change what the model knows about our policy.',
    },
    {
      q: 'A model has 7 billion parameters. Roughly how much memory do its weights need at 4-bit precision?',
      options: ["About 3.5 GB", "About 7.0 GB", "About 14 GB", "About 28 GB"],
      answer: 0,
      explain: '4 bits is half a byte, so 7 billion × 0.5 bytes ≈ 3.5 GB. 14 GB is FP16 (2 bytes each), 7 GB is INT8, and 28 GB is FP32.',
    },
    {
      q: 'Which statement best describes the difference between MCP and an Agent?',
      options: ["MCP is a kind of LLM; an Agent is a kind of vector database", "MCP connects apps to tools; an Agent decides which tools to use", "They are two names for the same component in an AI product", "MCP trains the model; an Agent compresses it for cheaper serving"],
      answer: 1,
      explain: 'MCP is the plug: a protocol that exposes tools, resources and prompts. The agent is the decision-maker that runs think, act, observe until done. An agent may use MCP tools, but they are different layers.',
    },
    {
      q: 'A teammate says: "Fine-tuning and RAG do the same thing, so we only ever need one of them." What is the best response?',
      options: ["Correct, because both of them change the model weights", "Correct, because both of them only change the prompt", "No: RAG supplies facts at query time; fine-tuning changes behaviour", "No: RAG is only for images, and fine-tuning is only for text"],
      answer: 2,
      explain: 'RAG leaves weights unchanged and supplies knowledge in the prompt; fine-tuning trains the weights to change behaviour. They solve different problems and are often used together.',
    },
  ],
  takeaways: [
    'An LLM predicts the next token again and again; it is fluent but does not know our private or recent data and cannot act alone.',
    'RAG retrieves relevant documents and puts them in the prompt, so knowledge updates are as easy as editing a document.',
    'MCP is an open standard plug that connects AI applications to tools, data and prompts through servers and clients.',
    'An Agent is an LLM in a loop that thinks, calls tools, observes results and repeats until the task is done.',
    'Fine-tuning changes model weights to change behaviour; quantization stores weights in fewer bits to save memory and cost.',
    'Real products combine these pieces, each fixing one specific weakness, and add them only when needed.',
  ],
  terms: [
    { term: 'LLM', def: 'A large neural network trained on text to predict the next token, used to understand and generate language.' },
    { term: 'Token', def: 'A small unit of text (a word or part of a word) that a language model reads and writes.' },
    { term: 'RAG', def: 'Retrieval-Augmented Generation: retrieving relevant documents and adding them to the prompt before the model answers.' },
    { term: 'MCP', def: 'Model Context Protocol: an open standard for connecting AI applications to tools, data sources and prompt templates.' },
    { term: 'Agent', def: 'A system in which an LLM repeatedly decides on actions, uses tools, and observes results until a goal is met.' },
    { term: 'Fine-tuning', def: 'Further training a pre-trained model on focused data so its weights, and therefore its behaviour, change.' },
    { term: 'Quantization', def: 'Storing model weights with fewer bits (for example 8 or 4) to reduce memory and speed up inference.' },
  ],
};
