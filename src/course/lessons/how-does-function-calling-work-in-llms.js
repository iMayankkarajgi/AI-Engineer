export default {
  id: "how-does-function-calling-work-in-llms",
  minutes: 25,
  hook: "If a language model can only output text, how does it “check the weather”, “query a database” or “book a meeting”?",
  summary: "Function calling (also called tool calling) lets an LLM ask our application to run a function. We describe the available functions with names, descriptions and JSON Schemas; the model replies with a structured request naming a function and its arguments; our code runs it and sends the result back; the model then answers using that result. The model never executes anything itself, which is exactly what makes the pattern safe and controllable.",
  sections: [
    {
      id: "what-is-function-calling",
      title: "What is function calling?",
      blocks: [
        { type: "p", text: "**Function calling** is a feature of modern LLM APIs where, instead of replying with ordinary text, the model can reply with a **structured request to call a function** that we told it about. The request contains the function's name and the arguments to pass, written as JSON (JavaScript Object Notation, a simple text format for data like `{\"city\": \"Paris\"}`)." },
        { type: "p", text: "Vendors use slightly different names: OpenAI says *function calling* or *tool calling*, Anthropic says *tool use*, Google says *function calling*. The idea is the same everywhere. In this lesson, **tool** and **function** mean the same thing: a piece of our code the model may ask us to run." },
        { type: "callout", tone: "analogy", title: "Think of it like a head chef and a kitchen", text: "The head chef (the LLM) never touches the stove. They shout precise orders: “Two eggs, fried, three minutes.” The kitchen staff (our code) cook and bring the plate back. The chef tastes it and decides what to say to the customer. The orders must follow the menu (the function definitions), and the kitchen can refuse an order that is not on it." }
      ]
    },
    {
      id: "why-we-need-it",
      title: "Why we need function calling",
      blocks: [
        { type: "p", text: "An LLM on its own has three hard limits:" },
        { type: "list", items: [
          "**Frozen knowledge**: it only knows what was in its training data, up to a cutoff date. It cannot know today's weather or your latest order.",
          "**No access to private data**: it has never seen your company's database, calendar or tickets.",
          "**No ability to act**: it cannot send an email, create a ticket or run code. It can only write text about doing so."
        ] },
        { type: "p", text: "Before function calling was built into APIs (OpenAI added it in June 2023, and other vendors followed), developers asked the model in the prompt to “reply in this exact format if you need the weather”, then parsed the text with regular expressions. It worked, but the model often drifted from the format and parsing broke. Function calling turned this into a first-class, trained behaviour with a predictable, machine-readable output." },
        { type: "check", question: "A user asks a plain LLM (no tools) “What is the price of order #4812?” What is the best case and the worst case?", answer: "Best case: it says it cannot access order data. Worst case: it invents a plausible price (a hallucination). With a `get_order(order_id)` tool, the model can ask our code for the real record instead of guessing." }
      ]
    },
    {
      id: "model-does-not-run",
      title: "The key insight: the model does not run the function",
      blocks: [
        { type: "p", text: "This is the single most important point of the lesson, and the most common misunderstanding. **The LLM never executes your function.** It cannot reach your servers. All it does is produce text (structured as a tool call) saying *which* function it would like called and *with what arguments*." },
        { type: "p", text: "Our application receives that request and decides what to do with it. Usually we run the function, but we are in full control. We can:" },
        { type: "list", items: [
          "**Validate** the arguments (is `amount` a positive number below the limit?).",
          "**Check permissions** (is this user allowed to see that account?).",
          "**Ask a human** to approve before anything irreversible (sending money, deleting data).",
          "**Refuse** and send back an error message, which the model can read and react to.",
          "**Log** every call for debugging and auditing."
        ] },
        { type: "callout", tone: "warn", title: "Common mistake", text: "Treating the model's arguments as trusted. They are generated text: they can be wrong, malformed, or even shaped by a malicious document the model just read (prompt injection). Always validate tool arguments the same way you would validate input from an untrusted web form." },
        { type: "p", text: "How does the model know how to produce these requests? Models are fine-tuned on many examples of tool definitions and tool calls. When we send tool definitions through the API, the provider renders them into the model's prompt in a special format, and the model has learned to emit a tool call in a matching format when it judges a tool is needed. The API then parses that output and hands it to us as a clean JSON object." }
      ]
    },
    {
      id: "step-by-step",
      title: "How function calling works step by step",
      blocks: [
        { type: "steps", title: "One function call, end to end",
          items: [
            { title: "Define the tools", text: "We describe each function: a `name`, a plain-language `description` of what it does and when to use it, and a JSON Schema for its parameters (types, required fields, allowed values)." },
            { title: "Send the request", text: "We call the LLM API with the conversation messages plus the tool definitions." },
            { title: "The model decides", text: "The model reads the question and the tool descriptions. It either answers directly with text, or returns one or more tool calls, each with an `id`, a `name`, and `arguments`." },
            { title: "Our code executes", text: "We parse the arguments, validate them, and run the real function (an API call, a database query, anything)." },
            { title: "Send the result back", text: "We append the model's tool-call message and a tool-result message (linked by the call `id`) to the conversation, and call the API again." },
            { title: "The model answers", text: "Now the model sees the real data and writes the final reply for the user, or asks for another tool if it still needs more." }
          ] },
        { type: "flow", title: "The round trip", loop: false,
          nodes: [
            { label: "User question", detail: "“What's the weather in Paris?” plus the tool list goes to the API." },
            { label: "Model: tool call", detail: "Returns {name: get_weather, arguments: {\"city\": \"Paris\"}} instead of text." },
            { label: "App runs function", detail: "Our code validates the arguments and calls the real weather service." },
            { label: "Tool result", detail: "{\"temp_c\": 18, \"sky\": \"cloudy\"} is sent back, tagged with the call id." },
            { label: "Model: final answer", detail: "“It's 18 °C and cloudy in Paris right now.”" }
          ] },
        { type: "p", text: "Most APIs also let us steer *whether* tools are used with a setting usually called `tool_choice`: let the model decide (auto), forbid tools (none), require some tool, or force one specific tool. Forcing a tool is a handy trick for reliable data extraction." }
      ]
    },
    {
      id: "get-weather-example",
      title: "A concrete example: get_weather(city)",
      blocks: [
        { type: "p", text: "Here is what the messages look like on the wire. The exact field names differ by vendor, so we show the two most common shapes side by side. Read them as data, not as something to memorise." },
        { type: "tabs", items: [
          { label: "OpenAI-style", blocks: [
            { type: "code", lang: "json", title: "Tool definition, model reply, and our tool result", code: `// 1. tool definition we send
{"type": "function",
 "function": {"name": "get_weather",
              "description": "Current weather for a city.",
              "parameters": {"type": "object",
                             "properties": {"city": {"type": "string"}},
                             "required": ["city"]}}}

// 2. the model's reply (no text, just a tool call)
{"role": "assistant",
 "tool_calls": [{"id": "call_1", "type": "function",
                 "function": {"name": "get_weather",
                              "arguments": "{\\"city\\": \\"Paris\\"}"}}]}

// 3. the message we append after running the function
{"role": "tool", "tool_call_id": "call_1",
 "content": "{\\"temp_c\\": 18, \\"sky\\": \\"cloudy\\"}"}` },
            { type: "p", text: "Note that `arguments` arrives as a **JSON string** that we must parse, and it can in principle be invalid, so parse it inside error handling." }
          ] },
          { label: "Anthropic-style", blocks: [
            { type: "code", lang: "json", title: "Tool definition, model reply, and our tool result", code: `// 1. tool definition we send
{"name": "get_weather",
 "description": "Current weather for a city.",
 "input_schema": {"type": "object",
                  "properties": {"city": {"type": "string"}},
                  "required": ["city"]}}

// 2. the model's reply: a content block of type tool_use
{"role": "assistant",
 "content": [{"type": "tool_use", "id": "toolu_1",
              "name": "get_weather", "input": {"city": "Paris"}}]}

// 3. we reply with a user message holding a tool_result block
{"role": "user",
 "content": [{"type": "tool_result", "tool_use_id": "toolu_1",
              "content": "{\\"temp_c\\": 18, \\"sky\\": \\"cloudy\\"}"}]}` },
            { type: "p", text: "Here the arguments arrive already parsed as an object called `input`, and the response's stop reason tells us the model stopped to use a tool." }
          ] }
        ] },
        { type: "p", text: "Now let us run the whole round trip. To keep it runnable offline, `fake_model` plays the role of the API, returning exactly the kind of message a real model would. The rest of the code (tool schema, argument parsing, validation, the tool message, the second call) is what you would write in production." },
        { type: "code", lang: "python", title: "function_calling.py", code: `import json

# 1. The tool definition we send to the model (name, description, JSON Schema).
TOOLS = [{"name": "get_weather",
          "description": "Current weather for a city.",
          "parameters": {"type": "object",
                         "properties": {"city": {"type": "string"}},
                         "required": ["city"]}}]

def get_weather(city):                       # our real code (fake data here)
    data = {"Paris": (18, "cloudy"), "Tokyo": (24, "sunny")}
    temp, sky = data.get(city, (None, "unknown"))
    return {"city": city, "temp_c": temp, "sky": sky}

def fake_model(messages, tools):
    """Stands in for the LLM API. Turn 1: ask for tools. Turn 2: answer."""
    if messages[-1]["role"] == "user":
        return {"role": "assistant", "tool_calls": [
            {"id": "call_1", "name": "get_weather", "arguments": '{"city": "Paris"}'},
            {"id": "call_2", "name": "get_weather", "arguments": '{"city": "Tokyo"}'}]}
    w = [json.loads(m["content"]) for m in messages if m["role"] == "tool"]
    return {"role": "assistant", "content": " | ".join(
        f"{x['city']}: {x['temp_c']} C, {x['sky']}" for x in w)}

messages = [{"role": "user", "content": "Weather in Paris and Tokyo?"}]
reply = fake_model(messages, TOOLS)
messages.append(reply)
for call in reply.get("tool_calls", []):     # 2. the APP executes each call
    args = json.loads(call["arguments"])     # arguments arrive as a JSON string
    missing = [k for k in TOOLS[0]["parameters"]["required"] if k not in args]
    result = {"error": f"missing {missing}"} if missing else get_weather(**args)
    print("model asked:", call["name"], args, "->", result)
    messages.append({"role": "tool", "tool_call_id": call["id"],
                     "content": json.dumps(result)})
final = fake_model(messages, TOOLS)          # 3. model sees results, answers
print("final answer:", final["content"])
print("messages in history:", len(messages))`, output: `model asked: get_weather {'city': 'Paris'} -> {'city': 'Paris', 'temp_c': 18, 'sky': 'cloudy'}
model asked: get_weather {'city': 'Tokyo'} -> {'city': 'Tokyo', 'temp_c': 24, 'sky': 'sunny'}
final answer: Paris: 18 C, cloudy | Tokyo: 24 C, sunny
messages in history: 4`,
          walkthrough: [
            { lines: [3, 8], note: "The tool definition: a name, a description the model reads to decide when to use it, and a JSON Schema saying `city` is a required string." },
            { lines: [10, 13], note: "The real function. Here it returns canned data; in production it would call a weather API." },
            { lines: [15, 23], note: "The stand-in for the LLM API. On the first call it returns two tool calls (one per city) and no text. On the second call, after seeing tool results, it writes the answer from those results." },
            { lines: [25, 27], note: "Send the user message, get the model's reply, and append it to the history. The assistant tool-call message must stay in the history so the results can be matched to it." },
            { lines: [28, 34], note: "Our code executes each call: parse the JSON-string arguments, check required fields, run the function, and append a `tool` message tagged with the matching `tool_call_id`." },
            { lines: [35, 37], note: "Call the model again with the results. It now answers in plain text. The history has 4 messages: user, assistant (tool calls), and two tool results." }
          ] }
      ]
    },
    {
      id: "conversation-loop",
      title: "The conversation loop",
      blocks: [
        { type: "p", text: "A single question may need several rounds: the model asks for a tool, reads the result, then asks for another. So in practice we wrap the API call in a loop:" },
        { type: "list", ordered: true, items: [
          "Call the model with the messages and tools.",
          "If the reply contains tool calls, run them, append the results, and go back to step 1.",
          "If the reply is plain text with no tool calls, that is the final answer: stop.",
          "As a safety net, stop after a maximum number of rounds."
        ] },
        { type: "p", text: "That loop is the heart of every AI agent. The next lesson studies it in detail. One rule to keep in mind now: **the history must stay consistent**. Every tool call the model makes needs exactly one matching result message with the same id, in order. APIs usually reject a history where a tool call has no result." },
        { type: "callout", tone: "tip", title: "Errors are results too", text: "If a function fails, do not crash the loop. Send the error back as the tool result, for example `{\"error\": \"city not found: Pariss\"}`. Models are good at reading an error and retrying with corrected arguments." }
      ]
    },
    {
      id: "multi-step-and-parallel",
      title: "Multi-step and parallel function calling",
      blocks: [
        { type: "p", text: "There are two different ways a model can need more than one call:" },
        { type: "list", items: [
          "**Multi-step (sequential)**: each call depends on the previous result. Example: `find_user(email)` returns an id, then `get_orders(user_id)` needs that id. These must happen in separate rounds.",
          "**Parallel**: the calls are independent. Example: weather in Paris *and* Tokyo. Many models can return several tool calls in one reply, and our code can run them at the same time."
        ] },
        { type: "chart", kind: "bar", title: "Model round trips for “weather in 3 cities”", yLabel: "Model API calls", labels: ["One call per turn", "Parallel calls in one turn"],
          series: [ { name: "Model API calls", values: [4, 2] } ],
          caption: "Exact count, not a measurement: one tool per turn needs 3 tool-calling turns plus 1 answer turn; parallel calls need 1 tool-calling turn plus 1 answer turn. Fewer round trips means lower latency and less repeated input." },
        { type: "p", text: "Our Python example above already used parallel calls: one reply asked for both Paris and Tokyo. Parallel calling is a big latency win, but only for independent calls. If the second call needs the first call's output, the model must wait for it." },
        { type: "check", question: "A model is asked: “Find the customer with email ana@example.com and list her last three orders.” Can both tool calls be made in parallel?", answer: "No. `get_orders` needs the customer id that `find_customer` returns, so the calls are sequential: two separate rounds. Parallel calling only applies when the calls do not depend on each other." }
      ]
    },
    {
      id: "structured-outputs",
      title: "Relation to structured outputs and JSON mode",
      blocks: [
        { type: "p", text: "Function calling is one member of a family of features that make LLM output machine-readable. It helps to separate three ideas:" },
        { type: "compare", title: "JSON mode vs structured outputs vs function calling",
          options: [
            { name: "JSON mode", summary: "The model is constrained to output syntactically valid JSON.", pros: ["Always parseable"], cons: ["No guarantee about which fields appear or their types"], bestFor: "Quick prototypes needing any JSON" },
            { name: "Structured outputs", summary: "The output is forced to match a JSON Schema we provide, typically via constrained decoding.", pros: ["Fields and types guaranteed (within supported schema features)"], cons: ["Some schema features may be unsupported", "Still no guarantee the values are correct"], bestFor: "Extraction: turn a document into a fixed record" },
            { name: "Function calling", summary: "The model chooses whether to call a tool, which tool, and with what arguments.", pros: ["Model decides when and what", "Enables actions and multi-step loops"], cons: ["Arguments must still be validated unless strict mode is on"], bestFor: "Agents and assistants that act" }
          ],
          rows: [
            ["Who decides to produce structure", "We do (always)", "We do (always)", "The model (when it needs a tool)"],
            ["Schema enforced", "No, only valid JSON", "Yes", "Optional strict mode on some APIs"],
            ["Leads to an action", "No", "No", "Yes, our code runs it"]
          ],
          verdict: "Use structured outputs when you always want the same record back; use function calling when the model should decide whether and how to act. Some APIs offer a strict mode that applies schema enforcement to tool arguments too." },
        { type: "p", text: "**Constrained decoding** means that while generating, the model is only allowed to pick tokens that keep the output valid against a grammar or schema. That guarantees *shape*, not *truth*: a perfectly valid `{\"city\": \"Paris\"}` can still be the wrong city." }
      ]
    },
    {
      id: "real-world-use",
      title: "Real-world use: the backbone of AI agents",
      blocks: [
        { type: "p", text: "Almost every LLM product that *does* something runs on function calling:" },
        { type: "table", caption: "Typical tools in real products",
          head: ["Product", "Example tools", "Why function calling fits"],
          rows: [
            ["Support assistant", "get_order, check_policy, create_ticket", "Needs private, live data and safe, limited actions."],
            ["Coding agent", "read_file, edit_file, run_tests, search_code", "Every step depends on what the last one revealed."],
            ["Data assistant", "run_sql, plot_chart", "The model writes the query; the database computes the exact answer."],
            ["Personal assistant", "list_events, create_event, send_email", "Actions need user approval, which the app enforces between call and execution."]
          ] },
        { type: "callout", tone: "example", title: "Writing good tool definitions", text: "Treat descriptions as documentation for a new colleague. Say what the tool does, when to use it, and when not to. Use clear parameter names (`order_id`, not `x`), enums for fixed choices (`\"unit\": \"celsius\" | \"fahrenheit\"`), and keep the tool list short. Too many similar tools confuse models and bloat every prompt." },
        { type: "p", text: "**Quick summary.** We describe functions with a name, a description and a JSON Schema. The model replies with a structured call, never running anything itself. Our code validates and executes the call, returns the result tagged with the call id, and calls the model again. Independent calls can run in parallel; dependent calls need multiple rounds. Wrap that in a loop with a step limit, and you have the core of an AI agent." }
      ]
    },
    {
      id: "common-mistakes",
      title: "Common mistakes and how to spot them",
      blocks: [
        { type: "p", text: "Most function-calling bugs show up in one of two places: the tool call the model wrote, or the history we send back. The good news is that each bug leaves a clear trace. If we log every tool call and every tool result, we can usually name the problem in a minute." },
        { type: "table", caption: "Symptoms we see in logs, the likely cause, and the fix",
          head: ["Symptom", "Likely cause", "Fix"],
          rows: [
            ["The model answers from memory and never calls the tool", "The description does not say when to use the tool, or the question does not match it", "Rewrite the description with a clear “use this when…” line; force the tool if it must always run"],
            ["A call names a tool that does not exist", "Similar tool names, or a tool the model has seen elsewhere", "Return an error result listing the valid names; keep names distinct"],
            ["Arguments have the wrong type, such as `\"ten\"` for a number", "Loose schema, or vague parameter names", "Tighter schema with types and enums; validate in code; use strict mode where the API offers it"],
            ["The arguments string does not parse as JSON", "Output was cut off by the token limit, or the model drifted", "Parse inside error handling; raise the output limit; send the parse error back"],
            ["The API rejects our second request", "A tool call in the history has no result with the same id", "Append exactly one result per call, including for failed calls"],
            ["The model calls the right tool with a made-up id or name", "It had to guess a value it never saw", "Give it a lookup tool first, or tell it to ask the user when a value is unknown"]
          ] },
        { type: "p", text: "When a call is broken, the order of our checks matters. Each check assumes the one before it passed." },
        { type: "steps", title: "A safe order for checking one tool call",
          items: [
            { title: "Is the tool known?", text: "Look the name up in our own table of functions. Never build a function name from model text and run it." },
            { title: "Do the arguments parse?", text: "Turn the JSON string into data. A parse failure is a normal event, not a crash." },
            { title: "Are the fields present and the right type?", text: "Compare against the schema: required fields, types, allowed values." },
            { title: "Is the call allowed?", text: "Business rules and permissions: may this user do this, and is the amount within limits?" },
            { title: "Run it and report back", text: "Whether a check failed or the function ran, send one result with the call id. A clear error message is what lets the model fix its own call." }
          ] }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build the part of the app that sits between the model and our functions: a dispatcher. It takes a tool call, checks it in the safe order above, runs it, and always returns a result message. We feed it one good call and four broken ones to see every path." },
        { type: "code", lang: "python", title: "practice_tool_dispatcher.py", code: `import json

# One tool: its schema says which arguments it needs and their Python types.
SCHEMAS = {"convert": {"amount": float, "to": str}}
RATES = {"EUR": 0.5, "INR": 80.0}            # made-up rates, easy to check

def convert(amount, to):                     # the real function
    return {"amount": amount * RATES[to], "currency": to}

FUNCS = {"convert": convert}

def dispatch(call):
    """Validate one tool call, run it, and always return a result message."""
    name, raw = call["name"], call["arguments"]
    try:
        if name not in FUNCS:
            raise ValueError(f"unknown tool '{name}'")
        args = json.loads(raw)               # arguments arrive as a JSON string
        for key, typ in SCHEMAS[name].items():
            if key not in args:
                raise ValueError(f"missing argument '{key}'")
            if isinstance(args[key], int) and typ is float:
                args[key] = float(args[key])  # 10 is a fine float
            if not isinstance(args[key], typ):
                raise ValueError(f"'{key}' must be {typ.__name__}")
        if args["to"] not in RATES:
            raise ValueError(f"'to' must be one of {sorted(RATES)}")
        result = FUNCS[name](**args)
    except (ValueError, json.JSONDecodeError) as e:
        result = {"error": str(e)}           # errors go back as results
    return {"role": "tool", "tool_call_id": call["id"], "content": json.dumps(result)}

# Five calls a model might produce: one good, four broken in different ways.
calls = [{"id": "c1", "name": "convert", "arguments": '{"amount": 10, "to": "EUR"}'},
         {"id": "c2", "name": "convert", "arguments": '{"amount": "ten", "to": "EUR"}'},
         {"id": "c3", "name": "convert", "arguments": '{"amount": 10}'},
         {"id": "c4", "name": "convert", "arguments": '{"amount": 10, "to": "EUR"'},
         {"id": "c5", "name": "exchange", "arguments": '{"amount": 10, "to": "INR"}'}]
for c in calls:
    print(c["id"], "->", dispatch(c)["content"])`, output: `c1 -> {"amount": 5.0, "currency": "EUR"}
c2 -> {"error": "'amount' must be float"}
c3 -> {"error": "missing argument 'to'"}
c4 -> {"error": "Expecting ',' delimiter: line 1 column 27 (char 26)"}
c5 -> {"error": "unknown tool 'exchange'"}`,
          walkthrough: [
            { lines: [3, 10], note: "A small schema, some made-up rates, the real function, and a table that maps tool names to functions." },
            { lines: [12, 28], note: "The checks, in order: known tool, parseable JSON, required fields and types, then an allowed-values rule. Only after all of them does the function run." },
            { lines: [29, 31], note: "Any failure becomes an `error` result. Success or failure, we return exactly one tool message carrying the call id." },
            { lines: [33, 40], note: "Five calls a model might write. Compare each one with its line of output." }
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Change call `c1` to `\"to\": \"USD\"`. Predict which check catches it and the exact error text before you run it.",
          "Change call `c3` to `'{\"amount\": 10, \"to\": 5}'`. Predict whether the message will talk about a missing argument or a wrong type.",
          "Remove `json.JSONDecodeError` from the `except` line, leaving only `ValueError`, and run again. Predict what happens at `c4`. (Hint: check whether `JSONDecodeError` is a kind of `ValueError`.) Then remove the whole `try`/`except` and predict again."
        ] },
        { type: "check", question: "Call `c2` and call `c4` both fail, but they fail at different checks. Why is it useful that the two error messages are different?", answer: "The error text is what the model reads on the next turn. “'amount' must be float” tells it to send a number. A parse error tells it the JSON itself was malformed, which often means the output was cut off. A single vague message like “bad call” would leave the model guessing and it might repeat the same mistake." },
        { type: "check", question: "Suppose the dispatcher raised an exception for `c5` instead of returning an error result. What two things would go wrong?", answer: "First, the program would stop, so one bad call would end the whole conversation. Second, the history would hold a tool call `c5` with no matching result, and many APIs reject such a history. Returning an error result keeps the history consistent and gives the model a chance to pick the correct tool name." }
      ]
    }
  ],
  quiz: [
    { q: "During function calling, where does the function actually execute?", options: ["Inside the LLM's neural network, as part of generating the reply", "On the LLM provider's servers, which run every defined tool automatically", "In our application code, after the model returns a tool-call request", "In the user's browser by default, via the provider's JavaScript SDK"], answer: 2, explain: "The model only outputs a structured request. Our application decides whether to run it, validates the arguments, executes it, and sends the result back. (Some providers offer built-in hosted tools, but for your own functions it is always your code.)" },
    { q: "Our bot sometimes calls `issue_refund` with a negative amount. What is the most robust fix?", options: ["Add a firm instruction to the system prompt forbidding negative amounts", "Validate arguments in code and return an error to the model if invalid", "Switch to a larger model, which makes fewer mistakes with numbers", "Remove the tool's description so the model calls it less often"], answer: 1, explain: "Tool arguments are untrusted generated text. Validation in code is a hard guarantee; prompting helps but is not a guarantee. Returning an error lets the model correct itself." },
    { q: "A user asks for the weather in 3 cities. With parallel function calling, how many model API calls does the round trip need at minimum?", options: ["1", "2", "3", "4"], answer: 1, explain: "One call where the model returns all three tool calls at once, then one call with the three results so it can write the answer: 2 in total. Without parallel calls it would be 4." },
    { q: "What is the difference between JSON mode and structured outputs?", options: ["JSON mode ensures valid JSON but no set schema; structured outputs enforce our schema", "JSON mode is meant for tool calls, while structured outputs are meant for chat", "They are two names for one feature that providers simply label differently", "Structured outputs also guarantee that the values are factually correct"], answer: 0, explain: "JSON mode ensures parseable JSON only. Structured outputs constrain generation to match our schema. Neither guarantees the values are correct." },
    { q: "Which statement is a misconception?", options: ["Tool descriptions influence when, and how often, the model chooses a tool", "Each tool call needs a matching result message carrying the same call id", "Since the model returns valid JSON, its arguments can be trusted unchecked", "A tool error can be sent back to the model as a result message so it can retry"], answer: 2, explain: "Valid shape is not valid content. Arguments can be wrong or influenced by prompt injection, so they must be validated. The other statements are correct practices." }
  ],
  takeaways: [
    "Function calling lets a model request that our code run a function; it returns a name plus JSON arguments.",
    "The model never executes anything; our app validates, authorises, runs and logs every call.",
    "Results go back as tool messages linked by call id, then the model is called again.",
    "Independent calls can be parallel in one turn; dependent calls need sequential rounds.",
    "Structured outputs fix the shape of a response; function calling lets the model decide to act."
  ],
  terms: [
    { term: "Function calling (tool use)", def: "An LLM API feature where the model returns a structured request to call a described function instead of plain text." },
    { term: "Tool definition", def: "The name, description and JSON Schema of parameters we send so the model knows what it can call." },
    { term: "JSON Schema", def: "A standard way to describe the shape of JSON data: field names, types, required fields and allowed values." },
    { term: "Tool result", def: "The message we send back with the output (or error) of a function, linked to the call by its id." },
    { term: "Parallel function calling", def: "The model returning several independent tool calls in one reply so they can run together." },
    { term: "Constrained decoding", def: "Restricting which tokens the model may generate so the output always matches a grammar or schema." }
  ]
};
