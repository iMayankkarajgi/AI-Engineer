export default {
  id: "ai-agent-loop",
  minutes: 19,
  hook: "Every AI agent, from a tiny script to a coding assistant, runs the same few lines of code over and over; what are they, and how do they know when to stop?",
  summary: "The agent loop is the small piece of ordinary code that repeatedly calls the model, runs any tools it asks for, feeds the results back, and stops when the model gives a final answer or a limit is hit. Each pass is one think-act-observe cycle. Getting the loop right (stop conditions, error handling, parallel calls, budgets) is what separates a demo from a dependable agent.",
  sections: [
    {
      id: "big-picture",
      title: "The big picture",
      blocks: [
        { type: "p", text: "In the last two lessons we met AI agents and function calling. Function calling gives us one round trip: the model asks for a tool, we run it, we send back the result. But real tasks rarely finish in one round trip. A research question might need five searches; a bug fix might need reading three files, editing one, and running the tests twice." },
        { type: "p", text: "The **agent loop** is what turns one round trip into as many as the task needs. It is surprisingly small: often 20–40 lines of code. Yet nearly every agent framework, under its abstractions, is running this same loop." },
        { type: "callout", tone: "analogy", title: "Think of it like cooking from a recipe you are improvising", text: "You taste the soup (observe), decide it needs salt (think), add a pinch (act), then taste again. You repeat until it tastes right, and you stop for other reasons too: the guests have arrived (time limit) or you have run out of salt (a tool keeps failing). The agent loop is that taste-adjust-taste cycle, written as code." }
      ]
    },
    {
      id: "what-is-the-loop",
      title: "What is the AI agent loop?",
      blocks: [
        { type: "p", text: "**The AI agent loop is a `while` loop around an LLM call.** Each iteration (called a *turn* or *step*) does three things: call the model with everything so far, execute whatever tools it asked for, and append the results to the history. The loop ends when the model replies without asking for any tool, or when a safety limit triggers." },
        { type: "p", text: "Two parts with very different natures work together here:" },
        { type: "list", items: [
          "**The model** is probabilistic. It reads the history and *decides*: call a tool, or answer.",
          "**The loop code** is deterministic. It never decides what to do for the task; it *executes*, records, and enforces rules (limits, permissions, timeouts)."
        ] },
        { type: "p", text: "This split matters. We cannot fully control what the model will say, but we can fully control the loop. Safety, cost control, and reliability are mostly built into the loop, not the prompt." }
      ]
    },
    {
      id: "why-a-loop",
      title: "Why an AI agent needs a loop",
      blocks: [
        { type: "p", text: "Why not ask the model to plan everything and call all tools at once? Because **the right next step often depends on the result of the previous one.** Suppose a user says: “Why did yesterday's nightly job fail?” The agent must:" },
        { type: "list", ordered: true, items: [
          "List yesterday's job runs (it does not know the run id yet).",
          "Read the log of the failed run (needs the id from step 1).",
          "Notice a “disk full” error and check disk usage on that machine (only now does it know which machine)."
        ] },
        { type: "p", text: "None of these steps could be written in advance. Each one is chosen after seeing the last observation. A loop is the only structure that allows that: **decide, act, look, decide again.** It also allows recovery: if a tool returns an error, the next turn can try something else." },
        { type: "check", question: "If every task needed exactly one known tool call, would we need a loop?", answer: "No. A single function-calling round trip (or even a fixed workflow) would do. The loop exists because the number and choice of steps depend on intermediate results, which we cannot know in advance." }
      ]
    },
    {
      id: "think-act-observe",
      title: "The think-act-observe cycle",
      blocks: [
        { type: "p", text: "Each pass through the loop is one **think-act-observe** cycle:" },
        { type: "flow", title: "One cycle of the agent loop", loop: true,
          nodes: [
            { label: "Think", detail: "The model reads the goal, instructions, and full history, and reasons about what is missing. Some models show this reasoning; others keep it internal." },
            { label: "Act", detail: "The model emits a tool call (or several). Our loop code executes them, with validation and permission checks." },
            { label: "Observe", detail: "The tool output, or the error, is turned into a tool-result message and appended to the history." },
            { label: "Check stop", detail: "If the model gave a final answer, or a limit was reached, exit. Otherwise go round again." }
          ] },
        { type: "p", text: "Observation is what makes this different from a model just writing a long plan. The model gets **grounded feedback from the real world** after each action, so a mistake in step 2 can be noticed and corrected in step 3." },
        { type: "viz", name: "agent-loop", caption: "Step through an agent trace. Each loop turn adds a model message and a tool result to the log; the loop ends when the model answers without a tool call." }
      ]
    },
    {
      id: "loop-step-by-step",
      title: "The loop step by step",
      blocks: [
        { type: "steps", title: "What the loop code does on every run",
          items: [
            { title: "Initialise", text: "Build the message list: system prompt (role, rules), the user's goal, and the tool definitions. Set counters: steps = 0, tokens used = 0." },
            { title: "Call the model", text: "Send the whole message list. The model is stateless, so it must see the full history every time." },
            { title: "Inspect the reply", text: "No tool calls? It is the final answer: return it. Tool calls present? Append the assistant message to the history and continue." },
            { title: "Execute tools", text: "For each call: validate arguments, check permissions, run with a timeout, and catch exceptions. Turn the result or error into text." },
            { title: "Append observations", text: "Add one tool-result message per call, linked by call id, in order." },
            { title: "Enforce limits", text: "Increase counters. If steps, time, tokens or cost exceed the budget, stop and return a partial answer or an explanation." },
            { title: "Repeat", text: "Go back to “Call the model”." }
          ] },
        { type: "p", text: "Because the full history is re-sent on every call, the input grows each turn. If each step adds about the same amount of text, the **total** input tokens processed grows roughly with the square of the number of steps. Prompt caching (covered in the inference module) reduces the price of the repeated prefix, but long loops are still expensive." },
        { type: "chart", kind: "area", title: "Cumulative input tokens across a loop", xLabel: "Loop step", yLabel: "Total input tokens sent",
          series: [ { name: "Cumulative input", points: [[1, 500], [2, 1300], [3, 2400], [4, 3800], [5, 5500], [6, 7500], [7, 9800], [8, 12400], [9, 15300], [10, 18500]] } ],
          caption: "Illustrative: a 500-token start and 300 new tokens per step. Step k sends 500 + 300(k−1) tokens, so 10 steps send 18,500 in total, not 10 × 500." }
      ]
    },
    {
      id: "loop-in-code",
      title: "The loop in real code",
      blocks: [
        { type: "p", text: "Here is the shape of the loop against a real API, written with the Anthropic Python SDK. Other SDKs look very similar; only field names change. It needs an API key, so it has no output shown; the runnable version follows." },
        { type: "code", lang: "python", title: "agent_loop_real_api.py (shape only)", code: `import anthropic
client = anthropic.Anthropic()          # reads ANTHROPIC_API_KEY

def run_agent(goal, tools, run_tool, max_steps=10):
    messages = [{"role": "user", "content": goal}]
    for _ in range(max_steps):
        resp = client.messages.create(model=MODEL, max_tokens=1024,
                                      tools=tools, messages=messages)
        messages.append({"role": "assistant", "content": resp.content})
        if resp.stop_reason != "tool_use":          # no tool needed: done
            return "".join(b.text for b in resp.content if b.type == "text")
        results = []
        for block in resp.content:                  # may be several calls
            if block.type == "tool_use":
                try:
                    out = run_tool(block.name, block.input)
                except Exception as e:              # errors become observations
                    out = f"error: {e}"
                results.append({"type": "tool_result",
                                "tool_use_id": block.id, "content": str(out)})
        messages.append({"role": "user", "content": results})
    return "Stopped: step limit reached."`,
          walkthrough: [
            { lines: [4, 5], note: "The loop function takes the goal, the tool definitions, a function that actually runs tools, and a step budget." },
            { lines: [6, 9], note: "Each turn: call the model with the full history, then append its reply (which may contain tool_use blocks)." },
            { lines: [10, 11], note: "Stop condition: if the model did not stop to use a tool, its text is the final answer." },
            { lines: [12, 20], note: "Run every requested tool. Exceptions are caught and sent back as text, so the model can recover instead of the loop crashing." },
            { lines: [21, 22], note: "All results go back in one message; then the loop repeats. If the budget runs out, return a clear message." }
          ] },
        { type: "p", text: "And here is a runnable, offline version that focuses on the loop's control logic. The “model” is a scripted list of turns, so we can see three runs end in three different ways." },
        { type: "code", lang: "python", title: "loop_stop_conditions.py", code: `# An agent loop with three stop conditions and parallel tool calls.
def lookup_price(item): return {"apple": 3, "bread": 5, "milk": 4}[item]
TOOLS = {"lookup_price": lookup_price}

def run(script, max_steps=4):
    history, seen = [], set()
    for step in range(1, max_steps + 1):
        turn = script[min(step - 1, len(script) - 1)]   # the "LLM" output
        if "final" in turn:                              # stop 1: model is done
            return f"done at step {step}: {turn['final']}"
        results = []
        for name, arg in turn["calls"]:                  # may be several (parallel)
            key = (name, arg)
            if key in seen:                              # stop 2: stuck repeating
                return f"aborted at step {step}: repeated {name}({arg})"
            seen.add(key)
            results.append(TOOLS[name](arg))
        history.append(results)                          # observations go back in
        print(f"  step {step}: {turn['calls']} -> {results}")
    return f"stopped: hit max_steps={max_steps}"         # stop 3: budget

good = [{"calls": [("lookup_price", "apple"), ("lookup_price", "bread"),
                   ("lookup_price", "milk")]},
        {"final": "total is 12"}]
stuck = [{"calls": [("lookup_price", "apple")]}]          # repeats forever
wander = [{"calls": [("lookup_price", x)]} for x in ["apple", "bread", "milk", "apple"]]
for name, script in [("good", good), ("stuck", stuck), ("wander", wander)]:
    print(name)
    print(" ", run(script, max_steps=3 if name == "wander" else 4))`, output: `good
  step 1: [('lookup_price', 'apple'), ('lookup_price', 'bread'), ('lookup_price', 'milk')] -> [3, 5, 4]
  done at step 2: total is 12
stuck
  step 1: [('lookup_price', 'apple')] -> [3]
  aborted at step 2: repeated lookup_price(apple)
wander
  step 1: [('lookup_price', 'apple')] -> [3]
  step 2: [('lookup_price', 'bread')] -> [5]
  step 3: [('lookup_price', 'milk')] -> [4]
  stopped: hit max_steps=3`,
          walkthrough: [
            { lines: [2, 3], note: "One tool: a price lookup." },
            { lines: [5, 8], note: "The loop. `turn` is what the model would return at this step; `seen` remembers every (tool, argument) pair already called." },
            { lines: [9, 10], note: "Stop 1, the normal exit: the model gives a final answer." },
            { lines: [11, 17], note: "Execute every call in this turn (parallel calls). Stop 2: if the model repeats an identical call, it is probably stuck, so abort." },
            { lines: [18, 20], note: "Append observations and continue. Stop 3: if the loop runs out of steps, return a clear “budget” message." },
            { lines: [22, 29], note: "Three scripted behaviours: a good run with parallel calls, a stuck run, and a wandering run that never finishes." }
          ] },
        { type: "check", question: "In the output, why did the “good” run finish in only 2 steps even though it needed three prices?", answer: "Because step 1 contained three parallel tool calls, all executed in the same turn. Step 2 was the final answer. Without parallel calls it would have needed 4 steps (3 lookups + 1 answer)." }
      ]
    },
    {
      id: "parallel-tool-calls",
      title: "Parallel tool calls in one turn",
      blocks: [
        { type: "p", text: "When a model returns several tool calls in one reply, the loop should handle all of them before calling the model again. Two practical rules:" },
        { type: "list", items: [
          "**Run independent calls concurrently** (threads, async, or a worker pool). Three 1-second API calls then take about 1 second, not 3.",
          "**Return every result, in the matching order and with the matching ids**, in the next message. If one call fails, still send its error as its result; never drop it."
        ] },
        { type: "callout", tone: "warn", title: "Careful with side effects", text: "Parallel is safe for reads (lookups, searches). For writes that depend on each other (create a folder, then a file inside it), running them at the same time can break things. Many APIs let you turn parallel tool calls off, or the loop can run calls one by one when a tool is marked as having side effects." }
      ]
    },
    {
      id: "when-to-stop",
      title: "How the loop knows when to stop",
      blocks: [
        { type: "p", text: "A loop without good exits is the most common source of runaway cost. A well-built loop has several independent stop conditions:" },
        { type: "compare", title: "Stop conditions",
          options: [
            { name: "Natural finish", summary: "The model replies without any tool call.", pros: ["The normal, desired exit"], cons: ["Model may stop too early or claim success falsely"], bestFor: "Every loop (primary exit)" },
            { name: "Hard budgets", summary: "Max steps, max tokens, max cost, wall-clock timeout.", pros: ["Guarantees termination", "Caps spending"], cons: ["May cut off a run that was nearly done"], bestFor: "Every loop (safety net)" },
            { name: "Stuck detection", summary: "Abort or nudge when the same call repeats or no progress is made.", pros: ["Catches loops early, saving budget"], cons: ["Needs a definition of “progress”"], bestFor: "Long-running agents" },
            { name: "Explicit done tool / human", summary: "A `finish(answer)` tool, or a human approval gate.", pros: ["Clear signal; can require a structured result"], cons: ["Extra tool for the model to learn"], bestFor: "Workflows needing a structured final output" }
          ],
          rows: [
            ["Who triggers it", "Model", "Loop code", "Loop code", "Model or human"],
            ["Required?", "Yes", "Yes", "Recommended", "Optional"]
          ],
          verdict: "Always combine a natural finish with hard budgets. Add stuck detection and verification for anything long-running or expensive." },
        { type: "p", text: "A good loop also tells the model about its limits, for example: “You have 10 steps. If you cannot finish, summarise what you found.” When a budget is hit, return a helpful partial result rather than an empty failure." }
      ]
    },
    {
      id: "loop-failures",
      title: "Common loop failures",
      blocks: [
        { type: "table", caption: "Loop failure modes and fixes",
          head: ["Failure", "Symptom", "Fix"],
          rows: [
            ["Infinite loop", "Same search repeated with tiny variations.", "Max steps, duplicate-call detection, tell the model what it already tried."],
            ["Lost tool results", "API error about a tool call without a result.", "Always append exactly one result per call id, even on error."],
            ["Crash on tool error", "One bad argument kills the whole run.", "Catch exceptions; return the error text as the observation."],
            ["Context overflow", "Long runs exceed the context window or slow down.", "Truncate or summarise old tool outputs; keep large data out of the prompt."],
            ["Premature finish", "Model answers before verifying (e.g. says tests pass without running them).", "Require evidence: a check tool, or a verification step before finishing."],
            ["Huge observations", "A tool returns a 2 MB file into the prompt.", "Cap result size; return summaries or pages with a pointer to the rest."]
          ] },
        { type: "callout", tone: "warn", title: "The most expensive bug", text: "No step limit plus a tool that keeps erroring. The model retries forever, and each retry re-sends the growing history. Every production loop needs a hard cap on steps and cost, no matter how good the model is." },
        { type: "p", text: "**Quick summary.** The agent loop is a simple `while` loop: call the model, run requested tools, append results, repeat. Each pass is a think-act-observe cycle. The model decides; the loop executes and enforces rules. Handle parallel calls together, never drop a result, turn errors into observations, and always pair the natural finish with hard budgets and stuck detection." }
      ]
    }
  ],
  quiz: [
    { q: "What normally signals that an agent loop should end with success?", options: ["The model replies without requesting any tool call", "The tool list becomes empty after every tool has been used", "The history grows until it reaches the context window limit", "A tool returns an error, so there is nothing left to try"], answer: 0, explain: "The natural exit is a model reply with no tool calls, meaning it is giving the final answer. Hitting the context limit or tool errors are failure paths that should be handled, not success signals." },
    { q: "An agent keeps calling `search(\"refund policy\")` over and over and the bill is climbing. Which loop change addresses this most directly?", options: ["Raise the temperature so the model tries a different search query", "Add duplicate-call detection plus a hard max-step and cost budget", "Remove the system prompt so the model has fewer rules to satisfy", "Run the tools in parallel so repeated searches finish sooner"], answer: 1, explain: "Stuck detection catches repeated identical calls early, and hard budgets guarantee termination. Temperature or parallelism do not stop a loop." },
    { q: "Each step adds 300 tokens to a history that starts at 500 tokens. How many input tokens does step 4 send to the model?", options: ["500", "1,200", "1,400", "3,800"], answer: 2, explain: "Step k sends 500 + 300(k−1). For k = 4: 500 + 900 = 1,400. The 3,800 figure is the cumulative total over steps 1–4." },
    { q: "How do the model and the loop code divide the work?", options: ["The loop decides which tool to call next; the model executes that tool", "The model decides the next step; the loop runs the tools and enforces limits", "The model and the loop vote together on each step before any tool runs", "The model runs the tools directly; the loop code only logs what happened"], answer: 1, explain: "The model is the probabilistic decision maker. The loop is deterministic code that executes, records results and enforces safety rules." },
    { q: "Which belief about parallel tool calls is a misconception?", options: ["Independent read-only calls can safely run concurrently with each other", "Each parallel call still needs its own matching result message in history", "If one parallel call fails, we can drop it and send back only the successes", "Parallel calls reduce the number of model round trips a task needs"], answer: 2, explain: "Every tool call needs a matching result, including failures (send the error as the result). Dropping one breaks the history and hides the problem from the model." }
  ],
  takeaways: [
    "The agent loop is a short while-loop: call the model, run requested tools, append results, repeat.",
    "Each pass is a think-act-observe cycle; observations let the agent react to real results.",
    "The model decides; the deterministic loop executes, validates, and enforces budgets.",
    "Always combine the natural finish with hard limits (steps, tokens, cost, time) and stuck detection.",
    "Turn errors into observations, return a result for every call, and cap the size of tool outputs."
  ],
  terms: [
    { term: "Agent loop", def: "The repeating code that calls the model, executes requested tools, and feeds results back until a stop condition." },
    { term: "Turn (step)", def: "One iteration of the loop: one model call plus execution of any tool calls it returned." },
    { term: "Think-act-observe", def: "The cycle inside each turn: reason about the next move, take an action with a tool, read the result." },
    { term: "Stop condition", def: "A rule that ends the loop, such as a final answer, a step budget, or stuck detection." },
    { term: "Stuck detection", def: "Checks that notice the agent repeating itself or making no progress, and stop or redirect it." },
    { term: "Budget", def: "A hard limit on steps, tokens, money or time that guarantees the loop terminates." }
  ]
};
