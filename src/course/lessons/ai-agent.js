export default {
  id: "ai-agent",
  minutes: 25,
  hook: "A chatbot can tell you how to book a flight; what does it take for software to actually go and book it?",
  summary: "An AI agent is a program where a language model decides, step by step, which actions to take toward a goal, runs those actions through tools, looks at the results, and repeats until the goal is met. It is built from five parts: a model, instructions, tools, memory, and a loop that ties them together. Agents shine on open-ended, multi-step tasks, but every extra step is another chance to fail, so we add limits, checks and humans where it matters.",
  sections: [
    {
      id: "big-picture",
      title: "The big picture",
      blocks: [
        { type: "p", text: "So far in this course, a large language model (LLM) has been a function: text goes in, text comes out. We ask a question, it answers, and the conversation ends. That is powerful, but it is also passive. The model cannot check today's price of a stock, open a file, run a test, or send an email. It can only *talk about* doing those things." },
        { type: "p", text: "An **AI agent** removes that limit. We wrap the model in a small program that lets it *do* things: call a search engine, query a database, run code. After each action, the program shows the model what happened, and the model decides what to do next. The model stops being only a writer and becomes a decision maker inside a loop." },
        { type: "callout", tone: "analogy", title: "Think of it like a new intern", text: "A plain LLM is like a very well-read intern who is locked in a room with no phone and no computer. Ask anything and you get a thoughtful answer from memory, but nothing gets done. An agent is the same intern, now given a laptop, a few approved apps, a notepad, and a task list. They try something, look at the result, adjust, and keep going until the task is finished, or until they ask you for help." },
        { type: "p", text: "In this module we will build up the full picture: function calling (how a model asks for an action), the agent loop (how actions repeat), well-known agent designs (ReAct, Plan-and-Execute, Reflection), memory, and MCP (a standard way to plug tools in). This first lesson gives the overview that everything else hangs on." }
      ]
    },
    {
      id: "what-is-an-agent",
      title: "What is an AI agent?",
      blocks: [
        { type: "p", text: "A simple working definition: **an AI agent is a system in which an LLM chooses its own next action, in a loop, to reach a goal, using tools to act on the world and observations to see the results.**" },
        { type: "p", text: "Three words in that sentence do the heavy lifting:" },
        { type: "list", items: [
          "**Goal**: the agent is given an outcome (“find the three cheapest flights to Lisbon next Friday”), not a fixed script of steps.",
          "**Chooses**: the model, not the programmer, decides which step comes next. This is called *autonomy*, and it comes in degrees.",
          "**Loop**: the agent acts, observes, and acts again, as many times as needed. The number of steps is not known in advance."
        ] },
        { type: "p", text: "The word *agent* is older than LLMs. In classic AI textbooks (Russell and Norvig's *Artificial Intelligence: A Modern Approach*), an agent is anything that **perceives** its environment through sensors and **acts** on it through actuators. An LLM agent fits that frame: tool results are its perceptions, tool calls are its actions, and the LLM is the part that maps one to the other." },
        { type: "callout", tone: "note", title: "Workflow or agent?", text: "Many useful LLM apps are *workflows*: the programmer fixes the steps in code (summarise → translate → email). The LLM fills in each step but never picks the path. An agent lets the model pick the path. Workflows are more predictable; agents are more flexible. Many real systems mix the two." },
        { type: "check", question: "A script calls an LLM to summarise each new support ticket and then always posts the summary to Slack. Is this an agent?", answer: "No. The steps are fixed by the programmer and run the same way every time; the model never decides what to do next. It is a workflow (a pipeline) that uses an LLM. It becomes agent-like only when the model chooses actions, for example deciding whether to search the knowledge base, escalate, or reply." }
      ]
    },
    {
      id: "agent-vs-llm-vs-chatbot",
      title: "AI agent vs plain LLM vs chatbot",
      blocks: [
        { type: "p", text: "These three terms get mixed up a lot. The difference is about **who acts** and **how many turns happen without a human**." },
        { type: "compare", title: "Plain LLM vs chatbot vs AI agent",
          options: [
            { name: "Plain LLM", summary: "One request in, one completion out.", pros: ["Simple and cheap", "Predictable cost and latency"], cons: ["No memory between calls", "Cannot act or fetch fresh data"], bestFor: "Writing, summarising, classifying, one-shot Q&A" },
            { name: "Chatbot", summary: "An LLM plus conversation history and a chat interface.", pros: ["Remembers the conversation", "Natural back-and-forth"], cons: ["A human drives every turn", "Usually talks rather than acts"], bestFor: "Support chat, tutoring, brainstorming" },
            { name: "AI agent", summary: "An LLM in a loop that picks and runs tools until a goal is met.", pros: ["Takes real actions", "Handles open-ended, multi-step tasks"], cons: ["Slower and costlier", "More ways to fail; needs guardrails"], bestFor: "Research, coding, data analysis, operations tasks" }
          ],
          rows: [
            ["Who decides the next step", "The caller", "The human user", "The model"],
            ["Steps per user request", "1", "1 reply per message", "Many (unknown in advance)"],
            ["Can use tools", "No", "Sometimes", "Yes, central"],
            ["Typical cost per task", "Lowest", "Low", "Higher (many model calls)"]
          ],
          verdict: "A chatbot can contain an agent: when you ask a modern assistant to “check my calendar and propose a time”, it switches from chatting to an agent loop behind the scenes." },
        { type: "p", text: "Notice that the line is blurry. A chatbot that can call one tool (say, a weather lookup) is a small step toward an agent. People often talk about an **autonomy spectrum**: from fixed pipelines, to a model that routes between a few options, to a model that plans and executes freely for many steps." }
      ]
    },
    {
      id: "five-core-parts",
      title: "The five core parts",
      blocks: [
        { type: "p", text: "Almost every agent, from a weekend script to a production coding assistant, is built from the same five parts:" },
        { type: "table", caption: "The five parts of an AI agent, using a travel-booking agent as the example",
          head: ["Part", "What it is", "Travel agent example"],
          rows: [
            ["1. Model (the brain)", "The LLM that reads the situation and decides the next step.", "A capable chat model that supports tool calling."],
            ["2. Instructions (the goal and rules)", "The system prompt: role, goal, constraints, style, when to stop or ask.", "“Find the cheapest refundable option. Never book without user approval.”"],
            ["3. Tools (the hands)", "Functions the program can run for the model: APIs, search, code, databases.", "search_flights, search_hotels, get_calendar, book (with approval)."],
            ["4. Memory (the notebook)", "What the agent knows: the running history this task, plus facts saved across sessions.", "The flights already found; the user's saved preference for aisle seats."],
            ["5. Loop (the orchestrator)", "Plain code that calls the model, runs the chosen tool, feeds results back, and enforces limits.", "Repeat until a final answer, at most 15 steps, ask before paying."]
          ] },
        { type: "flow", title: "How the five parts connect", loop: true,
          nodes: [
            { label: "Instructions + goal", detail: "The system prompt and the user's request set what “done” looks like and which rules apply." },
            { label: "Model decides", detail: "The LLM reads the goal, the memory and the latest results, and outputs either a tool call or a final answer." },
            { label: "Tool runs", detail: "The orchestrator (our code) executes the requested tool. The model never runs anything itself." },
            { label: "Observation", detail: "The tool's output (or error) is turned into text." },
            { label: "Memory updated", detail: "The observation is appended to the history, so the next model call can see it." }
          ] },
        { type: "callout", tone: "tip", title: "Planning is a behaviour, not a separate box", text: "You will often see “planning” listed as an agent part. In practice planning happens inside the model (it reasons about what to do) and is shaped by the instructions and the loop design. Later lessons show designs that make planning explicit, such as Plan-and-Execute." }
      ]
    },
    {
      id: "end-to-end",
      title: "How an AI agent works end to end",
      blocks: [
        { type: "p", text: "Let us follow one request from start to finish. The user types: “How old is Python 3?” The agent has two tools: `search` and `calculator`." },
        { type: "steps", title: "One agent run, step by step",
          items: [
            { title: "Receive the goal", text: "The orchestrator builds the first prompt: system instructions, the list of available tools with their descriptions, and the user's question." },
            { title: "Think and choose", text: "The model reasons that it needs the release year, and replies with a structured request: call `search` with “python release”. It does not answer yet." },
            { title: "Act", text: "The orchestrator sees the tool request, runs the real `search` function, and gets “Python 3.0 was released in 2008.”" },
            { title: "Observe", text: "That result is added to the conversation as an observation, and the model is called again with everything so far." },
            { title: "Repeat", text: "The model now needs the current year, then the subtraction. Each need becomes another act-observe round." },
            { title: "Finish", text: "When the model has enough information, it replies with a plain answer instead of a tool call. The loop sees “no tool call” and returns the answer to the user." }
          ] },
        { type: "viz", name: "agent-loop", caption: "Play the trace: the model thinks, calls a tool, reads the observation, and repeats until it can give a final answer. Watch the message log grow with every step." },
        { type: "p", text: "Two details matter. First, **the model only ever produces text** (often structured as JSON). Our code turns that text into real actions. This is what keeps the system controllable: we decide which tools exist and we can block, log or require approval for any of them. Second, **the conversation history is the agent's working memory**. The model itself is stateless: between calls it remembers nothing except what we send it. Each model call re-reads the whole history, which is why long runs get slower and more expensive." }
      ]
    },
    {
      id: "research-agent-example",
      title: "A concrete example: a tiny research agent",
      blocks: [
        { type: "p", text: "Here is the whole idea in about 35 lines of Python. To make it runnable without an API key, the “model” is a scripted function that makes the same decisions a real LLM would make for this question. Everything else (tools, memory, loop, step limit) is exactly how a real agent is wired." },
        { type: "code", lang: "python", title: "research_agent.py", code: `# A tiny research agent: a scripted "model" picks tools until it can answer.
DOCS = {"python release": "Python 3.0 was released in 2008.",
        "python today": "The current year is 2026."}

def search(query):                      # tool 1: look something up
    return DOCS.get(query, "no result")

def calculator(expr):                   # tool 2: do exact arithmetic
    return str(eval(expr, {"__builtins__": {}}))

TOOLS = {"search": search, "calculator": calculator}

def fake_model(goal, memory):
    """Stands in for the LLM: decides the next action from what it has seen."""
    seen = " ".join(memory)
    if "2008" not in seen:
        return ("search", "python release")
    if "2026" not in seen:
        return ("search", "python today")
    if "Result:" not in seen:
        return ("calculator", "2026 - 2008")
    return ("final", "Python 3 is about 18 years old.")

goal = "How old is Python 3?"
memory = []                             # what the agent has observed so far
for step in range(1, 6):                # hard step limit = safety net
    action, arg = fake_model(goal, memory)
    if action == "final":
        print(f"Step {step}: FINAL -> {arg}")
        break
    result = TOOLS[action](arg)         # the app, not the model, runs the tool
    memory.append(f"Result: {result}" if action == "calculator" else result)
    print(f"Step {step}: {action}({arg!r}) -> {result}")
else:
    print("Stopped: step limit reached")`, output: `Step 1: search('python release') -> Python 3.0 was released in 2008.
Step 2: search('python today') -> The current year is 2026.
Step 3: calculator('2026 - 2008') -> 18
Step 4: FINAL -> Python 3 is about 18 years old.`,
          walkthrough: [
            { lines: [2, 11], note: "Two tools. `search` looks up a tiny document store; `calculator` does exact arithmetic (LLMs are unreliable at math, so we hand it to code). `TOOLS` maps tool names to functions." },
            { lines: [13, 22], note: "The stand-in for the LLM. It looks at what has been observed so far and returns the next action as `(tool_name, argument)`, or `final` when it can answer. A real model makes this choice by reading the history." },
            { lines: [24, 26], note: "The goal, an empty memory list, and a loop capped at 5 steps. The cap is a safety net: agents must never be able to run forever." },
            { lines: [27, 30], note: "Ask the model for the next action. If it says `final`, print the answer and stop." },
            { lines: [31, 33], note: "Otherwise our code runs the chosen tool and appends the result to memory, so the next decision can use it." },
            { lines: [34, 35], note: "Python's `for ... else`: the `else` runs only if the loop ended without `break`, meaning the step limit was hit." }
          ] },
        { type: "p", text: "Swap `fake_model` for a real LLM call (with the tool list passed in) and you have a genuine agent. The next lesson, on function calling, shows exactly what that call looks like." },
        { type: "check", question: "In the code above, what would happen if `search` returned “no result” for “python today” every time?", answer: "The model would keep asking for `search('python today')` because 2026 never appears in memory. The loop would run until the 5-step limit and print “Stopped: step limit reached”. This is why step limits (and repeated-call detection, covered in the agent-loop lesson) are essential." }
      ]
    },
    {
      id: "types-of-agents",
      title: "Types of AI agents",
      blocks: [
        { type: "p", text: "There are two useful ways to classify agents: the classic textbook types (by how they decide) and the modern LLM designs (by how the loop is structured)." },
        { type: "table", caption: "Classic agent types (from the standard AI textbook framing)",
          head: ["Type", "How it decides", "Everyday example"],
          rows: [
            ["Simple reflex", "Fixed if-then rules on the current input only.", "A thermostat: too cold → heat on."],
            ["Model-based reflex", "Rules plus an internal picture of the world it updates over time.", "A robot vacuum that remembers which rooms are already clean."],
            ["Goal-based", "Considers which actions lead toward a goal.", "A route planner finding a path to an address."],
            ["Utility-based", "Weighs how good each outcome is, not just whether it reaches the goal.", "A route planner trading off time, tolls and fuel."],
            ["Learning", "Improves its behaviour from feedback over time.", "A recommender that adapts to what you click."]
          ] },
        { type: "p", text: "LLM agents are mostly goal-based (with some utility judgement inside the model). Within LLM agents, the common designs you will meet in this module are:" },
        { type: "list", items: [
          "**Tool-calling agent**: the basic loop from this lesson; the model calls tools until done.",
          "**ReAct agent**: the model writes an explicit *Thought* before each *Action* and reads an *Observation* after it.",
          "**Plan-and-Execute agent**: one call writes a full plan; the steps are then executed (and re-planned if something breaks).",
          "**Reflection agent**: the agent drafts, critiques its own draft, and revises.",
          "**Multi-agent systems**: several specialised agents (researcher, writer, reviewer) coordinated by an orchestrator, covered later in the module."
        ] },
        { type: "timeline", title: "How we got to LLM agents",
          items: [
            { when: "1995", title: "The agent framing", text: "Russell and Norvig's textbook organises AI around agents that perceive and act." },
            { when: "2022", title: "ReAct", text: "Researchers show that interleaving reasoning and tool actions in one prompt improves LLM performance on question answering and decision tasks." },
            { when: "2023", title: "Autonomous agent demos and function calling", text: "Open-source projects such as AutoGPT popularise looping LLMs; OpenAI adds function calling to its API, making structured tool requests standard." },
            { when: "2024", title: "MCP and computer use", text: "Anthropic releases the Model Context Protocol (a standard way to connect tools) and a computer-use capability where a model operates a desktop through screenshots." },
            { when: "2025–2026", title: "Agents in daily work", text: "Coding agents, deep-research features and browser agents become mainstream products from several vendors." }
          ] }
      ]
    },
    {
      id: "what-agents-can-do",
      title: "What AI agents can do today",
      blocks: [
        { type: "p", text: "As of 2026, agents are reliable enough to be useful in areas where the work is checkable and mistakes are cheap to catch:" },
        { type: "list", items: [
          "**Coding**: read a codebase, edit files, run tests, fix failures, and open a pull request. Tests give the agent a clear signal of success.",
          "**Research**: run many searches, read pages, compare sources, and write a cited report.",
          "**Data analysis**: write and run SQL or Python against a dataset, check the numbers, and draw charts.",
          "**Customer operations**: look up an order, check a policy, issue a refund under a limit, and escalate anything unusual to a human.",
          "**Computer and browser use**: fill in web forms or operate apps that have no API, by looking at screenshots and clicking. Still slower and more error-prone than API tools."
        ] },
        { type: "callout", tone: "example", title: "Real-world pattern: the support agent", text: "A typical support agent has tools like `get_order(id)`, `get_refund_policy()`, `issue_refund(id, amount)` and `escalate(reason)`. The instructions say refunds above a set amount always need a human. The agent handles the routine 70–80% (illustrative) of tickets end to end, and the risky ones are routed to people with a summary already written." }
      ]
    },
    {
      id: "when-to-use",
      title: "When to use an AI agent (and when not to)",
      blocks: [
        { type: "p", text: "Agents cost more and are less predictable than a single LLM call or a fixed workflow. A good rule: **use the simplest thing that works, and add autonomy only when the task needs it.**" },
        { type: "list", items: [
          "**Use an agent when** the number and order of steps depend on what you find along the way (research, debugging, open-ended data questions), and when results can be verified (tests pass, numbers match, a human approves).",
          "**Use a workflow when** the steps are known in advance (extract → validate → store). It is cheaper, faster, and easier to test.",
          "**Use a single LLM call when** the task is one transformation of text (summarise, classify, translate, rewrite)."
        ] },
        { type: "chart", kind: "line", title: "Why long agent runs are fragile", xLabel: "Number of steps", yLabel: "Chance every step succeeds",
          series: [
            { name: "99% per step", points: [[1, 0.99], [5, 0.951], [10, 0.904], [15, 0.86], [20, 0.818], [30, 0.74]] },
            { name: "95% per step", points: [[1, 0.95], [5, 0.774], [10, 0.599], [15, 0.463], [20, 0.358], [30, 0.215]] },
            { name: "90% per step", points: [[1, 0.9], [5, 0.59], [10, 0.349], [15, 0.206], [20, 0.122], [30, 0.042]] }
          ],
          caption: "Computed as pⁿ, assuming each step succeeds independently with probability p and one bad step ruins the run. Real agents can recover from some errors, but the lesson holds: small per-step error rates compound." },
        { type: "p", text: "The chart is the single most important intuition about agents. With 95% reliability per step, a 10-step task fully succeeds only about 60% of the time (0.95¹⁰ ≈ 0.599). That is why good agent design keeps runs short, checks results along the way, and lets the agent recover from errors instead of stopping blindly." }
      ]
    },
    {
      id: "failure-modes",
      title: "Common failure modes",
      blocks: [
        { type: "callout", tone: "warn", title: "The mistake most teams make first", text: "Giving a new agent many tools, broad permissions, and no step limit, then testing it on a handful of happy-path examples. Start with few tools, read-only permissions, a hard step and cost budget, and human approval for anything irreversible." },
        { type: "table", caption: "What goes wrong and the usual fix",
          head: ["Failure", "What it looks like", "Typical fix"],
          rows: [
            ["Infinite or long loops", "Calls the same tool again and again.", "Max steps, repeated-call detection, cost budget."],
            ["Wrong tool or bad arguments", "Searches when it should calculate; passes a name instead of an ID.", "Fewer, clearly named tools; good descriptions; argument validation."],
            ["Hallucinated results", "Claims it did something it never did, or invents data.", "Answer only from observations; log and check every tool call."],
            ["Losing the thread", "Forgets the goal in a long run as context fills up.", "Summarise history, restate the goal, use explicit plans."],
            ["Unsafe actions", "Deletes data or sends a message without asking.", "Least-privilege tools, approval steps, sandboxing."],
            ["Prompt injection", "A web page or email it reads tells it to do something else.", "Treat tool output as data, never as instructions; restrict what follows from it."]
          ] },
        { type: "p", text: "**Quick summary.** An AI agent is an LLM inside a loop that chooses actions toward a goal. It has five parts: model, instructions, tools, memory, and the loop. The model only writes requests; our code executes them, which is where we add safety. Agents are great for multi-step, checkable work, but errors compound with every step, so we keep them simple, bounded and supervised." }
      ]
    },
    {
      id: "worked-example-run-cost",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "We said that every model call re-reads the whole history. Let us put small numbers on that, because it changes how we design agents. All numbers here are illustrative and chosen to be easy to add up." },
        { type: "p", text: "Say the system prompt plus the tool list is 500 tokens. The user's question is 50 tokens. Each round adds about 200 tokens to the history: the model's tool request plus the tool's result. The run needs three tool calls and then a final answer, so the model is called four times." },
        { type: "table", caption: "Input tokens read by each model call (illustrative numbers)",
          head: ["Model call", "What it reads", "Input tokens"],
          rows: [
            ["1", "Prompt + question", "550"],
            ["2", "Prompt + question + 1 round", "750"],
            ["3", "Prompt + question + 2 rounds", "950"],
            ["4", "Prompt + question + 3 rounds", "1,150"],
            ["Total", "All four calls", "3,400"]
          ] },
        { type: "steps", title: "Reading the table",
          items: [
            { title: "The history only grows", text: "Each call reads everything the earlier calls read, plus one more round. Nothing is dropped unless we drop it." },
            { title: "The total is more than the final history", text: "The finished history is 1,150 tokens, but we paid to read 3,400. Early tokens are read again and again: the 500-token prompt was read four times." },
            { title: "Cost grows faster than steps", text: "With n calls, the total is n × 550 + 200 × (0 + 1 + … + (n − 1)). Double the steps and the second part roughly quadruples." },
            { title: "Big tool results hurt most", text: "If one search returned 3,000 tokens in round 1, every later call would carry those 3,000 tokens too. Trimming tool output is often the cheapest fix." }
          ] },
        { type: "p", text: "This is why real agents keep tool results short, summarise old history, and cap the number of steps. Many providers also offer prompt caching, which makes the repeated prefix cheaper to re-read, but the pattern of growth stays the same." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build a small support agent that handles refund requests. It has all five parts: a scripted model, instructions (a refund limit), two tools, a memory list, and a loop. The new idea is an approval rule that lives in the loop, so the model cannot skip it." },
        { type: "code", lang: "python", title: "practice_support_agent.py", code: `# A support agent with an approval rule: the loop, not the model, enforces it.
ORDERS = {"A17": {"item": "kettle", "paid": 40},
          "B42": {"item": "laptop", "paid": 900}}
REFUND_LIMIT = 100                       # instructions: bigger refunds need a human

def get_order(order_id):                 # read-only tool
    return ORDERS.get(order_id, "unknown order")

def issue_refund(order_id):              # tool with a real side effect
    return f"refunded {ORDERS[order_id]['paid']} for {order_id}"

TOOLS = {"get_order": get_order, "issue_refund": issue_refund}

def fake_model(order_id, memory):
    """Scripted stand-in for the LLM: look up the order, then refund it."""
    if not memory:
        return ("get_order", order_id)
    if len(memory) == 1 and isinstance(memory[0], dict):
        return ("issue_refund", order_id)
    return ("final", f"Ticket closed: {memory[-1]}")

def run_agent(order_id, max_steps=4):
    memory = []                          # observations for this task only
    for step in range(1, max_steps + 1):
        action, arg = fake_model(order_id, memory)
        if action == "final":
            return f"  step {step}: {arg}"
        if action == "issue_refund" and ORDERS[arg]["paid"] > REFUND_LIMIT:
            result = "BLOCKED: sent to a human for approval"   # guardrail in code
        else:
            result = TOOLS[action](arg)
        memory.append(result)
        print(f"  step {step}: {action}({arg!r}) -> {result}")
    return "  stopped: step limit"

for oid in ["A17", "B42", "Z99"]:
    print(f"Refund request for {oid}")
    print(run_agent(oid))`, output: `Refund request for A17
  step 1: get_order('A17') -> {'item': 'kettle', 'paid': 40}
  step 2: issue_refund('A17') -> refunded 40 for A17
  step 3: Ticket closed: refunded 40 for A17
Refund request for B42
  step 1: get_order('B42') -> {'item': 'laptop', 'paid': 900}
  step 2: issue_refund('B42') -> BLOCKED: sent to a human for approval
  step 3: Ticket closed: BLOCKED: sent to a human for approval
Refund request for Z99
  step 1: get_order('Z99') -> unknown order
  step 2: Ticket closed: unknown order`,
          walkthrough: [
            { lines: [2, 12], note: "The data, the rule and the tools. `get_order` only reads. `issue_refund` has a side effect, so it is the one we must guard." },
            { lines: [14, 20], note: "The scripted model. It asks for the order first. If the lookup returned an order (a dict), it asks for a refund. After that it writes a final message from the last observation." },
            { lines: [22, 34], note: "The loop. Before running `issue_refund` it checks the amount against the limit. Above the limit, the tool is never called and the model sees a `BLOCKED` observation instead." },
            { lines: [36, 38], note: "Three tickets: a small refund, a large one, and an order that does not exist." }
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Set `REFUND_LIMIT = 1000`. Before running, predict what changes for order `B42` and what stays the same for `A17`.",
          "Set `max_steps=2` in `run_agent`. Predict which line each ticket ends with. Does any refund still happen?",
          "Delete the guardrail `if` so every call goes straight to `TOOLS[action](arg)`. Predict the output for `B42`, then say why relying on the model's instructions alone would be risky here."
        ] },
        { type: "check", question: "For order `Z99` the model never asks for a refund. Which line of the scripted model causes that, and what would a real LLM need in order to behave the same way?", answer: "The check `isinstance(memory[0], dict)` fails, because the lookup returned the text “unknown order”, so the model skips the refund and goes to the final message. A real LLM would need to read the observation and notice the order was not found. That works only because our code fed the tool result back into the history; without the observation the model would have nothing to react to." },
        { type: "check", question: "The refund limit could be written only in the system prompt (“never refund more than 100”). Why do we also enforce it in the loop code?", answer: "A prompt rule is a request; the model usually follows it but can get it wrong, or be talked out of it by text it reads. A check in code runs every time, whatever the model outputs. Since the model only writes requests and our code runs the tools, the code is the one place where a rule can be guaranteed." }
      ]
    }
  ],
  quiz: [
    { q: "What is the key property that makes a system an AI agent rather than an LLM workflow?", options: ["It runs on a very large model that can plan many steps ahead in one go", "The model picks each next action in a loop, based on what it observes", "It talks to users through a chat interface instead of a fixed API", "It stores the full conversation history between user sessions"], answer: 1, explain: "An agent lets the model pick the path step by step. Model size, a chat UI, or stored history alone do not make something an agent; a fixed pipeline with a huge model is still a workflow." },
    { q: "In an agent, the model replies with a request to call `search('python release')`. Who actually runs the search?", options: ["The LLM runs it internally, using a search tool built into its weights", "The search engine, which reads the request straight from the model", "The orchestrator code around the model runs it and returns the result", "Nobody: the model predicts what the search would most likely return"], answer: 2, explain: "The model only produces text describing the call. The surrounding program executes the real function and feeds the output back as an observation. This is also where we enforce permissions and logging." },
    { q: "An agent succeeds at each step 95% of the time, independently. Roughly how often does a 10-step task succeed end to end?", options: ["About 95%", "About 85%", "About 60%", "About 10%"], answer: 2, explain: "0.95¹⁰ ≈ 0.599, so about 60%. Per-step errors compound, which is why shorter runs and checks along the way matter so much." },
    { q: "Our team needs to extract the same five fields from every invoice and store them. The steps never change. What should we build?", options: ["A fixed workflow that calls an LLM for extraction", "A fully autonomous agent with many tools to choose from", "A multi-agent system with a reviewer agent", "A chatbot that asks the user for each field"], answer: 0, explain: "When the steps are known in advance, a workflow is cheaper, faster and easier to test. Agents are for tasks whose steps depend on what is discovered along the way." },
    { q: "Which statement about agent memory is a misconception?", options: ["The conversation history acts as the agent's working memory during a single task", "Long-term memory can keep facts in an external store across sessions", "A tool result stays in the model's memory even after it leaves the context", "Long histories make each model call slower and more expensive"], answer: 2, explain: "The model is stateless between calls: it only “remembers” what is sent in the context (or retrieved from a memory store). The other three statements are correct." }
  ],
  takeaways: [
    "An AI agent is an LLM in a loop that chooses actions toward a goal, using tools and observing the results.",
    "Five parts: model, instructions, tools, memory, and the orchestrating loop.",
    "The model only writes requests; our code runs the tools, which is where safety controls live.",
    "Prefer a single call or a fixed workflow when the steps are known; use agents for open-ended, verifiable, multi-step work.",
    "Errors compound per step, so bound the loop, validate tool calls, and keep humans in charge of irreversible actions."
  ],
  terms: [
    { term: "AI agent", def: "A system where an LLM repeatedly chooses and takes actions through tools, observing results, until a goal is reached." },
    { term: "Tool", def: "A function the agent's program can run on the model's behalf, such as search, a database query or code execution." },
    { term: "Observation", def: "The result of a tool call, fed back to the model as input for its next decision." },
    { term: "Orchestrator", def: "The plain code that runs the loop: calls the model, executes tools, updates memory and enforces limits." },
    { term: "Workflow", def: "A fixed sequence of steps defined by the programmer, where an LLM may do individual steps but does not choose the path." },
    { term: "Autonomy", def: "How much the model, rather than the programmer or user, decides what happens next." }
  ]
};
