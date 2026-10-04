export default {
  id: 'multi-agent-systems',
  minutes: 17,
  hook: 'If one AI agent is good, are five agents five times better, or five times the bill and five times the confusion?',
  summary: 'A multi-agent system is a group of LLM agents, each with its own role, context and tools, that communicate and coordinate to finish a task none of them handles as well alone. It shines when work splits into independent parts that can run in parallel or need separate expertise, but it costs more tokens, adds latency for coordination and creates new ways to fail. Start with one agent and add more only when you can name the reason.',
  sections: [
    {
      id: 'big-picture',
      title: 'The big picture',
      blocks: [
        { type: 'p', text: 'An **AI agent** is an LLM that runs in a loop: it decides on an action, calls a tool (search, code, an API), observes the result and repeats until the goal is met. One agent with good tools can do a lot. But as tasks grow, a single agent hits limits: its **context window** (the text it can hold at once) fills with notes from every subtask, it works through subtasks one at a time, and one prompt must make it an expert at everything.' },
        { type: 'p', text: 'Our running example: a **market research assistant**. A user asks, "Compare the top five electric-scooter makers on price, battery range, safety recalls and customer sentiment." That is four quite different research jobs, each needing many searches, plus a final report.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a newsroom', text: 'A newspaper does not have one reporter write the whole paper. An editor splits the work: one reporter covers prices, one covers safety, one interviews customers. They work at the same time, each with their own notebook. The editor reads their drafts and writes the final story. A multi-agent system is a newsroom of LLM agents, and the editor is usually an agent too.' },
      ],
    },
    {
      id: 'what-is-mas',
      title: 'What is a multi-agent system?',
      blocks: [
        { type: 'p', text: 'A **multi-agent system (MAS)** is a set of agents that work towards a shared goal by dividing work and exchanging information. The idea is old in computer science (robot swarms, trading agents), but here each agent is an LLM with its own prompt, tools and memory.' },
        { type: 'list', items: [
          '**Own context**: each agent sees only what it needs, so its window stays focused.',
          '**Own role**: each gets a specialised system prompt ("You are a safety-recall researcher...").',
          '**Own tools**: the coder can run code, the researcher can search, the reviewer may have no tools at all.',
          '**Shared goal**: the outputs are combined into one result for the user.',
        ] },
        { type: 'p', text: 'Contrast this with a **single agent with many tools**: one loop, one context, one prompt. And with a fixed **workflow** (a pipeline where code, not the model, decides the order of LLM calls). Real systems often mix these: a fixed workflow whose steps are agents.' },
      ],
    },
    {
      id: 'three-pillars',
      title: 'The three pillars',
      blocks: [
        { type: 'p', text: 'A useful way to describe any multi-agent system is by three pillars. If one is weak, the whole system wobbles.' },
        { type: 'table', head: ['Pillar', 'Question it answers', 'In the scooter example'], rows: [
          ['**Agents**', 'Who does the work, with what role, model and tools?', 'A lead planner, four researchers, a writer'],
          ['**Environment**', 'What do they act on and share?', 'Web search, a notes store, the final report file'],
          ['**Interaction**', 'How do they communicate and coordinate?', 'The lead sends tasks, researchers return summaries, the lead merges'],
        ] },
        { type: 'p', text: '**Interaction** splits into two parts that people often blur. **Communication** is *how information moves* (messages, shared memory). **Coordination** is *who decides what happens next* (a boss, a fixed order, or a negotiation). We look at each below.' },
      ],
    },
    {
      id: 'agent-roles',
      title: 'Common agent roles',
      blocks: [
        { type: 'table', caption: 'Roles are just prompts and tool sets; one model can play several', head: ['Role', 'Job', 'Typical tools'], rows: [
          ['Orchestrator / planner', 'Breaks the goal into subtasks, assigns them, merges results', 'Spawn/assign agents, read results'],
          ['Researcher', 'Gathers facts for one subtopic', 'Web search, document search'],
          ['Executor / coder', 'Takes actions: writes and runs code, calls APIs', 'Code sandbox, APIs, file system'],
          ['Critic / reviewer', 'Checks another agent\'s output for errors and gaps', 'Often none, or tests'],
          ['Verifier', 'Checks facts or runs tests against a clear standard', 'Search, test runner'],
          ['Writer / summariser', 'Turns collected material into the final answer', 'None'],
        ] },
        { type: 'p', text: 'Roles are not magic. A "critic" is the same kind of model with a prompt that says "find problems". It helps because a fresh context, without the author\'s chain of reasoning, often spots mistakes the author missed.' },
      ],
    },
    {
      id: 'communicate-coordinate',
      title: 'How agents communicate and coordinate',
      blocks: [
        { type: 'p', text: '**Communication styles** (a later lesson goes deeper):' },
        { type: 'list', items: [
          '**Direct messages**: agent A sends a message to agent B.',
          '**Through a hub**: every message goes via the orchestrator, which decides what to forward.',
          '**Shared memory (blackboard)**: agents read and write a common store, such as a notes file or database.',
          '**Broadcast**: one agent sends the same message to all others.',
        ] },
        { type: 'p', text: '**Coordination patterns**:' },
        { type: 'compare', title: 'Coordination patterns', options: [
          { name: 'Centralised (supervisor)', summary: 'One orchestrator plans, assigns and merges.', pros: ['Clear control and logs', 'Easy to stop and debug'], cons: ['Orchestrator is a bottleneck and single point of failure'], bestFor: 'Most production systems' },
          { name: 'Hierarchical', summary: 'Supervisors manage sub-supervisors who manage workers.', pros: ['Scales to big tasks'], cons: ['More layers = more latency and lost detail'], bestFor: 'Very large, multi-part projects' },
          { name: 'Decentralised (peer / handoff)', summary: 'Agents pass control to each other directly.', pros: ['Flexible, no single boss'], cons: ['Hard to predict and debug; loops are easy'], bestFor: 'Customer-service handoffs between specialists' },
          { name: 'Debate / voting', summary: 'Several agents answer, then argue or vote.', pros: ['Can catch individual errors'], cons: ['Costly; fails if agents share blind spots'], bestFor: 'High-stakes judgement calls' },
        ], verdict: 'Default to a centralised supervisor; reach for the others only when it clearly falls short.' },
        { type: 'flow', title: 'Supervisor pattern for the scooter report', nodes: [
          { label: 'User goal', detail: 'Compare five scooter makers on price, range, recalls and sentiment.' },
          { label: 'Lead plans', detail: 'The lead agent writes four focused subtasks with clear outputs and limits.' },
          { label: 'Researchers', detail: 'Four researcher agents run in parallel, each in a clean context with search tools.' },
          { label: 'Condensed results', detail: 'Each returns a short summary with sources, not its whole search history.' },
          { label: 'Critic checks', detail: 'A reviewer looks for missing makers, unsupported numbers and contradictions.' },
          { label: 'Writer', detail: 'The final report is assembled and returned to the user.' },
        ] },
        { type: 'steps', title: 'One run, step by step', items: [
          { title: 'Plan', text: 'The lead reads the request and decides it splits into four independent research tracks.' },
          { title: 'Delegate', text: 'Each subtask gets its own agent, prompt, tools and a budget (for example, at most 15 searches).' },
          { title: 'Work in parallel', text: 'Agents search and read independently; none sees the others\' raw notes.' },
          { title: 'Return and merge', text: 'Each agent returns a compact result; the lead combines them into one table.' },
          { title: 'Review and finish', text: 'A critic flags gaps; the lead re-delegates one fix if needed, then answers.' },
        ] },
      ],
    },
    {
      id: 'trade-offs',
      title: 'Multi-agent vs single agent: the trade-offs',
      blocks: [
        { type: 'p', text: 'The benefits are real but never free. The code below puts illustrative numbers on three effects: parallel speed-up, token overhead, and how fast the number of links grows when every agent may talk to every other agent. It also shows why voting only helps when agents make *different* mistakes.' },
        { type: 'code', lang: 'python', title: 'tradeoffs.py', code: `# Single agent vs multi-agent: time, cost, links and the value of independence.
import numpy as np

subtasks = [30, 25, 40, 20]      # seconds each research subtask takes (illustrative)
plan, merge = 8, 10              # orchestrator overhead in seconds
tokens_per_task, overhead_tokens = 6000, 4000

single_time = sum(subtasks)
multi_time = plan + max(subtasks) + merge          # workers run in parallel
single_tokens = sum(tokens_per_task for _ in subtasks)
multi_tokens = single_tokens + overhead_tokens * (len(subtasks) + 1)
print(f"time:   single {single_time}s   multi {multi_time}s")
print(f"tokens: single {single_tokens}   multi {multi_tokens}  "
      f"(x{multi_tokens / single_tokens:.1f})")

for n in (3, 5, 10):                                # how many links must be managed?
    print(f"{n} agents: peer-to-peer links {n * (n - 1) // 2:2d}, hub links {n - 1}")

# Three reviewer agents vote; each is right 70% of the time.
rng = np.random.default_rng(0)
trials, p = 100_000, 0.7
independent = rng.random((trials, 3)) < p
shared = rng.random(trials) < p                     # same model, same blind spot
correlated = np.where(rng.random((trials, 3)) < 0.8, shared[:, None], independent)
for name, votes in [("independent", independent), ("correlated", correlated)]:
    majority = votes.sum(axis=1) >= 2
    print(f"majority of 3, {name:11s}: {majority.mean():.3f}")`, output: `time:   single 115s   multi 58s
tokens: single 24000   multi 44000  (x1.8)
3 agents: peer-to-peer links  3, hub links 2
5 agents: peer-to-peer links 10, hub links 4
10 agents: peer-to-peer links 45, hub links 9
majority of 3, independent: 0.785
majority of 3, correlated : 0.707`, walkthrough: [
          { lines: [4, 6], note: 'Four research subtasks with made-up durations, plus planning and merging overhead for the orchestrator.' },
          { lines: [8, 14], note: 'A single agent does tasks one after another (sum). Parallel workers finish when the slowest does (max) plus overhead. Each extra agent also needs its own prompt and instructions, so tokens go up.' },
          { lines: [16, 17], note: 'If every agent can talk to every other, links grow as n(n−1)/2. Through a hub they grow as n−1.' },
          { lines: [19, 27], note: 'Three reviewers vote, each right 70% of the time. With independent errors the majority is right more often. When 80% of the time they all share one blind spot (same model, same prompt), most of the gain disappears.' },
        ] },
        { type: 'chart', kind: 'bar', title: 'Scooter research: single vs multi-agent (illustrative, from the code)', labels: ['Wall time (s)', 'Tokens (thousands)'], series: [ { name: 'Single agent', values: [115, 24] }, { name: 'Multi-agent', values: [58, 44] } ], caption: 'Illustrative numbers from the simulation above: about half the time, about 1.8× the tokens. Real ratios depend on the task.' },
        { type: 'p', text: 'Real systems show the same shape. Anthropic reported in 2025 that in its multi-agent research feature, multi-agent runs used roughly 15× the tokens of a normal chat, and that on a web-browsing benchmark, how many tokens were spent explained most of the variation in performance. In other words, part of the gain comes simply from spending more compute in parallel.' },
        { type: 'compare', title: 'Single agent vs multi-agent', options: [
          { name: 'Single agent', summary: 'One loop, one context, one prompt, many tools.', pros: ['Simple to build and debug', 'Cheaper', 'No information lost between agents'], cons: ['Context fills up on big tasks', 'Sequential work', 'One prompt must cover all skills'], bestFor: 'Most tasks, tightly coupled work like editing one codebase' },
          { name: 'Multi-agent', summary: 'Several focused agents plus coordination.', pros: ['Parallel work: faster on wide tasks', 'Clean, focused contexts', 'Specialised prompts and tools'], cons: ['More tokens and cost', 'Coordination bugs, lost context at handoffs', 'Harder to test and trace'], bestFor: 'Breadth-first research, independent subtasks, separate permissions' },
        ], rows: [
          ['Cost', 'Lower', 'Higher (often several ×)'],
          ['Latency on wide tasks', 'Higher', 'Lower (parallel)'],
          ['Debugging', 'One trace', 'Many interleaved traces'],
          ['Failure modes', 'Fewer', 'More (handoffs, loops, conflicts)'],
        ], verdict: 'A single agent is the default. Multi-agent is an optimisation for specific shapes of work.' },
        { type: 'check', question: 'Using the code\'s numbers, why did multi-agent take 58 s and not 40 s (the longest subtask)?', answer: 'Because the orchestrator adds overhead: 8 s to plan and 10 s to merge. 8 + 40 + 10 = 58. Coordination time is always added on top of the slowest worker.' },
      ],
    },
    {
      id: 'common-mistakes',
      title: 'Common mistakes',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'The biggest mistake: splitting work that is not independent', text: 'If subtask B depends on details decided inside subtask A, giving them to separate agents means B works without those details. Two coding agents editing the same feature in parallel often make conflicting assumptions. Split only along clean seams, or pass the needed decisions explicitly.' },
        { type: 'list', items: [
          '**Too many agents, too early.** Every extra role adds prompts, handoffs and cost. Many "teams" of five agents work better as one agent with good tools.',
          '**Vague delegation.** "Research scooters" leads to duplicated or missing work. Each subtask needs an objective, output format, tools and limits.',
          '**Passing everything.** Forwarding full transcripts between agents wastes context; forwarding too little loses key facts. Return condensed results with sources.',
          '**No stopping rules.** Agents that can call each other can loop forever. Set budgets for turns, tokens and time.',
          '**Same model, same blind spots.** Debate or voting among copies of one model gains little if they all make the same mistake (see the code output).',
          '**No tracing.** Without logs of every message and tool call, failures are almost impossible to diagnose.',
        ] },
      ],
    },
    {
      id: 'when-to-use',
      title: 'When to use a multi-agent system',
      blocks: [
        { type: 'p', text: 'A good rule: **start with one agent**, measure where it fails, and add agents only for a reason you can name.' },
        { type: 'table', head: ['Situation', 'Multi-agent?', 'Why'], rows: [
          ['Many independent subtopics to research', 'Yes', 'Parallel, focused contexts'],
          ['Task too big for one context window', 'Often', 'Each agent holds only its part'],
          ['Parts need different permissions or tools', 'Yes', 'Isolation: the reader cannot write, the writer cannot browse'],
          ['High-stakes output needing independent review', 'Yes, a reviewer', 'Fresh context catches errors'],
          ['Tightly coupled task (one file, one design)', 'Usually no', 'Shared context matters more than parallelism'],
          ['Simple Q&A or low budget', 'No', 'Overhead outweighs the gain'],
        ] },
        { type: 'callout', tone: 'example', title: 'Where you see it in practice', text: 'Deep-research features in AI assistants use a lead agent that spawns parallel search agents. Coding assistants delegate exploration of a large codebase to helper agents and keep the main conversation clean. Customer-service platforms hand a conversation from a triage agent to a billing or technical specialist.' },
        { type: 'check', question: 'A team wants three agents to co-write one 200-line function: one for the first part, one for the middle, one for the end. Good idea?', answer: 'Probably not. The parts are tightly coupled (shared variables, shared assumptions), so separate contexts will drift apart. One agent, perhaps with a separate reviewer agent, is the better design.' },
      ],
    },
    {
      id: 'quick-summary',
      title: 'Quick summary',
      blocks: [
        { type: 'p', text: 'A multi-agent system is several LLM agents with their own roles, contexts and tools, working towards one goal. Think in three pillars: agents, environment, interaction (communication + coordination). Common roles are orchestrator, researcher, executor, critic, verifier and writer. Communication can be direct, through a hub, broadcast or via shared memory; coordination is usually a central supervisor. Multi-agent buys speed on wide tasks, focused contexts and specialisation, and pays in tokens, latency for coordination and new failure modes. Use it for parallel, separable work, not for tightly coupled tasks.' },
      ],
    },
  ],
  quiz: [
    { q: 'What best describes a multi-agent system built from LLMs?', options: ['One LLM called with a very long, multi-part prompt', 'Several agents with own roles and contexts, coordinating', 'A model trained on data pooled from several companies', 'A single agent that can call a large number of tools'], answer: 1, explain: 'The defining features are multiple agents with separate roles, contexts and tools, plus communication and coordination towards a shared goal. A single agent with many tools is the main alternative, not a MAS.' },
    { q: 'Our single research agent produces good reports but takes 20 minutes because it researches 8 unrelated topics one after another. What change most directly helps?', options: ['Make the system prompt longer and more detailed', 'Add a debate step between two copies of the agent', 'Delegate the topics to parallel researcher agents', 'Lower the temperature so each step is faster'], answer: 2, explain: 'The topics are independent, so a lead agent can hand them to parallel researchers with focused contexts and merge their summaries. Debate adds cost without addressing the sequential bottleneck; prompt length and temperature do not change the structure.' },
    { q: 'With 6 agents, how many links exist if every agent can talk directly to every other agent, versus everyone talking through one hub?', options: ['15 vs 5', '30 vs 6', '36 vs 6', '12 vs 5'], answer: 0, explain: 'Peer-to-peer links are n(n−1)/2 = 6×5/2 = 15. Through a hub each of the other agents has one link: n−1 = 5.' },
    { q: 'Compared with a single agent, what is the most typical cost of a multi-agent system?', options: ['Lower total tokens, because each context is smaller', 'More tokens and coordination overhead', 'It can no longer call any external tools', 'It always gives lower-quality final answers'], answer: 1, explain: 'Each agent needs its own prompt and instructions, and the orchestrator adds planning and merging, so total tokens rise (the lesson\'s simulation gave 1.8×; real systems often more). Smaller individual contexts do not make the total smaller.' },
    { q: 'Which statement is a misconception?', options: ['A reviewer agent with a fresh context can catch errors the author missed', 'Voting among three copies of one model always fixes its errors', 'Tightly coupled tasks are often better done by a single agent', 'Budgets on turns and tokens help stop agents from looping forever'], answer: 1, explain: 'Voting helps only when errors are fairly independent. Copies of one model with one prompt often share blind spots; in the simulation, correlated voters improved almost nothing (0.707 vs 0.7).' },
  ],
  takeaways: [
    'A multi-agent system = several agents with their own roles, contexts and tools, plus communication and coordination.',
    'Three pillars: agents, environment, interaction (communication + coordination).',
    'Centralised supervisor is the default coordination pattern; others add flexibility and risk.',
    'Gains: parallel speed on wide tasks, focused contexts, specialisation. Costs: tokens, overhead, new failure modes.',
    'Split only along independent seams; tightly coupled work belongs in one agent.',
    'Start with one agent and add more only for a reason you can name and measure.',
  ],
  terms: [
    { term: 'Multi-agent system (MAS)', def: 'Several AI agents that divide work and exchange information to reach a shared goal.' },
    { term: 'Orchestrator', def: 'The agent (or code) that plans, assigns subtasks and merges results.' },
    { term: 'Communication', def: 'How information moves between agents: messages, a hub, broadcast or shared memory.' },
    { term: 'Coordination', def: 'How the system decides who does what and when: supervisor, hierarchy, peers or voting.' },
    { term: 'Blackboard (shared memory)', def: 'A common store that all agents can read and write.' },
    { term: 'Handoff', def: 'Passing control of a task or conversation from one agent to another.' },
  ],
};
