export default {
  id: 'ai-orchestration',
  minutes: 18,
  hook: 'A real AI product is rarely one model call. Who decides which call happens first, which ones run together, and what happens when one of them fails?',
  summary: 'AI orchestration is the coordination layer that connects models, tools, data, memory and agents into one reliable workflow. It decides the order of steps, passes data between them, handles branching, retries and errors, and keeps state. Five patterns cover most systems: sequential, parallel, conditional, loop and orchestrator-worker.',
  sections: [
    {
      id: 'what-is-orchestration',
      title: 'What is AI orchestration?',
      blocks: [
        { type: 'p', text: '**AI orchestration** is the coordination of several AI components (LLM calls, tools, retrieval, memory, other agents) so that together they complete a task. The **orchestrator** is the part that holds the plan: it decides what runs, in what order, with which inputs, and what to do with the outputs.' },
        { type: 'p', text: 'Our running example: a **customer-email assistant** for an online shop. For each incoming email it must detect the language, classify the request, look up the order, draft a reply, check the reply for policy problems, and either send it or pass it to a human. That is six or more steps, some with tools, some with conditions.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a conductor and an orchestra', text: 'Each musician (a model, a tool, a database) is skilled at one thing. The conductor does not play an instrument. They decide when each section comes in, how loud, and how the parts fit. Without a conductor, skilled musicians still produce noise. Orchestration is the conductor for AI components.' },
      ],
    },
    {
      id: 'why-orchestration',
      title: 'Why do we need AI orchestration?',
      blocks: [
        { type: 'list', items: [
          '**One call is not enough**: real tasks need retrieval, tools, checks and formatting, not just one prompt.',
          '**Reliability**: models fail, time out and sometimes return malformed output. Someone must retry, fall back or stop.',
          '**Data flow**: the order number found in step 2 must reach the lookup tool in step 3.',
          '**Cost and speed**: independent steps should run in parallel; cheap models should handle easy steps.',
          '**State and memory**: long tasks must remember what already happened, and resume after a crash.',
          '**Observability and control**: we need logs, human approval points and limits on spending.',
        ] },
        { type: 'p', text: 'Without an orchestration layer, this logic ends up scattered across ad-hoc scripts, which is hard to test, change or debug.' },
      ],
    },
    {
      id: 'orchestration-vs-agents',
      title: 'AI orchestration vs AI agents',
      blocks: [
        { type: 'p', text: 'These words overlap, so let us be precise. An **AI agent** is an LLM that decides its own next action in a loop, using tools until it reaches a goal. **Orchestration** is the broader job of coordinating components. The orchestrator can be **code** (a fixed workflow written by developers) or an **LLM** (an agent that plans and delegates at run time).' },
        { type: 'compare', title: 'Code-driven workflow vs LLM-driven agent', options: [
          { name: 'Workflow (code orchestrates)', summary: 'Developers fix the steps and branches in code; LLMs fill in each step.', pros: ['Predictable and testable', 'Cheaper and faster', 'Easy to audit'], cons: ['Cannot handle cases nobody planned for', 'Changes require code edits'], bestFor: 'Well-understood, repeatable processes' },
          { name: 'Agent (LLM orchestrates)', summary: 'An LLM decides which tools or sub-agents to use and when to stop.', pros: ['Handles open-ended, novel tasks', 'Adapts its plan as it learns'], cons: ['Less predictable', 'Higher cost and latency', 'Harder to test'], bestFor: 'Open-ended research, coding, exploration' },
        ], rows: [
          ['Who decides the next step', 'Code', 'The model'],
          ['Path through the task', 'Known in advance', 'Discovered at run time'],
          ['Typical failure', 'Unplanned input', 'Wandering, loops, wrong tool'],
        ], verdict: 'Most production systems combine them: a code workflow at the top, with agents inside the steps that need flexibility.' },
      ],
    },
    {
      id: 'components',
      title: 'Components of AI orchestration',
      blocks: [
        { type: 'table', head: ['Component', 'Role', 'In the email assistant'], rows: [
          ['Models', 'Do the reasoning and generation in each step', 'A small model to classify, a larger one to draft'],
          ['Tools / integrations', 'Act on the world or fetch data', 'Order database, email API'],
          ['Data / retrieval', 'Bring in knowledge', 'Return policy documents'],
          ['Memory / state', 'Remember what happened so far', 'Email, language, order, draft, check results'],
          ['Control logic', 'Order, branches, loops, parallelism', '"If refund request, go to refund branch"'],
          ['Error handling', 'Retries, timeouts, fallbacks', 'Retry the order lookup twice, then escalate'],
          ['Observability', 'Logs, traces, metrics, costs', 'A trace of every step per email'],
          ['Guardrails / human-in-the-loop', 'Checks and approvals', 'Human approves refunds above $200'],
        ] },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How AI orchestration works',
      blocks: [
        { type: 'steps', title: 'One email through the orchestrator', items: [
          { title: 'Receive and initialise state', text: 'The orchestrator creates a state object: `{email, customer_id}` and a trace id.' },
          { title: 'Plan or follow the graph', text: 'In a workflow, the next node is fixed by code. In an agent, an LLM chooses the next action.' },
          { title: 'Run a step', text: 'Call a model or tool with inputs taken from the state, e.g. classify the email as `refund`.' },
          { title: 'Update state', text: 'Write the result back: `state.intent = refund`.' },
          { title: 'Decide what is next', text: 'Branch on the state (refund branch), run independent steps in parallel, or loop back for a revision.' },
          { title: 'Handle failure', text: 'On error or timeout: retry, use a fallback model, or route to a human.' },
          { title: 'Finish', text: 'Return the result, store the trace, record cost and latency.' },
        ] },
        { type: 'flow', title: 'The email assistant as an orchestrated workflow', nodes: [
          { label: 'Email in', detail: 'New customer email arrives; state is created.' },
          { label: 'Classify', detail: 'A small model labels the intent (refund, shipping, other) and language.' },
          { label: 'Gather', detail: 'In parallel: look up the order and retrieve the relevant policy.' },
          { label: 'Draft', detail: 'A larger model writes a reply using the order and policy.' },
          { label: 'Check', detail: 'A checker scores the draft for policy and tone; if too low, loop back to Draft.' },
          { label: 'Send or escalate', detail: 'Send if it passes; escalate to a human if the loop limit is hit or the refund is large.' },
        ] },
      ],
    },
    {
      id: 'patterns',
      title: 'Patterns of AI orchestration',
      blocks: [
        { type: 'p', text: 'Almost every orchestrated system is built from five patterns. They nest: a loop can contain a parallel step; an orchestrator-worker can run inside one branch.' },
        { type: 'tabs', items: [
          { label: 'Sequential', blocks: [
            { type: 'p', text: '**Sequential pattern** (also called prompt chaining): steps run one after another and each step\'s output is the next step\'s input. Example: extract the key facts from an email → summarise them → translate the summary.' },
            { type: 'list', items: ['Simple and easy to debug; you can check each intermediate result.', 'Total time is the **sum** of all steps.', 'One failed step blocks everything after it.'] },
          ] },
          { label: 'Parallel', blocks: [
            { type: 'p', text: '**Parallel pattern** (fan-out / fan-in): independent steps run at the same time on the same input, and their results are gathered. Example: analyse sentiment, extract topics and check for personal data on a review at once. A variant runs the *same* step several times and votes.' },
            { type: 'list', items: ['Total time is roughly the **slowest** step, not the sum.', 'Steps must not depend on each other.', 'Needs a merge step and handling for partial failures.'] },
          ] },
          { label: 'Conditional', blocks: [
            { type: 'p', text: '**Conditional pattern** (routing): a classifier, rule or LLM decides which branch to run. Example: refund requests go to a refund agent with payment tools; opening-hours questions go to a cheap FAQ responder.' },
            { type: 'list', items: ['Each branch can be specialised and cheaper.', 'A misrouting sends the request down the wrong path, so routers need evaluation and a fallback branch.'] },
          ] },
          { label: 'Loop', blocks: [
            { type: 'p', text: '**Loop pattern** (evaluator-optimizer, refine): generate, check, and repeat until a condition holds. Example: draft a reply, score it with a checker, revise until the score passes.' },
            { type: 'list', items: ['Improves quality when there is a clear check (tests pass, score above a threshold).', 'Always set a **maximum number of iterations**, or it may never stop.'] },
          ] },
          { label: 'Orchestrator-worker', blocks: [
            { type: 'p', text: '**Orchestrator-worker pattern**: an LLM orchestrator reads the task, decides *at run time* which subtasks are needed, sends them to workers (often in parallel), and merges the results. Example: "compare price and recalls" creates two worker tasks; "compare price, range and recalls" creates three.' },
            { type: 'list', items: ['Flexible: subtasks are not fixed in advance.', 'Costs extra planning and merging calls; the plan itself can be wrong.'] },
          ] },
        ] },
        { type: 'code', lang: 'python', title: 'patterns.py', code: `# Five orchestration patterns with fake "LLM steps" (stdlib only).
# Each step returns (result, seconds); we add up simulated time instead of sleeping.
def step(name, secs):
    return lambda x: (f"{name}({x})", secs)

def sequential(steps, x):                 # output of one step feeds the next
    total = 0
    for s in steps:
        x, t = s(x); total += t
    return x, total

def parallel(steps, x):                   # same input, run at once, wait for slowest
    outs = [s(x) for s in steps]
    return [o for o, _ in outs], max(t for _, t in outs)

def conditional(x):                       # a router picks one branch
    branch = step("refund_agent", 2) if "refund" in x else step("faq_agent", 1)
    return branch(x)

def loop(draft, max_iters=5, target=0.8):  # refine until a checker is satisfied
    score, i = 0.5, 0
    while score < target and i < max_iters:
        score, i = round(score + 0.12, 2), i + 1   # each revision helps a bit
    return f"{draft} after {i} revisions (score {score})", i * 3

def orchestrator_worker(question):        # plan subtasks at run time, then merge
    subtasks = [w for w in ["price", "range", "recalls"] if w in question]
    results, t = parallel([step(f"worker:{s}", 4) for s in subtasks], question)
    return f"merge({len(results)} results)", 2 + t + 2   # plan + work + merge

print("sequential :", sequential([step("extract", 2), step("summarise", 3), step("translate", 2)], "doc"))
print("parallel   :", parallel([step("sentiment", 2), step("topics", 3), step("pii_check", 1)], "review"))
print("conditional:", conditional("I want a refund"), conditional("opening hours?"))
print("loop       :", loop("essay"))
print("orch-worker:", orchestrator_worker("compare price and recalls"))`, output: `sequential : ('translate(summarise(extract(doc)))', 7)
parallel   : (['sentiment(review)', 'topics(review)', 'pii_check(review)'], 3)
conditional: ('refund_agent(I want a refund)', 2) ('faq_agent(opening hours?)', 1)
loop       : ('essay after 3 revisions (score 0.86)', 9)
orch-worker: ('merge(2 results)', 8)`, walkthrough: [
          { lines: [1, 4], note: '`step` makes a fake LLM step that wraps its input in its name and reports a simulated duration in seconds.' },
          { lines: [6, 10], note: 'Sequential: feed each output into the next step and **add** the times.' },
          { lines: [12, 14], note: 'Parallel: every step gets the same input; the time is the **maximum**, since they run at once.' },
          { lines: [16, 18], note: 'Conditional: a simple rule routes refund requests to a slower specialist and everything else to a fast FAQ step.' },
          { lines: [20, 24], note: 'Loop: revise until the score reaches 0.8, but never more than 5 times. Each revision costs 3 s.' },
          { lines: [26, 29], note: 'Orchestrator-worker: the subtasks are chosen from the question at run time, run in parallel, then merged (2 s plan + 4 s work + 2 s merge).' },
          { lines: [31, 35], note: 'Run each pattern on a small example and print (result, seconds).' },
        ] },
        { type: 'chart', kind: 'bar', title: 'Simulated time per pattern (from the code)', yLabel: 'Seconds', unit: ' s', labels: ['Sequential (3 steps)', 'Parallel (3 steps)', 'Conditional (refund)', 'Loop (3 revisions)', 'Orchestrator-worker'], series: [ { name: 'Seconds', values: [7, 3, 2, 9, 8] } ], caption: 'Simulated durations from the code above, not measurements. Note how parallel takes the slowest step (3 s) while sequential adds all steps (2 + 3 + 2 = 7 s).' },
        { type: 'check', question: 'Three independent steps take 4 s, 6 s and 5 s. How long do they take sequentially and in parallel (ignoring overhead)?', answer: 'Sequentially 4 + 6 + 5 = 15 s. In parallel max(4, 6, 5) = 6 s. Parallel only works because the steps do not need each other\'s outputs.' },
      ],
    },
    {
      id: 'tools',
      title: 'Tools for AI orchestration',
      blocks: [
        { type: 'p', text: 'We can orchestrate with plain code, and for small systems that is often best. As systems grow, frameworks help with state, retries, tracing and human approval. The landscape changes fast; these are examples of categories, not a ranking.' },
        { type: 'table', head: ['Category', 'Examples', 'What they give you'], rows: [
          ['Graph / workflow frameworks for LLMs', 'LangGraph, LlamaIndex Workflows', 'Steps as nodes, explicit state, branches and loops, checkpoints'],
          ['Multi-agent frameworks', 'CrewAI, Microsoft AutoGen / Agent Framework', 'Roles, agent conversations, delegation'],
          ['Vendor agent SDKs', 'OpenAI Agents SDK, Claude Agent SDK, Google ADK', 'Agent loops, tools, handoffs or subagents, tracing'],
          ['Durable workflow engines', 'Temporal, Airflow, Prefect', 'Retries, scheduling, resuming long-running jobs after crashes'],
          ['Plain code', 'Python functions + asyncio', 'Full control, no dependencies; you build logging and retries'],
        ] },
      ],
    },
    {
      id: 'challenges',
      title: 'Challenges in AI orchestration',
      blocks: [
        { type: 'list', items: [
          '**Error propagation**: a wrong classification early on sends everything after it down the wrong path.',
          '**Latency stacking**: each sequential LLM call adds seconds; long chains feel slow.',
          '**Cost growth**: loops, retries and orchestrator calls multiply tokens.',
          '**State management**: keeping the right data available to each step without passing huge contexts around.',
          '**Non-determinism**: the same input can take different paths, which makes testing harder.',
          '**Debugging**: failures hide across many steps unless every step is traced.',
          '**Over-engineering**: a five-agent graph for a task one prompt can do.',
        ] },
        { type: 'callout', tone: 'warn', title: 'The common mistake: loops and agents without limits', text: 'A loop that waits for "good enough" and an agent that decides when it is done can both run forever, especially when the checker is strict and the generator cannot satisfy it. Always set maximum iterations, timeouts and a token or cost budget, and define what happens when a limit is hit (usually: hand off to a human).' },
      ],
    },
    {
      id: 'best-practices',
      title: 'Best practices',
      blocks: [
        { type: 'list', ordered: true, items: [
          '**Start with the simplest thing**: one prompt, then a chain, then add patterns as measured needs appear.',
          '**Prefer code for control when the path is known**; use an LLM orchestrator only where flexibility pays.',
          '**Make state explicit**: a typed state object that every step reads and writes.',
          '**Validate between steps**: check output formats before passing them on.',
          '**Parallelise independent work**, and handle partial failures in the merge.',
          '**Bound every loop**: iterations, time and cost.',
          '**Trace everything**: inputs, outputs, latency and cost per step, with one trace id per request.',
          '**Put humans at the risky points**: approvals for money, deletions or external messages.',
          '**Evaluate the whole pipeline**, not only single steps: a test set of real inputs with expected outcomes.',
        ] },
        { type: 'callout', tone: 'example', title: 'Orchestration in the wild', text: 'Retrieval-augmented chatbots chain retrieve → rerank → generate → check. Coding agents loop write → run tests → fix. Document pipelines fan out pages to parallel extractors and merge the fields. Support systems route by intent to specialist agents with different tools.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the main job of an AI orchestration layer?', options: ['Training the model\'s weights on fresh company data', 'Coordinating steps, state, branches and errors', 'Compressing every prompt to save on token costs', 'Replacing all LLM calls with hand-written rules'], answer: 1, explain: 'Orchestration coordinates models, tools, data and agents into a reliable workflow: ordering steps, passing state, branching and handling errors. It does not train models, and it uses LLM calls rather than replacing them.' },
    { q: 'Our email assistant sends every message, simple or complex, to the most expensive model, and costs are too high. Which pattern most directly helps?', options: ['Sequential chain', 'Refinement loop', 'Conditional routing', 'Broadcast to all'], answer: 2, explain: 'A router sends easy requests (opening hours) to a cheap branch and hard ones to the expensive model. A loop or chain would add calls, not remove them.' },
    { q: 'Four independent steps take 2 s, 5 s, 3 s and 4 s. Ignoring overhead, what are the sequential and parallel times?', options: ['14 s and 5 s', '14 s and 3.5 s', '5 s and 14 s', '14 s and 14 s'], answer: 0, explain: 'Sequential adds them: 2 + 5 + 3 + 4 = 14 s. Parallel waits for the slowest: 5 s. 3.5 s would be the average, which is not how parallel timing works.' },
    { q: 'How does a code-driven workflow differ from an LLM-driven agent as the orchestrator?', options: ['A workflow cannot call any LLMs inside its steps', 'Workflow: code fixes the path; agent: the model picks', 'Agents are always cheaper and more predictable', 'No difference; the two terms are interchangeable'], answer: 1, explain: 'Workflows are predictable and testable because developers define the path; agents are flexible because the model decides its next step at run time. Agents are usually less predictable and more costly.' },
    { q: 'Which belief is a misconception?', options: ['Parallel steps must not depend on each other\'s outputs', 'An orchestrator-worker system picks subtasks at run time', 'A refine loop with a strict checker needs no iteration cap', 'Tracing every step makes orchestrated systems easier to debug'], answer: 2, explain: 'If the generator can never satisfy the checker, the loop runs forever. Every loop needs a maximum number of iterations and a plan for what happens when it is reached.' },
  ],
  takeaways: [
    'AI orchestration coordinates models, tools, data, memory and agents into one reliable workflow.',
    'The orchestrator can be code (a workflow) or an LLM (an agent); most real systems mix both.',
    'Five patterns cover most systems: sequential, parallel, conditional, loop and orchestrator-worker.',
    'Sequential time adds up; parallel time is the slowest step; loops need hard limits.',
    'Start simple, make state explicit, trace every step and put humans at the risky points.',
  ],
  terms: [
    { term: 'AI orchestration', def: 'Coordinating LLM calls, tools, data, memory and agents so they complete a task together.' },
    { term: 'Orchestrator', def: 'The component (code or an LLM) that decides which step runs next and with what inputs.' },
    { term: 'Workflow', def: 'A system whose steps and branches are fixed in code, with LLMs inside the steps.' },
    { term: 'Routing', def: 'Choosing which branch, model or agent should handle an input.' },
    { term: 'Fan-out / fan-in', def: 'Sending work to several parallel steps, then gathering and merging their results.' },
    { term: 'Evaluator-optimizer loop', def: 'Generate, check, revise, repeated until a check passes or a limit is hit.' },
  ],
};
