export default {
  id: 'recursive-language-models',
  minutes: 21,
  hook: 'What if, instead of stuffing a 10-million-token document into a model\'s prompt, we let the model write code to explore it and call itself on the pieces?',
  summary: 'A Recursive Language Model (RLM) is an inference strategy, not a new network: the long input is stored as a variable in a programming environment (a Python REPL), and the model writes code to peek at it, search it, split it and call language models, including itself, on chosen pieces. Only small results ever enter the model\'s own context. This sidesteps context limits and "context rot", and it handles inputs far beyond any context window, at the cost of more calls, latency and reliance on the model\'s coding skill.',
  sections: [
    {
      id: 'what-is-rlm',
      title: 'What is a Recursive Language Model (RLM)?',
      blocks: [
        { type: 'p', text: '**Recursive Language Models** were proposed by Alex L. Zhang, Tim Kraska and Omar Khattab at MIT (a blog post in October 2025, then a paper on arXiv in December 2025). An RLM is a way of **running** an existing LLM. From the outside it looks like a normal model call: text in, answer out. Inside, the model never sees the whole input at once.' },
        { type: 'p', text: 'Instead, the input is loaded into a **REPL** (Read-Eval-Print Loop: an interactive programming session, like a Python console) as a variable, for example `context`. The model is told the variable exists and how big it is. It then writes code to look at parts of it, filter it, split it, and call a language model on selected pieces. Those sub-calls are where the **recursion** comes from: the model can invoke a model (even a copy of itself) on a sub-problem.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a lawyer with a document room', text: 'A lawyer handed 50 boxes of documents does not read every page into memory before answering. They check the index, search for key names, hand boxes to assistants with specific questions ("find every invoice from March"), and combine the assistants\' short reports. The lawyer\'s own head only holds the summaries. An RLM is the lawyer; the REPL is the document room; sub-calls are the assistants.' },
      ],
    },
    {
      id: 'why-rlms',
      title: 'Why do we need RLMs?',
      blocks: [
        { type: 'list', items: [
          '**Hard context limits.** Every model has a maximum context window. Inputs such as whole codebases, years of logs or thousands of documents can exceed even million-token windows.',
          '**Context rot.** Even within the window, quality tends to drop as the context grows: models miss details, mix up facts, or ignore the middle. Benchmarks that need the model to use *all* of a long input (count, compare, aggregate) degrade especially fast.',
          '**Cost.** Every token in the prompt is paid for on every call. Re-sending a huge context repeatedly is expensive.',
        ] },
        { type: 'viz', name: 'lost-in-middle', caption: 'Move the relevant passage through a long context and watch accuracy dip in the middle: one symptom of why long prompts are unreliable.' },
        { type: 'p', text: 'Running example: a support team exports **50,000 lines of chat logs** (about 1.4 million characters) and asks, "Which customer asked for a refund most often?" No single pass of an LLM over the raw text would reliably count hundreds of scattered mentions. We will solve it RLM-style.' },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How an RLM works',
      blocks: [
        { type: 'flow', title: 'The RLM loop', loop: true, nodes: [
          { label: 'Root model gets the question', detail: 'Its prompt contains the question and a note that the input is in the variable `context` (with its length), but not the input itself.' },
          { label: 'Writes code', detail: 'For example: print the first lines, search with a regex, or split into chunks.' },
          { label: 'REPL runs it', detail: 'The code executes; only a truncated printout of the result comes back into the root model\'s context.' },
          { label: 'Sub-calls (recursion)', detail: 'The code may call an LM on a chunk with a focused question, storing the short answer in a variable.' },
          { label: 'Decide', detail: 'The root model reads the small results and either writes more code or returns a final answer.' },
        ] },
        { type: 'steps', title: 'One RLM run, step by step', items: [
          { title: 'Load', text: 'The 1.4M-character log goes into the REPL variable `context`. The root model\'s prompt stays small.' },
          { title: 'Peek', text: 'The model prints the first two lines to learn the format: `[00000] user=chen msg=hello`.' },
          { title: 'Plan', text: 'It decides to split the log into 5 chunks of 10,000 lines each.' },
          { title: 'Delegate', text: 'For each chunk, it calls a sub-LM: "List the users who asked for a refund in this text." Each call sees only its chunk.' },
          { title: 'Aggregate in code', text: 'It counts the returned names with ordinary Python, exactly and cheaply.' },
          { title: 'Answer', text: 'It returns the final answer. In the authors\' setup the model signals this with a special final-answer marker.' },
        ] },
      ],
    },
    {
      id: 'writing-and-running-code',
      title: 'How the model writes and runs code',
      blocks: [
        { type: 'p', text: 'The root model behaves like a programmer at a console. Each turn it emits a code block; the environment runs it and returns the printed output, cut to a limited length so the model\'s context does not fill up. Variables persist between turns, so the model can build up intermediate results (lists of matches, partial summaries) outside its own context window.' },
        { type: 'p', text: 'The script below simulates this. The "sub-LM" is a stand-in function (a real RLM would call an LLM API there), but the structure, a variable holding the huge input, peeking, chunking, sub-calls and aggregation in code, is exactly the RLM pattern.' },
        { type: 'code', lang: 'python', title: 'rlm_simulation.py', code: `import random
random.seed(7)

# The huge input lives in a REPL variable, NOT in the model's prompt.
users = ["ana", "bo", "chen", "dev", "eli"]
context = "\\n".join(
    f"[{i:05d}] user={random.choice(users)} msg={'refund please' if random.random() < 0.03 else 'hello'}"
    for i in range(50_000))
print("context size:", len(context), "chars,", context.count("\\n") + 1, "lines")

calls = {"sub_llm": 0}
def llm_query(prompt, chunk):
    # Stand-in for a sub-LM call on a small chunk; a real RLM would call an LLM here.
    calls["sub_llm"] += 1
    return [line.split()[1][5:] for line in chunk.splitlines() if "refund" in line]

# --- Code the root model might write, step by step ---
print("peek:", context[:200].splitlines()[:2])       # 1. look at the format
lines = context.splitlines()
chunks = ["\\n".join(lines[i:i + 10_000]) for i in range(0, len(lines), 10_000)]  # 2. split
found = []
for ch in chunks:                                     # 3. recurse on each chunk
    found += llm_query("Which users asked for a refund?", ch)
counts = {u: found.count(u) for u in sorted(set(found))}   # 4. aggregate in code
print("sub-LM calls:", calls["sub_llm"], "| refund requests:", len(found))
print("per user:", counts)
print("FINAL:", max(counts, key=counts.get), "asked most often")`, output: `context size: 1362328 chars, 50000 lines
peek: ['[00000] user=chen msg=hello', '[00001] user=dev msg=hello']
sub-LM calls: 5 | refund requests: 1527
per user: {'ana': 280, 'bo': 329, 'chen': 309, 'dev': 293, 'eli': 316}
FINAL: bo asked most often`,
          walkthrough: [
            { lines: [4, 9], note: 'Build a 1.36M-character log and keep it in a variable. In an RLM, the model is only told this variable exists and how long it is.' },
            { lines: [11, 15], note: 'The sub-call. Here a simple filter stands in for an LLM reading one chunk and answering a focused question.' },
            { lines: [17, 20], note: 'Code the root model would write: peek at two lines to learn the format, then split into 10,000-line chunks.' },
            { lines: [21, 24], note: 'Recursion: one sub-call per chunk, then exact counting in Python. Only these small results ever reach the root model.' },
            { lines: [25, 27], note: 'Five sub-calls handled 50,000 lines; the answer comes from exact aggregation, not from a model eyeballing 1.4M characters.' },
          ] },
        { type: 'callout', tone: 'warn', title: 'Run model-written code in a sandbox', text: 'An RLM executes code the model wrote. Always run it in an isolated sandbox with no secrets, limited network access, and limits on time, memory and the number of sub-calls. Never give the REPL access to production systems.' },
      ],
    },
    {
      id: 'why-better',
      title: 'Why RLMs work better',
      blocks: [
        { type: 'list', items: [
          '**Small, focused contexts.** Each model call sees only what it needs, so it stays in the range where models are reliable, avoiding context rot.',
          '**Code does what code is good at.** Exact searching, counting, sorting and joining are done by Python, not by a model guessing over a huge prompt.',
          '**The model chooses the strategy.** Unlike a fixed pipeline, the model can inspect the data first and pick regex search, chunking or sampling as needed.',
          '**Inputs beyond the window.** Since the full input never enters any prompt, its size is limited by the REPL\'s memory, not the context window.',
        ] },
        { type: 'p', text: 'The authors reported that on OOLONG, a long-context benchmark that requires aggregating information spread across the input, an RLM built on **GPT-5-mini** scored far higher than **GPT-5** called directly (roughly double the correct answers on the 132K-token setting), at comparable cost per query. They also reported strong results when scaling to inputs of **10 million tokens and more** (on BrowseComp-Plus with 1,000 documents), where direct calls are impossible. These are results from the authors\' experiments; independent replications vary by task and model.' },
      ],
    },
    {
      id: 'recursion',
      title: 'Recursion inside RLMs',
      blocks: [
        { type: 'p', text: '**Recursion** means a procedure calling itself on a smaller version of the problem. In an RLM, a sub-call can be a plain LLM call, or another full RLM with its own REPL that can split its chunk further. The **recursion depth** is how many levels deep this goes.' },
        { type: 'p', text: 'In the original experiments the depth was **1**: the root model called ordinary LMs on pieces, and those did not recurse further. Deeper recursion is possible in principle (a chunk that is still too big could be split again), but it multiplies calls and latency, so it needs limits.' },
        { type: 'check', question: 'A root model splits a 10M-token input into 100 chunks of 100K tokens, and each sub-call is itself an RLM that splits its chunk into 10 pieces. How many leaf LM calls happen, and what is the recursion depth?', answer: '100 × 10 = 1,000 leaf calls, plus the 100 intermediate RLM calls and the root. The depth is 2. This shows why depth and fan-out must be capped: calls grow multiplicatively.' },
      ],
    },
    {
      id: 'vs-chunking',
      title: 'How RLMs differ from simple chunking',
      blocks: [
        { type: 'p', text: 'Classic **map-reduce chunking** also splits a document and summarises each chunk, so what is new? In simple chunking a **human designs a fixed pipeline** in advance: split every N tokens, apply the same prompt to each chunk, merge summaries. The model has no say.' },
        { type: 'compare', title: 'Fixed chunking pipeline vs RLM', options: [
          { name: 'Simple chunking (map-reduce)', summary: 'Pre-designed split → same prompt per chunk → merge.', pros: ['Predictable cost', 'Easy to build and debug'], cons: ['Same strategy for every question', 'Summaries can drop the needed detail', 'Wastes calls on irrelevant chunks'], bestFor: 'Repeated, well-understood tasks like summarising every report the same way' },
          { name: 'RLM', summary: 'The model inspects the data and writes its own decomposition and aggregation code.', pros: ['Adapts strategy to each question', 'Can skip irrelevant parts with search', 'Exact aggregation in code'], cons: ['Less predictable cost and latency', 'Depends on the model\'s coding ability', 'Needs a sandbox'], bestFor: 'Varied, open questions over huge inputs' },
        ], verdict: 'Chunking is a fixed recipe; an RLM lets the model write the recipe for each question.' },
      ],
    },
    {
      id: 'advantages-limitations',
      title: 'Advantages and limitations of RLMs',
      blocks: [
        { type: 'table', head: ['Advantages', 'Limitations'], rows: [
          ['Handles inputs far larger than any context window', 'Many sequential calls: answers can take seconds to minutes'],
          ['Avoids context rot by keeping each call small', 'Cost varies a lot by question; occasional runaway runs'],
          ['Uses code for exact operations (count, sort, join)', 'Only as good as the model\'s coding and planning skill'],
          ['Works with existing models; no retraining needed', 'Sub-calls in the original design are blocking and do not reuse prefix caches'],
          ['Model picks a strategy per question', 'Requires a secure sandbox for model-written code'],
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistake', text: 'Using an RLM for a short input or a simple question. If the whole input fits comfortably in the context window and the question is easy, one direct call is faster, cheaper and just as accurate. RLMs pay off when inputs are huge or questions need exhaustive aggregation.' },
      ],
    },
    {
      id: 'when-to-use',
      title: 'When to use RLMs',
      blocks: [
        { type: 'list', items: [
          'The input is **larger than the context window**, or so long that quality visibly drops.',
          'The question needs **information from all over** the input: counting, comparing, listing every case, joining across documents.',
          'The input has **structure code can exploit**: logs, CSVs, codebases, JSON, many separate documents.',
          '**Latency is acceptable** (batch analysis, research, audits), not instant chat.',
        ] },
      ],
    },
    {
      id: 'rlm-vs-rag',
      title: 'RLM vs RAG',
      blocks: [
        { type: 'p', text: '**Retrieval-Augmented Generation (RAG)** embeds documents ahead of time, retrieves the top few chunks most similar to the question, and puts them into the prompt. It is fast and cheap, but it assumes the answer lives in a few retrievable chunks.' },
        { type: 'compare', title: 'RAG vs RLM', options: [
          { name: 'RAG', summary: 'Retrieve the top-k similar chunks, then answer in one call.', pros: ['Fast and cheap per query', 'Mature tooling', 'Index built once, reused'], cons: ['Fails when the answer needs many scattered pieces', 'Retrieval misses wreck the answer'], bestFor: 'Look-up questions over a large, stable knowledge base' },
          { name: 'RLM', summary: 'The model programmatically explores the full input with sub-calls.', pros: ['Can examine everything exhaustively', 'Exact aggregation'], cons: ['Slower, more calls', 'Higher and more variable cost'], bestFor: 'Analytical questions over one huge input' },
        ], rows: [
          ['"What is our refund policy?"', 'Great', 'Overkill'],
          ['"Which customer asked for refunds most often?"', 'Poor: needs every mention', 'Great'],
          ['Pre-processing', 'Embedding index', 'None; load into REPL'],
        ], verdict: 'They are complementary: an RLM can even call a retriever as one of its tools.' },
        { type: 'check', question: 'For "Which customer asked for a refund most often?" over 50,000 log lines, why would RAG struggle?', answer: 'RAG returns only the top few chunks most similar to the question, but the answer requires counting every refund mention across the entire log. Most mentions would never be retrieved, so the count would be wrong. Exhaustive processing, as in an RLM, is needed.' },
      ],
    },
    {
      id: 'real-use-case',
      title: 'A real use case',
      blocks: [
        { type: 'callout', tone: 'example', title: 'Auditing a large codebase', text: 'A security team asks: "List every place where user input reaches a SQL query without parameterisation." The repository is millions of tokens. An RLM loads the file tree into the REPL, greps for database calls, groups hits by file, sends each group to a sub-LM with the question "Is the query built from unsanitised input? Answer yes/no with the line", and collects the yes-answers into a report in code. Every file is considered; each model call only sees a few hundred lines.' },
        { type: 'p', text: 'Other natural fits: analysing months of server logs during an incident review, comparing clauses across hundreds of contracts, and answering research questions over large document collections where the answer is spread across many sources.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the core idea of a Recursive Language Model?', options: ['A new neural architecture built from recurrent layers instead of attention', 'Input lives in a REPL variable; the model writes code and calls LMs on parts', 'Training a model with a native context window of 10 million tokens', 'Repeating the same prompt many times until the answer stops changing'], answer: 1, explain: 'An RLM is an inference strategy over an existing LLM: input in a REPL variable, code to explore it, sub-calls on pieces. It is not a recurrent architecture.' },
    { q: 'A root model splits an input into 20 chunks and calls a plain LLM on each; none of those calls recurse. What is the recursion depth and how many sub-calls are made?', options: ['Depth 1, 20 sub-calls', 'Depth 20, 1 sub-call', 'Depth 2, 400 sub-calls', 'Depth 0, no sub-calls'], answer: 0, explain: 'One level of sub-calls below the root is depth 1, with one call per chunk: 20. This matches the depth-1 setup in the original experiments.' },
    { q: 'How does an RLM differ from a fixed map-reduce chunking pipeline?', options: ['RLMs never split the input; they read it all in one call', 'Chunking pipelines use code, while RLMs avoid code entirely', 'The model itself decides how to split and aggregate', 'There is no real difference; the two are the same method'], answer: 2, explain: 'Chunking is a human-designed fixed recipe; an RLM writes its own decomposition and aggregation code, adapting to each question.' },
    { q: 'We ask "Which supplier appears most often across 3,000 invoices?" and RAG gives wrong counts. What should we try?', options: ['Raise RAG\'s top-k from 5 to 6 and ask the question again', 'An RLM that checks every invoice and counts in code', 'Swap in a smaller embedding model to speed up retrieval', 'Shorten the question so retrieval matches more chunks'], answer: 1, explain: 'Counting requires every invoice, not the top few similar chunks. Exhaustive processing with exact aggregation fits RLMs.' },
    { q: 'Someone proposes using an RLM for every chatbot reply, including "What are your opening hours?" with a 2-page FAQ. What is the problem?', options: ['RLMs are unable to read FAQ pages or other short documents', 'The input fits in context, so it adds cost for no gain', 'RLMs only work on source code, not on natural language', 'RLMs must be fine-tuned before they can answer anything'], answer: 1, explain: 'RLMs pay off for huge inputs or exhaustive questions. For short inputs, a direct call is faster, cheaper and just as accurate.' },
  ],
  takeaways: [
    'An RLM keeps the long input in a REPL variable and lets the model explore it with code.',
    'Sub-calls on chosen pieces (recursion) keep every model call small, avoiding context rot.',
    'Exact operations such as counting and joining are done in code, not by the model guessing.',
    'RLMs handle inputs far beyond the context window but are slower and less predictable in cost.',
    'Use RAG for look-ups, RLMs for exhaustive analysis over huge inputs; sandbox all model-written code.',
  ],
  terms: [
    { term: 'Recursive Language Model (RLM)', def: 'An inference strategy where a model explores a long input stored in a REPL and calls models on pieces of it.' },
    { term: 'REPL', def: 'Read-Eval-Print Loop: an interactive programming session that runs code and returns output.' },
    { term: 'Root model', def: 'The top-level model call that plans, writes code and returns the final answer.' },
    { term: 'Sub-call', def: 'A language-model call made from within the REPL on a selected piece of the input.' },
    { term: 'Recursion depth', def: 'How many levels of nested model calls are allowed below the root.' },
    { term: 'Context rot', def: 'The drop in model accuracy as the amount of text in its context grows.' },
  ],
};
