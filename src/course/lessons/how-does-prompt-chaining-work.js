export default {
  id: "how-does-prompt-chaining-work",
  minutes: 17,
  hook: "What if, instead of asking one giant prompt to do five jobs at once, we let the model do one job at a time and check its work in between?",
  summary: "Prompt chaining splits a complex task into a sequence of smaller LLM calls, where the output of one call becomes the input of the next. Between calls, ordinary code can validate, route or transform the data. Chains are easier to debug, test and control than one big prompt, at the price of more calls, more latency and the risk that an early mistake flows downstream.",
  sections: [
    {
      id: "prompt-and-chaining",
      title: "What is a prompt, and what is prompt chaining?",
      blocks: [
        { type: "p", text: "A **prompt** is the text we send to a large language model (LLM): instructions, examples, data and the question. The model reads the prompt and generates a response, one token (a small piece of text) at a time. One prompt in, one response out: that is a single **LLM call**." },
        { type: "p", text: "**Prompt chaining** is a design pattern where we break a task into several steps and give each step its own LLM call with its own focused prompt. The output of step 1 is placed into the prompt of step 2, and so on. In between, our own code can check, reshape or branch on the results. The whole sequence is called a **chain**." },
        { type: "callout", tone: "analogy", title: "Think of it like an assembly line", text: "A car factory does not ask one worker to build a whole car. One station fits the frame, the next adds the engine, an inspector checks the welds, and only then does the car move on. Each station has one clear job and a quality check. A prompt chain is an assembly line for text." },
        { type: "p", text: "Our running example: an online shop receives a customer review: *“Ordered the X200 blender on May 2. It arrived cracked and support never replied. I want a refund.”* We want the system to understand it, decide what kind of case it is, and draft a polite reply." }
      ]
    },
    {
      id: "why-chaining",
      title: "Why do we need prompt chaining?",
      blocks: [
        { type: "p", text: "We could write one long prompt: “Read this review, extract the product and issue, decide whether it is a refund, return or question, write a reply under 40 words in our brand voice, and output JSON.” Modern models often manage it. But as the instruction list grows, several problems appear:" },
        { type: "list", items: [
          "**Instructions compete.** With many requirements in one prompt, the model tends to satisfy most of them and quietly drop one, and which one it drops can change from run to run.",
          "**Hard to debug.** When the final reply is wrong, we cannot tell whether extraction, classification or writing failed.",
          "**No checkpoints.** We cannot stop and validate an intermediate result, because there is none: everything happens in one response.",
          "**One size for everything.** Every sub-task uses the same model, temperature and prompt, even though extraction wants precision and writing wants fluency."
        ] },
        { type: "p", text: "Chaining fixes these by giving each sub-task a short, specific prompt and by placing **plain code** between the steps. The model does the language work; code does the checking, which code is very good at." },
        { type: "check", question: "Pause and predict: a one-prompt pipeline sometimes writes a lovely reply that promises a refund for a customer who only asked a question. With a chain, where would we catch this?", answer: "At the classification step. Because classification is its own call with its own output (“refund”, “return” or “question”), code can branch on it and only run the refund-reply prompt when the label is “refund”. We can also log and test that step on its own." }
      ]
    },
    {
      id: "how-it-works",
      title: "How does prompt chaining work, step by step?",
      blocks: [
        { type: "steps", title: "Building and running a chain", items: [
          { title: "Decompose the task", text: "Write down the sub-tasks a careful human would do in order. For our review: extract facts → classify the case → draft a reply → check the reply." },
          { title: "Write one focused prompt per step", text: "Each prompt does one thing and asks for an output format the next step can use, often JSON or a single label." },
          { title: "Pass outputs forward", text: "Insert the previous step's output into the next prompt, usually inside clear delimiters such as `<facts>...</facts>`. Pass only what the next step needs." },
          { title: "Add gates between steps", text: "A gate is a code check: is this valid JSON? Are the required fields present? Is the label one of the allowed values? If not, retry the step or stop." },
          { title: "Branch when needed", text: "Code can choose the next prompt based on a result, for example a refund template vs a question template." },
          { title: "Log every step", text: "Store each step's input and output so we can find which link broke when something goes wrong." }
        ] },
        { type: "flow", title: "Our review-handling chain", nodes: [
          { label: "Review", detail: "Raw text from the customer: product, problem and request are mixed together." },
          { label: "Extract", detail: "LLM call 1 returns JSON: product, issue, request, sentiment." },
          { label: "Gate", detail: "Code checks the JSON parses and has all required keys. On failure: retry or stop." },
          { label: "Classify", detail: "LLM call 2 returns one label: refund, return or question." },
          { label: "Draft", detail: "LLM call 3 writes the reply using the extracted facts and the refund template." },
          { label: "Check", detail: "Code (or a small LLM call) checks length, tone and that no forbidden promises were made." }
        ] }
      ]
    },
    {
      id: "real-example",
      title: "A real example of prompt chaining",
      blocks: [
        { type: "p", text: "Here are the actual prompts a team might write for the chain above. Notice how small each one is." },
        { type: "table", caption: "One focused prompt per step", head: ["Step", "Prompt (shortened)", "Output"], rows: [
          ["1. Extract", "“From the review in <review> tags, return JSON with keys product, issue, request, sentiment. Use null if missing.”", "`{\"product\": \"X200 blender\", \"issue\": \"arrived cracked\", ...}`"],
          ["2. Classify", "“Given these facts, answer with exactly one word: refund, return or question.”", "`refund`"],
          ["3. Draft", "“Write a reply under 40 words, apologetic and specific, using these facts. Do not promise dates.”", "A short reply"],
          ["4. Check", "Code: word count, banned phrases, required facts present. Optionally an LLM check for tone.", "pass / fail"]
        ] },
        { type: "p", text: "Another everyday chain is **summarize a long report**: step 1 splits it into sections and summarizes each one, step 2 merges the section summaries, step 3 rewrites the merged summary for a specific audience (for example executives). Each step is easy to inspect on its own." },
        { type: "callout", tone: "example", title: "Where chains show up in real products", text: "Document pipelines (extract → validate → store), content tools (outline → draft → edit → fact-check), coding assistants (plan → write code → run tests → fix), translation with review (translate → back-translate → compare), and RAG systems (rewrite the query → retrieve → answer → check citations) are all prompt chains." }
      ]
    },
    {
      id: "code",
      title: "Code example of prompt chaining",
      blocks: [
        { type: "p", text: "To keep it runnable anywhere, `llm()` is a stand-in that returns what a real model would plausibly return. In production we would replace its body with an API call. Everything else, the gate, the branch and the check, is exactly what we would write for real." },
        { type: "code", lang: "python", title: "review_chain.py", code: `import json

review = "Ordered the X200 blender on May 2. It arrived cracked and support never replied. I want a refund."

def llm(task, text):
    # Stand-in for a real model call: each task returns what a model might
    if task == "extract":
        return json.dumps({"product": "X200 blender", "issue": "arrived cracked",
                           "request": "refund", "sentiment": "negative"})
    if task == "classify":
        return "refund" if json.loads(text)["request"] == "refund" else "other"
    if task == "draft":
        d = json.loads(text)
        return (f"Sorry your {d['product']} {d['issue']}. "
                f"We have started a {d['request']} and will email you today.")

def gate_valid_json(text, keys):
    # A plain-code check between steps: stop early on bad output
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return False
    return all(k in data for k in keys)

step1 = llm("extract", review)
print("Step 1 (extract):", step1)
if not gate_valid_json(step1, ["product", "issue", "request"]):
    raise SystemExit("Gate failed: retry step 1")
print("Gate: valid JSON with all keys")

route = llm("classify", step1)          # output of step 1 is input of step 2
print("Step 2 (classify):", route)

if route == "refund":                   # branch on the result
    reply = llm("draft", step1)
    print("Step 3 (draft):", reply)
    n = len(reply.split())
    print(f"Step 4 (check): {n} words, under 40? {n <= 40}")`, output: `Step 1 (extract): {"product": "X200 blender", "issue": "arrived cracked", "request": "refund", "sentiment": "negative"}
Gate: valid JSON with all keys
Step 2 (classify): refund
Step 3 (draft): Sorry your X200 blender arrived cracked. We have started a refund and will email you today.
Step 4 (check): 16 words, under 40? True`,
          walkthrough: [
            { lines: [5, 15], note: "A fake `llm(task, text)`. Each task stands for a separate, focused prompt. Swap this for a real API call." },
            { lines: [17, 23], note: "The gate: plain code that checks the JSON parses and contains the keys later steps need." },
            { lines: [25, 29], note: "Step 1 runs, then the gate. If it fails we stop (or retry) instead of passing garbage forward." },
            { lines: [31, 32], note: "Step 2 receives step 1's output as its input. That hand-off is the “chain”." },
            { lines: [34, 38], note: "Code branches on the label, step 3 drafts, and step 4 checks the length with ordinary Python." }
          ] }
      ]
    },
    {
      id: "patterns",
      title: "Common patterns in prompt chaining",
      blocks: [
        { type: "p", text: "Most real chains are built from a handful of shapes:" },
        { type: "list", items: [
          "**Sequential pipeline.** A → B → C. Each step transforms the previous output (extract → classify → draft).",
          "**Gate (validation).** Code checks an output and decides: continue, retry, or stop.",
          "**Routing (branching).** A classification step picks which prompt or which model runs next.",
          "**Parallel fan-out, then merge.** Run the same prompt on many pieces at once (summarize 10 chapters), then one call combines the results. This is often called map-reduce.",
          "**Generate → critique → revise.** One call drafts, a second call lists problems, a third call fixes them. Loop a fixed number of times or until a check passes."
        ] },
        { type: "compare", title: "One big prompt vs a prompt chain vs an agent",
          options: [
            { name: "Single prompt", summary: "Everything in one LLM call.", pros: ["Lowest latency", "Simplest to build", "Model sees full context at once"], cons: ["Instructions compete", "Hard to debug", "No checkpoints"], bestFor: "Simple tasks with few requirements" },
            { name: "Prompt chain", summary: "A fixed sequence of focused calls, designed by us.", pros: ["Each step testable", "Gates catch errors early", "Different model per step"], cons: ["More calls, more latency", "Errors can propagate", "We must design the steps"], bestFor: "Repeatable multi-stage tasks with a known shape" },
            { name: "Agent", summary: "The model decides its own next step and tool in a loop.", pros: ["Handles open-ended tasks", "Adapts to surprises"], cons: ["Less predictable", "Harder to test", "Cost varies per run"], bestFor: "Tasks whose steps cannot be known in advance" }
          ],
          rows: [
            ["Who decides the steps?", "Nobody: one step", "We do, in code", "The model, at run time"],
            ["Predictability", "Medium", "High", "Lower"],
            ["Debuggability", "Low", "High", "Medium (needs tracing)"]
          ],
          verdict: "If we can write the steps down in advance, use a chain. Reach for an agent only when the path truly depends on what the model discovers." }
      ]
    },
    {
      id: "advantages",
      title: "Advantages of prompt chaining",
      blocks: [
        { type: "list", items: [
          "**Accuracy.** Each call has one goal, so the model gives it its full attention.",
          "**Debuggability.** Logs show exactly which step produced a bad output.",
          "**Testability.** We can build a small test set for each step (for example 50 reviews with known labels for the classifier).",
          "**Control.** Code between steps enforces rules the model might ignore: allowed labels, length limits, required fields.",
          "**Cost tuning.** Cheap, fast models can handle easy steps (classification) and a stronger model only the hard ones (writing).",
          "**Reuse.** A good extraction step can feed several different downstream chains."
        ] },
        { type: "chart", kind: "line", title: "Why gates matter: end-to-end success of an n-step chain with no checks", xLabel: "Number of steps", yLabel: "Chance every step is right", series: [
          { name: "99% per step", points: [[1, 0.99], [2, 0.98], [3, 0.97], [4, 0.961], [5, 0.951], [6, 0.941], [7, 0.932], [8, 0.923]] },
          { name: "95% per step", points: [[1, 0.95], [2, 0.902], [3, 0.857], [4, 0.815], [5, 0.774], [6, 0.735], [7, 0.698], [8, 0.663]] },
          { name: "90% per step", points: [[1, 0.9], [2, 0.81], [3, 0.729], [4, 0.656], [5, 0.59], [6, 0.531], [7, 0.478], [8, 0.43]] }
        ], caption: "Computed as pⁿ, assuming steps fail independently and nothing catches errors. Gates with retries raise each step's effective success rate, which is why checks between steps are so valuable." }
      ]
    },
    {
      id: "take-care",
      title: "Things to take care of while using prompt chaining",
      blocks: [
        { type: "callout", tone: "warn", title: "Errors flow downstream", text: "If step 1 extracts the wrong product, every later step will confidently build on that mistake. The chart above shows how quickly per-step errors compound. Put a gate after any step whose output later steps depend on, and fail loudly instead of passing bad data along." },
        { type: "list", items: [
          "**Latency adds up.** Sequential calls run one after another. Run independent steps in parallel and use small models for simple steps.",
          "**Cost adds up.** Every call re-sends its own instructions and inputs. Keep each prompt lean and pass only what the next step needs.",
          "**Lost context.** A later step only knows what we hand it. If the drafting step needs the customer's name, it must be in the hand-off.",
          "**Brittle formats.** Ask for structured output (JSON with fixed keys, or one label from a list) and validate it. Many APIs offer a structured-output or JSON mode that helps.",
          "**Too many steps.** Splitting a task into ten tiny calls adds latency and hand-offs without improving quality. Split where a human would naturally check the work.",
          "**Test the whole chain too.** Each step can pass its own tests while the end-to-end result is still poor. Keep an end-to-end test set."
        ] },
        { type: "check", question: "Our 3-step chain is accurate but too slow. Steps 2 and 3 both read step 1's output but do not depend on each other. What can we change?", answer: "Run steps 2 and 3 in parallel (fan-out) since neither needs the other's result, then merge. We can also move a simple step, like classification, to a smaller and faster model." }
      ]
    },
    {
      id: "when-to-use",
      title: "When to use prompt chaining",
      blocks: [
        { type: "table", head: ["Situation", "Use a chain?", "Reason"], rows: [
          ["Task has clear stages (extract, decide, write)", "Yes", "Each stage gets a focused prompt and a check"],
          ["We need guarantees on format or rules", "Yes", "Code gates enforce them between steps"],
          ["Different stages need different models", "Yes", "Route cheap steps to cheap models"],
          ["A single prompt already works reliably", "No", "Extra calls only add latency and cost"],
          ["Steps cannot be known in advance", "Probably not", "An agent loop fits better"],
          ["Real-time chat where every 100 ms matters", "Carefully", "Keep the chain short or parallel"]
        ] },
        { type: "p", text: "A good workflow is to start with one prompt, measure where it fails, and split out exactly the failing part into its own step with its own check. That way every link in the chain earns its place." }
      ]
    }
  ],
  quiz: [
    { q: "What defines prompt chaining?", options: ["Sending the same prompt several times and voting on the final answer", "Splitting a task into LLM calls where each output feeds the next", "Letting the model pick its own tools in a loop until it is finished", "Adding several worked examples to a single prompt before the question"], answer: 1, explain: "Chaining is a sequence of focused calls with hand-offs between them. Voting is self-consistency, a model choosing tools in a loop is an agent, and adding examples is few-shot prompting." },
    { q: "In our chain, step 1 sometimes returns invalid JSON and step 3 then writes nonsense. What is the best change?", options: ["Add a gate after step 1 that validates the JSON and retries", "Raise the temperature of step 3 so it writes more creatively", "Merge all the steps back into one big prompt to avoid hand-offs", "Remove step 2 so the chain is shorter and has fewer failure points"], answer: 0, explain: "A gate catches the bad output at the source, before it flows downstream. The other options do not address the invalid JSON at all." },
    { q: "A 4-step chain has no checks and each step is right 90% of the time, independently. Roughly how often is the whole chain right?", options: ["90%", "about 36%", "about 66%", "about 81%"], answer: 2, explain: "0.9⁴ ≈ 0.656, about 66%. Errors compound across steps. 81% is only two steps (0.9²), and 90% would mean errors never compound." },
    { q: "When is an agent a better fit than a fixed prompt chain?", options: ["When the task always has the same three stages in the same order", "When we need the most predictable cost and latency per request", "When we want every step to be unit-tested separately and simply", "When the right steps depend on what is discovered along the way"], answer: 3, explain: "Chains shine when we know the steps in advance; that is also what makes them predictable and testable. Agents suit tasks whose path cannot be known ahead of time." },
    { q: "Which belief about prompt chaining is a misconception?", options: ["Code between steps can enforce rules the model might otherwise ignore", "More steps always mean better quality, so split as finely as possible", "Different steps in the same chain can use different models and settings", "Steps that do not depend on each other can run in parallel to save time"], answer: 1, explain: "Over-splitting adds latency, cost and more hand-offs where context can be lost, without improving quality. Split where a natural checkpoint exists. The other three statements are true." }
  ],
  takeaways: [
    "Prompt chaining splits a task into focused LLM calls; each output becomes the next input.",
    "Code between steps (gates) validates, routes and transforms, catching errors before they spread.",
    "Common shapes: sequential pipeline, gate, routing, parallel fan-out/merge, and generate-critique-revise.",
    "Chains are easier to debug and test than one big prompt, but cost more calls and latency.",
    "Use a chain when the steps are known in advance; use an agent when they are not."
  ],
  terms: [
    { term: "LLM call", def: "One request to a language model: a prompt in, one response out." },
    { term: "Prompt chaining", def: "Running several focused LLM calls in sequence, passing each output into the next prompt." },
    { term: "Gate", def: "A code check between chain steps that decides to continue, retry or stop." },
    { term: "Routing", def: "Choosing the next prompt or model based on the result of a classification step." },
    { term: "Fan-out / merge", def: "Running a step on many pieces in parallel, then combining the results in one call." },
    { term: "Error propagation", def: "A mistake in an early step being carried into and amplified by later steps." }
  ]
};
