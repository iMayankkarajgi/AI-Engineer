export default {
  id: "what-is-graph-engineering",
  minutes: 27,
  hook: "What if, instead of hoping one giant prompt or one endless loop does the right thing, we drew the whole job as a map of small steps and arrows that we can see, test and pause?",
  summary: "Graph engineering builds an AI system as a graph: nodes are small steps (an LLM call, a tool, a check), edges are the paths between them, and a shared state object carries data from step to step. Conditional edges let the graph make decisions, cycles let it redo work, parallel branches save time, and checkpoints let it pause for a human or resume after a crash. It trades some of a free loop's flexibility for control, visibility and reliability.",
  sections: [
    {
      id: "what-is-graph-engineering",
      title: "What is graph engineering? Graph = nodes + edges",
      blocks: [
        { type: "p", text: "In maths and computer science, a **graph** is a set of **nodes** (points) joined by **edges** (lines or arrows). A city metro map is a graph: stations are nodes, tracks are edges. A recipe is a graph too: “chop onions” and “heat oil” are nodes, and an arrow says “heat oil, then fry onions”." },
        { type: "p", text: "**Graph engineering** is the practice of building an AI application as such a graph. Each node does one small, clear job: call the model to draft a reply, call a tool to look up an order, run a check. Edges say which node runs next, sometimes based on a decision. A shared **state** carries the data along the way. Instead of one big prompt that must do everything, or one open-ended loop where the model improvises every step, we lay the workflow out explicitly." },
        { type: "callout", tone: "analogy", title: "Think of a flowchart for a call centre", text: "New staff at a call centre get a flowchart: “Is it about billing? Go to box 4. Is the customer angry? Escalate to a supervisor.” Each box is small and clear, the arrows show what comes next, and a supervisor can see exactly where any call is. Graph engineering gives an AI system the same kind of flowchart, with the model doing the thinking inside each box." },
        { type: "p", text: "Our running example: a **support reply pipeline**. A ticket comes in, we draft a reply with an LLM, a reviewer step checks it, and if it is good we send it; if not we draft again." }
      ]
    },
    {
      id: "why-graph-engineering",
      title: "Why do we need graph engineering?",
      blocks: [
        { type: "p", text: "In the previous lesson we engineered a single agent loop. Loops are flexible: the model chooses every next action. That flexibility is also the problem when the workflow is actually known in advance. If we *know* a reply must always be reviewed before sending, we should not rely on the model remembering to do it." },
        { type: "list", items: [
          "**Control:** important steps (review, approval, compliance checks) always happen, because an edge forces them.",
          "**Visibility:** we can draw the system and point to where a run is right now and how it got there.",
          "**Testability:** each node is a small function we can unit-test on its own.",
          "**Reliability:** errors can be handled per node; progress can be saved per node and resumed.",
          "**Speed and cost:** independent nodes can run in parallel, and simple nodes can use a small, cheap model or no model at all."
        ] },
        { type: "p", text: "Frameworks such as LangGraph (a later lesson) are built around this idea, but graph engineering is a design approach, not a library. We can implement it in 30 lines of Python, as we will below." }
      ]
    },
    {
      id: "building-blocks",
      title: "The three building blocks: node, edge and state",
      blocks: [
        { type: "table", caption: "The vocabulary of every graph-based AI system.", head: ["Block", "What it is", "In our support pipeline"], rows: [
          ["Node", "A step: a function that reads the current state and returns an update to it", "`draft` (LLM writes a reply), `review` (checks it), `send` (calls the email API)"],
          ["Edge", "An arrow saying which node runs next", "`draft → review` always"],
          ["Conditional edge", "An arrow chosen at run time by a small routing function", "`review → send` if approved, else `review → draft`"],
          ["State", "A shared record passed through the graph and updated by each node", "`{ticket, draft, tries, approved, sent}`"],
          ["Start and end", "Where a run enters and where it finishes", "Start at `draft`; end after `send`"]
        ] },
        { type: "p", text: "The key design rule: **nodes do not call each other.** A node only reads state and returns changes. The graph runtime merges those changes into the state and follows the edges. This keeps nodes small and swappable, and it means the runtime always knows where we are." },
        { type: "callout", tone: "tip", title: "Design the state first", text: "Before drawing nodes, write down the state object: what fields exist, who writes each one, and what “finished” looks like in terms of those fields. A clean state makes the rest of the graph easy." }
      ]
    },
    {
      id: "first-graph",
      title: "Let's build our first graph",
      blocks: [
        { type: "p", text: "Here is a tiny graph runtime and our support pipeline. The LLM calls are replaced by simple functions so we can run it and see real output, but the structure is exactly what a real system uses." },
        { type: "code", lang: "python", title: "support_graph.py", code: `import copy
# Nodes: small functions that read the state and return updates.
def draft(s):   return {"draft": f"Reply v{s['tries'] + 1} for: {s['ticket']}", "tries": s["tries"] + 1}
def review(s):  return {"approved": s["tries"] >= 2}       # pretend v1 is too vague
def send(s):    return {"sent": True}

nodes = {"draft": draft, "review": review, "send": send}
edges = {"draft": lambda s: "review",                        # fixed edge
         "review": lambda s: "send" if s["approved"] else "draft",  # conditional edge (cycle)
         "send": lambda s: "END"}

def run(state, start="draft", max_steps=10):
    node, checkpoints = start, []
    for _ in range(max_steps):                     # guard against endless cycles
        state = {**state, **nodes[node](state)}    # merge the node's update
        checkpoints.append((node, copy.deepcopy(state)))   # save after every node
        nxt = edges[node](state)
        print(f"{node:6} -> {nxt:6} state={ {k: state[k] for k in ('tries', 'approved') if k in state} }")
        if nxt == "END":
            return state, checkpoints
        node = nxt
    raise RuntimeError("step limit hit")

final, cps = run({"ticket": "refund for order 42", "tries": 0})
print("final draft:", final["draft"], "| sent:", final["sent"])
print("checkpoints saved:", len(cps), "| resume point after 1st review:", cps[1][0], cps[1][1]["approved"])`, output: `draft  -> review state={'tries': 1}
review -> draft  state={'tries': 1, 'approved': False}
draft  -> review state={'tries': 2, 'approved': False}
review -> send   state={'tries': 2, 'approved': True}
send   -> END    state={'tries': 2, 'approved': True}
final draft: Reply v2 for: refund for order 42 | sent: True
checkpoints saved: 5 | resume point after 1st review: review False`, walkthrough: [
          { lines: [2, 5], note: "Three nodes. Each takes the state and returns only the fields it changes. In a real system `draft` would call an LLM and `review` might call a second LLM or a rule checker." },
          { lines: [7, 10], note: "The graph itself: a dictionary of nodes and a dictionary of edges. The `review` edge is conditional: it routes to `send` or back to `draft`, which creates a cycle." },
          { lines: [12, 15], note: "The runtime: run the current node, then merge its update into the state. Note the `max_steps` guard: cycles need a limit too." },
          { lines: [16, 16], note: "A checkpoint after every node: a copy of the state plus where we were. This is what makes pause, resume and debugging possible." },
          { lines: [17, 22], note: "Follow the edge to find the next node, print the transition, and stop at END." },
          { lines: [24, 26], note: "Run it. The first draft is rejected, the cycle produces v2, review approves, and the reply is sent. Five checkpoints were saved." }
        ] }
      ]
    },
    {
      id: "conditional-edges-and-cycles",
      title: "Conditional edges and cycles",
      blocks: [
        { type: "p", text: "A **conditional edge** is how a graph makes decisions. After a node runs, a small routing function looks at the state and returns the name of the next node. The routing can be plain code (`if approved`), or it can read a field that an LLM set (for example, a classifier node writes `intent = 'refund'` and the edge routes to the refund branch). Keeping the decision in an edge, not hidden inside a prompt, makes it visible and testable." },
        { type: "p", text: "A **cycle** is an edge that points back to an earlier node. Cycles let a graph do work again when needed: redraft after a failed review, re-search after finding nothing, re-run code after a failing test. A graph with cycles can express an agent loop, but with the loop's shape fixed by us." },
        { type: "flow", title: "The draft → review cycle", loop: true, nodes: [
          { label: "draft", detail: "An LLM writes a reply using the ticket and any reviewer feedback stored in state." },
          { label: "review", detail: "A checker (rules, a second LLM, or both) sets approved = True or False and may add feedback." },
          { label: "route", detail: "Conditional edge: approved → send; not approved and tries < 3 → draft again; otherwise → human." },
          { label: "send", detail: "Only reached through an approval. The edge makes it impossible to send an unreviewed reply." }
        ] },
        { type: "callout", tone: "warn", title: "Every cycle needs an exit", text: "A cycle whose condition can never become true is an infinite loop in a nicer outfit. Always add a counter in state (like `tries`) and a route that leaves the cycle when the counter is exhausted, plus a global step limit in the runtime." },
        { type: "check", question: "In the code above, what would happen if `review` always returned `approved: False`?", answer: "The graph would cycle draft → review → draft until the runtime's `max_steps=10` guard fired and raised “step limit hit”. A better design also routes to a human after, say, 3 tries, so the exit is graceful rather than an error." }
      ]
    },
    {
      id: "one-full-run",
      title: "One full run, step by step",
      blocks: [
        { type: "steps", title: "What the runtime does for the ticket “refund for order 42”", items: [
          { title: "Start", text: "State = {ticket, tries: 0}. The entry node is `draft`." },
          { title: "draft (1st)", text: "Writes “Reply v1…”, sets tries = 1. Fixed edge → `review`. Checkpoint 1 saved." },
          { title: "review (1st)", text: "tries < 2, so approved = False. Conditional edge → `draft`. Checkpoint 2 saved." },
          { title: "draft (2nd)", text: "Writes “Reply v2…”, tries = 2. → `review`. Checkpoint 3." },
          { title: "review (2nd)", text: "approved = True. Conditional edge → `send`. Checkpoint 4." },
          { title: "send and END", text: "sent = True, edge → END. Checkpoint 5. The final state is returned." }
        ] },
        { type: "p", text: "Notice that at every moment we can answer three questions: which node are we in, what is the state, and how did we get here. That is the core benefit of graph engineering over an opaque loop." }
      ]
    },
    {
      id: "parallel-branches",
      title: "Parallel branches: doing many things at the same time",
      blocks: [
        { type: "p", text: "If two nodes do not depend on each other, the graph can run them at the same time. This is called **fan-out** (one node leads to several) and **fan-in** (several lead back into one). For a support ticket, we might look up the order, search the help centre and check the customer's history in parallel, then let one `draft` node use all three results." },
        { type: "chart", kind: "hbar", title: "Time to gather context for one ticket", unit: " s", labels: ["Sequential: order → docs → history", "Parallel: all three at once"], series: [ { name: "Seconds", values: [3.5, 1.5] } ], caption: "Illustrative: lookups of 1.0 s, 1.5 s and 1.0 s. In sequence they add up to 3.5 s; in parallel we wait only for the slowest, 1.5 s." },
        { type: "p", text: "Parallel branches raise one new question: what if two branches write the same state field? Graph runtimes solve this with a **reducer**, a rule for merging updates. For a list field the reducer is usually “append”, so each branch adds its results; for a single value we must decide which branch wins, or avoid the conflict by giving each branch its own field." }
      ]
    },
    {
      id: "checkpoints-humans-errors",
      title: "Checkpoints, human in the loop and errors",
      blocks: [
        { type: "p", text: "**Checkpoints.** Saving the state after each node (as our runtime did) gives us three things. We can **resume** a long run after a crash from the last checkpoint instead of starting over. We can **pause** a run, even for days, and continue later. And we can **time-travel** for debugging: load the state from checkpoint 2 and re-run from there with a fixed node." },
        { type: "p", text: "**Human in the loop.** Because the graph can pause at a known node with a saved state, adding a human is natural: before `send`, the graph stops, shows the draft to an agent in a dashboard, and resumes when they click approve or type edits. The human's input becomes a state update, and the graph continues along the edges." },
        { type: "p", text: "**Handling errors.** Each node is a natural boundary for errors. A node can retry its own transient failures (an API timeout). A failure the node cannot fix can be written into state (`error = 'order API down'`) and a conditional edge can route to a fallback node, such as a polite holding reply or a human queue. One broken step no longer crashes the whole system." },
        { type: "check", question: "Our graph sends a refund confirmation, but legal wants a person to approve any refund over $200 first. Where would we add this in graph terms?", answer: "Add a conditional edge after the refund decision: if amount > 200, route to an `await_approval` node that pauses the graph (saving a checkpoint) until a human approves; otherwise go straight on. The checkpoint lets the run wait safely and resume with the human's answer in state." }
      ]
    },
    {
      id: "graph-vs-loop",
      title: "Graph engineering vs loop engineering",
      blocks: [
        { type: "compare", title: "Two ways to structure multi-step AI work", options: [
          { name: "Loop engineering", summary: "One loop where the model chooses each next action from a set of tools.", pros: ["Very flexible; handles surprises", "Little upfront design"], cons: ["Hard to guarantee required steps", "Harder to see and test", "Can wander"], bestFor: "Open-ended tasks where the path is unknown: debugging, research" },
          { name: "Graph engineering", summary: "A fixed map of nodes and edges; the model works inside nodes and some routing decisions.", pros: ["Required steps always happen", "Each node testable", "Easy pause, resume, parallelism and human approval"], cons: ["Upfront design work", "Rigid when the task does not fit the map"], bestFor: "Repeatable business workflows with known stages" }
        ], rows: [
          ["Who decides the next step", "The model, each turn", "Edges (code), sometimes using a model's output"],
          ["Visibility", "A log of turns", "A position on a drawn map"],
          ["Pause for a human", "Possible, ad hoc", "Built in at any node"],
          ["Typical risk", "Drift, endless loops", "Over-rigid flows, missing branches"]
        ], verdict: "They combine well: a graph for the overall workflow, with an agent loop living inside one node where flexibility is needed." }
      ]
    },
    {
      id: "worked-resume-example",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "Checkpoints sound abstract until something breaks. Let us replay the run from our first graph, and make the email API fail at the worst moment." },
        { type: "table", caption: "The five checkpoints of that run", head: ["Checkpoint", "After node", "Next node", "Key state"], rows: [["1", "draft", "review", "tries = 1"], ["2", "review", "draft", "tries = 1, approved = False"], ["3", "draft", "review", "tries = 2"], ["4", "review", "send", "tries = 2, approved = True"], ["5", "send", "END", "sent = True"]] },
        { type: "steps", title: "The send node crashes", items: [{ title: "What we have", text: "Two drafts and two reviews are done, then `send` raises an error. Checkpoint 4 is the last one saved: approved draft v2, next node `send`." }, { title: "Restart without checkpoints", text: "We begin again at `draft` with tries = 0. That repeats four node runs, which in a real system are four model calls. The new draft may also differ from the one that was approved." }, { title: "Resume from checkpoint 4", text: "We load the saved state and run only `send`. One node, no model call, and the reply that goes out is exactly the one that passed review." }, { title: "Count the saving", text: "Five node runs from scratch against one from the checkpoint. On a long graph the gap is larger." }] },
        { type: "p", text: "Resuming has one trap. Suppose `send` did email the customer and then crashed before its checkpoint was saved. On resume it runs again, and the customer gets two emails. A node with an outside effect should be safe to repeat: for example, `send` first looks for a “sent” record keyed by the ticket id." },
        { type: "p", text: "The same checkpoints give us time travel. To try a stricter reviewer, we load checkpoint 1 and run on from `review` with the new node. We do not pay for the first draft again." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build the fan-out and fan-in from the parallel-branches section. Three lookup nodes read the same state and return updates. A reducer appends their facts, a plain field shows what “last write wins” means, and a failed lookup is routed to a fallback node instead of crashing the run." },
        { type: "code", lang: "python", title: "practice_fanout_reducer.py", code: `# Fan-out and fan-in with a reducer, plus an error route to a fallback node.
def order(s):   return {"facts": ["order 42: kettle, delivered"], "source": "orders"}
def docs(s):    return {"facts": ["returns accepted within 30 days"], "source": "docs"}
def history(s):
    if s["history_down"]:
        return {"error": "history API down"}          # write the failure into state
    return {"facts": ["2 past tickets, both solved"], "source": "history"}

REDUCERS = {"facts": lambda old, new: old + new}      # list field: append

def merge(state, update):
    for key, value in update.items():
        if key in REDUCERS:
            state[key] = REDUCERS[key](state[key], value)
        else:
            state[key] = value                        # default: last write wins
    return state

def run(history_down):
    state = {"ticket": "kettle broken", "history_down": history_down, "facts": []}
    snapshot = dict(state)                            # every branch reads the same state
    updates = [node(snapshot) for node in (order, docs, history)]   # fan-out
    for update in updates:                            # fan-in: merge the updates
        state = merge(state, update)
    nxt = "fallback" if "error" in state else "draft" # conditional edge
    if nxt == "draft":
        state["reply"] = f"draft built from {len(state['facts'])} facts"
    else:
        state["reply"] = "holding reply sent; ticket queued for a human"
    return nxt, state

for down in (False, True):
    nxt, state = run(down)
    print("route:", nxt, "| facts:", len(state["facts"]), "| source:", state["source"])
    print("  reply:", state["reply"])`, output: `route: draft | facts: 3 | source: history
  reply: draft built from 3 facts
route: fallback | facts: 2 | source: docs
  reply: holding reply sent; ticket queued for a human`, walkthrough: [{ lines: [2, 7], note: "Three lookup nodes. Each returns only its update. The history node writes an `error` field when its API is down." }, { lines: [9, 17], note: "The merge rule: a field with a reducer is combined, here by appending; any other field is simply overwritten." }, { lines: [20, 24], note: "Fan-out and fan-in: every branch reads the same snapshot, then the updates are merged one by one." }, { lines: [25, 30], note: "A conditional edge routes on the `error` field: to `draft` normally, to a fallback when a lookup failed." }] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: ["Delete the `facts` entry from `REDUCERS`, so that every field uses last write wins. Predict the `facts` count in the first run.", "Change the branch order to `(history, docs, order)`. Predict the `source` printed for each run. What does this tell us about fields without a reducer?", "Soften the route: go to `draft` whenever at least 2 facts arrived, even with an error. Predict the reply for the second run."] },
        { type: "check", question: "In the first run `facts` holds 3 items but `source` holds only `history`. All three branches wrote both fields. Why the difference?", answer: "`facts` has a reducer that appends, so each branch's list was added to the others. `source` has no reducer, so each write replaced the one before, and only the last merged branch is left. Any field that parallel branches share needs a reducer, or each branch needs its own field. Otherwise results vanish without any error." },
        { type: "check", question: "Each branch received `snapshot`, a copy taken before the fan-out, and not the live `state`. What could go wrong if branches read the live state while others were updating it?", answer: "A branch's input would depend on which branches happened to finish first, so the same ticket could give different results from run to run. With a snapshot, every branch sees the same input and no branch can affect another. The only place their results meet is the merge step, where the reducer rules are explicit. That is what makes it safe to run the branches truly in parallel." }
      ]
    },
    {
      id: "where-it-works-best-practices",
      title: "Where it works, where it fails, and best practices",
      blocks: [
        { type: "p", text: "**Works well:** document processing pipelines (extract → validate → enrich → store), support and sales workflows with approval steps, multi-agent systems where a supervisor routes work to specialist nodes, and any process where compliance needs proof that certain steps happened." },
        { type: "p", text: "**Fails or adds friction:** truly open-ended problems where we cannot predict the steps (the graph becomes a giant mess of edges), quick prototypes where drawing the graph costs more than the task, and single-call tasks that need no graph at all. A sign of trouble is a graph with dozens of conditional edges trying to anticipate every case: that is usually a loop pretending to be a graph." },
        { type: "list", ordered: true, items: [
          "Design the state schema first, and keep it small and typed.",
          "Keep each node to one responsibility; if a node needs “and” in its name, split it.",
          "Put decisions in edges, not hidden inside prompts, so they can be tested.",
          "Give every cycle a counter and an exit, and the runtime a global step limit.",
          "Checkpoint after each node; it is cheap and makes pause, resume and debugging possible.",
          "Use plain code nodes where no model is needed; reserve LLM calls for judgement.",
          "Draw the graph and keep the drawing in sync with the code."
        ] },
        { type: "p", text: "**Conclusion.** Graph engineering turns an AI system from a black box into a visible map: small steps, explicit decisions, shared state, and natural places to pause, retry, parallelise and involve humans. Combined with the harness and loop engineering from the previous lessons, it is how most production agent systems are structured today." }
      ]
    }
  ],
  quiz: [
    { q: "In graph engineering, what is the role of the state?", options: ["It holds the model's hidden activations between the layers of each call", "It is the list of edges that says which node runs after which", "It is the prompt template used by the first node in the graph", "A shared record that nodes read and update as the run moves"], answer: 3, explain: "State is the shared data object passed along the graph; nodes return updates and the runtime merges them." },
    { q: "Our pipeline sometimes sends replies that skipped review, because the model “decided” review was unnecessary. What graph change fixes this?", options: ["Tell the model clearly in the prompt that review is always important", "Make an approved review the only edge into the send node", "Run the review and send nodes in parallel to save time", "Remove the review node completely so nothing is skipped"], answer: 1, explain: "Required steps should be enforced by edges, not by hoping the model remembers. If the only path to send passes through an approval, skipping is impossible." },
    { q: "Three independent lookups take 1.0 s, 1.5 s and 1.0 s. About how long does the gathering step take if we run them as parallel branches?", options: ["1.5 s", "3.5 s", "1.0 s", "1.17 s"], answer: 0, explain: "In parallel we wait for the slowest branch, 1.5 s. Running them in sequence would take the sum, 3.5 s." },
    { q: "Which statement best contrasts graph engineering with loop engineering?", options: ["Graphs can never contain cycles, while loops always repeat", "Loop: the model picks each step. Graph: edges define the paths", "Loops support human approval steps, while graphs cannot pause", "Graphs need no stop conditions because their paths are fixed"], answer: 1, explain: "Graphs can have cycles and support humans very naturally; they still need limits. The real difference is who decides the path." },
    { q: "A teammate says “once we use a graph, we no longer need step limits, because the path is fixed.” Why is this wrong?", options: ["Graphs always run in parallel, so step limits are pointless anyway", "Step limits only matter during training, never in production runs", "A cycle can repeat forever if its exit condition is never met", "Checkpoints already stop any run that goes on for too long"], answer: 2, explain: "A cycle with an unreachable exit is an infinite loop. Each cycle needs a counter and an exit route, and the runtime needs a global step limit. Checkpoints save state but do not stop anything." }
  ],
  takeaways: [
    "Graph engineering lays out an AI system as nodes (steps), edges (paths) and a shared state.",
    "Conditional edges make decisions visible and testable; cycles let the graph redo work.",
    "Every cycle needs a counter and an exit, and the runtime needs a global step limit.",
    "Parallel branches cut latency; reducers decide how their updates merge.",
    "Checkpoints enable resume after crashes, pausing for human approval and time-travel debugging.",
    "Use graphs for known workflows and loops for open-ended ones; nesting a loop inside a node combines both."
  ],
  terms: [
    { term: "Node", def: "One step in the graph: a function that reads the state and returns an update." },
    { term: "Edge", def: "An arrow from one node to the next; a conditional edge picks the next node at run time." },
    { term: "State", def: "The shared data record that flows through the graph and is updated by nodes." },
    { term: "Cycle", def: "A path that returns to an earlier node, used to repeat work such as redrafting." },
    { term: "Reducer", def: "A rule for merging state updates, especially from parallel branches (for example, append to a list)." },
    { term: "Checkpoint", def: "A saved copy of the state and position after a node, used to pause, resume or debug a run." }
  ]
};
