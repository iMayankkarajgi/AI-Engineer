export default {
  id: "harness-engineering-in-ai",
  minutes: 25,
  hook: "If two teams use the exact same model and one ships a reliable agent while the other ships a toy, what is actually different between them?",
  summary: "A model on its own only turns text into text. The harness is all the code around it: the instructions, tools, context, memory, loop, safety checks, verification and logs that turn that text engine into a working agent or a trustworthy evaluation. Harness engineering is the practice of designing that surrounding system on purpose, because in practice it decides most of the reliability we see.",
  sections: [
    {
      id: "what-is-a-harness",
      title: "What is a harness in AI?",
      blocks: [
        { type: "p", text: "A large language model (LLM) is a function: text goes in, text comes out. It cannot open a file, call an API, remember yesterday's chat, or notice that it made a mistake. Everything that lets it do those things lives *outside* the model, in ordinary software we write. That surrounding software is called the **harness**." },
        { type: "callout", tone: "analogy", title: "Think of a horse and its harness", text: "A horse is strong, but strength alone does not plough a field. The harness connects that strength to the plough, lets the farmer steer, and stops the horse from running off. The model is the horse; the harness is the straps, reins and plough. A great horse with a broken harness still ploughs nothing." },
        { type: "p", text: "The word also has an older meaning in software: a **test harness** is the code that feeds inputs to a program, collects outputs and checks them. In AI we use the word in both senses. An **agent harness** wraps a model so it can act. An **evaluation harness** wraps a model so we can measure it fairly. Both are code around the model, not the model itself." },
        { type: "formula", expr: "Agent = Model + Harness", where: [["Model", "the trained LLM: predicts the next tokens given a prompt"], ["Harness", "everything else: prompts, tools, context assembly, memory, the loop, permissions, checks, logs"]], caption: "A popular shorthand among agent builders. The model supplies judgement; the harness supplies hands, eyes, memory and brakes." },
        { type: "p", text: "**Harness engineering** is the discipline of designing, building and improving that surrounding system on purpose, with the same care we give to any production software. The term became common in 2025–2026 as teams building coding agents noticed that most of their gains came from changing the harness, not from switching models." },
        { type: "p", text: "Our running example in this lesson: a **support agent for an online shop**. Customers ask things like “Where is order 42?” or “Can I return my kettle?”. The model is good at language. The harness is what lets it look up orders, follow the refund policy, refuse unsafe requests and hand off to a human." }
      ]
    },
    {
      id: "why-harness-engineering",
      title: "Why do we need harness engineering?",
      blocks: [
        { type: "p", text: "A raw model has five gaps that no amount of prompt polishing can close on its own:" },
        { type: "list", items: [
          "**No hands.** It can only write text. To check an order status, something must turn its text into a real API call and feed the result back.",
          "**No memory.** Each request starts from zero. If the customer told us their order number two messages ago, the harness must resend it.",
          "**No sense of finished.** The model will happily say “Done!” when nothing was done. Something outside it must check.",
          "**Unpredictable failures.** APIs time out, outputs come back malformed, the model calls a tool with a wrong argument. Something must catch, retry or recover.",
          "**No brakes.** A model asked to “clean up old orders” could try to delete data. Something must limit what it is allowed to do."
        ] },
        { type: "p", text: "Each gap is filled by a piece of the harness. This is why the same model can feel brilliant in one product and clumsy in another: the products differ mainly in their harnesses. Public coding-agent leaderboards show this too: the same underlying model often scores quite differently depending on the agent scaffold around it (the exact gap varies by benchmark and model, so treat any single number with care)." },
        { type: "callout", tone: "note", title: "Where reliability comes from", text: "The model sets the ceiling of what is possible. The harness decides how close we get to that ceiling, how often, and what happens when we miss." },
        { type: "check", question: "Our support bot sometimes tells customers “I have issued your refund” when no refund was made. Is this a model problem or a harness problem?", answer: "Mostly a harness problem. The model is producing plausible text; the harness let that text reach the customer without checking that a refund tool was actually called and succeeded. A verification step (only claim a refund if the refund API returned success) fixes it regardless of which model we use." }
      ]
    },
    {
      id: "components",
      title: "Components of an AI harness",
      blocks: [
        { type: "p", text: "Different teams split things up differently, but almost every serious harness has these parts:" },
        { type: "table", caption: "The usual building blocks, using our shop support agent as the example.", head: ["Component", "What it does", "Shop support example"], rows: [
          ["Instructions", "The system prompt: role, rules, tone, what to do when unsure", "“You are the support agent for Acme. Never promise refunds over $200 without a human.”"],
          ["Tools", "Functions the model may call, each with a name, description and argument schema", "`get_order(id)`, `start_return(id)`, `handoff_to_human()`"],
          ["Context assembly", "Decides what goes into the prompt each turn: history, retrieved docs, tool results", "Last 10 messages + the return policy section + the order record"],
          ["Memory", "Stores facts across turns or sessions outside the prompt", "Customer's past tickets, saved in a database"],
          ["Control loop", "Runs model → tool → model until a stop condition", "At most 8 steps per customer message"],
          ["Guardrails and permissions", "Blocks unsafe inputs, outputs and actions; asks a human for risky ones", "Refunds over $200 need approval"],
          ["Verification", "Checks results against a definition of done", "Only say “refunded” if `start_return` returned `ok`"],
          ["Error handling", "Retries, timeouts, fallbacks, graceful messages", "Retry the order API twice, then apologise and hand off"],
          ["Observability", "Logs every prompt, tool call, cost and latency", "A trace per ticket that we can replay"]
        ] },
        { type: "flow", title: "How the parts connect on one customer message", loop: false, nodes: [
          { label: "Input guard", detail: "Checks the incoming message for abuse, prompt injection attempts or personal data that must be masked before anything else runs." },
          { label: "Assemble context", detail: "Builds the prompt: system instructions, relevant history, retrieved policy text, and memory about this customer." },
          { label: "Model", detail: "The LLM reads the prompt and either answers or asks to call a tool with specific arguments." },
          { label: "Tool runner", detail: "The harness validates the arguments, checks permissions, runs the real function, and captures the result or error." },
          { label: "Verify", detail: "Compares what happened against the definition of done: did the tool succeed? Does the answer cite the order?" },
          { label: "Output guard + log", detail: "Final safety check on the reply, then everything (prompts, tool calls, cost, time) is written to a trace." }
        ] },
        { type: "callout", tone: "tip", title: "The model only sees what the harness shows it", text: "If a fact is not in the assembled context, the model does not know it. Many “the model is dumb” bugs are really “the harness forgot to include the order record” bugs." }
      ]
    },
    {
      id: "harness-for-agents",
      title: "Harness engineering for AI agents",
      blocks: [
        { type: "p", text: "An **AI agent** is a model running in a loop: it decides an action, the harness performs it, the result comes back, and the model decides again. The loop itself is simple. The engineering is in the details around it." },
        { type: "viz", name: "agent-loop", caption: "Watch the think → call tool → observe cycle. Every arrow in this loop is harness code: parsing the tool call, running it, formatting the result, deciding whether to continue." },
        { type: "steps", title: "One agent turn, as the harness sees it", items: [
          { title: "Build the prompt", text: "Combine system instructions, tool definitions (names, descriptions, JSON schemas), conversation history and fresh context. Trim old material if we are near the context limit." },
          { title: "Call the model", text: "Send the prompt with settings such as temperature and maximum output tokens. Apply a timeout so one slow call cannot hang the whole agent." },
          { title: "Parse the response", text: "Is it a final answer or a tool call? If it is a tool call, validate the arguments against the schema. Invalid arguments become an error message the model can read and fix." },
          { title: "Check permission and run the tool", text: "Read-only tools may run automatically; risky ones (payments, deletes, sending email) may need human approval. Run inside a sandbox where possible." },
          { title: "Feed the result back", text: "Format the tool output (truncate huge outputs, keep errors readable) and append it to the history." },
          { title: "Decide whether to stop", text: "Stop if the task is verified done, if a step or cost budget is used up, or if the agent is stuck repeating itself. Otherwise go round again." }
        ] },
        { type: "p", text: "Notice how little of this is about the model. Tool descriptions, argument validation, output truncation, permissions and stop rules are all harness design choices, and each one changes behaviour. For example, a tool described as `search(q)` with no explanation gets used poorly; the same tool described as “Search orders by customer email or order id. Returns at most 5 matches.” gets used well." },
        { type: "callout", tone: "example", title: "Real-world harnesses", text: "Coding agents such as Claude Code, Cursor's agent and OpenAI's Codex are, at their core, a frontier model plus a carefully engineered harness: file and shell tools, project instruction files, permission prompts, context compaction and test running. Later lessons in this module look at two of them in detail." }
      ]
    },
    {
      id: "harness-for-evaluation",
      title: "Harness engineering for evaluation",
      blocks: [
        { type: "p", text: "The second meaning of harness is about **measurement**. An **evaluation harness** runs a model (or a whole agent) over a fixed set of test cases, scores each output, and reports results in a repeatable way. A well-known open example is EleutherAI's `lm-evaluation-harness`, which runs many public benchmarks with the same prompt formats and scoring rules so that different models can be compared fairly." },
        { type: "p", text: "Why does this need engineering? Because tiny harness choices move scores: how the prompt is formatted, whether answers are compared exactly or after trimming and lower-casing, how many examples are shown, what temperature is used, how timeouts and API errors are counted. Two teams evaluating the same model with different harnesses can report different numbers and both be “right”." },
        { type: "code", lang: "python", title: "eval_harness.py — a tiny evaluation harness", code: `import random
random.seed(7)

def flaky_model(question):
    # Stand-in for an LLM API: sometimes fails, sometimes answers badly.
    if random.random() < 0.2:
        raise TimeoutError("API timeout")
    answers = {"2+2": "4", "capital of France": "Paris", "3*5": "15", "opposite of hot": "cold"}
    return answers.get(question, "I am not sure") if random.random() < 0.85 else "banana"

def call_with_retry(fn, arg, retries=3):
    for attempt in range(1, retries + 1):
        try:
            return fn(arg), attempt
        except TimeoutError:
            continue          # harness absorbs transient errors
    return None, retries

def run_eval(model, cases):
    log, passed = [], 0
    for question, expected in cases:
        answer, attempts = call_with_retry(model, question)
        ok = answer is not None and answer.strip().lower() == expected.lower()
        passed += ok
        log.append((question, answer, attempts, "PASS" if ok else "FAIL"))
    return passed / len(cases), log

cases = [("2+2", "4"), ("capital of France", "paris"), ("3*5", "15"),
         ("opposite of hot", "cold"), ("largest planet", "jupiter")]
score, log = run_eval(flaky_model, cases)
for q, a, n, verdict in log:
    print(f"{verdict}  q={q!r:22} answer={a!r:16} attempts={n}")
print(f"score = {score:.0%}")`, output: `PASS  q='2+2'                  answer='4'              attempts=1
PASS  q='capital of France'    answer='Paris'          attempts=1
PASS  q='3*5'                  answer='15'             attempts=1
PASS  q='opposite of hot'      answer='cold'           attempts=2
FAIL  q='largest planet'       answer='I am not sure'  attempts=1
score = 80%`, walkthrough: [
          { lines: [1, 2], note: "A fixed seed makes the run repeatable. Reproducibility is the first job of an eval harness." },
          { lines: [4, 9], note: "A fake model that times out 20% of the time and gives a nonsense answer 15% of the time, like a real API on a bad day." },
          { lines: [11, 17], note: "Retry logic: a timeout is a harness problem, not a wrong answer, so we try again up to 3 times instead of scoring it as a failure." },
          { lines: [19, 26], note: "The scorer. Note the normalisation: strip spaces and lower-case before comparing, so 'Paris' matches 'paris'. Changing this one line changes the score." },
          { lines: [28, 33], note: "Run all cases and print a per-case log plus the final score. The log is what lets us debug a bad number." }
        ] },
        { type: "p", text: "Look at case 4: the first call timed out and the retry succeeded. Without retries, that case would have failed and the score would have been 60%, a measurement of our network, not of the model. And if we compared `'Paris' == 'paris'` without lower-casing, case 2 would also fail. Same model, three different scores, purely from harness choices." },
        { type: "check", question: "In the run above, how many cases would pass if we removed the `.lower()` calls in the scorer and also removed retries?", answer: "Two. Case 2 fails because 'Paris' ≠ 'paris' without lower-casing, and case 4 fails because its first call timed out and there is no retry. Cases 1 and 3 still pass, case 5 still fails, so the score drops from 80% to 40%." }
      ]
    },
    {
      id: "compare",
      title: "Prompt, context and harness engineering",
      blocks: [
        { type: "p", text: "These three terms overlap, so it helps to see them side by side. Each one contains the one before it." },
        { type: "compare", title: "Three layers of engineering around a model", options: [
          { name: "Prompt engineering", summary: "Write the words of one request well.", pros: ["Cheap and fast to try", "Big gains on simple single-shot tasks"], cons: ["Cannot add tools, memory or checks", "Fragile when inputs vary"], bestFor: "One-off generations, classification, rewriting" },
          { name: "Context engineering", summary: "Decide what information fills the context window each time.", pros: ["Gives the model the right facts", "Handles long histories and documents"], cons: ["Still trusts whatever the model outputs", "Does not run actions"], bestFor: "RAG apps, long chats, assistants that need fresh data" },
          { name: "Harness engineering", summary: "Design the whole system around the model: tools, loop, memory, permissions, verification, logs.", pros: ["Turns a model into a dependable agent", "Catches and recovers from failures", "Makes behaviour measurable"], cons: ["Real software effort", "More moving parts to test and maintain"], bestFor: "Agents that act, production systems, fair evaluations" }
        ], rows: [
          ["Unit of design", "A single prompt", "The context per call", "The full system over many calls"],
          ["Handles tool calls", "No", "Only the results it includes", "Yes: runs, validates, permits"],
          ["Checks the result", "No", "No", "Yes, verification is built in"],
          ["Typical owner", "Anyone", "App developer", "Engineering team"]
        ], verdict: "Prompt and context engineering are parts of harness engineering. When a system must act or be trusted, we need the whole harness." }
      ]
    },
    {
      id: "best-practices",
      title: "Best practices in harness engineering",
      blocks: [
        { type: "list", ordered: true, items: [
          "**Start with a definition of done.** Write down how the harness will *check* that a task succeeded before you write the loop. A test that passes, an API that returned success, a schema that validates.",
          "**Keep tools few, clear and well described.** Each tool should do one thing, with a precise description and a strict argument schema. Ten overlapping tools confuse a model more than three sharp ones.",
          "**Validate everything the model produces.** Treat model output like user input: parse it, check types, reject or repair before acting.",
          "**Put limits everywhere.** Maximum steps, maximum cost, timeouts per call, maximum output size from tools. Fail closed, not open.",
          "**Gate risky actions.** Read-only actions can run freely; irreversible ones (payments, deletes, emails) need a human approval or a stricter policy.",
          "**Log a full trace.** Every prompt, tool call, result, token count and latency, so any failure can be replayed and understood.",
          "**Evaluate the harness, not just the model.** Keep a fixed test set of real tasks and re-run it whenever you change a prompt, tool or rule. Harness changes cause regressions too.",
          "**Make it model-agnostic where possible.** Models change every few months. A harness with a thin model adapter lets us swap models and compare them on our own evals."
        ] },
        { type: "callout", tone: "warn", title: "The common mistake", text: "Blaming the model and switching to a bigger one when the real bug is in the harness: a missing fact in the context, a vague tool description, an unchecked “done”. Before upgrading the model, read the trace of a failing case end to end. Most of the time the fix is a few lines of harness code." },
        { type: "p", text: "**When not to build a heavy harness:** a single summarisation or translation call does not need tools, loops or memory. Adding them adds latency and cost and new failure modes. Start with the smallest harness that meets the definition of done and grow it when real failures show where it is weak." }
      ]
    },
    {
      id: "reading-a-trace",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "We keep saying “read the trace”. Here is what that looks like. A customer wrote “Where is order 42?” and our agent replied “I could not find that order.” The order exists. Below is the trace of that run, with illustrative numbers." },
        { type: "table", caption: "One failing run, as logged by the harness", head: ["Step", "What happened", "Tokens", "Time"], rows: [["1. Assemble context", "System prompt + 10 messages + tool definitions", "1,850 in", "5 ms"], ["2. Model", "Asks for `get_order(order_id=\"#42\")`", "40 out", "900 ms"], ["3. Tool runner", "The order API answers `error: id must be a number`", "–", "120 ms"], ["4. Feed back", "The harness appends `Tool failed.`", "3 in", "1 ms"], ["5. Model", "Writes “I could not find that order.”", "25 out", "700 ms"]] },
        { type: "steps", title: "Reading it from top to bottom", items: [{ title: "Was the fact available?", text: "Step 1 shows the customer's message, with “order 42”, in the context. Context assembly did its job." }, { title: "Was the decision sensible?", text: "Step 2 picked the right tool. Only the argument is off: `\"#42\"` instead of `42`." }, { title: "What did the harness do with the bad argument?", text: "Nothing. It passed the string straight to the API. There was no schema check." }, { title: "What did the model learn from the failure?", text: "Step 4 says only “Tool failed.” The real reason was thrown away, so the model could not correct itself." }, { title: "Name the fixes", text: "Validate arguments before running a tool, and feed the full error text back. Both are a few lines of harness code. A bigger model would have faced the same blank error message." }] },
        { type: "p", text: "The habit to build: for each step, ask which harness component owned it and whether that component did its job. The first step where the answer is “no” is where we fix." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build the tool-running part of an agent harness. A scripted model proposes tool calls, and some of them are bad. The harness validates each call, applies a permission rule, runs the real function, and lets the reply claim a return only if the return tool truly succeeded." },
        { type: "code", lang: "python", title: "practice_tool_runner.py", code: `# A tiny agent harness: validate, permit, run, verify. The "model" is scripted.
ORDERS = {42: {"item": "kettle", "price": 39}, 77: {"item": "sofa", "price": 450}}

def get_order(order_id):    return ORDERS[order_id]
def start_return(order_id): return {"ok": True, "label": f"RET-{order_id}"}

TOOLS = {"get_order": get_order, "start_return": start_return}
APPROVAL_OVER = 200                # policy: big refunds need a human

def harness(tool_calls):
    log, returned = [], False
    for name, arg in tool_calls:
        if name not in TOOLS:                               # unknown tool
            log.append(f"{name}: REJECTED unknown tool"); continue
        if not isinstance(arg, int) or arg not in ORDERS:   # validate arguments
            log.append(f"{name}({arg!r}): REJECTED bad argument"); continue
        if name == "start_return" and ORDERS[arg]["price"] > APPROVAL_OVER:
            log.append(f"{name}({arg}): BLOCKED needs human approval"); continue
        result = TOOLS[name](arg)                           # run the real function
        returned = returned or (name == "start_return" and result["ok"])
        log.append(f"{name}({arg}): ran -> {result}")
    # Verification: only claim a return if the tool really succeeded
    reply = "Your return is started." if returned else "I have passed this to a colleague."
    return log, reply

runs = {"kettle ticket": [("get_order", "42"), ("get_order", 42), ("start_return", 42)],
        "sofa ticket":   [("get_order", 77), ("start_return", 77), ("delete_order", 77)]}
for ticket, calls in runs.items():
    log, reply = harness(calls)
    print(ticket)
    for line in log:
        print("  ", line)
    print("   reply:", reply)`, output: `kettle ticket
   get_order('42'): REJECTED bad argument
   get_order(42): ran -> {'item': 'kettle', 'price': 39}
   start_return(42): ran -> {'ok': True, 'label': 'RET-42'}
   reply: Your return is started.
sofa ticket
   get_order(77): ran -> {'item': 'sofa', 'price': 450}
   start_return(77): BLOCKED needs human approval
   delete_order: REJECTED unknown tool
   reply: I have passed this to a colleague.`, walkthrough: [{ lines: [2, 8], note: "A tiny order database, two real tools, the tool registry and one policy: returns over 200 need a human." }, { lines: [13, 18], note: "Three checks before anything runs: is the tool known, are the arguments valid, and is the action permitted?" }, { lines: [19, 24], note: "Run the tool, record whether a return really succeeded, and build the reply from that fact, not from what the model said." }, { lines: [26, 33], note: "Two scripted tickets. Each one contains a call that the harness must stop." }] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: ["Raise `APPROVAL_OVER` to 500. Predict the log and the reply for the sofa ticket.", "Make `start_return` return `{\"ok\": False}` for every order. Predict the kettle reply. Which line of the harness stops a false claim?", "Add a `cancel_order` tool that always needs approval. Decide where that rule belongs, then predict the log line for the call `(\"cancel_order\", 42)`."] },
        { type: "check", question: "In the kettle ticket, the first call `get_order('42')` was rejected, yet the ticket still ended well. In a real agent, what should the harness do with that rejection so that the model can recover?", answer: "Send it back to the model as a readable error, for example “order_id must be an integer, got the string '42'”. In our script the next call happened to be correct. A real model corrects itself only if it sees what was wrong. A rejection that is logged but never shown to the model protects the API and still leaves the agent stuck." },
        { type: "check", question: "The sofa reply says “I have passed this to a colleague”, although the scripted model asked for a return. Which two harness parts shaped that reply, and why is neither of them a prompt?", answer: "The permission rule blocked `start_return(77)`, because 450 is over the 200 limit. Then the verification step saw that no return had succeeded, so it refused to claim one. Both are code that runs whatever the model wrote. A prompt can ask a model to respect a limit; only the harness can make the limit impossible to cross." }
      ]
    },
    {
      id: "putting-it-together",
      title: "Putting it all together",
      blocks: [
        { type: "p", text: "Let us follow one message through our shop support agent: “My kettle arrived broken, order 42, I want my money back.”" },
        { type: "flow", title: "One ticket through the full harness", loop: true, nodes: [
          { label: "Guard + context", detail: "No injection found. The harness loads the customer's history and the returns policy, and adds tool definitions." },
          { label: "Model decides", detail: "The model asks to call get_order(42)." },
          { label: "Run tool", detail: "Harness validates the id, runs the lookup: kettle, $39, delivered 3 days ago." },
          { label: "Model decides again", detail: "Within policy and under $200, so it asks to call start_return(42, reason='damaged')." },
          { label: "Verify", detail: "The return API answered ok with a return label id. Only now may the reply say the return is started." },
          { label: "Reply + log", detail: "The answer passes the output guard; the full trace with cost and timing is saved. If any step failed, the loop would retry or hand off to a human." }
        ] },
        { type: "p", text: "The model contributed two decisions and one friendly sentence. The harness contributed safety, facts, actions, a correctness check and a record. That ratio is typical, and it is why harness engineering has become a core skill for AI engineers. The next lessons zoom in on two of its parts: the **loop** (loop engineering) and the **graph** of steps (graph engineering)." }
      ]
    }
  ],
  quiz: [
    { q: "What is the best description of an AI harness?", options: ["The fine-tuning dataset that specialises a base model for one company's tasks", "All the code around a model: tools, context, memory, limits, checks and logs", "A smaller supervisor model that watches a bigger model and corrects its answers", "The GPU cluster, drivers and serving software that the model runs on"], answer: 1, explain: "A harness is the surrounding code, not training data, another model, or hardware. Agent = Model + Harness." },
    { q: "Our support agent tells customers a refund was issued even when the refund API failed. What is the most direct fix?", options: ["Switch to a larger, more capable model that hallucinates less often", "Raise the temperature so the replies sound less repetitive and robotic", "Only allow a refund claim after the refund tool returns success", "Add more polite example refund messages to the system prompt"], answer: 2, explain: "This is a harness gap: nothing checks the action against a definition of done. A bigger model or better wording can still claim success without checking." },
    { q: "In the lesson's eval harness, removing retries turned one case from PASS to FAIL. What does that tell us?", options: ["The model itself got worse at answering that particular question", "The score would partly measure network reliability, not the model", "Retries always inflate scores unfairly and should never be used", "The expected answer stored for that test case was wrong"], answer: 1, explain: "That case's first call timed out. Counting a timeout as a wrong answer mixes infrastructure failures into the model's score, so the harness choice changes what we measure." },
    { q: "How does harness engineering relate to prompt and context engineering?", options: ["They are unrelated fields that different teams work on separately", "Harness engineering is a small sub-topic inside prompt engineering", "It contains both, and adds tools, loop, permissions, checks and logs", "Context engineering fully replaced harness engineering in 2025"], answer: 2, explain: "Prompts and context are pieces of the harness. The harness adds the parts that let a model act and be checked." },
    { q: "A teammate says: “Our agent is unreliable, so we need a bigger model.” What should we usually do first?", options: ["Read the trace of a failing run to find the real cause", "Fine-tune the current model on a large set of new examples", "Remove all step limits so the agent has more room to finish", "Turn off logging to make each run faster and cheaper"], answer: 0, explain: "Most failures are harness failures: missing facts, vague tools, unchecked results. Traces reveal them cheaply. Removing limits or logs makes things worse." }
  ],
  takeaways: [
    "A model only maps text to text; the harness gives it tools, memory, limits, checks and logs.",
    "Agent = Model + Harness. The model sets the ceiling; the harness decides how reliably we reach it.",
    "An evaluation harness must be reproducible, because prompt format, scoring rules and error handling all move the score.",
    "Validate model outputs, cap steps and cost, gate risky actions and verify results against a definition of done.",
    "Before blaming the model, read the trace: most agent bugs are harness bugs."
  ],
  terms: [
    { term: "Harness", def: "The software around a model that supplies instructions, tools, context, memory, control flow, safety checks, verification and logging." },
    { term: "Agent harness", def: "A harness that lets a model take actions in a loop until a task is done." },
    { term: "Evaluation harness", def: "Code that runs a model over fixed test cases, scores outputs consistently and reports results reproducibly." },
    { term: "Tool", def: "A function the model may request by name with structured arguments; the harness actually runs it." },
    { term: "Guardrail", def: "A check on inputs, outputs or actions that blocks or modifies unsafe behaviour." },
    { term: "Trace", def: "A complete log of one run: prompts, tool calls, results, tokens, cost and timing." }
  ]
};
