export default {
  id: "what-is-loop-engineering",
  minutes: 26,
  hook: "Why does an agent that is clever on every single step still sometimes run in circles for fifty steps, or stop after two and proudly announce a job it never did?",
  summary: "An AI agent works by running a loop: look at the situation, pick an action, run it, look at the result, and repeat. Loop engineering is the practice of designing that repeating cycle on purpose: what the model sees each turn, how actions run, how progress is tracked, and above all when and how the loop stops. Most agent failures are loop failures, and a handful of techniques (budgets, verification, loop detection, context trimming, recovery) fix most of them.",
  sections: [
    {
      id: "what-is-loop-engineering",
      title: "What is loop engineering? Loop + engineering",
      blocks: [
        { type: "p", text: "Split the name in two. A **loop** is a cycle that runs again and again: in an AI agent, one turn of the loop is “the model looks at everything so far, chooses an action, the action runs, the result is added to what the model will see next”. **Engineering** means designing something deliberately, with limits, measurements and failure handling, instead of hoping it works." },
        { type: "p", text: "So **loop engineering** is the deliberate design of the cycle an agent repeats until a task is truly finished. It is one part of the bigger harness (the previous lesson): the harness is all the code around the model; the loop is the beating heart of that code." },
        { type: "callout", tone: "analogy", title: "Think of a cook tasting a soup", text: "A good cook does not add salt once and serve. They taste, adjust, taste again, and stop when it is right, or when dinner time arrives and they serve the best version so far. A bad cook either never stops adjusting, or serves without tasting. Loop engineering is teaching the agent to taste, to adjust sensibly, and to know when to stop." },
        { type: "p", text: "Our running example: a **coding agent** asked to “make the failing test in `utils.py` pass”. Each turn it may run tests, read a file, edit a file, or declare that it is done." }
      ]
    },
    {
      id: "why-loop-engineering",
      title: "Why do we need loop engineering?",
      blocks: [
        { type: "p", text: "A single model call is like a single move in a game. Real tasks need many moves, and each move depends on what the previous one revealed. That is why agents loop. But loops multiply risk: if each step has a small chance of going wrong, a long chain of steps has a large chance that *something* goes wrong." },
        { type: "p", text: "A simple illustrative calculation: if each step is right 95% of the time and steps were independent, a 20-step task would be fully right only about 0.95²⁰ ≈ 36% of the time. Real steps are not independent, but the lesson holds: without checks and recovery, long loops decay. Loop engineering exists to stop small errors from compounding." },
        { type: "chart", kind: "line", title: "Chance that every step goes right", xLabel: "Number of steps", yLabel: "Probability", series: [
          { name: "99% per step", points: [[1, 0.99], [5, 0.95], [10, 0.904], [20, 0.818], [30, 0.74], [50, 0.605]] },
          { name: "95% per step", points: [[1, 0.95], [5, 0.774], [10, 0.599], [20, 0.358], [30, 0.215], [50, 0.077]] }
        ], caption: "Illustrative: pᵏ for independent steps. Verification and recovery inside the loop break this decay because errors get caught and fixed instead of carried forward." },
        { type: "p", text: "The second reason is cost. Every turn re-sends the growing conversation to the model. A loop that runs 3× longer than needed costs far more than 3×, because later turns carry more tokens. A loop with no stop rule can burn a budget overnight." }
      ]
    },
    {
      id: "what-is-a-loop",
      title: "What is a loop in an AI agent?",
      blocks: [
        { type: "p", text: "Almost every modern agent, from coding assistants to research agents, runs the same basic cycle. It is often called the **agent loop** or the **ReAct** pattern (reason + act)." },
        { type: "viz", name: "agent-loop", caption: "Step through one agent run. Each lap is one turn: the model thinks, requests a tool, the harness runs it, and the observation is appended to the message log." },
        { type: "steps", title: "One turn of the loop", items: [
          { title: "Observe", text: "Build the input for this turn: the goal, the instructions, the history of actions and results so far, and any fresh information." },
          { title: "Decide", text: "Call the model. It returns either a tool call (an action with arguments) or a final answer." },
          { title: "Act", text: "The harness runs the requested tool: run tests, read a file, search, call an API." },
          { title: "Record", text: "The result (output, or an error) is added to the history, so the next turn can see it." },
          { title: "Check", text: "Should we stop? The task may be verified done, a budget may be used up, or the agent may be stuck. If none of these, start the next turn." }
        ] }
      ]
    },
    {
      id: "simplest-loop",
      title: "The simplest loop and its problems",
      blocks: [
        { type: "p", text: "Here is the loop most people write first:" },
        { type: "code", lang: "python", title: "naive_loop.py (do not ship this)", code: `history = [goal]
while True:
    reply = model(history)
    if reply.is_final_answer:
        break                      # stop when the MODEL says it is done
    result = run_tool(reply.tool, reply.args)
    history.append(result)         # history grows forever` },
        { type: "p", text: "It looks fine and works in demos. In real use it has four hidden problems:" },
        { type: "list", items: [
          "**No upper bound.** `while True` with no step or cost limit can run forever if the model never says “final answer”.",
          "**The model decides when it is done.** Models sometimes declare success too early (“I fixed it!”) without running the tests. The stop rule trusts the very thing we are unsure about.",
          "**History grows without limit.** After many turns the history no longer fits in the context window, or important early facts get buried and ignored.",
          "**No handling of errors or stuck states.** A tool crash ends the program, and an agent that keeps repeating the same failing action is never noticed."
        ] },
        { type: "check", question: "In the naive loop, which single line is responsible for the “declares success without doing the work” failure?", answer: "`if reply.is_final_answer: break`. The loop stops whenever the model claims to be done. A better rule stops only when an independent check (for example, the test suite) confirms the goal is met." }
      ]
    },
    {
      id: "parts-to-engineer",
      title: "The parts of the loop that we must engineer",
      blocks: [
        { type: "p", text: "Every turn has a few decision points. Each is a place where we choose behaviour on purpose:" },
        { type: "table", caption: "Design decisions inside the loop, with the coding-agent example.", head: ["Part", "Question we answer", "Coding agent example"], rows: [
          ["Turn input", "What does the model see this turn?", "Goal, last test output, files read so far, a short progress note"],
          ["Action space", "Which actions are allowed?", "`run_tests`, `read`, `edit`, `say_done`; no `delete`"],
          ["Tool execution", "How are actions run and limited?", "Sandbox, 60 s timeout, output cut to 4,000 characters"],
          ["Observation format", "How are results shown back?", "Only the failing test names and the first error, not 2,000 lines of logs"],
          ["Progress tracking", "How do we know we are moving forward?", "Number of failing tests per turn; a to-do list the agent updates"],
          ["Stop conditions", "When does the loop end?", "Tests pass (verified), or 30 steps, or $1 spent, or stuck"],
          ["Recovery", "What happens after an error or a stuck state?", "Feed the error back once; after 2 repeats, nudge or escalate to a human"]
        ] },
        { type: "callout", tone: "tip", title: "Three kinds of stop", text: "A healthy loop has a **success stop** (an external check says done), a **budget stop** (steps, time, tokens or money run out) and a **stuck stop** (no progress or repeated actions). Most broken loops are missing at least one of the three." }
      ]
    },
    {
      id: "prompt-context-loop",
      title: "Prompt vs context vs loop engineering",
      blocks: [
        { type: "compare", title: "Three things we can engineer around an LLM", options: [
          { name: "Prompt engineering", summary: "Choose the right words for one model call.", pros: ["Quick to iterate", "No extra infrastructure"], cons: ["Covers a single call only", "Cannot fix multi-step failures"], bestFor: "Single-shot tasks: classify, rewrite, extract" },
          { name: "Context engineering", summary: "Choose what information is in the window for each call.", pros: ["Right facts at the right time", "Controls cost and focus"], cons: ["Says nothing about when to stop or how to recover"], bestFor: "RAG, long chats, deciding what each turn sees" },
          { name: "Loop engineering", summary: "Design the repeating cycle: actions, checks, budgets, recovery and stopping.", pros: ["Makes multi-step agents finish reliably", "Bounds cost and time"], cons: ["Needs a checkable definition of done", "More code to test"], bestFor: "Agents that take many actions toward a goal" }
        ], rows: [
          ["Time scale", "One call", "One call (repeated)", "The whole run"],
          ["Main question", "How do I ask?", "What should it see?", "What happens next, and when do we stop?"],
          ["Typical failure fixed", "Misunderstood instruction", "Missing or buried facts", "Endless loops, early “done”, error spirals"]
        ], verdict: "They stack: good prompts and good context inside each turn, and good loop design across turns. Loop engineering uses context engineering at every turn." }
      ]
    },
    {
      id: "how-loops-break",
      title: "Common ways a loop breaks",
      blocks: [
        { type: "list", items: [
          "**Infinite loop:** the stop condition is never met. Often because “done” is fuzzy or the model never says it.",
          "**Repetition:** the agent repeats the same action (re-reading the same file, re-running the same failing command) because nothing tells it that it already tried.",
          "**Premature success:** the agent declares done without checking, or after a check that does not really test the goal.",
          "**Context overflow:** history grows until it exceeds the window or the important parts get lost in the middle.",
          "**Error spiral:** one tool error leads to a confused fix, which causes another error, and so on.",
          "**Goal drift:** after many turns the agent starts solving a different problem (refactoring code nobody asked about).",
          "**Cost runaway:** each turn is affordable, but the run takes 200 turns."
        ] },
        { type: "callout", tone: "warn", title: "The most expensive mistake", text: "Letting the model be the only judge of “done”. It is the root of both premature success and, in the other direction, endless polishing. Always pair the model's claim with an outside check whenever one exists." }
      ]
    },
    {
      id: "techniques",
      title: "Techniques of loop engineering",
      blocks: [
        { type: "steps", title: "Fixes, matched to the failures above", items: [
          { title: "Budgets", text: "Hard caps on steps, wall-clock time, tokens and money. When a cap hits, stop and report the best result so far rather than crash. This bounds infinite loops and cost runaways." },
          { title: "Verified stopping", text: "Done means an external check passed: tests green, schema valid, API returned success. The model can *propose* done; the checker *confirms* it. This fixes premature success." },
          { title: "Loop and repetition detection", text: "Keep a short memory of recent actions. If the same action with the same arguments appears N times, intervene: tell the model it already tried that, change strategy, or stop." },
          { title: "Context management", text: "Summarise or drop old turns, keep tool outputs short, and keep a running progress note (goal, what is done, what is next) at the top. This fixes overflow and drift." },
          { title: "Error recovery", text: "Show errors to the model in a readable form, retry transient failures automatically, and after a few failed attempts escalate to a human instead of spiralling." },
          { title: "Checkpoints and logs", text: "Save state after each turn so a long run can resume after a crash, and log every turn so we can see where loops go wrong." }
        ] },
        { type: "check", question: "An agent re-runs `npm test` five times in a row with the same failing result. Which two techniques address this most directly?", answer: "Repetition detection (notice the identical action and intervene) and error recovery (after a few failures, change approach or escalate). A step budget would also stop it eventually, but only after wasting turns." }
      ]
    },
    {
      id: "complete-example",
      title: "A complete example",
      blocks: [
        { type: "p", text: "Below is a small but complete engineered loop for our coding agent. The “model” is scripted so the run is repeatable, and it deliberately makes two classic mistakes: running tests before doing anything, and repeating the same edit. Watch how the loop handles both." },
        { type: "code", lang: "python", title: "engineered_loop.py", code: `# A scripted "model" that proposes one action per turn for: make tests pass.
script = ["run_tests", "read utils.py", "edit utils.py", "edit utils.py",
          "edit utils.py", "run_tests", "say done"]

def fake_model(turn):
    return script[turn] if turn < len(script) else "say done"

def tests_pass(state):
    return state["edits"] >= 1          # the real check: one correct edit fixes it

def run_loop(max_steps=6, max_repeats=2):
    state, history = {"edits": 0}, []
    for step in range(max_steps):
        action = fake_model(step)
        # Guard 1: stop a repeating action before it burns budget
        if history[-max_repeats:] == [action] * max_repeats:
            print(f"step {step}: {action!r} repeated, nudging model")
            history.append("nudge"); continue
        history.append(action)
        if action.startswith("edit"):
            state["edits"] += 1
        print(f"step {step}: {action}")
        # Guard 2: done means the checker says done, not the model
        if action == "say done" or action == "run_tests":
            if tests_pass(state):
                return f"finished in {step + 1} steps (tests pass)"
            print("         tests fail -> keep going")
    return f"stopped: step budget of {max_steps} used up"

print(run_loop())`, output: `step 0: run_tests
         tests fail -> keep going
step 1: read utils.py
step 2: edit utils.py
step 3: edit utils.py
step 4: 'edit utils.py' repeated, nudging model
step 5: run_tests
finished in 6 steps (tests pass)`, walkthrough: [
          { lines: [1, 6], note: "A scripted model so the output is deterministic. A real agent would call an LLM here with the history." },
          { lines: [8, 9], note: "The definition of done lives outside the model: here, the tests pass after at least one edit." },
          { lines: [11, 13], note: "The budget stop: a `for` loop with `max_steps` instead of `while True`." },
          { lines: [15, 17], note: "Repetition detection: if the last two actions equal this one, we skip it and nudge the model instead of letting it edit the same file a third time." },
          { lines: [22, 26], note: "Verified stopping: when the model runs tests or says done, the loop asks the real checker. A failing check keeps the loop going." },
          { lines: [27, 27], note: "If the budget runs out, we stop with a clear message instead of looping forever." }
        ] },
        { type: "p", text: "In six steps the loop survived an early test run (it simply kept going), blocked a third identical edit, and stopped only when the checker confirmed success. Change `max_steps` to 4 and the same script ends with “step budget used up”, which is also a correct, safe outcome." }
      ]
    },
    {
      id: "worked-cost-of-long-loops",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "Earlier we said that a loop running 3× longer costs far more than 3×. Let us check that with small numbers. Suppose the first turn sends 500 tokens (goal, instructions, tools), and each turn adds 300 tokens of action and result to the history. All numbers are illustrative." },
        { type: "steps", title: "Adding up the tokens", items: [{ title: "Tokens per turn", text: "Turn 1 sends 500, turn 2 sends 800, turn 3 sends 1,100. Turn n sends 500 + 300 × (n − 1)." }, { title: "A 5-turn run", text: "500 + 800 + 1,100 + 1,400 + 1,700 = 5,500 tokens." }, { title: "A 15-turn run", text: "The turns grow from 500 up to 4,700. Their sum is 39,000 tokens." }, { title: "Compare", text: "3× the turns, but 39,000 ÷ 5,500 ≈ 7.1× the tokens. The cost of a run grows roughly with the square of its length." }, { title: "Now cap the history", text: "If we trim or summarize so that no turn sends more than 1,400 tokens, the 15-turn run costs 19,200 tokens: about half." }] },
        { type: "chart", kind: "line", title: "Total tokens sent over one run", xLabel: "Turns", yLabel: "Cumulative tokens", series: [{ name: "History grows every turn", points: [[1, 500], [5, 5500], [10, 18500], [15, 39000], [20, 67000]] }, { name: "History capped at 1,400 tokens", points: [[1, 500], [5, 5200], [10, 12200], [15, 19200], [20, 26200]] }], caption: "Illustrative: 500 tokens on turn 1, plus 300 more on each later turn. Computed with the sums from the steps above." },
        { type: "p", text: "Two lessons follow. A step budget alone is a weak cost limit, because late steps cost much more than early ones; a token budget measures what we really pay. And context management is not only about quality: it turns a curve that bends upward into a straight line." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build a loop with all three stops: a success stop from a checker, a budget stop measured in tokens, and a stuck stop that fires when the number of failing tests has not improved for two turns. The model's results are scripted as failing-test counts." },
        { type: "code", lang: "python", title: "practice_three_stops.py", code: `# Three stops in one loop: verified success, token budget and no progress.
def run(failing_per_turn, token_budget=6000, patience=2):
    history, spent, best, stale = 500, 0, None, 0
    for turn, failing in enumerate(failing_per_turn, 1):
        spent += history                   # each turn re-sends the whole history
        history += 300                     # and the new result makes it longer
        if best is None or failing < best:
            best, stale = failing, 0       # progress: fewer failing tests
        else:
            stale += 1                     # no progress this turn
        print(f"  turn {turn}: failing={failing} spent={spent} stale={stale}")
        if failing == 0:
            return "success stop: the checker reports 0 failing tests"
        if stale >= patience:
            return f"stuck stop: no progress for {patience} turns (best={best})"
        if spent + history > token_budget:
            return f"budget stop: the next turn would pass {token_budget} tokens"
    return "script ended"

# Failing-test counts that a model's edits might produce, turn by turn
for name, script in [("steady", [5, 3, 3, 1, 0]),
                     ("stuck", [5, 4, 4, 4, 2, 0]),
                     ("slow", [5, 4, 3, 2, 2, 1, 1, 0])]:
    print(name)
    print(" ", run(script))`, output: `steady
  turn 1: failing=5 spent=500 stale=0
  turn 2: failing=3 spent=1300 stale=0
  turn 3: failing=3 spent=2400 stale=1
  turn 4: failing=1 spent=3800 stale=0
  turn 5: failing=0 spent=5500 stale=0
  success stop: the checker reports 0 failing tests
stuck
  turn 1: failing=5 spent=500 stale=0
  turn 2: failing=4 spent=1300 stale=0
  turn 3: failing=4 spent=2400 stale=1
  turn 4: failing=4 spent=3800 stale=2
  stuck stop: no progress for 2 turns (best=4)
slow
  turn 1: failing=5 spent=500 stale=0
  turn 2: failing=4 spent=1300 stale=0
  turn 3: failing=3 spent=2400 stale=0
  turn 4: failing=2 spent=3800 stale=0
  turn 5: failing=2 spent=5500 stale=1
  budget stop: the next turn would pass 6000 tokens`, walkthrough: [{ lines: [3, 6], note: "The cost model: every turn re-sends the whole history, and the history grows by 300 tokens per turn." }, { lines: [7, 10], note: "Progress tracking: fewer failing tests than ever before resets the `stale` counter; anything else raises it." }, { lines: [12, 17], note: "The three stops, in order: verified success, stuck, and a budget check that looks one turn ahead." }, { lines: [20, 25], note: "Three scripted runs: one that improves steadily, one that gets stuck, and one that is too slow for the budget." }] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: ["Set `patience=1`. Predict which of the three runs end differently, and at which turn.", "Set `token_budget=20000`. Predict how the `slow` run ends and its final `spent`.", "Change `history += 300` to `history += 0`, as if we held the context at a fixed size. Predict `spent` at turn 5, and how the `slow` run ends now."] },
        { type: "check", question: "In the `stuck` script the counts are 5, 4, 4, 4, 2, 0, so the tests would have passed at turn 6. The loop stopped at turn 4. Was that a mistake?", answer: "It is a trade-off, not a bug. At turn 4 the loop knows only that two turns in a row brought no progress; it cannot see the future. With `patience=2` we accept that some slow but working runs get cut, in return for never paying for runs that are truly stuck. If two-turn plateaus are normal for our task, we raise the patience. A good stuck stop also hands over the best state so far, so the work is not lost." },
        { type: "check", question: "The budget stop fires when `spent + history > token_budget`, before the next turn runs, and not after `spent` has passed the budget. Why check ahead?", answer: "Because the cost of the next turn is already known: it will re-send the whole history. Checking ahead means we never overshoot, and we stop while there is still a clean state to report. Checking afterwards would let the most expensive turn of the run, the last one, go over the limit." }
      ]
    },
    {
      id: "where-it-works",
      title: "Where it works well and where it fails",
      blocks: [
        { type: "p", text: "Loop engineering shines when **progress is checkable**: code with tests, data pipelines with validation, form filling with a schema, search tasks with a clear target. The checker gives the loop a reliable signal for “keep going” vs “stop”." },
        { type: "p", text: "It struggles when **done is a matter of taste**: “write a great marketing email”, “design a nice logo”. Without a reliable check, the loop either stops at the first plausible draft or polishes forever. Here we can still add an LLM judge or a rubric, but that check is itself fuzzy, so we should add a human review step." },
        { type: "p", text: "**When not to loop at all:** if one model call can do the job (translate this paragraph), a loop only adds cost and latency. And when the steps are known in advance and branch in fixed ways, a predefined **graph** of steps is often clearer than a free-form loop; that is the topic of the next lesson." },
        { type: "callout", tone: "example", title: "In real products", text: "Coding agents such as Claude Code and Cursor's agent run exactly this kind of loop: they read, edit and run tests or commands, feed results back, and are bounded by permissions, limits and user interruption. Research agents loop over search and reading with a budget on the number of searches." }
      ]
    }
  ],
  quiz: [
    { q: "What is loop engineering mainly concerned with?", options: ["Choosing the best wording and examples for a single prompt", "Designing an agent's repeating cycle, its checks and when it stops", "Training a model so that it produces longer, more detailed answers", "Building and tuning the vector index used for retrieval"], answer: 1, explain: "Loop engineering is about the cycle across turns: actions, observations, progress, recovery and stop conditions. Wording a single prompt is prompt engineering." },
    { q: "Our coding agent often says “All tests pass!” but CI later shows failures. Which change fixes this most directly?", options: ["Ask the model more politely in the prompt to double-check its work", "Increase the step budget so the agent has more turns to finish", "Stop only when the harness runs the tests and they pass", "Use a higher temperature so the agent explores more fixes"], answer: 2, explain: "This is premature success. The fix is verified stopping: the model may propose done, but an external check confirms it. More steps or politeness do not create a check." },
    { q: "If each step of an agent is independently right with probability 0.95, roughly how likely is a 20-step run to be right on every step?", options: ["About 95%", "About 75%", "About 36%", "About 5%"], answer: 2, explain: "0.95²⁰ ≈ 0.36. This illustrative decay is why loops need verification and recovery rather than trusting every step." },
    { q: "How is loop engineering different from context engineering?", options: ["Context: what one call sees. Loop: what happens across calls and when to stop", "They are two names for exactly the same practice used by different teams", "Loop engineering is about training; context engineering is about inference", "Context engineering is mainly about stop conditions and step budgets"], answer: 0, explain: "Context engineering works within each call. Loop engineering works across the whole run, and it uses context engineering at every turn." },
    { q: "Which statement about the naive `while True` loop is a misconception?", options: ["It has no upper bound on steps or on cost", "Its history can grow beyond the context window", "It lets the model alone decide when it is done", "It is safe if the model is strong enough"], answer: 3, explain: "Even a very strong model sometimes stops early or repeats itself; without budgets, verification and recovery, the loop is unsafe regardless of model quality." }
  ],
  takeaways: [
    "An agent is a model in a loop: observe, decide, act, record, check.",
    "Small per-step error rates compound over long loops, so loops need checks and recovery.",
    "A healthy loop has three stops: verified success, budget exhausted, and stuck.",
    "Never let the model be the only judge of done when an external check exists.",
    "Repetition detection, context trimming and progress notes fix most long-run failures.",
    "Loops work best where progress is checkable; fuzzy goals need human review."
  ],
  terms: [
    { term: "Agent loop", def: "The repeating cycle in which a model picks an action, the harness runs it, and the result is fed back for the next decision." },
    { term: "Loop engineering", def: "Deliberately designing an agent's loop: turn inputs, actions, progress tracking, recovery and stop conditions." },
    { term: "Stop condition", def: "A rule that ends the loop: verified success, an exhausted budget, or detection that the agent is stuck." },
    { term: "Verified stopping", def: "Ending the loop only when an independent check, not the model's claim, confirms the goal is met." },
    { term: "Budget", def: "A hard limit on steps, time, tokens or money for one run." },
    { term: "Goal drift", def: "When an agent, after many turns, starts working on something other than the original task." }
  ]
};
