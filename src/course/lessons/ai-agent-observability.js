export default {
  id: "ai-agent-observability",
  minutes: 24,
  hook: "A customer says our agent took 30 seconds and then refunded the wrong order: how do we find out exactly what it did, step by step?",
  summary: "AI agent observability is the ability to see and understand what an agent did on every run: each model call, prompt, tool call, result, decision, token count, latency and cost. It is built from traces made of nested spans, plus metrics and logs. Observability lets us debug failures, control cost and latency, detect quality drift and feed real failures back into evaluation.",
  sections: [
    {
      id: "basics",
      title: "What is an AI agent, and what is observability?",
      blocks: [
        { type: "p", text: "An **AI agent** is a program in which a large language model (LLM) repeatedly decides what to do next: call a tool, look something up, ask the user, or finish. One user request can trigger many model calls and tool calls, and the path is chosen by the model at run time." },
        { type: "p", text: "**Observability** is a term from software operations: a system is observable if we can understand what is happening inside it from the data it emits, without adding new code each time we have a question. That data is called **telemetry**. **Monitoring** watches known signals (“alert if error rate > 2%”); observability lets us investigate questions we did not anticipate (“why did *this* request take 30 seconds?”)." },
        { type: "callout", tone: "analogy", title: "Think of it like an aircraft's flight recorder", text: "When something goes wrong in flight, investigators do not guess. They read the flight recorder: every control input, instrument reading and cockpit conversation, in order, with timestamps. Agent observability gives every agent run its own flight recorder, so we can replay what it saw, decided and did." }
      ]
    },
    {
      id: "what-and-why",
      title: "What is AI agent observability, and why do we need it?",
      blocks: [
        { type: "p", text: "**AI agent observability** means capturing, for every agent run, the full chain of events (inputs, prompts, model outputs, tool calls with arguments and results, retrieved documents, errors, timings, token counts and costs) in a structured, linked form, and making it searchable, visual and measurable." },
        { type: "list", items: [
          "**Debugging.** Agents fail in new ways: a wrong tool choice, a malformed argument, a loop, a hallucinated order ID. Without a record of each step we can only guess.",
          "**Non-determinism.** The same input can take different paths. We need to see the path that actually happened.",
          "**Cost control.** Token usage varies a lot per run. One runaway loop can cost more than a thousand normal requests.",
          "**Latency.** Users feel the total time; traces show which step is slow.",
          "**Quality drift.** Model updates, prompt edits or new data can quietly degrade answers. Scoring live traffic catches it.",
          "**Safety and audit.** For actions such as refunds, we need to show who asked for what, which tool ran and with which arguments."
        ] },
        { type: "p", text: "Our running example: the **refund agent** handling “refund order 1009”. A user complains it was slow. We will find out why from its trace." }
      ]
    },
    {
      id: "vs-traditional",
      title: "How is AI agent observability different from traditional observability?",
      blocks: [
        { type: "compare", title: "Traditional services vs AI agents",
          options: [
            { name: "Traditional observability", summary: "Watch deterministic code: requests, errors, latency, resource use.", pros: ["Mature standards and tools", "Errors are usually explicit (exceptions, status codes)"], cons: ["Does not capture prompts, outputs or quality"], bestFor: "APIs, databases, web services" },
            { name: "AI agent observability", summary: "Adds the content and decisions of model-driven steps.", pros: ["Shows what the model saw and said", "Tracks tokens, cost and quality"], cons: ["Large, sensitive payloads (prompts may contain personal data)", "“Errors” are often silent: a fluent but wrong answer returns HTTP 200"], bestFor: "LLM apps, RAG pipelines, multi-step agents" }
          ],
          rows: [
            ["Main failure signal", "Exceptions, 5xx codes, timeouts", "Also wrong-but-successful outputs, bad tool choices, loops"],
            ["What is recorded", "Timing, status, resource metrics", "Plus prompts, completions, tool arguments, retrieved docs"],
            ["New metrics", "—", "Tokens, cost per request, quality scores, steps per run"],
            ["Path through the system", "Fixed by code", "Chosen by the model, different per run"]
          ],
          verdict: "Agent observability builds on the same foundations (traces, metrics, logs) and adds content, cost and quality on top." }
      ]
    },
    {
      id: "three-pillars",
      title: "The three pillars of observability",
      blocks: [
        { type: "table", head: ["Pillar", "What it is", "Agent example"], rows: [
          ["Logs", "Timestamped records of individual events, often as structured text", "“tool.issue_refund timed out after 2,300 ms”"],
          ["Metrics", "Numbers aggregated over time, cheap to store and alert on", "p95 latency, tokens per request, daily cost, tool error rate"],
          ["Traces", "The end-to-end path of one request through the system, made of linked spans", "The whole refund run: plan → get order → refund (timeout) → retry → reply"]
        ] },
        { type: "p", text: "For agents, **traces are the most important pillar**, because an agent's behaviour is a sequence of linked decisions. Metrics are usually computed from traces (for example, total cost = sum of the cost of every LLM span), and logs are often attached to spans as events." }
      ]
    },
    {
      id: "traces-spans",
      title: "Traces and spans",
      blocks: [
        { type: "p", text: "A **trace** represents one request from start to finish and has a unique **trace ID**. A **span** is one unit of work inside the trace, such as one LLM call, one tool call or one retrieval. Each span has a name, a start time and an end time (so a duration), a **parent span ID** that places it in a tree, a status (ok or error), and **attributes**: key-value details like model name, token counts or tool arguments." },
        { type: "p", text: "The root span covers the whole agent run; child spans nest beneath it. Viewed as a timeline (a “waterfall”), the trace shows what happened, in what order, and where the time went. The code below builds and prints a toy trace for our refund run." },
        { type: "code", lang: "python", title: "toy_trace.py", code: `spans = []
PRICE_IN, PRICE_OUT = 3e-6, 15e-6     # illustrative $ per token

def span(name, parent=None, ms=0, **attrs):
    # A span = one timed unit of work, linked to its parent
    s = {"id": f"s{len(spans) + 1}", "name": name, "parent": parent, "ms": ms, "attrs": attrs}
    spans.append(s)
    return s

# One trace for one user request (durations are made up but fixed)
root = span("agent.run", user="u_42", task="refund order 1009")
span("llm.call", root, 820, model="big-model", in_tok=1200, out_tok=90)
span("tool.get_order", root, 140, status="ok")
span("tool.issue_refund", root, 2300, status="timeout")
span("tool.issue_refund", root, 310, status="ok")          # retry
span("llm.call", root, 640, model="big-model", in_tok=1500, out_tok=60)
root["ms"] = sum(s["ms"] for s in spans if s["parent"] is root)

def show(s, depth=0):
    # Print the trace as a tree, like an observability UI would
    print(f"{'  ' * depth}{s['id']} {s['name']:<18}{s['ms']:>5} ms  {s['attrs']}")
    for child in [c for c in spans if c["parent"] is s]:
        show(child, depth + 1)

show(root)
llm = [s for s in spans if s["name"] == "llm.call"]
cost = sum(s["attrs"]["in_tok"] * PRICE_IN + s["attrs"]["out_tok"] * PRICE_OUT for s in llm)
errors = sum(s["attrs"].get("status") == "timeout" for s in spans)
slow = max(spans[1:], key=lambda s: s["ms"])
print(f"\\ntotal={root['ms']} ms  llm_calls={len(llm)}  cost=\${cost:.4f}  errors={errors}")
print(f"slowest: {slow['id']} {slow['name']} {slow['ms']} ms ({slow['attrs']['status']})")`, output: `s1 agent.run          4210 ms  {'user': 'u_42', 'task': 'refund order 1009'}
  s2 llm.call            820 ms  {'model': 'big-model', 'in_tok': 1200, 'out_tok': 90}
  s3 tool.get_order      140 ms  {'status': 'ok'}
  s4 tool.issue_refund  2300 ms  {'status': 'timeout'}
  s5 tool.issue_refund   310 ms  {'status': 'ok'}
  s6 llm.call            640 ms  {'model': 'big-model', 'in_tok': 1500, 'out_tok': 60}

total=4210 ms  llm_calls=2  cost=$0.0103  errors=1
slowest: s4 tool.issue_refund 2300 ms (timeout)`,
          walkthrough: [
            { lines: [1, 8], note: "A span is a record with an id, a name, a parent, a duration and attributes. Illustrative token prices are set at the top." },
            { lines: [10, 17], note: "One trace: a root span for the run and five child spans. The first refund call times out and is retried. The root's duration is the sum of its sequential children." },
            { lines: [19, 25], note: "Print the trace as an indented tree, the way tracing UIs show it." },
            { lines: [26, 31], note: "Derive metrics from the spans: number of LLM calls, cost from token counts, error count and the slowest span." }
          ] },
        { type: "chart", kind: "hbar", title: "Where the 4,210 ms went", xLabel: "Milliseconds", labels: ["s2 llm.call (plan)", "s3 tool.get_order", "s4 tool.issue_refund (timeout)", "s5 tool.issue_refund (retry)", "s6 llm.call (reply)"], series: [ { name: "Duration", values: [820, 140, 2300, 310, 640] } ], caption: "From the code output. Over half the run was one tool call that timed out; the model was not the bottleneck." },
        { type: "check", question: "Using the trace, what is the cheapest fix for the slow run?", answer: "Lower the timeout on `issue_refund` (or fix the refund service), since the timed-out call alone took 2,300 ms of 4,210 ms and the retry then succeeded in 310 ms. Switching to a faster model would save far less. Without the trace, many teams would have blamed the LLM." }
      ]
    },
    {
      id: "what-to-observe",
      title: "What to observe inside an agent, and the key metrics",
      blocks: [
        { type: "list", items: [
          "**Inputs and outputs**: the user request, the final answer, and each model call's prompt and completion.",
          "**Model details**: model name and version, temperature and other settings, input and output token counts, cached tokens.",
          "**Tool calls**: tool name, arguments, result (or a summary of it), status, duration, retries.",
          "**Retrieval**: the query, which documents came back, their scores.",
          "**Decisions**: the agent's plan or reasoning summary, which branch it took, guardrail verdicts.",
          "**Context**: user or session ID, prompt version, app version, so we can group and compare runs.",
          "**Feedback and scores**: thumbs up/down, LLM-judge scores attached to the trace."
        ] },
        { type: "table", caption: "Key metrics for AI agent observability", head: ["Metric", "Why it matters"], rows: [
          ["Latency: end-to-end, p50 / p95, time to first token", "User experience; p95 shows the slow tail that averages hide"],
          ["Tokens and cost per request and per user", "Budget control; catches runaway loops"],
          ["Steps (LLM and tool calls) per run", "Rising counts signal loops or confused planning"],
          ["Error rate: model API errors, tool failures, timeouts, invalid outputs", "Reliability of each dependency"],
          ["Task success and user feedback rate", "Whether users actually got what they needed"],
          ["Online quality scores (judge or heuristic)", "Detect drift in correctness, groundedness, tone"],
          ["Guardrail triggers and policy violations", "Safety, abuse and attack monitoring"]
        ] }
      ]
    },
    {
      id: "how-it-works",
      title: "How AI agent observability works",
      blocks: [
        { type: "steps", title: "From code to dashboard", items: [
          { title: "Instrument", text: "Add tracing to the agent code. Many SDKs and agent frameworks offer automatic instrumentation that wraps every LLM and tool call in a span; we add custom spans and attributes for our own steps." },
          { title: "Propagate context", text: "The trace ID is passed along so that every child span, even in other services, attaches to the same trace." },
          { title: "Export", text: "Spans are batched and sent asynchronously to a collector or backend (commonly using the OpenTelemetry protocol), so tracing does not slow the agent down." },
          { title: "Store and index", text: "The backend stores traces and makes them searchable by user, error, cost, latency or attribute." },
          { title: "Visualize and alert", text: "Dashboards show metrics over time; alerts fire on spikes in cost, latency or errors; engineers open individual traces to debug." },
          { title: "Evaluate and improve", text: "Sampled traces are scored by LLM judges or reviewed by people. Bad traces become new test cases in the evaluation suite." }
        ] },
        { type: "flow", title: "The observability feedback loop", loop: true, nodes: [
          { label: "Agent runs", detail: "Users send requests; the agent calls models and tools." },
          { label: "Spans emitted", detail: "Each step records timing, inputs, outputs, tokens and status." },
          { label: "Backend", detail: "Traces are stored, indexed and turned into metrics." },
          { label: "Dashboards & alerts", detail: "We spot spikes, slow steps and failing tools." },
          { label: "Debug & evaluate", detail: "Inspect traces, score samples, add failures to the test set." },
          { label: "Fix & ship", detail: "Change the prompt, tool or model, then watch the metrics again." }
        ] }
      ]
    },
    {
      id: "tools-and-vs-eval",
      title: "Tools and frameworks, and observability vs evaluation",
      blocks: [
        { type: "table", caption: "Examples (the field moves fast; check current docs)", head: ["Category", "Examples"], rows: [
          ["Open standards", "OpenTelemetry (traces, metrics, logs) with its generative-AI semantic conventions, which are still evolving; OpenInference and OpenLLMetry conventions for LLM spans"],
          ["LLM / agent observability platforms", "Langfuse, LangSmith, Arize Phoenix, Helicone, Weights & Biases Weave, MLflow Tracing"],
          ["General observability vendors with LLM features", "Datadog, New Relic, Grafana and others accept OpenTelemetry data and offer LLM views"],
          ["Built into agent frameworks", "Many agent SDKs emit traces of model and tool calls out of the box"]
        ] },
        { type: "compare", title: "Observability vs evaluation",
          options: [
            { name: "Observability", summary: "Records what actually happened in each run, mostly in production.", pros: ["Covers real user traffic", "Essential for debugging and cost control"], cons: ["Tells us what happened, not whether it was good, unless we add scores"], bestFor: "Debugging, monitoring, cost and latency, auditing" },
            { name: "Evaluation", summary: "Measures quality against criteria, mostly on test sets before release.", pros: ["Controlled comparisons between versions", "Clear pass/fail criteria"], cons: ["Test sets may not reflect real traffic"], bestFor: "Deciding whether a change is better before shipping" }
          ],
          rows: [
            ["Main question", "What did the agent do, and where did time and money go?", "How good is the agent on our criteria?"],
            ["When", "Continuously, in production", "Before release and on every change"],
            ["Data", "Live traces", "Curated test tasks"]
          ],
          verdict: "They feed each other: traces supply real failures for the test set, and evaluation scorers run on sampled traces as online evaluation." }
      ]
    },
    {
      id: "challenges-best-practices",
      title: "Challenges and best practices",
      blocks: [
        { type: "callout", tone: "warn", title: "Challenges", text: "**Privacy**: prompts and tool results can contain personal or confidential data, so traces need redaction, access control and retention limits. **Volume and cost**: full prompts for every call are large; teams sample or truncate. **Silent failures**: a wrong answer looks like a success unless we attach quality scores or feedback. **Long, branching traces** from multi-agent systems are hard to read. **Standards are still settling**, so attribute names differ between tools." },
        { type: "list", items: [
          "**Trace from day one**, including during development; it is the fastest debugger for agents.",
          "**Give every run a trace ID** and log it with user-facing errors so support can find the trace.",
          "**Record versions** of prompts, models and tools as attributes, so we can compare before and after a change.",
          "**Redact sensitive data** before export, and set retention rules.",
          "**Alert on cost, latency, error rate and steps per run**, not just on crashes.",
          "**Attach feedback and judge scores** to traces to make silent failures visible.",
          "**Close the loop**: turn bad traces into evaluation test cases."
        ] },
        { type: "callout", tone: "example", title: "Real-world use", text: "A team sees daily cost double overnight. Sorting traces by cost reveals an agent stuck re-calling a search tool after a schema change in its results. They fix the parser, add an alert on steps per run, and add that failing case to their evaluation suite." }
      ]
    },
    {
      id: 'spotting-mistakes',
      title: 'Common mistakes and how to spot them',
      blocks: [
        { type: 'p', text: 'Collecting traces is the easy half. Reading the numbers built from them is where teams go wrong, and the most common mistake is trusting an **average**. A small example shows why. Ten refund runs finish; nine take 1.0 second and one, stuck on a slow tool, takes 11.0 seconds. The numbers are illustrative.' },
        { type: 'steps', title: 'One slow run, three different stories', items: [
          { title: 'The mean', text: '`(9 × 1.0 + 11.0) / 10 = 2.0` seconds. No user waited 2 seconds. The mean describes a run that never happened.' },
          { title: 'The median (p50)', text: 'Sort the ten values and take the middle: **1.0 second**. This is the typical experience, and it hides the slow run completely.' },
          { title: 'A high percentile', text: 'p95 asks: how long did the slowest 5% take? With only 10 runs, the one slow run is the slowest 10%, so p95 is pulled far above 1 second (the exact value depends on how the tool interpolates). Now the problem is visible.' },
          { title: 'Grow the sample', text: 'With 100 runs and still one slow one, that run is the slowest 1%. It sits *above* p95, so p95 goes back to about 1 second. We need p99 or the maximum to see it.' },
          { title: 'The rule', text: 'Report p50 for the typical user, p95 or p99 for the unlucky ones, and keep the maximum in view. Then open the trace of the worst run rather than staring at the dashboard.' },
        ] },
        { type: 'table', caption: 'A symptom on the dashboard, and where to look in the trace', head: ['What the metric shows', 'Likely cause', 'What to open in the trace'], rows: [
          ['Mean latency up, p50 flat', 'A few very slow runs', 'Sort traces by duration; look for one long span such as a tool timeout'],
          ['Cost up, request count flat', 'More tokens per run: a longer prompt, or more steps', 'Compare input tokens and step count per run before and after the change'],
          ['Steps per run creeping up', 'The agent repeats a tool call that keeps failing or returns nothing useful', 'Look for the same tool name with the same arguments several times in a row'],
          ['Error rate flat, complaints up', 'Silent failures: the run “succeeds” with a wrong answer', 'Traces with low judge scores or negative feedback; read input, retrieved data and output'],
          ['One user or tenant dominates cost', 'An unusual input, or an automated caller', 'Group traces by user or session ID'],
        ] },
        { type: 'p', text: 'Two instrumentation mistakes make all of this impossible: spans without a parent link, so a run cannot be reassembled, and traces without version attributes, so we cannot say which prompt or model produced a bad run.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'Earlier we looked inside one trace. Now we stand one level up: we take summaries of **40 finished runs** and compute what a dashboard would show, namely latency percentiles, cost and error rate. Then we add a simple alert rule that finds a run stuck in a loop.' },
        { type: 'code', lang: 'python', title: 'practice_trace_metrics.py', code: `import numpy as np
rng = np.random.default_rng(11)

# 40 finished agent runs, as a tracing backend would summarise them.
runs = []
for i in range(40):
    steps = int(rng.integers(3, 7))                  # normal runs: 3 to 6 steps
    runs.append({"id": f"run-{i:02d}", "steps": steps,
                 "ms": int(steps * rng.integers(300, 700)),
                 "tokens": int(steps * rng.integers(800, 1500)),
                 "error": bool(rng.random() < 0.05)})
# One run got stuck in a loop, calling the same tool again and again.
runs[17].update(steps=38, ms=41000, tokens=95000)

ms = np.array([r["ms"] for r in runs])
tokens = np.array([r["tokens"] for r in runs])
PRICE = 5e-6                                         # illustrative $ per token

print(f"latency  mean {ms.mean():.0f} ms | p50 {np.percentile(ms, 50):.0f} ms | p95 {np.percentile(ms, 95):.0f} ms | max {ms.max()} ms")
print(f"cost     total \${tokens.sum() * PRICE:.2f} | mean per run \${tokens.mean() * PRICE:.4f}")
print(f"errors   {sum(r['error'] for r in runs)} of {len(runs)} runs")

# Alert rule: flag any run with far more steps than a typical run.
typical = np.median([r["steps"] for r in runs])
for r in runs:
    if r["steps"] > 3 * typical:
        share = r["tokens"] / tokens.sum()
        print(f"ALERT {r['id']}: {r['steps']} steps (typical {typical:.0f}), {share:.0%} of all tokens")`, output: `latency  mean 3344 ms | p50 2489 ms | p95 3571 ms | max 41000 ms
cost     total $1.49 | mean per run $0.0372
errors   3 of 40 runs
ALERT run-17: 38 steps (typical 5), 32% of all tokens`,
          walkthrough: [
            { lines: [4, 13], note: 'Simulate 40 run summaries with steps, latency, tokens and an error flag. Then overwrite one run with a runaway loop.' },
            { lines: [15, 21], note: 'Dashboard numbers: mean, p50, p95 and maximum latency; total and mean cost; error count.' },
            { lines: [23, 28], note: 'An alert rule: flag any run with more than three times the typical number of steps, and show its share of all tokens.' },
          ] },
        { type: 'p', text: 'One run out of 40 used about a third of all tokens. Look at the latency line: p95 (3,571 ms) gives no hint of a 41-second run, because a single run in 40 lies above the 95th percentile. The maximum and the step alert are what expose it.' },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Add a second stuck run after line 13: `runs[5].update(steps=30, ms=33000, tokens=70000)`. Predict: does p95 move now? Why does two runs out of 40 change it when one did not?',
          'Make the alert too sensitive: on line 26 change `3 * typical` to `1.0 * typical`. Predict roughly how many alerts fire. Would we still read them?',
          'Remove the runaway run by commenting out line 13. Predict how the mean compares with p50 once the outlier is gone.',
        ] },
        { type: 'check', question: 'The mean latency (3,344 ms) is higher than the p50 (2,489 ms) and close to the p95. What does that pattern alone tell us, before we look at any trace?', answer: 'That the distribution has a long tail: a few runs are far slower than the rest and drag the mean up. In a healthy, symmetric set of runs the mean sits near the median. A mean well above p50 is a cue to sort traces by duration and open the slowest ones. Here that leads straight to run-17.' },
        { type: 'check', question: 'The alert names run-17 and says it took 38 steps. Is that enough to fix the problem?', answer: 'No. The metric tells us *that* something looped and *which* run. Only the trace tells us *why*: which tool was repeated, with what arguments, what it returned each time, and what the model decided after each result. The fix might be a tool that returns an unclear error, a missing stop condition, or a step limit. We need the spans to choose between them.' },
      ],
    },
  ],
  quiz: [
    { q: "In tracing, what is a span?", options: ["The whole conversation history stored for one user", "A dashboard chart showing latency across the week", "One timed step in a trace, like an LLM or tool call", "The maximum context window of the model being used"], answer: 2, explain: "A trace is the whole request; spans are its timed, nested steps with a parent and attributes. Dashboards show metrics, and the context window is unrelated." },
    { q: "Users report our agent is slow. The trace shows: LLM 820 ms, get_order 140 ms, issue_refund 2,300 ms (timeout), retry 310 ms, LLM 640 ms. What should we do first?", options: ["Fix the refund tool or shorten its timeout", "Switch to a faster, smaller language model", "Shorten the system prompt to cut prefill time", "Add more spans so the trace has more detail"], answer: 0, explain: "The timed-out tool call is more than half the total time. The trace points to the tool, not the model, as the bottleneck." },
    { q: "From the code example: two LLM calls used 1,200 + 1,500 input and 90 + 60 output tokens, at $3 and $15 per million. What is the cost?", options: ["$0.0081", "$0.0225", "$0.0030", "$0.0103"], answer: 3, explain: "Input: 2,700 × 3e-6 = $0.0081. Output: 150 × 15e-6 = $0.00225. Total ≈ $0.0103, as printed." },
    { q: "How do observability and evaluation relate?", options: ["They are two names for the same practice, run by the same tools", "One records real runs, one scores quality; each feeds the other", "Evaluation runs only in production; observability only in testing", "Good observability fully replaces the need for any evaluation"], answer: 1, explain: "Observability records what happened; evaluation measures quality against criteria. Traces feed test sets, and scorers run on sampled traces. The third option reverses where each is mainly used." },
    { q: "Which statement about agent observability is a misconception?", options: ["All HTTP 200s with no exceptions means the agent works", "Traces may contain personal data and need redaction", "Steps per run is a useful metric for spotting loops", "Prompt and model versions belong on every trace"], answer: 0, explain: "Agents fail silently: a fluent wrong answer or a bad tool choice still returns 200. Quality scores and feedback must be attached to see those failures." }
  ],
  takeaways: [
    "Agent observability records every model call, tool call, decision, token and millisecond of each run.",
    "Traces made of nested spans are the core; metrics and logs complete the three pillars.",
    "Agents fail silently, so attach quality scores and feedback, not just errors and latency.",
    "Instrument, export, store, visualize, alert, and feed bad traces back into evaluation.",
    "Handle privacy and volume with redaction, sampling and retention rules."
  ],
  terms: [
    { term: "Observability", def: "The ability to understand a system's internal behaviour from the telemetry it emits." },
    { term: "Telemetry", def: "Data a system emits about itself: logs, metrics and traces." },
    { term: "Trace", def: "The end-to-end record of one request, made of linked spans and identified by a trace ID." },
    { term: "Span", def: "One timed unit of work in a trace, with a parent, status and attributes." },
    { term: "Attribute", def: "A key-value detail on a span, such as model name, token count or tool argument." },
    { term: "OpenTelemetry", def: "An open standard and toolkit for producing and exporting traces, metrics and logs." },
    { term: "p95 latency", def: "The latency below which 95% of requests complete; it reveals the slow tail." }
  ]
};
