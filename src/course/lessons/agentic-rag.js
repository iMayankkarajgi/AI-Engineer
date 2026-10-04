export default {
  id: 'agentic-rag',
  minutes: 22,
  hook: 'Standard RAG searches once and hopes for the best. What if the system could notice the first search was not enough, and decide what to look up next?',
  summary: 'Agentic RAG puts an LLM agent in charge of retrieval. Instead of one fixed "retrieve then answer" step, the agent reasons about the question, chooses which tool or source to query, reads the results, judges whether they are enough, and loops (rewriting queries, searching again, calling other tools) until it can answer. It handles multi-step and multi-source questions far better than standard RAG, at the cost of more latency, more tokens and less predictability.',
  sections: [
    {
      id: 'big-picture',
      title: 'The big picture',
      blocks: [
        { type: 'p', text: 'Our running example: a customer-support assistant for a laptop shop. A customer, Priya, asks: *"Is the laptop I ordered still under warranty?"* To answer, the assistant must (1) find out which laptop Priya ordered and when (that is in the orders database, not the documents), (2) find the warranty length for that product line (in the policy documents), and (3) compare dates. No single search returns all of this.' },
        { type: 'p', text: 'Standard RAG would embed the question, fetch the top 5 policy chunks about "warranty", and ask the LLM to answer. It might find a general warranty page but it never learns which laptop Priya bought. **Agentic RAG** lets the model work like a researcher: plan, look something up, read, decide what is still missing, look that up, and only then answer.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a librarian vs a book chute', text: 'Standard RAG is a book chute: you post a question and it drops out the five books whose titles look closest. Agentic RAG is a librarian: they ask themselves what you really need, check the catalogue, notice the first book only half answers it, walk to another section, maybe phone the records office, and come back with a complete answer.' },
      ],
    },
    {
      id: 'recaps',
      title: 'A quick recap of RAG and of AI agents',
      blocks: [
        { type: 'p', text: '**RAG (Retrieval-Augmented Generation)** combines search with generation. Documents are split into chunks, embedded and stored in a vector database. At question time, the question is embedded, the most similar chunks are retrieved, and an LLM writes an answer grounded in those chunks. It is a fixed, one-pass pipeline: retrieve once, generate once.' },
        { type: 'p', text: 'An **AI agent** is an LLM that runs in a loop and can take actions. In each turn it reads the conversation so far, **reasons** about what to do next, **calls a tool** (a function the developer exposes, such as a search API, a database query or a calculator), **observes** the tool\'s result, and repeats until it decides it is done. The pattern of interleaving reasoning and actions was popularised as **ReAct** (Yao et al., 2022).' },
        { type: 'viz', name: 'agent-loop', caption: 'Watch an agent think, call a tool, observe the result and repeat until it can finish. Agentic RAG is this loop where most tools are retrievers.' },
      ],
    },
    {
      id: 'why-standard-falls-short',
      title: 'Why standard RAG falls short',
      blocks: [
        { type: 'list', items: [
          '**One shot**: if the first retrieval misses, there is no second chance. The LLM answers from whatever came back, or hallucinates.',
          '**Multi-hop questions**: "Which of our suppliers is based in the same city as our biggest customer?" needs one lookup to feed the next. A single search cannot chain.',
          '**One source**: the pipeline searches one index. Real answers often need documents *and* a database *and* a web search or an API.',
          '**No judgement**: it cannot tell that retrieved chunks are irrelevant or outdated, so it never decides to search again or to say "I could not find this".',
          '**Same effort for every question**: "hi" and a hard comparison question both trigger the same retrieval.',
        ] },
        { type: 'check', question: 'For "Is the laptop I ordered still under warranty?", which piece of information can standard RAG over policy documents never find, no matter how good the retriever is?', answer: 'Which laptop Priya ordered and when. That lives in the orders database, not in the documents. Only a system that can call another tool, here an order lookup, can get it.' },
      ],
    },
    {
      id: 'what-is-agentic-rag',
      title: 'What is agentic RAG, and the agentic RAG loop',
      blocks: [
        { type: 'p', text: '**Agentic RAG** is RAG where an LLM agent controls the retrieval process. Retrieval becomes a set of **tools** the agent can call as many times as it needs, with queries it writes itself. The agent decides *whether* to retrieve, *where* to retrieve from, *what* to search for, and *when* it has enough to answer.' },
        { type: 'flow', title: 'The agentic RAG loop', loop: true, nodes: [
          { label: 'Plan', detail: 'Read the question and the notes so far; decide what is still missing.' },
          { label: 'Act', detail: 'Call a tool: vector search, keyword search, SQL, web search, an API, or a calculator, with a query the agent wrote.' },
          { label: 'Observe', detail: 'Read the tool result and add useful facts to the working notes.' },
          { label: 'Reflect', detail: 'Is this relevant? Is it enough? If not, plan the next step (rewrite the query, try another source).' },
        ] },
        { type: 'steps', title: 'One pass through the loop, in detail', items: [
          { title: 'Understand the goal', text: 'The agent restates what a complete answer needs, sometimes splitting the question into sub-questions.' },
          { title: 'Choose a tool and a query', text: 'Pick the source most likely to hold the next missing fact, and write a focused query for it.' },
          { title: 'Read the result', text: 'Extract the useful facts; ignore irrelevant chunks.' },
          { title: 'Check sufficiency', text: 'If facts are missing or contradictory, loop again; a step limit stops runaway loops.' },
          { title: 'Answer with sources', text: 'When the notes cover the question, write the final answer and cite where each fact came from.' },
        ] },
      ],
    },
    {
      id: 'building-blocks',
      title: 'The three building blocks',
      blocks: [
        { type: 'p', text: 'Most agentic RAG systems are built from three parts:' },
        { type: 'list', items: [
          '**The reasoning model (the agent\'s "brain")**: an LLM that plans, chooses tools, writes search queries, judges results and decides when to stop. It is given a system prompt describing its job and the tools it may use.',
          '**Tools (retrievers and actions)**: functions with a name, a description and typed parameters, such as `search_policies(query)`, `lookup_order(customer_id)`, `web_search(query)`, `run_sql(query)`. The LLM reads the descriptions to decide which to call, and the application actually executes them.',
          '**Memory / state**: the running record of the task: the conversation, tool calls and their results, and extracted notes. Short-term memory lives in the context window; longer-term memory can be stored in a database and retrieved too.',
        ] },
        { type: 'p', text: 'Around these sit **guardrails**: a maximum number of steps, timeouts, permission checks on tools (read-only vs write), and cost limits. Many teams use frameworks such as LangGraph, LlamaIndex agents or provider tool-calling APIs to wire this together, but the loop itself is simple enough to write by hand.' },
      ],
    },
    {
      id: 'walkthrough',
      title: 'A walkthrough with a real example, in code',
      blocks: [
        { type: 'p', text: 'Here is the warranty question as a runnable loop. Two tools: a keyword document search and an order lookup. The `planner` function is a hard-coded stand-in for the LLM\'s decisions so the script runs without an API; in a real system each `planner` call would be one LLM turn that returns a tool call.' },
        { type: 'code', lang: 'python', title: 'agentic_rag_loop.py', code: `from datetime import date

DOCS = ["Warranty length depends on the product line; see each line's page.",
        "ProBook laptops come with a 2-year warranty from the purchase date.",
        "AirLite laptops come with a 1-year warranty from the purchase date."]
ORDERS = {"priya": {"item": "ProBook 14", "bought": date(2025, 3, 10)}}

def search_docs(query):                       # tool 1: keyword retriever
    words = set(query.lower().split())
    return max(DOCS, key=lambda d: len(words & set(d.lower().split())))

def lookup_order(customer):                   # tool 2: orders database
    return ORDERS[customer]

def planner(question, notes):
    # Stand-in for the LLM's decision; a real agent asks the model each turn.
    if not notes:
        return ("search_docs", "warranty length")
    if "order" not in notes:
        return ("lookup_order", "priya")
    if "years" not in notes:
        line = notes["order"]["item"].split()[0]
        return ("search_docs", f"{line} laptops warranty")
    return ("answer", None)

question = "Is the laptop Priya ordered still under warranty?"
notes, today = {}, date(2026, 10, 1)
for step in range(1, 6):                      # hard cap on loop iterations
    action, arg = planner(question, notes)
    if action == "answer":
        bought = notes["order"]["bought"]
        end = bought.replace(year=bought.year + notes["years"])
        print(f"step {step}: ANSWER -> covered until {end}: {'yes' if today <= end else 'no'}")
        break
    result = search_docs(arg) if action == "search_docs" else lookup_order(arg)
    print(f"step {step}: {action}({arg!r}) -> {result}")
    if action == "lookup_order":
        notes["order"] = result
    elif "2-year" in result or "1-year" in result:
        notes["years"] = 2 if "2-year" in result else 1
    else:
        notes["hint"] = result                # not enough yet: keep looking`, output: `step 1: search_docs('warranty length') -> Warranty length depends on the product line; see each line's page.
step 2: lookup_order('priya') -> {'item': 'ProBook 14', 'bought': datetime.date(2025, 3, 10)}
step 3: search_docs('ProBook laptops warranty') -> ProBook laptops come with a 2-year warranty from the purchase date.
step 4: ANSWER -> covered until 2027-03-10: yes`,
          walkthrough: [
            { lines: [3, 6], note: 'Our two data sources: three policy snippets and an orders "database".' },
            { lines: [8, 13], note: 'Two tools. search_docs returns the snippet with the most words in common with the query; lookup_order reads the database.' },
            { lines: [15, 24], note: 'The stand-in for the LLM: look at what we know so far and choose the next action. A real agent decides this by reasoning over the notes.' },
            { lines: [26, 28], note: 'Start with empty notes and allow at most 5 steps, a guardrail against endless loops.' },
            { lines: [29, 34], note: 'When the planner says "answer", compute the warranty end date from the collected facts and stop.' },
            { lines: [35, 42], note: 'Otherwise run the chosen tool, print the observation, and store what was learned.' },
          ] },
        { type: 'p', text: 'Look at the trace. Step 1 retrieves a general page that says "it depends on the product line". Standard RAG would stop here with a vague answer. The agent recognises the gap, looks up the order in step 2 (ProBook 14, bought 2025-03-10), then writes a *new, more specific* query in step 3 ("ProBook laptops warranty") built from what it just learned. Step 4 combines facts from two sources: covered until 2027-03-10, so yes.' },
      ],
    },
    {
      id: 'patterns',
      title: 'Common patterns of agentic RAG',
      blocks: [
        { type: 'table', caption: 'Patterns you will see in practice (often combined).', head: ['Pattern', 'What the agent does', 'Example'], rows: [
          ['Routing', 'Picks the right source or decides no retrieval is needed', 'Billing question → invoices DB; "hi" → answer directly'],
          ['Query rewriting', 'Rewrites a vague or conversational query into a good search query', '"and the cheaper one?" → "AirLite 13 price"'],
          ['Decomposition (multi-hop)', 'Splits a question into sub-questions answered in order', 'Find the order, then the warranty for that product'],
          ['Self-check / corrective retrieval', 'Grades retrieved chunks; if poor, searches again or elsewhere', 'Corrective RAG (CRAG) falls back to web search'],
          ['Reflection on the answer', 'Checks the draft answer against sources before replying', 'Self-RAG-style critique of support and relevance'],
          ['Multi-agent', 'Specialist agents (researcher, verifier, writer) coordinated by a lead agent', 'One agent per data source, one to merge'],
        ] },
        { type: 'p', text: 'Research names you may meet: **Self-RAG** (Asai et al., 2023) trains a model to decide when to retrieve and to critique its own output; **Corrective RAG** (Yan et al., 2024) evaluates retrieved documents and triggers corrective actions such as web search; **Adaptive-RAG** (Jeong et al., 2024) routes questions to no-retrieval, single-step or multi-step strategies based on estimated complexity.' },
      ],
    },
    {
      id: 'standard-vs-agentic',
      title: 'Standard RAG vs agentic RAG, and when to use it',
      blocks: [
        { type: 'compare', title: 'Standard RAG vs agentic RAG',
          options: [
            { name: 'Standard RAG', summary: 'Fixed pipeline: retrieve once, generate once.', pros: ['Fast and cheap (one LLM call)', 'Predictable, easy to test and debug', 'Simple to build'], cons: ['No second chance if retrieval misses', 'One source, no multi-hop reasoning'], bestFor: 'FAQ bots, single-source lookups, high traffic' },
            { name: 'Agentic RAG', summary: 'An agent loops: plan, retrieve, check, repeat.', pros: ['Multi-step and multi-source questions', 'Recovers from weak retrieval', 'Can combine documents with live tools'], cons: ['Several LLM calls: slower and costlier', 'Less predictable; harder to evaluate', 'Can loop or pick wrong tools'], bestFor: 'Research assistants, complex support, analytics' },
          ],
          rows: [
            ['LLM calls per question', '1', 'Typically 2–10+'],
            ['Latency', 'About one generation', 'Several generations plus tool time'],
            ['Control flow', 'Decided by the developer', 'Decided by the model at run time'],
          ],
          verdict: 'Start with standard (or hybrid + reranker) RAG. Add agentic behaviour where evaluation shows questions that need multiple steps or sources.' },
        { type: 'p', text: '**Use agentic RAG when** questions need several lookups that depend on each other, answers span several sources (documents plus databases or APIs), queries are vague and benefit from rewriting, or wrong answers are costly enough that a self-check step pays for itself. **Prefer standard RAG when** most questions are answered by one passage, latency must stay low, traffic is high and cost-sensitive, or you need strictly predictable behaviour.' },
        { type: 'chart', kind: 'bar', title: 'Typical relative cost per question', yLabel: 'LLM calls', labels: ['Standard RAG', 'Agentic, simple question', 'Agentic, multi-hop question'], series: [ { name: 'LLM calls', values: [1, 2, 6] } ], caption: 'Illustrative counts. Agentic systems spend more on hard questions and, with routing, can spend as little as standard RAG on easy ones.' },
      ],
    },
    {
      id: 'limitations-and-summary',
      title: 'Limitations of agentic RAG, and quick summary',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Limitations and common mistakes', text: '**Latency and cost** grow with every loop. **Unpredictability**: the same question can take different paths, which complicates testing. **Error compounding**: a wrong early step (a bad query, a misread result) can send later steps astray. **Infinite or wasteful loops** without step limits. **Tool misuse**: vague tool descriptions lead to wrong tool choices. **Security**: tools that write or send data need permission checks, and retrieved text can contain prompt-injection instructions the agent must treat as data, not commands. **Evaluation is harder**: you must judge the path as well as the final answer.' },
        { type: 'check', question: 'Our agentic RAG bot sometimes makes 15 tool calls for simple FAQ questions and users wait 30 seconds. Name two fixes.', answer: 'Add a router so simple questions take a single-retrieval path (or no retrieval), and set a hard step limit with a "answer with what you have" fallback. Clearer tool descriptions and a system prompt that tells the agent to stop once it has enough evidence also help.' },
        { type: 'list', ordered: true, items: [
          'Standard RAG retrieves once from one source; it cannot recover from a miss or chain lookups.',
          'Agentic RAG lets an LLM agent plan, call retrieval tools, observe, reflect and repeat.',
          'Building blocks: a reasoning LLM, well-described tools, and memory/state, plus guardrails.',
          'Patterns: routing, query rewriting, decomposition, corrective retrieval, answer reflection, multi-agent.',
          'It costs more latency and tokens and is less predictable, so use it where questions truly need it.',
        ] },
      ],
    },
  ],
  quiz: [
    { q: 'What is the key difference between standard RAG and agentic RAG?', options: ['Agentic RAG uses a bigger embedding model', 'An agent decides what and where to retrieve, in a loop', 'Agentic RAG stores documents in a graph database', 'Standard RAG cannot use a vector database at all'], answer: 1, explain: 'Agentic RAG turns retrieval into tools an LLM agent calls repeatedly, choosing queries and sources as it goes. Standard RAG is a fixed retrieve-once pipeline.' },
    { q: 'Our RAG bot answers "Which of our suppliers is in the same city as our biggest customer?" poorly. Retrieval quality on single facts is fine. What is the most fitting change?', options: ['Increase the chunk size so more text fits', 'Lower the LLM temperature to reduce randomness', 'Add more documents about suppliers to the index', 'Let an agent decompose it into chained lookups'], answer: 3, explain: 'This is a multi-hop question: find the biggest customer, find its city, then find suppliers there. Decomposition with sequential retrieval is exactly what agentic RAG adds.' },
    { q: 'In the code trace, why did the agent search the documents a second time in step 3?', options: ['The first search tool crashed and was retried', 'The step limit forced a repeat of step 1', 'It learned the product line and wrote a sharper query', 'The planner always runs exactly two document searches'], answer: 2, explain: 'Step 1 said warranty depends on the product line. After looking up the order (ProBook), the agent built a more specific query, "ProBook laptops warranty", that found the exact rule.' },
    { q: 'Which is NOT one of the three core building blocks of an agentic RAG system as described in the lesson?', options: ['A fine-tuned reranker model', 'A reasoning LLM that plans and decides', 'Tools such as retrievers and APIs', 'Memory or state of the task so far'], answer: 0, explain: 'The building blocks are the reasoning model, tools and memory/state. A reranker can be useful inside a retrieval tool, but it is not a core building block.' },
    { q: 'A teammate says: "Agentic RAG is always better, so let\'s replace our standard RAG FAQ bot that serves 50,000 simple questions a day." What is the main concern?', options: ['Agentic RAG cannot answer simple questions', 'More LLM calls per question: higher cost and latency', 'Agentic RAG only works with web search tools', 'Standard RAG already loops, so nothing changes'], answer: 1, explain: 'For simple, high-volume questions, extra planning and tool calls add cost and latency without improving answers. Use agentic behaviour where questions need it, or route simple ones to a fast path.' },
  ],
  takeaways: [
    'Standard RAG is one fixed pass: retrieve once from one source, then generate.',
    'Agentic RAG puts an LLM agent in a loop of plan, act (call a tool), observe and reflect.',
    'Its building blocks are a reasoning model, well-described tools (retrievers, databases, APIs) and memory/state.',
    'Common patterns: routing, query rewriting, decomposition, corrective retrieval, answer reflection, multi-agent.',
    'It shines on multi-step, multi-source questions but costs more latency, tokens and predictability; add step limits and routing.',
  ],
  terms: [
    { term: 'Agentic RAG', def: 'RAG in which an LLM agent decides when, where and what to retrieve, in a loop.' },
    { term: 'AI agent', def: 'An LLM that repeatedly reasons, calls tools and observes results until a goal is met.' },
    { term: 'Tool', def: 'A function with a name, description and parameters that the agent can ask the application to run.' },
    { term: 'Multi-hop question', def: 'A question that needs several lookups, where each depends on the previous answer.' },
    { term: 'Query decomposition', def: 'Splitting a complex question into simpler sub-questions answered in order.' },
    { term: 'ReAct', def: 'A prompting pattern that interleaves reasoning steps with tool actions and observations.' },
  ],
};
