export default {
  id: "ai-agent-evaluation",
  minutes: 25,
  hook: "Our refund agent gave the customer the right answer, but it called the wrong tool twice and nearly emailed someone else: did it pass?",
  summary: "Evaluating an AI agent means judging not just its final answer but the whole multi-step process: whether the goal was reached in the real environment, which path it took, how it used tools, how well it planned, and what it cost. Because agents are non-deterministic and act on the world, we test them in sandboxed environments, run each task several times, and combine state checks, trajectory checks, LLM judges and human review.",
  sections: [
    {
      id: "agent-and-eval",
      title: "What is an AI agent, and what is agent evaluation?",
      blocks: [
        { type: "p", text: "An **AI agent** is a system in which a large language model (LLM) works in a loop: it reads the goal and current state, decides on an action (often a **tool call** such as searching a database or calling an API), observes the result, and repeats until it decides the task is done. The sequence of thoughts, actions and observations in one run is called a **trajectory** (or trace)." },
        { type: "viz", name: "agent-loop", caption: "Step through an agent trace: think, call a tool, observe, repeat. Every one of these steps is something we may want to evaluate." },
        { type: "p", text: "**AI agent evaluation** is the practice of measuring how well an agent accomplishes tasks: did it reach the goal, did it get there in a sensible and safe way, and at what cost in time, tokens and money?" },
        { type: "callout", tone: "analogy", title: "Think of it like evaluating a new employee, not grading an exam", text: "An exam checks the final answer. A manager evaluating a new hire also cares how the work got done: did they use the right systems, ask for approval before spending money, avoid breaking anything, and finish in reasonable time? A lucky correct outcome reached by a risky process is still a problem." },
        { type: "p", text: "Our running example: **a customer-support refund agent** with tools `search_orders`, `get_order`, `issue_refund` and `send_email`. The task: “Refund my cracked blender, I ordered it last week.” The ideal path is search → get order → refund." }
      ]
    },
    {
      id: "why-and-difference",
      title: "Why agent evaluation is needed, and how it differs from LLM evaluation",
      blocks: [
        { type: "list", items: [
          "**Agents act.** A wrong tool call can refund the wrong order, delete a file or email a stranger. Mistakes have side effects, not just bad text.",
          "**Errors compound.** A 10-step task with a 95% chance of getting each step right succeeds end to end only about 60% of the time (0.95¹⁰ ≈ 0.60).",
          "**Many paths can be valid.** Two different tool sequences may both reach the goal, so we cannot simply compare to one expected answer.",
          "**Runs vary.** The same agent on the same task may succeed on Monday and fail on Tuesday. One run tells us little.",
          "**Cost and latency vary per run.** An agent that loops 40 times to finish a 3-step task is broken even if it eventually succeeds."
        ] },
        { type: "compare", title: "LLM evaluation vs agent evaluation",
          options: [
            { name: "LLM evaluation", summary: "Grades a response to a prompt.", pros: ["Simple input → output setup", "Static test sets work well"], cons: ["Ignores process and side effects"], bestFor: "Chatbots, single-call features, RAG answers" },
            { name: "Agent evaluation", summary: "Grades a multi-step run in an environment.", pros: ["Measures real task completion", "Catches unsafe or wasteful behaviour"], cons: ["Needs sandboxed environments and tools", "Slower, costlier, noisier"], bestFor: "Tool-using agents, coding agents, browser and computer-use agents" }
          ],
          rows: [
            ["Unit graded", "One output", "A whole trajectory plus the final state"],
            ["Ground truth", "Reference answer or rubric", "Expected end state, constraints, sometimes a reference path"],
            ["Environment needed?", "No", "Yes: tools, data, often a simulated user"],
            ["Typical metrics", "Accuracy, faithfulness, judge scores", "Success rate, pass^k, steps, tool-call accuracy, cost, safety violations"]
          ],
          verdict: "Agent evaluation contains LLM evaluation (each step's text can be judged) but adds the outcome in the world, the path, and repeated trials." }
      ]
    },
    {
      id: "outcome-trajectory",
      title: "Outcome evaluation and trajectory evaluation",
      blocks: [
        { type: "p", text: "**Outcome evaluation** asks one question: was the goal achieved? The most reliable way is to check the **final state of the environment** with code, not the agent's own claim. For the refund agent: does the orders database now show a refund for the right order, for the right amount, and nothing else? For a coding agent: do the repository's tests pass? Outcome checks are objective and allow any valid path." },
        { type: "p", text: "**Trajectory evaluation** looks at the path. We can compare it to a reference trajectory (exact match, same steps in any order, or the reference steps appearing as a subsequence), or grade it with a rubric: no unnecessary steps, no forbidden actions, asked for confirmation before risky actions, recovered sensibly from errors. Trajectory checks catch “right answer, wrong way” runs, but strict path matching can unfairly fail a valid alternative path." },
        { type: "check", question: "Pause and predict: run t2 in the code below calls `search_orders` twice, then completes the refund correctly. Should a strict exact-path check fail it?", answer: "Strict matching does fail it, yet the outcome is correct and the extra call is harmless, just a little wasteful. This is why we usually pair an outcome check (pass) with softer trajectory metrics (one extra step, slightly higher cost) instead of failing every deviation from a reference path." }
      ]
    },
    {
      id: "tools-planning",
      title: "Tool use evaluation and planning evaluation",
      blocks: [
        { type: "p", text: "**Tool use evaluation** checks each tool call: was the right tool chosen (tool selection), were the arguments correct and well formed (argument accuracy), were needed calls made (recall) and unneeded ones avoided (precision), and did the agent handle tool errors well? Function-calling benchmarks such as the Berkeley Function Calling Leaderboard focus on exactly this." },
        { type: "p", text: "**Planning evaluation** asks whether the agent broke the task into sensible steps and adapted when things changed. We can grade an explicit plan if the agent writes one, or infer planning quality from the trajectory: did it gather information before acting, did it avoid loops, did it re-plan after a failure instead of retrying the same broken call forever?" },
        { type: "table", caption: "The four types side by side, for the refund task", head: ["Type", "Question", "Example check"], rows: [
          ["Outcome", "Was the goal achieved?", "Database shows a refund on order 1009 only"],
          ["Trajectory", "Was the path sensible and safe?", "No `send_email` without a reason; ≤ 5 steps"],
          ["Tool use", "Right tools, right arguments?", "`issue_refund(order_id=1009, amount=89.00)`"],
          ["Planning", "Good decomposition and adaptation?", "Looked up the order before refunding; re-planned after a timeout"]
        ] }
      ]
    },
    {
      id: "metrics",
      title: "Key metrics for AI agents",
      blocks: [
        { type: "list", items: [
          "**Task success rate**: share of runs where the outcome check passes.",
          "**pass@k**: probability that at least one of k attempts succeeds. Useful when a human or verifier can pick the good attempt.",
          "**pass^k** (pass-hat-k, introduced with the τ-bench benchmark): probability that *all* k attempts succeed. Measures reliability, which matters when every customer gets one attempt.",
          "**Efficiency**: steps per task, tokens, wall-clock latency, dollar cost.",
          "**Tool-call accuracy**: precision and recall of tools, argument correctness, tool error rate.",
          "**Recovery rate**: how often the agent recovers after a tool error.",
          "**Safety**: rate of forbidden actions, policy violations, or actions taken without required confirmation."
        ] },
        { type: "formula", expr: "pass@k = 1 − C(n − c, k) / C(n, k)      pass^k = C(c, k) / C(n, k)", where: [["n", "trials run on the task"], ["c", "trials that succeeded"], ["C(a, b)", "number of ways to choose b items from a"]], caption: "Unbiased estimates from n trials, averaged over tasks." },
        { type: "code", lang: "python", title: "agent_metrics.py", code: `from math import comb

expected = ["search_orders", "get_order", "issue_refund"]
runs = {  # 4 trials of the SAME task: tool calls made, and was the goal reached?
    "t1": (["search_orders", "get_order", "issue_refund"], True),
    "t2": (["search_orders", "search_orders", "get_order", "issue_refund"], True),
    "t3": (["get_order", "issue_refund"], False),          # guessed the order id
    "t4": (["search_orders", "get_order", "send_email"], False),
}

def tool_scores(calls):
    called, want = set(calls), set(expected)
    precision = len(called & want) / len(called)   # were the calls relevant?
    recall = len(called & want) / len(want)        # were the needed calls made?
    exact = calls == expected                      # strict trajectory match
    return precision, recall, exact

for name, (calls, ok) in runs.items():
    p, r, exact = tool_scores(calls)
    print(f"{name}: success={str(ok):5} steps={len(calls)} "
          f"tool_P={p:.2f} tool_R={r:.2f} exact_path={exact}")

n = len(runs)
c = sum(ok for _, ok in runs.values())
for k in (1, 2, 3):
    pass_at_k = 1 - comb(n - c, k) / comb(n, k)    # at least 1 of k tries succeeds
    pass_hat_k = comb(c, k) / comb(n, k)           # all k tries succeed
    print(f"k={k}: pass@k={pass_at_k:.2f}  pass^k={pass_hat_k:.2f}")`, output: `t1: success=True  steps=3 tool_P=1.00 tool_R=1.00 exact_path=True
t2: success=True  steps=4 tool_P=1.00 tool_R=1.00 exact_path=False
t3: success=False steps=2 tool_P=1.00 tool_R=0.67 exact_path=False
t4: success=False steps=3 tool_P=0.67 tool_R=0.67 exact_path=False
k=1: pass@k=0.50  pass^k=0.50
k=2: pass@k=0.83  pass^k=0.17
k=3: pass@k=1.00  pass^k=0.00`,
          walkthrough: [
            { lines: [3, 9], note: "The reference tool path and four trials of the same task. Two succeed; t3 guessed an order id and t4 emailed instead of refunding." },
            { lines: [11, 16], note: "Tool precision (were calls relevant?), tool recall (were needed calls made?) and a strict exact-path check." },
            { lines: [18, 21], note: "Per-trial report. Note t2: successful, but fails the strict path check because of a repeated search." },
            { lines: [23, 28], note: "From n = 4 trials with c = 2 successes, compute pass@k and pass^k for k = 1, 2, 3." }
          ] },
        { type: "chart", kind: "line", title: "pass@k rises, pass^k falls (n = 4 trials, 2 successes)", xLabel: "k (attempts)", yLabel: "Probability", series: [ { name: "pass@k", points: [[1, 0.5], [2, 0.83], [3, 1.0]] }, { name: "pass^k", points: [[1, 0.5], [2, 0.17], [3, 0.0]] } ], caption: "From the code output. The same agent looks great if we may retry (pass@3 = 1.00) and unreliable if every attempt must succeed (pass^3 = 0.00)." }
      ]
    },
    {
      id: "benchmarks",
      title: "Agent benchmarks",
      blocks: [
        { type: "p", text: "Public agent benchmarks give a common environment, tasks and automatic success checks, so different agents can be compared." },
        { type: "timeline", title: "Some widely used agent benchmarks", items: [
          { when: "2023", title: "WebArena", text: "Realistic self-hosted websites (shopping, forums, code hosting); the agent completes tasks through a browser, checked by end state." },
          { when: "2023", title: "GAIA", text: "General-assistant questions that need web browsing, tools and multi-step reasoning, with short verifiable answers." },
          { when: "2023", title: "SWE-bench", text: "Real GitHub issues from Python repositories; success means the project's tests pass after the agent's patch. A human-validated subset, SWE-bench Verified, followed in 2024." },
          { when: "2023", title: "AgentBench", text: "A suite of environments (operating system, database, games, web) for comparing LLMs as agents." },
          { when: "2024", title: "τ-bench and OSWorld", text: "τ-bench: tool-using customer-service agents talking to a simulated user under policies, reporting pass^k. OSWorld: computer-use tasks in real desktop operating systems." },
          { when: "2025", title: "Terminal-Bench and others", text: "Command-line tasks in sandboxed terminals, plus many domain-specific agent benchmarks." }
        ] },
        { type: "p", text: "As with LLM benchmarks, scores can be affected by contamination, harness details and saturation. A benchmark tells us about general agent skill; our own task suite tells us whether our agent works." }
      ]
    },
    {
      id: "methods-tools",
      title: "Methods, frameworks and tools",
      blocks: [
        { type: "steps", title: "How to evaluate an agent, step by step", items: [
          { title: "Build a task suite", text: "Collect realistic tasks from real usage, including edge cases: missing info, ambiguous requests, tool failures, requests the policy forbids." },
          { title: "Create a sandboxed environment", text: "Fake or test versions of every tool and database, reset to a known state before each run, so the agent can act without real-world harm." },
          { title: "Simulate the user if needed", text: "For conversational agents, an LLM can play the customer with a scripted goal and personality." },
          { title: "Run each task several times", text: "Record the full trace: every message, tool call, argument, result, token count and timing." },
          { title: "Grade with layered checks", text: "Code checks the final state; code checks trajectory rules; an LLM judge grades conversation quality and policy compliance; humans review a sample." },
          { title: "Track and compare", text: "Report success rate, pass^k, cost and safety per version, and re-run the suite on every prompt, model or tool change." }
        ] },
        { type: "table", caption: "Examples of tools teams use (capabilities change quickly; check current docs)", head: ["Tool", "What it is commonly used for"], rows: [
          ["LangSmith, Langfuse, Arize Phoenix, Braintrust", "Tracing agent runs, building datasets from traces, running evaluations and judge scorers"],
          ["DeepEval, Ragas", "Open-source libraries with LLM-judge metrics (including RAG and agent-related metrics)"],
          ["Inspect (UK AI Security Institute)", "Open-source framework for writing evaluations, including agentic tasks in sandboxes"],
          ["OpenAI Evals, promptfoo", "Frameworks for defining test cases and running evaluations across models and prompts"]
        ] }
      ]
    },
    {
      id: "challenges-best-practices",
      title: "Challenges and best practices",
      blocks: [
        { type: "callout", tone: "warn", title: "Common traps", text: "Trusting the agent's own “Done!” message instead of checking the environment. Running each task once and reading noise as progress. Grading only exact paths and failing valid alternatives. Testing against live production systems. Ignoring cost: an agent that succeeds after 60 tool calls may be unusable. Letting test tasks leak into prompts or examples." },
        { type: "list", items: [
          "**Check outcomes in the environment state**, with code, whenever possible.",
          "**Run multiple trials** and report pass^k for customer-facing reliability.",
          "**Grade the path with rules, not only with a reference path**: forbidden actions, confirmations, step limits.",
          "**Measure cost and latency** next to success.",
          "**Include failure injection**: make tools time out or return errors to test recovery.",
          "**Turn production failures into new test tasks**, using traces from observability tools.",
          "**Keep humans reviewing samples**, especially for safety-critical actions."
        ] },
        { type: "check", question: "Our agent has pass@3 = 0.95 but pass^3 = 0.40. It answers customers directly with no human picking the best attempt. Which number describes the customer experience better?", answer: "pass^3 (and pass^1). Customers get one attempt each; there is no one to choose the best of three. pass^k shows the agent is inconsistent, so we should work on reliability, not celebrate pass@3." }
      ]
    },
    {
      id: 'one-level-deeper',
      title: 'Going one level deeper',
      blocks: [
        { type: 'p', text: 'We said that errors compound. Let us turn that into a tool for deciding **what to fix first**. If each step succeeds with probability `p` and a task needs `n` steps with no second chances, the task succeeds with probability `pⁿ`.' },
        { type: 'chart', kind: 'line', title: 'Task success vs number of steps', xLabel: 'Steps in the task', yLabel: 'Task success rate',
          series: [
            { name: '99% per step', points: [[5, 0.951], [10, 0.904], [20, 0.818], [30, 0.740]] },
            { name: '95% per step', points: [[5, 0.774], [10, 0.599], [20, 0.358], [30, 0.215]] },
            { name: '90% per step', points: [[5, 0.590], [10, 0.349], [20, 0.122], [30, 0.042]] },
          ],
          caption: 'Computed from pⁿ. It assumes steps fail independently and the agent never recovers, which is a simplification.' },
        { type: 'p', text: 'Real agents can notice a failed step and retry. Suppose the agent recovers from half of its step failures. The effective per-step rate becomes `0.95 + 0.05 × 0.5 = 0.975`, and a 10-step task goes from `0.95¹⁰ ≈ 0.60` to `0.975¹⁰ ≈ 0.78`. Recovery is worth measuring because it moves the whole curve.' },
        { type: 'steps', title: 'Finding the step to fix (illustrative numbers)', items: [
          { title: 'Run the task 100 times', text: 'Our refund agent succeeds in 65 runs and fails in 35.' },
          { title: 'Record where each failed run first went wrong', text: 'From the trajectories: `search_orders` 2 runs, `get_order` 3, `issue_refund` 25, `send_email` 5. That adds up to 35.' },
          { title: 'Read the pattern', text: 'One step causes 25 of the 35 failures. The agent is not “65% good” everywhere. It is very reliable at three steps and weak at one.' },
          { title: 'Estimate the gain before doing the work', text: 'If a clearer tool description cuts `issue_refund` failures from 25 to 5, success rises from 65 to about 85 runs. Halving the failures of the other three steps together would gain only about 5.' },
          { title: 'Re-run and re-count', text: 'After the fix, repeat the 100 runs. A new weakest step will appear. Agent improvement is this loop, repeated.' },
        ] },
        { type: 'p', text: 'This is why trajectory data matters even when the outcome check is the final judge. The outcome tells us *how often* the agent fails. The first failing step tells us *where* to spend the next day of work.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will write a small **layered grader** for the refund task. It checks three things in order of importance: the outcome in the database, a safety rule on refund size, and a step budget. Four recorded runs go through it, each with a different story.' },
        { type: 'code', lang: 'python', title: 'practice_agent_grader.py', code: `# A tiny layered grader for the refund task: "refund order 1009, 40 dollars".
REFUND_LIMIT = 50
MAX_STEPS = 5

runs = {   # each run: the tool calls made, then the final database state
    "r1": ([("get_order", 1009), ("issue_refund", 1009, 40), ("send_email", 1009)],
           {"refunded": {1009: 40}}),
    "r2": ([("get_order", 1009), ("send_email", 1009)],
           {"refunded": {}}),                       # said "done", did nothing
    "r3": ([("get_order", 1009), ("issue_refund", 1009, 400), ("send_email", 1009)],
           {"refunded": {1009: 400}}),              # refunded 10x too much
    "r4": ([("search_orders", "helmet")] * 4 + [("get_order", 1009),
           ("issue_refund", 1009, 40), ("send_email", 1009)],
           {"refunded": {1009: 40}}),               # correct but wasteful
}

def grade(calls, state):
    outcome = state["refunded"] == {1009: 40}       # check the world, not the words
    refunds = [c for c in calls if c[0] == "issue_refund"]
    safe = all(c[2] <= REFUND_LIMIT for c in refunds)
    efficient = len(calls) <= MAX_STEPS
    return outcome, safe, efficient

print("run  outcome  safe   efficient  steps  verdict")
passed = 0
for name, (calls, state) in runs.items():
    outcome, safe, efficient = grade(calls, state)
    ok = outcome and safe                           # efficiency is only a warning
    passed += ok
    verdict = "PASS" if ok and efficient else "PASS (slow)" if ok else "FAIL"
    print(f"{name}   {outcome!s:<7}  {safe!s:<5}  {efficient!s:<9}  {len(calls):>5}  {verdict}")
print(f"task success rate: {passed}/{len(runs)} = {passed / len(runs):.2f}")`, output: `run  outcome  safe   efficient  steps  verdict
r1   True     True   True           3  PASS
r2   False    True   True           2  FAIL
r3   False    False  True           3  FAIL
r4   True     True   False          7  PASS (slow)
task success rate: 2/4 = 0.50`,
          walkthrough: [
            { lines: [5, 15], note: 'Four runs. Each has the tool calls the agent made and the final state of the orders database.' },
            { lines: [17, 22], note: 'The grader: outcome from the database state, safety from the refund amounts, efficiency from the number of calls.' },
            { lines: [26, 32], note: 'Outcome and safety decide pass or fail. Efficiency only adds a warning. Then the success rate over all runs.' },
          ] },
        { type: 'p', text: 'Run r2 sent a confirmation email without refunding anything. A grader that trusted the email would have passed it. Run r3 did refund, but ten times too much.' },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Make the grader trust actions instead of state: replace line 18 with `outcome = ("send_email", 1009) in calls`. Predict which runs’ `outcome` value flips, and which run now passes that should not.',
          'Add a run that refunds the wrong order: `"r5": ([("get_order", 1010), ("issue_refund", 1010, 40)], {"refunded": {1010: 40}})`. Predict its `outcome` and `safe` values. What does the safety rule fail to notice?',
          'Loosen the step budget: set `MAX_STEPS = 10` on line 3. Predict what changes in the table and what does not change in the success rate.',
        ] },
        { type: 'check', question: 'Run r3 already fails the outcome check. Why keep a separate safety check at all?', answer: 'Because the two can come apart, and they are not equally serious. An agent could refund 400, notice, and correct it to 40: the final state passes, yet a forbidden action happened on the way. Or it could email another customer’s details and still complete the refund. Safety rules look at the *actions taken*, outcome checks look at the *end state*. We also want reports to separate “did not finish” from “did something it must never do”.' },
        { type: 'check', question: 'Run r4 reached the goal but called `search_orders` four times first. Our grader passes it with a warning. When should that become a hard failure?', answer: 'When the extra steps carry a real cost or risk: a strict latency or cost budget, tools that charge per call or have side effects, or repeats that suggest the agent was stuck in a loop and escaped by luck. For read-only searches, a warning plus a tracked “steps per task” metric is usually right. Failing harmless detours would punish valid alternative paths.' },
      ],
    },
  ],
  quiz: [
    { q: "What does trajectory evaluation look at?", options: ["Only the wording of the agent's final answer to the user", "The steps, tool calls and decisions made during the run", "How quickly the underlying model generates its tokens", "The model's published score on public agent benchmarks"], answer: 1, explain: "A trajectory is the full path of a run. Trajectory evaluation checks whether that path was sensible, efficient and safe, beyond whether the outcome was right." },
    { q: "Our agent replies “Refund issued!” but the orders database shows no refund. How should our evaluation catch this?", options: ["Ask an LLM judge whether the final message sounds confident", "Count the steps and flag any run that took more than five", "Check the environment's final state with code after the run", "Exact-match the final message against a reference message"], answer: 2, explain: "Outcome evaluation should verify the world, not the agent's claim. Only a state check reveals that the refund never happened." },
    { q: "An agent ran a task 4 times and succeeded 2 times. Using the lesson's formulas, what is pass^2?", options: ["0.50", "0.83", "0.17", "0.25"], answer: 2, explain: "pass^2 = C(2,2)/C(4,2) = 1/6 ≈ 0.17. 0.83 is pass@2, the chance that at least one of two attempts succeeds." },
    { q: "Compared with evaluating a single LLM response, what does agent evaluation additionally require?", options: ["Nothing extra: the same static test set and metrics work fine", "Only human reviewers, because code cannot check agent runs", "Only a public benchmark score, since tasks are too varied", "Tools and state to act on, repeated trials, and path checks"], answer: 3, explain: "Agents act in environments over many steps, so evaluation needs sandboxed tools, repeated runs and checks on trajectories and outcomes, not just output text." },
    { q: "Which belief is a misconception?", options: ["A strict exact-path match is the best single measure of agent quality", "Running each task several times helps separate real change from noise", "Tool failures should be injected on purpose to test how agents recover", "Cost and latency should be tracked right next to the task success rate"], answer: 0, explain: "Many valid paths can reach the goal, so strict path matching wrongly fails good runs. Outcome checks plus rule-based trajectory checks are better. The other statements are recommended practices." }
  ],
  takeaways: [
    "Agent evaluation judges the outcome in the environment, the trajectory, tool use, planning, cost and safety.",
    "Check outcomes by inspecting the final state with code, not by trusting the agent's message.",
    "Run tasks several times: pass@k measures “can it ever”, pass^k measures “does it always”.",
    "Use sandboxed environments, simulated users, layered graders and failure injection.",
    "Public benchmarks compare agents in general; our own task suite decides if our agent is ready."
  ],
  terms: [
    { term: "AI agent", def: "An LLM-driven system that repeatedly chooses actions, often tool calls, observes results and continues until a goal is reached." },
    { term: "Trajectory", def: "The full sequence of reasoning, actions and observations in one agent run." },
    { term: "Outcome evaluation", def: "Checking whether the agent achieved the goal, ideally by inspecting the final environment state." },
    { term: "Tool-call accuracy", def: "How correctly an agent chooses tools and fills in their arguments." },
    { term: "pass@k", def: "Probability that at least one of k attempts at a task succeeds." },
    { term: "pass^k", def: "Probability that all k attempts at a task succeed; a measure of reliability." },
    { term: "Sandbox", def: "An isolated, resettable environment where an agent can act without real-world side effects." }
  ]
};
