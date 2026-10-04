export default {
  id: "plan-and-execute-agent",
  minutes: 18,
  hook: "Should an agent decide each move as it goes, or think through the whole route before taking the first step?",
  summary: "A Plan-and-Execute agent splits the work in two: a planner (usually a strong LLM) writes the full list of steps up front, and an executor carries them out one by one, often with a cheaper model or plain code. When a step fails or reveals something new, a replanner revises the remaining plan. This gives structure, lower cost and easier oversight on long tasks, at the price of less flexibility than step-by-step agents like ReAct.",
  sections: [
    {
      id: "what-is-plan-and-execute",
      title: "What is a Plan-and-Execute agent?",
      blocks: [
        { type: "p", text: "A **Plan-and-Execute agent** solves a task in two separate phases:" },
        { type: "list", ordered: true, items: [
          "**Plan**: one model call reads the goal and writes an ordered list of steps (the *plan*), before anything is executed.",
          "**Execute**: each step is carried out in order, using tools. Results are collected as the steps complete."
        ] },
        { type: "p", text: "A third, optional component makes it robust: a **replanner** that looks at what has happened so far and rewrites the remaining steps when reality does not match the plan (a step failed, or a result changes what makes sense next)." },
        { type: "p", text: "The idea draws on research such as *Plan-and-Solve prompting* (Wang and colleagues, 2023), which showed that asking a model to first devise a plan and then carry it out can improve multi-step reasoning, and on open-source agent projects of 2023 that kept an explicit task list. Agent frameworks such as LangChain and LangGraph later offered it as a standard pattern." },
        { type: "callout", tone: "analogy", title: "Think of it like a building project", text: "An architect (the planner) draws the full blueprint before construction starts. Builders (the executors) follow it step by step without redesigning the house at each brick. When the builders hit rock where the foundation should go, they call the architect back (the replanner), who revises the remaining drawings. Compare that with a builder who decides each brick as they go: flexible, but slow, and the house may not end up coherent." }
      ]
    },
    {
      id: "vs-ai-agent",
      title: "Plan-and-Execute agent vs a basic AI agent",
      blocks: [
        { type: "p", text: "A basic tool-calling agent has no explicit plan. At each turn the model looks at the history and picks *one* next action. Any planning lives implicitly in the model's head and is re-done every turn. A Plan-and-Execute agent makes planning a **separate, visible artifact**: a list we can read, log, show to a user, edit, or approve before execution starts." },
        { type: "table", caption: "What changes when the plan becomes explicit",
          head: ["Aspect", "Basic agent loop", "Plan-and-Execute"],
          rows: [
            ["When planning happens", "Implicitly, every turn", "Explicitly, once up front (plus replans)"],
            ["Can a human review the plan before acting?", "Not easily", "Yes, the plan is a list"],
            ["Model used for each step", "The same model every turn", "Strong planner; cheaper model or code for steps"],
            ["Sense of overall progress", "Hidden in the history", "Clear: step 3 of 5 done"]
          ] },
        { type: "check", question: "Why is it easier to put a human approval gate in a Plan-and-Execute agent than in a basic loop?", answer: "Because the whole plan exists as a readable list before any tool runs. A person can approve, edit or reject it once, up front. In a basic loop, actions are decided one at a time, so approval would have to happen at every turn." }
      ]
    },
    {
      id: "anatomy",
      title: "Anatomy of a Plan-and-Execute agent",
      blocks: [
        { type: "table", caption: "The four parts",
          head: ["Part", "Job", "Typical choice"],
          rows: [
            ["Planner", "Turn the goal into an ordered list of concrete steps.", "The strongest (most expensive) model, called once."],
            ["Executor", "Carry out one step at a time with tools; return the result.", "A smaller model running a short tool loop, or plain code."],
            ["State", "Hold the goal, the remaining plan, and results of completed steps.", "A simple object or dictionary passed between parts."],
            ["Replanner", "After a step (or on failure), keep, edit, or extend the remaining plan, or finish.", "The planner model again, given the results so far."]
          ] },
        { type: "flow", title: "The Plan-and-Execute cycle", loop: true,
          nodes: [
            { label: "Planner", detail: "Reads the goal and writes steps 1..n as a structured list (often JSON)." },
            { label: "Executor", detail: "Takes the next step, runs the needed tools, and records the result." },
            { label: "Update state", detail: "The step moves from “remaining” to “done”, with its result attached." },
            { label: "Replanner", detail: "Checks progress. If all is well, continue; if a step failed or new info appeared, rewrite the remaining steps; if the goal is met, produce the final answer." }
          ] },
        { type: "deeper", title: "What a good plan looks like", blocks: [
          { type: "p", text: "A useful plan step is **small enough to execute with one or a few tool calls**, **specific** about its input and expected output, and **explicit about dependencies**. Compare a weak step, “research hotels”, with a strong one: “search hotels in Nice for the night of the trip; return the three cheapest with price and rating”. The strong step tells the executor exactly when it is done." },
          { type: "p", text: "Some designs go further and let steps refer to earlier results with placeholders, for example step 3 uses “the city found in step 1”. The research method ReWOO (2023) used this idea so that a whole chain of tool calls could be planned in one model call and filled in by code, without asking the model again between steps. The trade-off is the same as always: fewer model calls, but less chance to react if an intermediate result is surprising." }
        ] },
        { type: "callout", tone: "tip", title: "Make the plan structured", text: "Ask the planner for a JSON list (use structured outputs if your API supports them), where each step has an id, a description, the tool it expects to use, and which earlier steps it depends on. Structured plans are easy to validate, display and execute." }
      ]
    },
    {
      id: "how-it-works",
      title: "How a Plan-and-Execute agent works",
      blocks: [
        { type: "steps", title: "From goal to answer",
          items: [
            { title: "Receive the goal", text: "For example: “Plan a one-night trip from London to Nice, as cheap as possible.”" },
            { title: "Plan", text: "The planner writes the steps: 1) find a flight London→Nice, 2) find a hotel in Nice. Optionally a human approves." },
            { title: "Execute the next step", text: "The executor runs step 1 with the flight tool and stores the result." },
            { title: "Check and replan", text: "If the step succeeded, move on. If it failed (no direct flight), the replanner rewrites the remaining steps: fly to Paris, then take a train to Nice." },
            { title: "Repeat until done", text: "Execute the remaining steps in order, replanning only when needed." },
            { title: "Synthesise", text: "With all results in hand, write the final answer: the route, the hotel, and the total cost." }
          ] },
        { type: "p", text: "Because steps are known in advance, **independent steps can run in parallel**. If the plan says “search flights” and “search hotels” and neither depends on the other, the executor can do both at once. Research systems such as LLMCompiler took this further by planning a dependency graph of tool calls and running independent ones concurrently." },
        { type: "matrix", title: "Which step depends on which (1 = depends)", rows: ["1 Flights", "2 Trains", "3 Hotels", "4 Compare routes", "5 Book"], cols: ["1", "2", "3", "4", "5"],
          values: [[null, 0, 0, 0, 0], [0, null, 0, 0, 0], [0, 0, null, 0, 0], [1, 1, 0, null, 0], [0, 0, 1, 1, null]], format: "int",
          caption: "Rows are steps, columns are the steps they need first. Steps 1–3 have no dependencies, so they can run in parallel; step 4 waits for 1 and 2; step 5 waits for 3 and 4." }
      ]
    },
    {
      id: "full-trace",
      title: "A full trace example",
      blocks: [
        { type: "p", text: "Let us run the trip example. The planner's first plan assumes a direct flight. In our toy data there is none, so step 1 fails and the replanner routes through Paris. Notice that the hotel step from the original plan is kept: the replanner only replaces what broke." },
        { type: "code", lang: "python", title: "plan_and_execute.py", code: `# Plan-and-execute: planner writes all steps up front; executor runs them;
# a replanner patches the plan when a step fails.
FLIGHTS = {"LHR->CDG": 120}             # toy data: no direct LHR->NCE flight here
TOOLS = {
    "flight": lambda r: FLIGHTS.get(r) or f"ERROR no flight {r}",
    "train":  lambda r: {"CDG->NCE": 80}.get(r, f"ERROR no train {r}"),
    "hotel":  lambda city: {"NCE": 95}[city],
}

def planner(goal):                       # one "big" LLM call -> a list of steps
    return [("flight", "LHR->NCE"), ("hotel", "NCE")]

def replanner(failed_step, error):       # called only when something breaks
    print(f"  replan: {failed_step} failed ({error}); route via Paris")
    return [("flight", "LHR->CDG"), ("train", "CDG->NCE")]

plan = planner("Trip London -> Nice, cheapest, 1 night")
print("initial plan:", plan)
done, costs, replans = [], [], 0
while plan:
    step = plan.pop(0)                   # executor: cheap model or plain code
    result = TOOLS[step[0]](step[1])
    if isinstance(result, str) and result.startswith("ERROR") and replans < 2:
        replans += 1
        plan = replanner(step, result) + plan   # keep the remaining steps
        continue
    done.append(step); costs.append(result)
    print(f"  ran {step} -> {result}")
print("total cost:", sum(costs), "GBP | steps run:", len(done), "| replans:", replans)`, output: `initial plan: [('flight', 'LHR->NCE'), ('hotel', 'NCE')]
  replan: ('flight', 'LHR->NCE') failed (ERROR no flight LHR->NCE); route via Paris
  ran ('flight', 'LHR->CDG') -> 120
  ran ('train', 'CDG->NCE') -> 80
  ran ('hotel', 'NCE') -> 95
total cost: 295 GBP | steps run: 3 | replans: 1`,
          walkthrough: [
            { lines: [3, 8], note: "Toy tools for flights, trains and hotels. Missing routes return an ERROR string instead of raising, so the agent can react." },
            { lines: [10, 11], note: "The planner: in a real agent, one call to a strong model that returns a list of steps. Here it returns a fixed, slightly wrong plan." },
            { lines: [13, 15], note: "The replanner: called only when a step fails. It returns replacement steps for the broken part." },
            { lines: [17, 19], note: "Make the plan and set up state: completed steps, costs, and a replan counter." },
            { lines: [20, 26], note: "The executor loop: take the next step and run it. On an error, and if we have replans left (max 2), splice the new steps in front of the remaining plan." },
            { lines: [27, 29], note: "Successful steps are recorded. The final line synthesises the outcome: 3 steps, 1 replan, 295 in total." }
          ] },
        { type: "check", question: "In the trace, why was the planner called only once at the start, even though four steps were attempted?", answer: "Because execution follows the plan without asking the planner each time. The big model is called once to plan and once more (as the replanner) only when step 1 failed. Steps themselves run with tools or a cheaper executor. This is where the cost savings come from." }
      ]
    },
    {
      id: "vs-react",
      title: "Plan-and-Execute agent vs ReAct agent",
      blocks: [
        { type: "compare", title: "ReAct vs Plan-and-Execute",
          options: [
            { name: "ReAct", summary: "Decide one action at a time, reasoning after every observation.", pros: ["Highly adaptive", "Great when each step depends on the last result", "Simple to build"], cons: ["One big-model call per step", "Can lose sight of the overall goal", "Hard to review before acting"], bestFor: "Exploratory tasks: debugging, open research, troubleshooting" },
            { name: "Plan-and-Execute", summary: "Write the whole plan first, then execute it, replanning on surprises.", pros: ["Fewer calls to the expensive model", "Clear progress and reviewable plan", "Independent steps can run in parallel"], cons: ["Plan can be wrong or stale", "Replanning adds complexity", "Less nimble on surprises"], bestFor: "Long, structured tasks: reports, migrations, multi-part bookings" }
          ],
          rows: [
            ["Planning", "Step by step, implicit", "Up front, explicit"],
            ["Big-model calls for a 6-step task", "About 7 (6 steps + answer)", "About 2 (plan + final), plus any replans"],
            ["Adapting to surprises", "Immediately, every step", "Through the replanner"],
            ["Human approval", "Per action", "Once, on the plan"]
          ],
          verdict: "Use ReAct when you cannot know the steps until you see results. Use Plan-and-Execute when the task can be broken down up front and cost, speed or oversight matter. Hybrids are common: a plan whose steps are each run by a small ReAct executor." },
        { type: "chart", kind: "bar", title: "Calls to the strong model for a 6-step task", yLabel: "Strong-model calls", labels: ["ReAct", "Plan-and-Execute (no replan)", "Plan-and-Execute (1 replan)"],
          series: [ { name: "Strong-model calls", values: [7, 2, 3] } ],
          caption: "Illustrative counting, assuming ReAct uses the strong model for every step plus the final answer, while Plan-and-Execute uses it only to plan, replan and write the final answer, and runs steps with a cheaper executor or code." }
      ]
    },
    {
      id: "failure-modes",
      title: "Common failure modes and how to fix them",
      blocks: [
        { type: "table", caption: "Plan-and-Execute failures and fixes",
          head: ["Failure", "What happens", "Fix"],
          rows: [
            ["Bad initial plan", "Steps are vague (“research the topic”), missing, or in the wrong order.", "Ask for concrete, tool-sized steps; give example plans; validate the plan's structure."],
            ["Stale plan", "A result changes the situation but the executor keeps following the old plan.", "Run the replanner after each step, or at least after any unexpected result."],
            ["Replanning loops", "The replanner keeps rewriting the plan and never finishes.", "Cap replans; require progress; fall back to a human."],
            ["Lost context in steps", "The executor does not know why a step matters or what earlier steps found.", "Pass the goal and relevant prior results into each executor call."],
            ["Over-planning", "A 2-step task gets a 12-step plan; cost and latency balloon.", "Ask for the minimum number of steps; skip planning for simple requests."],
            ["Unverified completion", "Every step “succeeds” but the final result does not meet the goal.", "A final check step against the original goal before answering."]
          ] },
        { type: "callout", tone: "warn", title: "The most common mistake", text: "Treating the plan as fixed. Real environments are full of surprises (a missing file, an empty search result, an API error). Without a replanner, a Plan-and-Execute agent marches confidently through a plan that no longer makes sense." },
        { type: "callout", tone: "example", title: "Real-world use", text: "Deep-research features commonly start by drafting a research plan (sometimes shown to the user for approval) and then run many searches against it. Coding agents often write a task checklist before editing files and tick items off as they go. Data pipelines use a plan of queries whose independent parts run in parallel." },
        { type: "p", text: "**Quick summary.** A Plan-and-Execute agent separates thinking from doing: a planner writes the steps, an executor carries them out, and a replanner fixes the plan when reality disagrees. It saves strong-model calls, enables parallelism and human review, and keeps long tasks on track. It is less nimble than ReAct, so pair it with replanning and use ReAct-style execution inside steps when needed." }
      ]
    }
  ],
  quiz: [
    { q: "What is the defining feature of a Plan-and-Execute agent?", options: ["It critiques its own answer and rewrites it until a critic model approves", "It writes the full list of steps first, then carries them out one by one", "It decides one action at a time, after each new observation comes in", "It stores memories in a vector database to recall earlier steps"], answer: 1, explain: "Plan-and-Execute plans up front and then executes. Deciding one action at a time is ReAct; self-critique is Reflection; memory storage is a separate concern." },
    { q: "Our Plan-and-Execute agent keeps following its plan after step 2 returns “file not found”, producing nonsense. What should we add?", options: ["A larger executor model that can work around the missing file", "More tools, so the executor has another way to find the file", "A replanner that revises the remaining steps when a result surprises it", "A higher step limit so the plan has room to recover on its own"], answer: 2, explain: "The plan has gone stale. A replanner that inspects results and rewrites the remaining steps fixes this. More tools or a higher limit would not change the outdated plan." },
    { q: "In the dependency matrix, step 4 depends on steps 1 and 2, and step 5 depends on steps 3 and 4. Which steps can run in parallel at the very start?", options: ["Steps 1, 2 and 3", "Only step 1", "Steps 4 and 5", "Steps 1, 2 and 4"], answer: 0, explain: "Steps 1, 2 and 3 have no dependencies, so they can all start together. Step 4 must wait for 1 and 2; step 5 must wait for 3 and 4." },
    { q: "Compared with ReAct, where does Plan-and-Execute usually save cost?", options: ["It skips tool calls entirely, so each step costs one model completion", "It needs no system prompt, because the plan tells each step what to do", "It uses the strong model mainly to plan and replan; cheaper executors run steps", "It produces shorter final answers, since every step's output is pre-planned"], answer: 2, explain: "ReAct typically uses the strong model at every step. Plan-and-Execute concentrates strong-model use in planning and can hand steps to cheaper executors." },
    { q: "Which statement is a misconception about Plan-and-Execute?", options: ["Plans can be shown to a human for approval before acting", "Once the plan is written it must never change", "Independent steps can be executed in parallel", "It can be combined with ReAct-style executors for individual steps"], answer: 1, explain: "Good Plan-and-Execute agents replan when results are surprising. A fixed plan is a known failure mode, not a rule of the design." }
  ],
  takeaways: [
    "Plan-and-Execute splits work into a planner (writes all steps), an executor (does them), and a replanner (fixes the plan).",
    "Explicit plans are reviewable, show progress, and enable parallel execution of independent steps.",
    "The strong model is used mainly for planning, which can cut cost versus calling it at every step.",
    "Its weakness is rigidity: without replanning, a plan goes stale when results surprise it.",
    "Choose ReAct for exploratory tasks and Plan-and-Execute for structured, decomposable ones; hybrids are common."
  ],
  terms: [
    { term: "Plan-and-Execute agent", def: "An agent that writes a complete plan first and then executes its steps, revising the plan when needed." },
    { term: "Planner", def: "The model call that turns a goal into an ordered list of concrete steps." },
    { term: "Executor", def: "The component (smaller model or code) that carries out one plan step with tools." },
    { term: "Replanner", def: "The component that reviews progress and rewrites the remaining steps, or declares the task done." },
    { term: "Dependency", def: "A relationship where one step needs another step's result before it can run." },
    { term: "Stale plan", def: "A plan that no longer fits the situation because results differed from what the planner assumed." }
  ]
};
