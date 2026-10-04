export default {
  id: "how-does-langgraph-work",
  minutes: 28,
  hook: "How do we build an agent that can loop, branch, remember a customer across sessions and pause for a manager's approval, without it turning into a tangle of if-statements?",
  summary: "LangGraph is an open-source library from the LangChain team for building agents as graphs. We define a typed state, nodes that update it, and edges (fixed or conditional) that decide what runs next; cycles are allowed, so agent loops are natural. A checkpointer saves the state after every step per conversation thread, which gives memory, crash recovery, time travel and human-in-the-loop pauses. It is graph engineering, packaged as a library.",
  sections: [
    {
      id: "what-is-langgraph",
      title: "What is LangGraph?",
      blocks: [
        { type: "p", text: "**LangGraph** is an open-source library (Python and JavaScript) from the company behind LangChain, first released in early 2024. It lets us describe an LLM application as a **graph**: nodes are steps, edges connect them, and a shared **state** flows through. Unlike a simple chain, the graph may contain **cycles**, which is exactly what an agent needs: think, act, observe, think again." },
        { type: "p", text: "LangGraph is the practical form of the graph engineering ideas from earlier in this module. It is a lower-level tool than LangChain's chains: it does not decide how our agent should behave; it gives us precise control over the flow and handles the hard infrastructure parts (state merging, persistence, streaming, interrupts). LangChain 1.0's `create_agent` is itself built on LangGraph." },
        { type: "callout", tone: "analogy", title: "Think of a board game", text: "The board (graph) has squares (nodes) and arrows (edges), some of which say “roll: if 6, take the shortcut” (conditional edges). Each player carries a card with their position and items (state). You can save the game, leave, and come back tomorrow exactly where you were (checkpointer), and a referee can pause play to approve a move (human-in-the-loop)." },
        { type: "p", text: "Running example: a **shop support agent** that looks up orders with a tool, remembers each customer's conversation, and asks a human before issuing refunds." }
      ]
    },
    {
      id: "why-langgraph",
      title: "Why do we need LangGraph?",
      blocks: [
        { type: "p", text: "Chains are great for straight pipelines: retrieve → prompt → model → parse. Agents are different. They need to:" },
        { type: "list", items: [
          "**Loop** an unknown number of times (call tools until the answer is ready).",
          "**Branch** on decisions (tool call or final answer? refund or question?).",
          "**Keep state** across steps and across separate user messages.",
          "**Survive interruptions:** resume after a crash, or wait hours for a human approval.",
          "**Stay controllable:** limit steps, force certain checks, show progress while running."
        ] },
        { type: "p", text: "We could hand-write all of this with while-loops and dictionaries, and every team used to. LangGraph provides it as a tested runtime so we write only the business logic: the nodes and the routing." }
      ]
    },
    {
      id: "graph-and-state",
      title: "What is a graph and what is state in LangGraph?",
      blocks: [
        { type: "p", text: "A LangGraph graph starts with `StateGraph(State)`, where `State` is a schema (usually a Python `TypedDict` or a Pydantic model) listing the fields every node can read and update. For a chat agent the state is often just a list of messages." },
        { type: "p", text: "Nodes do not overwrite the state; they **return updates**, and LangGraph merges them. How a field is merged is set by a **reducer**. With no reducer, a new value replaces the old one. With `Annotated[list, add_messages]`, new messages are appended to the list (and a message with an existing id replaces that one). Reducers are what make parallel branches safe: two nodes can both add messages without one erasing the other." },
        { type: "formula", expr: "new_state[field] = reducer(old_state[field], update[field])", where: [["reducer", "default: replace; add_messages: append by id; operator.add: concatenate lists"], ["update", "the dict a node returned (only the fields it changed)"]], caption: "The state-merge rule LangGraph applies after every node." },
        { type: "check", question: "A state field `notes: list` has no reducer. Node A returns `{\"notes\": [\"x\"]}`, then node B returns `{\"notes\": [\"y\"]}`. What is `notes` after both?", answer: "`[\"y\"]`. Without a reducer the default is replace, so B's value overwrites A's. With `Annotated[list, operator.add]` it would be `[\"x\", \"y\"]`." }
      ]
    },
    {
      id: "nodes-edges-conditional",
      title: "Nodes, edges and conditional edges",
      blocks: [
        { type: "p", text: "A **node** is a plain function `node(state) -> update`, added with `builder.add_node(\"name\", fn)`. It can call an LLM, run a tool, query a database, or do pure logic." },
        { type: "p", text: "A **normal edge**, `builder.add_edge(\"a\", \"b\")`, always goes from a to b. Special names `START` and `END` mark where a run enters and leaves. A **conditional edge**, `builder.add_conditional_edges(\"a\", router)`, calls `router(state)` after node a; the router returns the name of the next node (or `END`). This is where decisions live, for example: “did the model ask for a tool? then go to tools, else finish”." },
        { type: "flow", title: "The classic tool-calling agent graph", loop: true, nodes: [
          { label: "START", detail: "The run begins with the user's message added to state.messages." },
          { label: "agent", detail: "Node: calls the chat model (with tools bound) on all messages and appends its reply." },
          { label: "route", detail: "Conditional edge: if the last AI message contains tool calls → tools; otherwise → END." },
          { label: "tools", detail: "Node: executes each requested tool and appends ToolMessages with the results." },
          { label: "back to agent", detail: "Normal edge tools → agent closes the cycle; the model now sees the tool results and decides again." }
        ] },
        { type: "p", text: "Calling `builder.compile()` checks the graph (for example, that edges point at real nodes) and returns a runnable app with `invoke`, `stream` and async versions. A `recursion_limit` setting caps the number of steps per run, so a cycle cannot spin forever." }
      ]
    },
    {
      id: "complete-example",
      title: "A complete example",
      blocks: [
        { type: "p", text: "Below: the real LangGraph code for our support agent, and a runnable mini version that implements the same mechanics (reducer, conditional edge, cycle, checkpointer per thread) in plain Python." },
        { type: "tabs", items: [
          { label: "Real LangGraph", blocks: [
            { type: "code", lang: "python", title: "support_agent.py (needs langgraph, langchain-openai, an API key)", code: `from typing import Annotated
from typing_extensions import TypedDict
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import InMemorySaver

@tool
def get_order_status(order_id: str) -> str:
    """Look up the shipping status of an order by id."""
    return {"42": "shipped", "7": "packing"}.get(order_id, "unknown")

class State(TypedDict):
    messages: Annotated[list, add_messages]      # reducer: append

llm = ChatOpenAI(model="gpt-4o-mini").bind_tools([get_order_status])
def agent(state: State):
    return {"messages": [llm.invoke(state["messages"])]}

builder = StateGraph(State)
builder.add_node("agent", agent)
builder.add_node("tools", ToolNode([get_order_status]))
builder.add_edge(START, "agent")
builder.add_conditional_edges("agent", tools_condition)   # tools or END
builder.add_edge("tools", "agent")
graph = builder.compile(checkpointer=InMemorySaver())

cfg = {"configurable": {"thread_id": "customer-1"}}
graph.invoke({"messages": [("user", "Where is order 42?")]}, cfg)
out = graph.invoke({"messages": [("user", "And order 7?")]}, cfg)
print(out["messages"][-1].content)`, walkthrough: [
              { lines: [10, 13], note: "A tool. Its docstring and type hints become the schema the model sees." },
              { lines: [15, 16], note: "The state: one field, a message list with the `add_messages` reducer." },
              { lines: [18, 20], note: "The agent node: the model, with the tool bound, reads all messages and returns one new AI message." },
              { lines: [22, 28], note: "Build the graph: two nodes, an entry edge, the prebuilt `tools_condition` router, and the edge back that forms the cycle. Compile with an in-memory checkpointer." },
              { lines: [30, 33], note: "Same thread id twice: the second call sees the first conversation, so “And order 7?” makes sense." }
            ] }
          ] },
          { label: "Mini version (runnable)", blocks: [
            { type: "code", lang: "python", title: "minigraph.py", code: `END = "__end__"
class StateGraph:
    def __init__(self): self.nodes, self.edges, self.cond = {}, {}, {}
    def add_node(self, name, fn): self.nodes[name] = fn
    def add_edge(self, a, b): self.edges[a] = b
    def add_conditional_edges(self, a, router): self.cond[a] = router
    def compile(self, checkpointer):
        def invoke(update, thread_id, start="agent"):
            state = checkpointer.get(thread_id, {"messages": []})
            state = {"messages": state["messages"] + update["messages"]}  # reducer: append
            node = start
            while node != END:
                out = self.nodes[node](state)
                state = {"messages": state["messages"] + out["messages"]}
                node = self.cond[node](state) if node in self.cond else self.edges[node]
            checkpointer[thread_id] = state           # persist per thread
            return state
        return invoke

def get_order_status(order_id): return {"42": "shipped", "7": "packing"}[order_id]

def agent(state):                     # fake LLM: call a tool once, then answer
    last = state["messages"][-1]
    if last.startswith("user:"):
        return {"messages": [f"tool_call:get_order_status:{last.split()[-1]}"]}
    return {"messages": [f"ai: Your order is {last.split(':')[-1]}."]}

def tools(state):                     # the graph, not the LLM, runs the tool
    _, name, arg = state["messages"][-1].split(":")
    return {"messages": [f"tool:{get_order_status(arg)}"]}

g = StateGraph()
g.add_node("agent", agent); g.add_node("tools", tools)
g.add_conditional_edges("agent", lambda s: "tools" if s["messages"][-1].startswith("tool_call") else END)
g.add_edge("tools", "agent")
memory = {}
app = g.compile(checkpointer=memory)
print(app({"messages": ["user: where is order 42"]}, thread_id="t1")["messages"])
print(app({"messages": ["user: and order 7"]}, thread_id="t1")["messages"][-1])
print("messages saved for t1:", len(memory["t1"]["messages"]), "| threads:", list(memory))`, output: `['user: where is order 42', 'tool_call:get_order_status:42', 'tool:shipped', 'ai: Your order is shipped.']
ai: Your order is packing.
messages saved for t1: 8 | threads: ['t1']`, walkthrough: [
              { lines: [2, 6], note: "The builder API: register nodes, normal edges and conditional edges." },
              { lines: [7, 10], note: "Compiling returns an `invoke` function. It loads the saved state for this thread and appends the new input (the append reducer)." },
              { lines: [11, 15], note: "The runtime loop: run a node, merge its update, then follow a conditional edge if there is one, else the normal edge. Stop at END." },
              { lines: [16, 17], note: "The checkpointer: save the final state under the thread id. (Real LangGraph saves after every step, not only at the end.)" },
              { lines: [22, 26], note: "A fake model: on a user message it requests a tool; after a tool result it answers." },
              { lines: [28, 30], note: "The tools node parses the request and runs the real Python function." },
              { lines: [32, 40], note: "Wire the same graph as the real example and run two turns on one thread. The second turn reuses the first turn's history: 8 messages total." }
            ] }
          ] }
        ] }
      ]
    },
    {
      id: "tools-and-who-calls-them",
      title: "Tools and who calls them",
      blocks: [
        { type: "p", text: "A frequent confusion: the model **never runs a tool itself**. It only outputs a structured request: “call `get_order_status` with `order_id='42'`”. Something else must execute that request. In LangGraph that something is a node, usually the prebuilt `ToolNode`, which reads the tool calls from the last AI message, runs the matching Python functions, and appends `ToolMessage` results to state." },
        { type: "steps", title: "Life of one tool call", items: [
          { title: "Bind", text: "`llm.bind_tools([...])` sends the tool names, descriptions and argument schemas with every model request." },
          { title: "Request", text: "The model replies with an AI message whose `tool_calls` list names the tool and arguments, instead of (or as well as) text." },
          { title: "Route", text: "The conditional edge (`tools_condition`) sees the tool calls and routes to the tools node." },
          { title: "Execute", text: "`ToolNode` runs each function with the given arguments. Errors can be caught and returned as messages so the model can try again." },
          { title: "Return", text: "Results are appended as ToolMessages, the edge goes back to the agent node, and the model reads them." }
        ] },
        { type: "callout", tone: "tip", title: "Why this split is good", text: "Because our code executes tools, we control them: validate arguments, enforce permissions, add timeouts, log every call, or pause before risky ones. The model only proposes." }
      ]
    },
    {
      id: "memory-and-persistence",
      title: "Memory and persistence",
      blocks: [
        { type: "p", text: "When we compile with a **checkpointer**, LangGraph saves a snapshot of the state after every step (technically, every “super-step”), keyed by the `thread_id` we pass in the config. A thread is one conversation or one job. This single feature gives several capabilities:" },
        { type: "list", items: [
          "**Short-term memory:** calling again with the same thread id continues the conversation, as in our example.",
          "**Fault tolerance:** if a run crashes mid-way, it can resume from the last saved step.",
          "**Time travel:** `get_state_history` lists past snapshots; we can inspect or re-run from any of them to debug.",
          "**Human-in-the-loop:** a run can stop and wait indefinitely, because its state is safely stored."
        ] },
        { type: "p", text: "`InMemorySaver` is for development; production uses database-backed checkpointers (for example SQLite or Postgres versions). For **long-term memory** shared across threads (a customer's preferences remembered in every new chat), LangGraph offers a separate **store** interface for key-value documents, which nodes can read and write." },
        { type: "callout", tone: "warn", title: "Thread ids are a privacy boundary", text: "Everything in a thread is replayed to the model. Reusing one thread id for different users leaks one customer's conversation to another. Derive thread ids from the authenticated user and conversation, never from user-supplied text." }
      ]
    },
    {
      id: "human-in-the-loop",
      title: "Human-in-the-loop",
      blocks: [
        { type: "p", text: "Because state is checkpointed, LangGraph can **interrupt** a run. Inside a node we call `interrupt(payload)`; the graph saves its state and returns the payload to our application (for example, “approve refund of $250 for order 42?”). Later we resume with `graph.invoke(Command(resume=answer), config)` on the same thread, and `interrupt` returns the human's answer inside the node, which continues from there. Graphs can also be compiled with static breakpoints such as `interrupt_before=[\"tools\"]` to pause before every tool call." },
        { type: "code", lang: "python", title: "approval step (real LangGraph, not run here)", code: `from langgraph.types import interrupt, Command

def refund(state):
    amount = state["refund_amount"]
    if amount > 200:                                   # policy: big refunds need a human
        decision = interrupt({"question": f"Approve refund of \${amount}?"})
        if decision != "approve":
            return {"messages": [("ai", "A manager declined this refund.")]}
    return {"messages": [("ai", f"Refund of \${amount} issued.")]}

# first call pauses at interrupt(); later, after the manager clicks approve:
# graph.invoke(Command(resume="approve"), {"configurable": {"thread_id": "customer-1"}})`, walkthrough: [
          { lines: [3, 6], note: "Inside a node, ask a human only when the policy requires it. `interrupt` saves state and stops the run." },
          { lines: [7, 9], note: "On resume, `decision` holds the human's answer, and the node finishes accordingly." },
          { lines: [11, 12], note: "Resuming is just another invoke on the same thread with a `Command(resume=...)`." }
        ] },
        { type: "check", question: "Why can't human-in-the-loop work reliably without a checkpointer?", answer: "Because the run must stop and later continue exactly where it was, possibly in a different process hours later. Without saved state there is nothing to resume from; the whole run would have to start over." }
      ]
    },
    {
      id: "when-to-use-langgraph",
      title: "When to use LangGraph",
      blocks: [
        { type: "compare", title: "Choosing a level of control", options: [
          { name: "LangChain chain", summary: "A linear pipeline of components joined with `|`.", pros: ["Very little code", "Easy to read"], cons: ["No cycles or persistent state"], bestFor: "RAG answers, extraction, single-pass tasks" },
          { name: "Prebuilt agent (create_agent)", summary: "A ready-made tool-calling loop, built on LangGraph.", pros: ["One function call", "Gets checkpointing and streaming"], cons: ["Less control over the flow"], bestFor: "Standard tool-using assistants" },
          { name: "Custom LangGraph", summary: "Our own state, nodes and edges.", pros: ["Exact control of loops, branches and checks", "Persistence, interrupts, parallel branches"], cons: ["More design and code", "A new mental model to learn"], bestFor: "Multi-step workflows, approvals, multi-agent systems" },
          { name: "Plain Python", summary: "Hand-written loop with the provider SDK.", pros: ["No framework to learn", "Total transparency"], cons: ["Rebuild persistence, interrupts, streaming yourself"], bestFor: "Small agents, or teams that prefer no frameworks" }
        ], verdict: "Start with the simplest option that works; move to a custom LangGraph graph when you need explicit control flow, durable state or human approvals." },
        { type: "callout", tone: "warn", title: "Common mistakes", text: "Forgetting a reducer and silently overwriting a list; using one shared thread id; putting giant blobs (whole PDFs) in state so every checkpoint is huge; and building a 30-node graph for a job a single prompt could do." },
        { type: "callout", tone: "example", title: "Real-world use", text: "Teams use LangGraph for customer-support agents with escalation, research agents with plan-search-write loops, document-processing pipelines with validation and review, and supervisor setups where one node routes work to specialist sub-agents." }
      ]
    },
    {
      id: "tracing-state-step-by-step",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "The merge rule decides everything a node can see, so let us trace it by hand on the mini version from this lesson. The state has one field, `messages`, with an append reducer. The user asks “where is order 42”." },
        { type: "table", caption: "Thread t1, first turn: what each step returns, and the state after the merge", head: ["Step", "Who ran", "Update returned", "Messages after merge"], rows: [["0", "input", "`user: where is order 42`", "1"], ["1", "agent", "`tool_call:get_order_status:42`", "2"], ["2", "tools", "`tool:shipped`", "3"], ["3", "agent", "`ai: Your order is shipped.`", "4"]] },
        { type: "p", text: "Each node returned one message, not the whole list. The reducer did the appending. After step 3 the conditional edge finds no tool call and routes to END, and 4 messages are saved under `t1`. The second turn loads those 4 and adds 4 more, which is the 8 in the output." },
        { type: "steps", title: "The same run with the default rule, replace", items: [{ title: "Input arrives", text: "`messages` is replaced by the new input: 1 message. No harm yet." }, { title: "agent runs", text: "It returns the tool call. `messages` now holds only the tool call. The user's question is gone." }, { title: "tools runs", text: "It reads the last message, runs the tool and returns the result. Only `tool:shipped` is left." }, { title: "agent runs again", text: "Our fake model looks only at the last message, so it still answers. A real model would see a tool result with no question in front of it." }, { title: "Second turn", text: "Loading the thread gives 1 message, not 4. The conversation memory is one line long." }] },
        { type: "p", text: "Nothing crashed in that replay. This is why a missing reducer is hard to notice: the graph runs, and the damage is a model that quietly lacks context. When a list field in a saved state looks too short, check its reducer first." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build two ideas in plain Python: the merge rule with a reducer, and a pause that waits for a human. A refund over 200 stops the run before it is issued. The state is saved under a thread id, and a later call that carries the human's answer picks up where the run stopped. This is a sketch of the mechanism, not LangGraph's real API." },
        { type: "code", lang: "python", title: "practice_pause_resume.py", code: `import operator    # a plain-Python sketch of the ideas, not the real LangGraph API

REDUCERS = {"notes": operator.add}            # no entry = replace (the default)

def merge(state, update):
    # new_state[field] = reducer(old_state[field], update[field])
    new = dict(state)
    for field, value in update.items():
        new[field] = REDUCERS[field](state[field], value) if field in REDUCERS else value
    return new

def lookup(state): return {"notes": ["order 42 costs 250"], "amount": 250}
def refund(state):
    if state["amount"] > 200 and state["approval"] is None:
        return "PAUSE"                        # like an interrupt: wait for a human
    ok = state["amount"] <= 200 or state["approval"] == "approve"
    return {"notes": ["refund issued" if ok else "refund declined"], "status": "done"}

NODES = [("lookup", lookup), ("refund", refund)]
saved = {}                                    # thread id -> (next node index, state)
EMPTY = {"notes": [], "amount": 0, "approval": None, "status": "open"}

def invoke(thread_id, resume=None):
    index, state = saved.get(thread_id, (0, EMPTY))
    if resume is not None:
        state = merge(state, {"approval": resume})    # the human's answer is an update
    while index < len(NODES):
        name, fn = NODES[index]
        update = fn(state)
        if update == "PAUSE":
            saved[thread_id] = (index, state)         # checkpoint, then stop
            return f"paused at {name}: approve refund of {state['amount']}?"
        state, index = merge(state, update), index + 1
        saved[thread_id] = (index, state)             # checkpoint after every step
    return f"{state['status']}: {state['notes']}"

print(invoke("customer-1"))
print(invoke("customer-1", resume="approve"))
print(invoke("customer-2"))
print(invoke("customer-2", resume="no"))`, output: `paused at refund: approve refund of 250?
done: ['order 42 costs 250', 'refund issued']
paused at refund: approve refund of 250?
done: ['order 42 costs 250', 'refund declined']`, walkthrough: [{ lines: [3, 10], note: "The merge rule from the lesson: a field with a reducer is combined (here, lists are added); any other field is replaced." }, { lines: [12, 17], note: "Two nodes. `refund` returns a pause signal when the amount is over 200 and no approval is in the state yet." }, { lines: [23, 35], note: "The runtime: load the thread's saved position and state, merge a human answer if there is one, run nodes, and save after every step." }, { lines: [37, 40], note: "Two threads. Each pauses, then resumes with a different human answer." }] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: ["Remove `\"notes\"` from `REDUCERS`. Predict the final `notes` list for customer-1.", "Change the amount in `lookup` to 150. Predict what the first call prints. Does the run pause at all?", "Call `invoke(\"customer-1\")` twice in a row with no `resume`. Predict the second result. Why is it safe to ask twice?"] },
        { type: "check", question: "When we resume, our `invoke` runs the `refund` node again from its first line; it does not jump into the middle of the function. Why does the refund still come out right, and what should we keep out of the lines before the pause?", answer: "On the second run `approval` is in the state, so the node skips the pause and finishes. This works because everything before the pause is a pure check. If the node did something with an outside effect before pausing, such as sending an email, that action would happen twice. Keep side effects after the pause, or make them safe to repeat." },
        { type: "check", question: "customer-1 and customer-2 paused with the same question and then got different endings. Where did each run keep its place while it waited? What would happen if both used one thread id?", answer: "In `saved`, under its own thread id: the index of the next node plus the full state. That entry is the only thing that links the second call to the first. With a shared thread id, the second customer's run would overwrite the first one's saved state, and one manager's answer could be applied to the other customer's refund. Each conversation needs its own thread id." }
      ]
    }
  ],
  quiz: [
    { q: "What does a reducer such as `add_messages` control in LangGraph?", options: ["Which node runs next after the current node has finished", "How a node's update is merged into the existing state field", "How many tokens the model is allowed to output per call", "Which tools are bound to the chat model for the agent"], answer: 1, explain: "Reducers define merging: replace by default, or append for message lists. Routing is done by edges." },
    { q: "Our agent forgets what the customer said in their previous message. What is most likely missing?", options: ["A conditional edge that routes back to the agent node", "A larger model with a much longer context window", "A checkpointer plus the same thread_id on every call", "A ToolNode that can look up previous conversations"], answer: 2, explain: "Conversation memory comes from the checkpointer saving state per thread. Without it, or with a new thread id each time, each call starts fresh." },
    { q: "In the mini version, why does the second call print “Your order is packing.” and leave 8 messages saved?", options: ["4 saved messages were loaded and the second turn added 4 more", "The model remembered the first answer inside its own weights", "The tools node ran twice during the second turn of the chat", "The reducer duplicated every message that was appended"], answer: 0, explain: "The checkpointer stored 4 messages for t1; turn 2 appended the user message, tool call, tool result and answer: 4 + 4 = 8." },
    { q: "Who actually executes a tool in a LangGraph agent?", options: ["The LLM provider's servers, after the model decides", "The model itself, during its forward pass", "The user's browser, through a JavaScript callback", "A node in our graph, such as ToolNode"], answer: 3, explain: "The model only requests a tool call; our graph's tools node runs the function and returns the result as a message." },
    { q: "Which statement is a misconception?", options: ["LangGraph graphs are allowed to contain cycles", "A runaway cycle is stopped by the recursion limit", "LangGraph only works if everything uses LangChain", "interrupt() relies on saved state to resume later"], answer: 2, explain: "LangGraph works with any code inside nodes; LangChain components are optional conveniences." }
  ],
  takeaways: [
    "LangGraph builds agents as graphs of nodes, edges and a typed shared state, with cycles allowed.",
    "Nodes return updates; reducers decide how updates merge into the state.",
    "Conditional edges hold the decisions, such as “tool call or finish?”.",
    "The model requests tools; a node in our graph executes them.",
    "A checkpointer saves state per thread, enabling memory, recovery, time travel and human approval pauses.",
    "Use LangGraph when control flow, durability or approvals matter; use simpler tools otherwise."
  ],
  terms: [
    { term: "StateGraph", def: "LangGraph's builder for a graph whose nodes share and update a typed state." },
    { term: "Reducer", def: "A function that merges a node's update into a state field, such as appending messages." },
    { term: "Conditional edge", def: "An edge that calls a router function on the state to choose the next node." },
    { term: "ToolNode", def: "A prebuilt node that executes the tool calls requested in the last AI message." },
    { term: "Checkpointer", def: "A component that saves state snapshots after each step, keyed by thread id." },
    { term: "Interrupt", def: "A pause inside a node that waits for external (usually human) input before resuming." }
  ]
};
