export default {
  id: "react-agent",
  minutes: 24,
  hook: "What happens if we make an agent write down its reasoning before every action, and read the result before its next thought?",
  summary: "A ReAct agent (Reasoning + Acting) interleaves three kinds of lines: a Thought that reasons about what to do, an Action that calls a tool, and an Observation with the tool's result. The cycle repeats until the agent writes a Final Answer. Reasoning keeps actions purposeful, and observations keep reasoning grounded in real data, which reduces hallucination compared with reasoning alone.",
  sections: [
    {
      id: "what-is-react",
      title: "What is a ReAct agent?",
      blocks: [
        { type: "p", text: "**ReAct** stands for **Re**asoning + **Act**ing. It was introduced in the 2022 paper *ReAct: Synergizing Reasoning and Acting in Language Models* by Shunyu Yao and colleagues (Princeton and Google). The idea is simple: instead of having the model either *think* or *act*, let it **alternate** between the two in a single running transcript." },
        { type: "p", text: "Every step of a ReAct agent has the same rhythm:" },
        { type: "list", items: [
          "**Thought**: a short piece of reasoning in plain language. “I need the height of the Eiffel Tower first.”",
          "**Action**: a tool call chosen because of that thought. `search[Eiffel Tower]`",
          "**Observation**: the result of the action, written into the transcript by our code. “The Eiffel Tower is 330 metres tall.”"
        ] },
        { type: "p", text: "Then a new Thought reads that observation, and the cycle continues until the model writes **Final Answer**." },
        { type: "callout", tone: "analogy", title: "Think of it like a detective's notebook", text: "A good detective writes: “The window was open, so the thief may have climbed in. Let me check for footprints outside.” They go and look (action). They write down what they find (observation): “Muddy prints, size 44.” Then they reason again with the new fact. A detective who only theorises invents stories; one who only collects clues never connects them. ReAct does both, in turns." }
      ]
    },
    {
      id: "why-react",
      title: "Why interleave reasoning and acting?",
      blocks: [
        { type: "p", text: "Before ReAct, two separate ideas were popular:" },
        { type: "list", items: [
          "**Reason only (chain-of-thought)**: the model writes step-by-step reasoning before answering. Good at logic, but every fact comes from the model's memory, so it can confidently reason from a hallucinated fact.",
          "**Act only**: the model issues tool calls without explaining itself. It can fetch real data, but it struggles to plan, track progress, or recover when a search returns nothing useful."
        ] },
        { type: "p", text: "The ReAct paper evaluated the combination on knowledge-heavy question answering and fact checking (using a Wikipedia search tool) and on interactive decision-making tasks such as a text-based household game and a web shopping simulator. Across these, interleaving reasoning with actions generally beat acting alone, and grounding the reasoning in retrieved facts reduced the hallucinations seen with reasoning alone. The paper also found the approaches can complement each other, for example falling back between ReAct and chain-of-thought." },
        { type: "compare", title: "Reason only vs act only vs ReAct",
          options: [
            { name: "Reason only (CoT)", summary: "Think step by step, then answer from memory.", pros: ["Good multi-step logic", "One model call"], cons: ["Facts can be hallucinated", "No fresh or private data"], bestFor: "Math and logic puzzles with all facts given" },
            { name: "Act only", summary: "Call tools directly, with no written reasoning.", pros: ["Grounded in real data", "Fewer tokens"], cons: ["Weak planning", "Hard to debug why it chose an action"], bestFor: "Simple single-tool lookups" },
            { name: "ReAct", summary: "Alternate Thought → Action → Observation.", pros: ["Grounded and planned", "Transcript explains every decision", "Recovers from bad results"], cons: ["More tokens and model calls", "Can loop or drift on long tasks"], bestFor: "Multi-hop questions, research, troubleshooting" }
          ],
          rows: [
            ["Uses external tools", "No", "Yes", "Yes"],
            ["Explicit reasoning", "Yes", "No", "Yes, before every action"],
            ["Main risk", "Hallucinated facts", "Aimless actions", "Long, costly loops"]
          ],
          verdict: "ReAct combines the strengths of both: reasoning decides what to look up, and observations correct the reasoning." }
      ]
    },
    {
      id: "react-vs-ai-agent",
      title: "ReAct agent vs AI agent",
      blocks: [
        { type: "p", text: "Is ReAct the same thing as an AI agent? Not quite. **“AI agent” is the general category**: any LLM in a loop that uses tools toward a goal. **ReAct is one specific design** for that loop, defined by its explicit Thought step before every action and its fixed Thought/Action/Observation format." },
        { type: "table", caption: "How ReAct relates to the general agent",
          head: ["Aspect", "General AI agent", "ReAct agent"],
          rows: [
            ["Loop", "Any act-observe loop", "Thought → Action → Observation loop"],
            ["Reasoning", "May be hidden, implicit, or absent", "Written explicitly before each action"],
            ["Planning", "Could be up-front, step-by-step, or none", "Step by step: one action decided at a time"],
            ["Format", "Any (often native tool calls)", "Classic: a text template; modern: native tool calls plus visible thoughts"]
          ] },
        { type: "p", text: "Today many tool-calling agents behave in a ReAct-like way even without the text template: the model reasons (sometimes in hidden “thinking” tokens), emits a native tool call, and reads the tool result. So ReAct is best understood as the **pattern** that most modern agent loops follow, and its original text format is a great way to see that pattern clearly." },
        { type: "check", question: "An agent writes a complete 6-step plan first, then executes the steps without reasoning in between. Is it a ReAct agent?", answer: "No. ReAct decides one action at a time, with fresh reasoning after each observation. Planning everything up front is the Plan-and-Execute pattern, covered in the next lesson." }
      ]
    },
    {
      id: "anatomy",
      title: "Anatomy of a ReAct agent",
      blocks: [
        { type: "p", text: "A ReAct agent has five working parts:" },
        { type: "table", caption: "The parts of a ReAct agent",
          head: ["Part", "Role"],
          rows: [
            ["Prompt template", "Explains the format, lists the tools, and often includes one or two example traces."],
            ["LLM", "Generates the next Thought and Action (or Final Answer), one step at a time."],
            ["Output parser", "Reads the model's text and extracts the action name and its input (for example with a regular expression)."],
            ["Tool registry", "Maps action names (search, calculate) to real functions."],
            ["Scratchpad", "The growing transcript of all Thoughts, Actions and Observations, sent back to the model every step."]
          ] },
        { type: "flow", title: "The ReAct cycle", loop: true,
          nodes: [
            { label: "Thought", detail: "The model writes what it knows, what is missing, and what to do next." },
            { label: "Action", detail: "The model names a tool and its input, e.g. search[Statue of Liberty]. Generation stops here." },
            { label: "Execute", detail: "Our parser extracts the action; our code runs the tool." },
            { label: "Observation", detail: "Our code appends “Observation: …” with the real result to the scratchpad." }
          ] }
      ]
    },
    {
      id: "prompt-template",
      title: "The ReAct prompt template",
      blocks: [
        { type: "p", text: "In the classic text form, the whole agent is driven by a prompt like this one. The model sees it, plus the scratchpad so far, on every call." },
        { type: "code", lang: "text", title: "react_prompt.txt", code: `Answer the question as well as you can. You can use these tools:

search: look up a topic in the encyclopedia. Input: a topic name.
calculate: evaluate an arithmetic expression. Input: an expression.

Use exactly this format:

Question: the question you must answer
Thought: think about what to do next
Action: one of [search, calculate]
Action Input: the input to the action
Observation: the result of the action
... (Thought / Action / Action Input / Observation can repeat)
Thought: I now know the final answer
Final Answer: the answer to the original question

Begin!

Question: {question}
{scratchpad}`,
          walkthrough: [
            { lines: [1, 4], note: "The task and the tool list, each with a one-line description of what it does and what input it takes." },
            { lines: [6, 14], note: "The format contract. The parser depends on these exact labels, so the prompt states them precisely." },
            { lines: [16, 19], note: "The question and the scratchpad (all previous Thought/Action/Observation lines) are filled in on every call." }
          ] },
        { type: "callout", tone: "warn", title: "Use a stop sequence", text: "Without precautions, the model will happily continue past `Action Input:` and write its own `Observation:` line, inventing a tool result. Pass `Observation:` as a stop sequence so generation halts right after the action, and only our code ever writes observations." },
        { type: "p", text: "Prompts usually also include one or two complete example traces (few-shot examples), which strongly improve format-following. With modern models that support native function calling, many implementations skip the text format: the Thought is ordinary assistant text (or hidden reasoning), the Action is a native tool call, and the Observation is a tool-result message. The pattern is identical; the parsing becomes more reliable." }
      ]
    },
    {
      id: "how-it-thinks-and-acts",
      title: "How a ReAct agent thinks and acts",
      blocks: [
        { type: "steps", title: "One ReAct run",
          items: [
            { title: "Start the scratchpad", text: "Fill the template with the question; the scratchpad is empty." },
            { title: "Generate a step", text: "Call the model. It writes a Thought and an Action with its input, then stops at the stop sequence." },
            { title: "Parse", text: "Extract the action name and input. If parsing fails or the tool does not exist, prepare an error observation instead of crashing." },
            { title: "Act and observe", text: "Run the tool and append `Observation: <result>` to the scratchpad." },
            { title: "Repeat", text: "Call the model again with the longer scratchpad. Its next Thought can react to the observation." },
            { title: "Finish", text: "When the model writes `Final Answer:`, return it. If the step limit is hit first, stop and report." }
          ] },
        { type: "viz", name: "agent-loop", caption: "Play the trace and match each message to ReAct's labels: the model's reasoning is the Thought, the tool call is the Action, the tool output is the Observation." }
      ]
    },
    {
      id: "full-trace",
      title: "A full trace example",
      blocks: [
        { type: "p", text: "Question: “How much taller is the Eiffel Tower than the Statue of Liberty?” This is a **multi-hop** question: it needs two separate facts and a calculation. Here is the trace a ReAct agent produces (the observations come from tools, not the model):" },
        { type: "code", lang: "text", title: "Trace", code: `Question: How much taller is the Eiffel Tower than the Statue of Liberty?
Thought: I need the height of the Eiffel Tower.
Action: search
Action Input: Eiffel Tower
Observation: The Eiffel Tower is 330 metres tall.
Thought: Now the Statue of Liberty.
Action: search
Action Input: Statue of Liberty
Observation: The Statue of Liberty is 93 metres tall.
Thought: Subtract the two heights.
Action: calculate
Action Input: 330 - 93
Observation: 237
Thought: I have what I need.
Final Answer: The Eiffel Tower is 237 m taller.`,
          walkthrough: [
            { lines: [1, 5], note: "First hop. The Thought names exactly what is missing; the Action fetches it; the Observation is a real fact." },
            { lines: [6, 9], note: "Second hop. The model does not guess the statue's height from memory; it looks it up." },
            { lines: [10, 13], note: "Arithmetic goes to a calculator tool rather than being done “in the head” of the model." },
            { lines: [14, 15], note: "With both facts and the difference observed, the model writes the Final Answer and the loop ends." }
          ] },
        { type: "callout", tone: "note", title: "About the numbers", text: "Heights depend on what is measured: the Eiffel Tower is about 330 m including antennas, and the Statue of Liberty is about 93 m from the ground to the torch including its pedestal. A real agent should state which measure its source used, which is another benefit of a visible trace." },
        { type: "check", question: "In this trace, which lines are written by the model and which by our code?", answer: "The model writes the Thought, Action and Action Input lines and the Final Answer. Our code writes every Observation line after running the tool. If the model ever writes an Observation itself, that is a hallucinated tool result, which the stop sequence prevents." }
      ]
    },
    {
      id: "implementing",
      title: "Implementing a ReAct agent",
      blocks: [
        { type: "p", text: "Below is a complete ReAct loop with a text parser. The model's replies are scripted so the run is repeatable offline; in a real agent, `next(LLM_TURNS)` becomes a model call with the template, the scratchpad, and `stop=[\"Observation:\"]`." },
        { type: "code", lang: "python", title: "react_agent.py", code: `import re

WIKI = {"Eiffel Tower": "The Eiffel Tower is 330 metres tall.",
        "Statue of Liberty": "The Statue of Liberty is 93 metres tall."}
TOOLS = {"search": lambda q: WIKI.get(q, "Not found."),
         "calculate": lambda e: str(eval(e, {"__builtins__": {}}))}

# What the LLM would write on each call (scripted so the demo is repeatable).
LLM_TURNS = iter([
    "Thought: I need the height of the Eiffel Tower.\\nAction: search\\nAction Input: Eiffel Tower",
    "Thought: Now the Statue of Liberty.\\nAction: search\\nAction Input: Statue of Liberty",
    "Thought: Subtract the two heights.\\nAction: calculate\\nAction Input: 330 - 93",
    "Thought: I have what I need.\\nFinal Answer: The Eiffel Tower is 237 m taller.",
])
PATTERN = re.compile(r"Action: (\\w+)\\s*\\nAction Input: (.+)")

prompt = "Question: How much taller is the Eiffel Tower than the Statue of Liberty?\\n"
for step in range(1, 7):                       # max 6 iterations
    text = next(LLM_TURNS)                     # call the model with \`prompt\`
    prompt += text + "\\n"
    print(text.splitlines()[0])                # show the Thought line
    if "Final Answer:" in text:
        print(">>", text.split("Final Answer:")[1].strip())
        break
    m = PATTERN.search(text)                   # parse the action the model chose
    if not m or m.group(1) not in TOOLS:
        obs = "Error: use one of " + ", ".join(TOOLS)   # tell the model, don't crash
    else:
        obs = TOOLS[m.group(1)](m.group(2).strip())
    prompt += f"Observation: {obs}\\n"          # feed the result back in
    print(f"  Action: {m.group(1)}[{m.group(2)}] -> Observation: {obs}")
print("prompt now has", prompt.count("\\n"), "lines")`, output: `Thought: I need the height of the Eiffel Tower.
  Action: search[Eiffel Tower] -> Observation: The Eiffel Tower is 330 metres tall.
Thought: Now the Statue of Liberty.
  Action: search[Statue of Liberty] -> Observation: The Statue of Liberty is 93 metres tall.
Thought: Subtract the two heights.
  Action: calculate[330 - 93] -> Observation: 237
Thought: I have what I need.
>> The Eiffel Tower is 237 m taller.
prompt now has 15 lines`,
          walkthrough: [
            { lines: [3, 6], note: "Two tools in a registry: a tiny encyclopedia search and a safe-ish calculator (no built-ins available to `eval`)." },
            { lines: [8, 14], note: "What a model would generate on each call: a Thought plus an Action, or a Final Answer." },
            { lines: [15, 15], note: "The parser: a regular expression that captures the tool name after `Action:` and the text after `Action Input:`." },
            { lines: [17, 21], note: "The scratchpad starts with the question. Each step appends the model's text, capped at 6 iterations." },
            { lines: [22, 24], note: "Stop condition: the model wrote a Final Answer." },
            { lines: [25, 29], note: "Parse and run the action. An unknown tool or bad format becomes an error observation the model can read and fix." },
            { lines: [30, 32], note: "Our code, never the model, appends the Observation. The scratchpad ends with 15 lines: the whole visible trace." }
          ] }
      ]
    },
    {
      id: "failure-modes",
      title: "Common failure modes and how to fix them",
      blocks: [
        { type: "table", caption: "ReAct failures and fixes",
          head: ["Failure", "What happens", "Fix"],
          rows: [
            ["Hallucinated observation", "The model writes its own Observation line instead of waiting for the tool.", "Stop sequence on “Observation:”; only code writes observations."],
            ["Format drift", "“Action: Search for X” instead of the exact labels; the parser fails.", "Few-shot examples, lenient parsing, error observations, or native tool calling."],
            ["Repetitive loops", "Searches the same thing again and again.", "Step limit, duplicate-call detection, remind the model what it already tried."],
            ["Unhelpful observations", "Search returns nothing relevant and the agent gives up or guesses.", "Better tools, rephrasing guidance in the prompt, return “no result” clearly."],
            ["Context bloat", "Long tool outputs fill the scratchpad.", "Truncate or summarise observations; keep only what matters."],
            ["Thoughts that do not match actions", "The Thought says one thing, the Action does another.", "Validate actions; keep tools few and clearly named."]
          ] },
        { type: "callout", tone: "warn", title: "A visible thought is not a guarantee", text: "A Thought explains the model's stated reason, which is very helpful for debugging, but it is not proof of how the model really decided. Never treat a convincing Thought as verification; check the actual observations." },
        { type: "p", text: "**When not to use ReAct.** If the steps are known in advance, a fixed workflow is cheaper. If a task has many steps that can be planned up front (or run in parallel), Plan-and-Execute may be faster and cheaper, because ReAct makes one model call per step and re-sends the growing scratchpad each time." },
        { type: "p", text: "**Quick summary.** ReAct alternates Thought, Action and Observation until a Final Answer. Reasoning guides actions; observations ground reasoning. It is a specific, transparent design within the broad family of AI agents, and the pattern most tool-calling agents follow today. Use stop sequences, robust parsing, step limits, and keep observations compact." }
      ]
    },
    {
      id: "worked-example-recovery",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "The Eiffel Tower trace was a clean run: every search worked first time. Real runs are messier. Let us follow one where a search comes back empty, and count what each model call has to read. The question is: “How tall is the tower in Paris that opened in 1889?”" },
        { type: "steps", title: "A run with one bad observation",
          items: [
            { title: "Call 1: a first guess at the query", text: "Thought: “I should search for the tower.” Action: `search`, Action Input: `Paris tower 1889`. Our code appends: Observation: Not found." },
            { title: "Call 2: the Thought reacts", text: "The model reads the empty result. Thought: “No page with that title. The 1889 tower in Paris is the Eiffel Tower, so I will search by name.” Action Input: `Eiffel Tower`. Observation: The Eiffel Tower is 330 metres tall." },
            { title: "Call 3: finish", text: "Thought: “I have the height.” Final Answer: about 330 metres." }
          ] },
        { type: "p", text: "The Thought in call 2 is where ReAct earns its cost. An act-only agent would see “Not found” and have no written place to work out *why* and what to try instead. Here the reasoning turns a dead end into a better query." },
        { type: "p", text: "Now the cost side. In the text format each full step adds four lines to the scratchpad: Thought, Action, Action Input, Observation. The scratchpad starts with one line, the question." },
        { type: "table", caption: "Scratchpad lines the model reads on each call (counted from the format, not measured)",
          head: ["Model call", "Lines already in the scratchpad", "Why"],
          rows: [
            ["1", "1", "Only the question"],
            ["2", "5", "Question + one full step"],
            ["3", "9", "Question + two full steps"],
            ["k", "1 + 4 × (k − 1)", "Each earlier step added four lines"]
          ] },
        { type: "p", text: "The failed search is not free: its four lines stay in the scratchpad and are re-read by every later call. One dead end is cheap. Five dead ends add 20 lines that every later call must carry, which is one reason to keep observations short and to stop runs that are going nowhere. (The fixed prompt template is also sent each time; we left it out of the count because it does not grow.)" }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will run a ReAct loop against a model that makes two slips: it names a tool that does not exist, and then it searches for a word the shop does not have. This time the scripted model is a function that reads the scratchpad, so it reacts to each observation the way a real model would. Our job is the loop: parse, run, and turn every slip into an Observation." },
        { type: "code", lang: "python", title: "practice_react_recovery.py", code: `import re
# ReAct with a model that slips up: the loop turns each slip into an Observation.
PRICES = {"notebook": 4, "pen": 2}
TOOLS = {"price": lambda item: str(PRICES.get(item, "Not found.")),
         "calculate": lambda e: str(eval(e, {"__builtins__": {}}))}
PATTERN = re.compile(r"Action: (\\w+)\\s*\\nAction Input: (.+)")

def fake_model(pad):
    """Scripted LLM: picks its next lines by reading the last scratchpad line."""
    last = pad.strip().splitlines()[-1]
    if last.startswith("Question"):          # slip 1: a tool that does not exist
        return "Thought: I need the notebook price.\\nAction: lookup\\nAction Input: notebook"
    if "Error" in last:                      # slip 2: plural word, not in the shop
        return "Thought: The tool is called price.\\nAction: price\\nAction Input: notebooks"
    if "Not found" in last:
        return "Thought: Try the singular word.\\nAction: price\\nAction Input: notebook"
    if last.endswith(": 4"):
        return "Thought: Now the pen.\\nAction: price\\nAction Input: pen"
    if last.endswith(": 2"):
        return "Thought: Add it up.\\nAction: calculate\\nAction Input: 3 * 4 + 2 * 2"
    return "Thought: I have the total.\\nFinal Answer: 16 in total."

pad, slips = "Question: What do 3 notebooks and 2 pens cost?\\n", 0
for step in range(1, 9):                     # at most 8 model calls
    text = fake_model(pad)
    pad += text + "\\n"
    if "Final Answer:" in text:
        print(f"{step}. FINAL:", text.split("Final Answer:")[1].strip())
        break
    m = PATTERN.search(text)
    if not m or m.group(1) not in TOOLS:     # bad format or unknown tool
        obs = "Error: unknown action. Use one of: " + ", ".join(TOOLS)
    else:
        obs = TOOLS[m.group(1)](m.group(2).strip())
    slips += obs.startswith(("Error", "Not found"))
    pad += f"Observation: {obs}\\n"           # only our code writes this line
    print(f"{step}. {text.splitlines()[0]}\\n   -> Observation: {obs}")
print("model calls:", step, "| slips recovered:", slips)`, output: `1. Thought: I need the notebook price.
   -> Observation: Error: unknown action. Use one of: price, calculate
2. Thought: The tool is called price.
   -> Observation: Not found.
3. Thought: Try the singular word.
   -> Observation: 4
4. Thought: Now the pen.
   -> Observation: 2
5. Thought: Add it up.
   -> Observation: 16
6. FINAL: 16 in total.
model calls: 6 | slips recovered: 2`,
          walkthrough: [
            { lines: [3, 6], note: "Two tools and the parser. `price` returns “Not found.” for an unknown item instead of raising an error." },
            { lines: [8, 21], note: "The scripted model. It looks only at the last line of the scratchpad and decides what to write next. The first two branches are the slips; the next branch is the recovery." },
            { lines: [30, 34], note: "The safety net. If the text does not parse, or the tool name is unknown, we build an error Observation that lists the valid tools." },
            { lines: [35, 38], note: "Count the slips, append the Observation ourselves, and print the trace. The last line reports how many model calls the run needed." }
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Change `range(1, 9)` to `range(1, 4)`. Predict the last line of the trace and whether a Final Answer is printed. What does the summary line say then?",
          "Change the error text to just `\"Error.\"` (keep the word Error). The scripted model still recovers, but think about a real model: what information did it lose, and how might call 2 go wrong?",
          "Make the `price` tool forgiving: look up `item.rstrip(\"s\")` instead of `item`. Predict the new number of model calls and slips before you run it."
        ] },
        { type: "check", question: "The run needed 6 model calls, but a perfect run needs only 4 (two prices, one sum, one final answer). Using the 1 + 4 × (k − 1) rule from the worked example, how many scratchpad lines does the last call read in each case?", answer: "The last call is call 6 in our run: 1 + 4 × 5 = 21 lines. In a perfect run it is call 4: 1 + 4 × 3 = 13 lines. The two slips added 8 lines that every later call had to re-read. Slips cost twice: an extra model call each, and a longer scratchpad for the rest of the run." },
        { type: "check", question: "In step 1 the model wrote a well-formed Action for a tool called `lookup`. Why do we send back an error Observation rather than quietly running `price`, the closest match?", answer: "Guessing what the model meant hides the mistake and can run the wrong tool, which is risky when tools have side effects. An explicit error keeps the transcript honest: the model sees what went wrong and what the valid choices are, and the fix shows up in its next Thought. It also keeps the rule simple: our code only runs tools that are named exactly." }
      ]
    }
  ],
  quiz: [
    { q: "What does each iteration of a ReAct agent consist of?", options: ["Plan → Execute → Replan", "Thought → Action → Observation", "Generate → Critique → Revise", "Retrieve → Rerank → Generate"], answer: 1, explain: "ReAct interleaves a written Thought, a tool Action, and the resulting Observation. Plan-Execute-Replan and Generate-Critique-Revise are other agent designs covered in this module." },
    { q: "Our ReAct agent's transcripts contain Observation lines with facts that no tool ever returned. What is the most likely fix?", options: ["Increase max steps so the agent has time to call the real tool", "Remove the Thought lines so the model focuses on tool calls", "Add “Observation:” as a stop sequence so only our code writes them", "Lower the temperature to zero so the model stops inventing facts"], answer: 2, explain: "Without a stop sequence the model keeps generating and invents its own Observation. Stopping at “Observation:” ensures observations come only from real tool executions." },
    { q: "Which weakness of chain-of-thought-only reasoning does ReAct mainly address?", options: ["It uses too few tokens to think through multi-step problems", "It cannot do any arithmetic at all unless it calls a calculator tool", "It reasons from facts in memory that may be hallucinated or outdated", "It needs fine-tuning on reasoning traces before it works well"], answer: 2, explain: "Reason-only models can confidently reason from wrong facts. ReAct grounds each reasoning step in observations from tools." },
    { q: "In the code example, the scratchpad ends with 15 lines. Which of these lines did the program (not the model) write?", options: ["The Thought lines", "The Action Input lines", "The Final Answer line", "The Observation lines"], answer: 3, explain: "The model generates Thoughts, Actions, Action Inputs and the Final Answer. The program runs the tool and appends each Observation." },
    { q: "Which statement about ReAct and AI agents is a misconception?", options: ["ReAct is one specific design within the broader category of AI agents", "ReAct writes a complete plan first, then executes it without further reasoning", "Many modern tool-calling agents follow a ReAct-like pattern even without the text template", "ReAct needs one model call per step, so long tasks get expensive"], answer: 1, explain: "ReAct decides one step at a time, reasoning after every observation. Writing a full plan first is Plan-and-Execute. The other three statements are accurate." }
  ],
  takeaways: [
    "ReAct = Reasoning + Acting: Thought → Action → Observation, repeated until a Final Answer.",
    "Reasoning guides which tool to use; observations ground reasoning in real data and reduce hallucination.",
    "ReAct is one design inside the general AI-agent family, deciding one step at a time.",
    "Only code writes observations: use a stop sequence and a robust parser (or native tool calls).",
    "Guard against loops and context bloat with step limits, duplicate detection and compact observations."
  ],
  terms: [
    { term: "ReAct", def: "An agent design that interleaves written reasoning (Thought) with tool use (Action) and results (Observation)." },
    { term: "Thought", def: "The model's short natural-language reasoning about what it knows and what to do next." },
    { term: "Observation", def: "The tool's real output, appended to the transcript by the program, never by the model." },
    { term: "Scratchpad", def: "The growing transcript of all previous Thought, Action and Observation lines sent to the model each step." },
    { term: "Stop sequence", def: "A string that makes the model stop generating when it is produced, such as “Observation:”." },
    { term: "Multi-hop question", def: "A question that needs several facts found in separate steps before it can be answered." }
  ]
};
