export default {
  id: 'ai-subagents',
  minutes: 15,
  hook: 'Why would an AI agent hand part of its own job to another AI agent, and then throw away almost everything that helper read?',
  summary: 'A subagent is a helper agent that a main agent starts for one focused subtask. It runs with its own fresh context window, its own instructions and often a restricted set of tools, and it returns only a short result. This keeps the main agent\'s context clean, allows parallel work and lets us give each helper only the permissions it needs.',
  sections: [
    {
      id: 'what-is-an-agent',
      title: 'What is an AI agent?',
      blocks: [
        { type: 'p', text: 'An **AI agent** is a large language model (LLM) placed in a loop with tools. Each turn, the model reads its context, decides on an action (for example "search the code for `login`"), a tool runs that action, and the tool\'s output is appended to the context. The loop repeats until the model decides the goal is done.' },
        { type: 'viz', name: 'agent-loop', caption: 'Watch an agent think, call a tool, observe the result and repeat. Notice how every observation is added to the message log: the log only grows.' },
        { type: 'p', text: 'That last point is the root of this lesson. Everything the agent reads stays in its **context window**, the fixed number of tokens the model can attend to at once. A big file read, a long search result or a noisy test log all take space, and they stay there for the rest of the task.' },
      ],
    },
    {
      id: 'what-are-subagents',
      title: 'What are AI subagents?',
      blocks: [
        { type: 'p', text: 'A **subagent** is an agent that another agent (the **main agent**, also called the parent or orchestrator) creates to do one focused subtask. The subagent gets a task description, works through its own loop with its own tools, and returns a result. Then it ends.' },
        { type: 'list', items: [
          '**Fresh context**: the subagent starts with an empty window plus its instructions. It does not see the whole parent conversation.',
          '**Own instructions**: a system prompt tailored to its job, such as "You are a code explorer. Report file paths and line numbers only."',
          '**Own tools**: often fewer than the parent, for example read-only file access.',
          '**Short result**: only the final answer goes back to the parent. Its working notes are discarded.',
        ] },
        { type: 'callout', tone: 'analogy', title: 'Think of it like sending an intern to the archive', text: 'A lawyer preparing a case does not personally read 3,000 pages of old records. She sends an intern: "Find every contract with Acme from 2019 and tell me the renewal dates." The intern spends a day in the archive and comes back with one page. The lawyer\'s desk stays clear, and she keeps thinking about the case. The intern is the subagent; the one page is the returned result.' },
      ],
    },
    {
      id: 'why-subagents',
      title: 'Why do we need subagents?',
      blocks: [
        { type: 'p', text: 'Our running example: a **coding assistant** working in a large repository. The user asks, "Add rate limiting to the login endpoint." Before changing anything, the assistant must find where login is handled, how other endpoints do rate limiting, and which tests cover login.' },
        { type: 'list', items: [
          '**Context pollution**: exploring means reading many files. If all of that lands in the main context, the window fills with irrelevant code, cost rises on every later turn, and quality can drop because the important parts are buried.',
          '**Focus**: a subagent with one narrow goal and a clean context is less distracted than a main agent juggling the whole conversation.',
          '**Parallelism**: three independent questions can go to three subagents at the same time.',
          '**Least privilege**: an explorer subagent can be given read-only tools, so it cannot edit anything by mistake.',
          '**Specialisation and cost**: a subagent can use a different prompt or even a smaller, cheaper model for simple jobs like searching.',
        ] },
        { type: 'check', question: 'The main agent reads 40 files (about 80,000 tokens) to find one function. Without subagents, what happens to every later turn of the conversation?', answer: 'All 80,000 tokens stay in the context, so every later model call re-reads them: it costs more, is slower, and the useful information is diluted. A subagent would have read them in its own window and returned just "the function is in auth/login.py, line 42".' },
      ],
    },
    {
      id: 'how-they-work',
      title: 'How do subagents work?',
      blocks: [
        { type: 'p', text: 'Under the hood, a subagent is usually exposed to the main agent as a **tool**. The main model calls something like `spawn_subagent(task="...", type="explorer")`. The framework then runs a whole separate agent loop and returns that agent\'s final message as the tool result.' },
        { type: 'steps', title: 'The life of a subagent', items: [
          { title: 'Decide to delegate', text: 'The main agent sees a subtask that is self-contained and would produce lots of noise, e.g. "find where login is handled".' },
          { title: 'Write the brief', text: 'It writes a clear task: goal, what to return, limits. The brief is all the subagent knows, so it must include any needed context.' },
          { title: 'Spawn with a fresh context', text: 'The framework starts a new loop: subagent system prompt + the brief, plus its allowed tools.' },
          { title: 'Work independently', text: 'The subagent searches, reads and reasons over many turns. All of that stays in its own window.' },
          { title: 'Return a summary', text: 'It ends with a compact answer, ideally structured (paths, line numbers, findings, open questions).' },
          { title: 'Continue the main task', text: 'The main agent receives the result as a tool output and keeps going, with a context that grew by only a few hundred tokens.' },
        ] },
        { type: 'flow', title: 'Main agent delegating to three subagents in parallel', nodes: [
          { label: 'Main agent', detail: 'Holds the user conversation and the plan: add rate limiting to login.' },
          { label: 'Spawn 3 briefs', detail: 'Explorer A: find login handler. Explorer B: find existing rate-limit code. Explorer C: find login tests.' },
          { label: 'Subagents work', detail: 'Each reads dozens of files in its own context, in parallel, with read-only tools.' },
          { label: 'Summaries back', detail: 'Each returns ~150 tokens: file paths, line numbers and how things are wired.' },
          { label: 'Main agent edits', detail: 'With a clean context and precise pointers, the main agent writes the change and runs the tests.' },
        ] },
        { type: 'p', text: 'Many tools make this concrete. In Claude Code, for example, we can define a custom subagent as a Markdown file with YAML frontmatter (a name, a description that says when to use it, an optional tool list and model) in a `.claude/agents/` folder, and the main agent delegates to it when a task matches. Other frameworks expose the same idea as "agents as tools". The exact configuration differs by product.' },
      ],
    },
    {
      id: 'example-use-case',
      title: 'Example use case, in code',
      blocks: [
        { type: 'p', text: 'Let us measure the context effect. We build a fake repository of 30 files × 400 lines, run three search tasks, and compare the main agent\'s context when tool output goes straight into it versus when a subagent does the reading and returns a one-line summary.' },
        { type: 'code', lang: 'python', title: 'subagent_context.py', code: `# Main agent context with and without subagents (stdlib only, fake codebase).
import random

random.seed(7)
REPO = {f"src/module_{i}.py": [f"line {j}: " + ("def login" if random.random() < 0.01 else "x = 1")
                               for j in range(400)] for i in range(30)}

def tokens(lines):                       # rough rule: ~0.75 words per token
    return round(sum(len(l.split()) for l in lines) / 0.75)

def explore(keyword):
    """Read every file, find the keyword. Returns (raw tool output, short summary)."""
    raw, hits = [], []
    for path, lines in REPO.items():
        raw += lines                      # everything the explorer had to read
        hits += [f"{path}:{n}" for n, l in enumerate(lines) if keyword in l]
    summary = [f"'{keyword}' found {len(hits)} times, e.g. {hits[:2]}"]
    return raw, summary

tasks = ["def login", "line 399", "def logout"]
main_without, main_with, sub_peak = 2000, 2000, 0    # 2,000 tokens of user chat
for t in tasks:
    raw, summary = explore(t)
    main_without += tokens(raw)                       # tool output lands in main context
    main_with += tokens(summary)                      # only the summary comes back
    sub_peak = max(sub_peak, tokens(raw))             # the subagent's own window
    print(summary[0][:70])

print(f"\\nmain context WITHOUT subagents: {main_without:,} tokens")
print(f"main context WITH subagents:    {main_with:,} tokens")
print(f"largest single subagent context: {sub_peak:,} tokens (then discarded)")`, output: `'def login' found 128 times, e.g. ['src/module_0.py:106', 'src/module_
'line 399' found 30 times, e.g. ['src/module_0.py:399', 'src/module_1.
'def logout' found 0 times, e.g. []

main context WITHOUT subagents: 241,487 tokens
main context WITH subagents:    2,031 tokens
largest single subagent context: 79,829 tokens (then discarded)`, walkthrough: [
          { lines: [4, 6], note: 'A fixed seed and a fake codebase: 30 files, 400 lines each. About 1% of lines contain `def login`.' },
          { lines: [8, 9], note: 'A rough token counter: about 0.75 words per token.' },
          { lines: [11, 18], note: 'The explorer reads every file (the raw output it must process) and returns a one-line summary with hit counts and two examples.' },
          { lines: [20, 27], note: 'For each task: without subagents, the raw output is added to the main context. With subagents, only the summary is added; the raw output lives in the subagent\'s own window.' },
          { lines: [29, 31], note: 'Compare the totals. The subagent still processed ~80k tokens, but that window was thrown away afterwards.' },
        ] },
        { type: 'chart', kind: 'hbar', title: 'Main agent context after three searches (from the code)', xLabel: 'Tokens', labels: ['Without subagents', 'With subagents'], series: [ { name: 'Main context tokens', values: [241487, 2031] } ], caption: 'Real output of the simulation above. The work is not free: each subagent still read about 80k tokens. It just did not leave them behind in the main context.' },
        { type: 'p', text: 'Notice what the numbers do **not** say. Total tokens processed across all agents are about the same (or slightly higher, because each subagent also reads its own prompt). Subagents save the *main* context, not total compute. In this toy example, without subagents the main context (241k tokens) would overflow many models\' windows; with them, it stays tiny.' },
      ],
    },
    {
      id: 'benefits-and-challenges',
      title: 'Benefits and challenges',
      blocks: [
        { type: 'compare', title: 'Doing it yourself vs delegating to a subagent', options: [
          { name: 'Main agent does it', summary: 'All reading and tool calls happen in the main context.', pros: ['Full context: nothing lost in a summary', 'No briefing overhead', 'Simplest to trace'], cons: ['Context fills with noise', 'Sequential', 'Same permissions for everything'], bestFor: 'Small lookups and tightly coupled steps' },
          { name: 'Subagent does it', summary: 'A focused helper works in its own context and returns a summary.', pros: ['Clean main context', 'Parallel work', 'Restricted tools and cheaper models possible'], cons: ['Brief must be complete', 'Details can be lost in the summary', 'Extra latency and tokens to start up'], bestFor: 'Large, self-contained exploration or research' },
        ], rows: [
          ['Main context growth', 'Everything read', 'Only the summary'],
          ['Total tokens', 'Baseline', 'Similar or higher'],
          ['Risk', 'Context rot', 'Lost or wrong details in the handoff'],
        ], verdict: 'Delegate when the subtask is self-contained and its raw output is much bigger than its useful answer.' },
        { type: 'callout', tone: 'warn', title: 'The handoff is the weak point', text: 'A subagent knows only what is in its brief. If the main agent writes "check the auth code" without saying *what to look for*, the subagent may return a confident but useless summary. And because the main agent never sees the raw files, it cannot easily notice what was missed. Write briefs like you would for a capable new colleague with zero background.' },
        { type: 'list', items: [
          '**Lost context**: the subagent cannot see decisions made earlier in the main conversation unless they are in the brief.',
          '**Summary errors**: a wrong or incomplete summary is trusted as fact by the main agent.',
          '**Conflicting edits**: two subagents that both write to the same files in parallel can overwrite each other.',
          '**Cost and latency**: each spawn re-sends a system prompt and tool definitions and adds turns.',
          '**Debugging**: failures are spread across several traces; we need logs of every subagent run.',
          '**Runaway delegation**: subagents that spawn subagents can explode in cost; many tools limit or forbid nesting.',
        ] },
      ],
    },
    {
      id: 'best-practices',
      title: 'Best practices',
      blocks: [
        { type: 'list', ordered: true, items: [
          '**One clear job per subagent**, with a name and description that make it obvious when to use it.',
          '**Write complete briefs**: goal, relevant background, what *not* to do, and the exact shape of the answer.',
          '**Ask for structured results**: file paths, line numbers, short findings, confidence and open questions, so the main agent can verify.',
          '**Give the fewest tools needed**: read-only for explorers and reviewers; write access only where edits are the point.',
          '**Prefer read-heavy tasks** for parallel subagents; keep writes in the main agent or serialise them.',
          '**Set budgets**: maximum turns, tokens or time per subagent.',
          '**Log everything**: keep each subagent\'s transcript for debugging even though the main context discards it.',
          '**Do not over-delegate**: a two-second lookup is cheaper done directly.',
        ] },
        { type: 'p', text: 'Here is what a good brief looks like for our rate-limiting example. Notice that it carries the background the subagent cannot see, says what *not* to do, and fixes the shape of the answer so the main agent can check it quickly.' },
        { type: 'code', lang: 'text', title: 'A brief for an explorer subagent (illustrative)', code: `Goal: find how HTTP rate limiting is currently implemented in this repo.
Background: we will add rate limiting to POST /login next. Python 3.12, FastAPI.
Do: search for middleware, decorators or Redis counters used for limits.
Do not: edit any file, or read the frontend/ folder.
Return (max 15 lines):
  - file:line of each existing limiter and what it limits
  - how limits are configured (env vars, settings file)
  - anything that looks broken or unused
  - your confidence (high / medium / low) and open questions` },
        { type: 'p', text: 'Compare that with "look at rate limiting". The vague version forces the subagent to guess the purpose, which files matter and when to stop, and the main agent then receives an answer it cannot easily verify. A good brief usually costs a hundred tokens and saves thousands.' },
        { type: 'callout', tone: 'example', title: 'Where subagents are used today', text: 'Coding assistants spawn explorer subagents to map a codebase and reviewer subagents to check a diff with a fresh eye. Deep-research products send parallel search subagents out on different subtopics. Data agents delegate "summarise this 500-page PDF" to a helper so the main analysis stays focused.' },
        { type: 'check', question: 'Two subagents are asked to refactor two different functions in the same file at the same time. What can go wrong, and how would we avoid it?', answer: 'Their edits can conflict: one writes the file based on an old version and overwrites the other\'s change. Avoid it by giving parallel subagents read-only work, by assigning non-overlapping files, or by running the editing subagents one after another.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the main reason a subagent protects the main agent\'s context window?', options: ['It runs on a model that has a much bigger context window', 'It compresses tokens so they take up less space', 'It reads in its own context and returns only a summary', 'It deletes older messages from the main conversation'], answer: 2, explain: 'The subagent\'s working notes stay in its own window, which is discarded. Only the summary enters the main context. It does not need a bigger model or edit the parent\'s history.' },
    { q: 'A main agent delegates "look at the payments code" to a subagent and gets back a vague, unhelpful summary. What is the most likely fix?', options: ['Give the subagent write access to the payments code', 'Write a complete brief with goal, context and answer format', 'Run the subagent with a much higher temperature', 'Drop the separate context so it can see the whole chat'], answer: 1, explain: 'A subagent knows only its brief. Vague briefs produce vague results. More permissions or randomness do not fix missing instructions; removing the separate context throws away the main benefit.' },
    { q: 'In the lesson\'s simulation, the main context was ~241k tokens without subagents and ~2k with them. What about the total tokens processed across all agents?', options: ['Also about 2k, because subagent work is free', 'Similar or higher: subagents still read it all', 'Exactly zero, because subagents run offline', 'About 100 times lower across the whole system'], answer: 1, explain: 'Each subagent still processed about 80k tokens. Subagents move work out of the main context; they do not remove it. Total compute stays similar or grows slightly from extra prompts.' },
    { q: 'When is doing the work directly in the main agent better than spawning a subagent?', options: ['A quick lookup tied to the current step', 'Exploring a huge, unfamiliar codebase', 'Three independent research questions', 'A review that needs a fresh, unbiased eye'], answer: 0, explain: 'Delegation has overhead (brief, startup, possible lost details). It pays off when raw output is large and the task is self-contained, parallel, or benefits from a fresh view, not for tiny, coupled lookups.' },
    { q: 'Which belief about subagents is a misconception?', options: ['Subagents can be given fewer tools than the main agent', 'Several subagents can work on separate tasks in parallel', 'A subagent automatically knows the whole parent chat', 'A subagent\'s result reaches the parent like a tool result'], answer: 2, explain: 'A subagent starts with a fresh context: its own instructions plus the brief. It does not inherit the parent conversation, which is why complete briefs matter.' },
  ],
  takeaways: [
    'A subagent is a helper agent spawned for one focused subtask, with its own fresh context, prompt and tools.',
    'Only its short result returns to the main agent, keeping the main context clean.',
    'Subagents enable parallel work and least-privilege tool access; they do not reduce total compute.',
    'The brief is everything the subagent knows: make it complete and ask for structured answers.',
    'Avoid parallel writes to the same files, set budgets and log every subagent run.',
  ],
  terms: [
    { term: 'Subagent', def: 'An agent started by another agent to do one subtask in its own context and return a result.' },
    { term: 'Main agent', def: 'The agent that holds the user conversation, plans the work and delegates to subagents.' },
    { term: 'Context window', def: 'The maximum number of tokens a model can read in one call.' },
    { term: 'Context pollution', def: 'Filling the context with large, mostly irrelevant tool output, which raises cost and can lower quality.' },
    { term: 'Brief', def: 'The task description handed to a subagent; its only knowledge of the larger job.' },
    { term: 'Least privilege', def: 'Giving each agent only the tools and permissions its job requires.' },
  ],
};
