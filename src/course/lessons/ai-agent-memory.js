export default {
  id: "ai-agent-memory",
  minutes: 25,
  hook: "An LLM forgets everything the moment a call ends; so how does an assistant remember that you are vegetarian three weeks later?",
  summary: "LLMs are stateless, so agent memory is something we build around the model. It forms a stack: the context window as working memory, the session history as short-term memory, and external stores as long-term memory (facts, past episodes and procedures). Memory systems run four core operations, write, read, update and forget, and the hard part is choosing what is worth remembering and retrieving only what helps the current task.",
  sections: [
    {
      id: "big-picture",
      title: "The big picture",
      blocks: [
        { type: "p", text: "Every LLM call starts from a blank slate. The model's weights hold general knowledge from training, but nothing about *you*, *this task*, or *what happened five minutes ago* unless we put it into the prompt. Each call is independent: this is what we mean when we say the model is **stateless**." },
        { type: "p", text: "Yet agents seem to remember: they keep track of a long task, recall your preferences, and avoid repeating last week's mistakes. All of that is **memory engineering**: ordinary software that decides what to save, where to keep it, and what to put back into the prompt at the right moment." },
        { type: "callout", tone: "analogy", title: "Think of it like a doctor with patient files", text: "A doctor sees hundreds of patients and cannot remember them all. Before your appointment, they pull your file: allergies, past treatments, notes from last visit. During the visit they keep a few things in their head (working memory) and jot notes. Afterwards they update the file, correcting what changed and leaving out small talk. The doctor's skill is like the LLM's weights; the file system is agent memory." }
      ]
    },
    {
      id: "why-memory",
      title: "Why AI agents need memory",
      blocks: [
        { type: "p", text: "Without memory, an agent hits four walls:" },
        { type: "list", items: [
          "**Within a task**: a multi-step agent must remember earlier tool results. The agent loop does this by keeping the message history, but long tasks overflow the context window.",
          "**Across sessions**: users expect not to repeat themselves (“I told you last week I'm vegetarian”).",
          "**Personalisation**: preferences, roles, projects and past decisions make answers more useful.",
          "**Learning from experience**: an agent that remembers “this API needs a date in ISO format” fails less often next time."
        ] },
        { type: "p", text: "Why not just keep everything in the prompt? Because the **context window** (the maximum tokens a model can read at once) is finite, every extra token costs money and latency on every call, and models use information in very long contexts less reliably (for example, details buried in the middle can be overlooked). Memory is therefore about *selection*: the right few facts, not all facts." },
        { type: "check", question: "A model has a 200,000-token context window. Does that mean we no longer need a memory system?", answer: "No. Context resets with every new session, so cross-session memory still needs storage. Even within a session, filling the window is slow and expensive on every call, and models may overlook details in very long contexts. Large windows reduce the pressure but do not replace selecting what matters." }
      ]
    },
    {
      id: "memory-stack",
      title: "The memory stack",
      blocks: [
        { type: "p", text: "It helps to picture memory as a stack of layers, from fastest and smallest to slowest and largest. The names below are widely used, though different frameworks slice them a little differently." },
        { type: "table", caption: "The agent memory stack",
          head: ["Layer", "What it holds", "Lifetime", "Where it lives"],
          rows: [
            ["Parametric memory", "General knowledge learned in training.", "Fixed until retraining or fine-tuning", "Model weights"],
            ["Working memory", "Everything in the current prompt: instructions, recent messages, retrieved facts.", "One model call", "Context window"],
            ["Short-term (session) memory", "The running conversation and tool results of this task.", "One session or task", "Message list, often trimmed or summarised"],
            ["Long-term: semantic", "Facts and preferences: “User is vegetarian”, “Team uses PostgreSQL”.", "Until changed or deleted", "Database, key-value or vector store"],
            ["Long-term: episodic", "Records of past events: “On 3 May we debugged the payment timeout; fix was X”.", "Until expired or archived", "Logs or vector store with timestamps"],
            ["Long-term: procedural", "How to do things: rules, learned instructions, reusable skills.", "Until revised", "System prompt, instruction files, skill libraries"]
          ] },
        { type: "p", text: "The terms *semantic*, *episodic* and *procedural* come from human memory research and map nicely onto agents: **what I know**, **what happened**, and **how to do it**. Only working memory is directly visible to the model. Every other layer matters only when its content is copied into the context." },
        { type: "callout", tone: "tip", title: "Short-term memory management", text: "When a session grows too long, common tricks are: keep the last N messages verbatim, replace older ones with a running summary, and drop or shorten bulky tool outputs while keeping their key results. The goal and any user constraints should always stay in view." }
      ]
    },
    {
      id: "four-operations",
      title: "The four core operations",
      blocks: [
        { type: "p", text: "Whatever storage we use, a memory system does four things:" },
        { type: "compare", title: "Write, read, update, forget",
          options: [
            { name: "Write", summary: "Decide something is worth keeping and store it, with metadata (time, source, type, user).", pros: ["Builds up knowledge over time"], cons: ["Storing noise pollutes later retrieval"], bestFor: "Stable facts, preferences, decisions, lessons learned" },
            { name: "Read", summary: "Retrieve the few most relevant memories for the current task and put them into the prompt.", pros: ["Personalised, informed answers"], cons: ["Wrong or stale memories mislead the model"], bestFor: "Start of each task or turn" },
            { name: "Update", summary: "Merge new information with old: correct, overwrite or consolidate memories.", pros: ["Keeps memory consistent"], cons: ["Needs conflict detection"], bestFor: "Changed facts (“moved to Munich”)" },
            { name: "Forget", summary: "Delete or expire memories that are outdated, unimportant, or must be removed.", pros: ["Privacy, relevance, smaller store"], cons: ["Over-forgetting loses useful context"], bestFor: "User requests, old episodes, sensitive data" }
          ],
          verdict: "Most memory bugs come from neglecting update and forget. A store that only ever grows becomes contradictory and noisy." },
        { type: "p", text: "**Reading** usually combines several signals into a score. A simple and common recipe is a weighted sum of **relevance** (how similar the memory is to the current query, often by embedding cosine similarity), **recency** (newer memories count more) and sometimes **importance** (how significant the memory was judged when written)." },
        { type: "formula", expr: "score = 0.8 · similarity(query, memory) + 0.2 · 0.5^(age / half-life)", where: [["similarity", "cosine similarity between query and memory embeddings, 0 to 1 here"], ["age", "days since the memory was written or last used"], ["half-life", "days after which the recency factor halves (30 below)"], ["0.8, 0.2", "weights we choose; tune them for the application"]], caption: "One reasonable retrieval score. The weights and half-life are design choices, not standard values." },
        { type: "chart", kind: "line", title: "Recency factor with a 30-day half-life", xLabel: "Age of memory (days)", yLabel: "Recency factor",
          series: [ { name: "0.5^(age/30)", points: [[0, 1], [15, 0.707], [30, 0.5], [45, 0.354], [60, 0.25], [90, 0.125]] } ],
          caption: "Exact values of 0.5^(age/30). A 60-day-old memory gets a quarter of the recency boost of a fresh one." }
      ]
    },
    {
      id: "memory-at-runtime",
      title: "How memory flows at runtime",
      blocks: [
        { type: "flow", title: "Memory in one agent turn", loop: true,
          nodes: [
            { label: "User message", detail: "“Any dinner ideas for tonight?”" },
            { label: "Read", detail: "Embed the request and retrieve the top few long-term memories: vegetarian diet, nut allergy." },
            { label: "Assemble context", detail: "System prompt + retrieved memories + recent session messages + the new message." },
            { label: "Agent acts", detail: "The model reasons, maybe calls tools, and answers using the memories." },
            { label: "Write / update / forget", detail: "Afterwards, extract anything new and durable, merge with existing memories, and expire what is stale." }
          ] },
        { type: "steps", title: "The same flow, step by step",
          items: [
            { title: "Retrieve before thinking", text: "Before the model call, query long-term memory with the user's message (and the current goal). Keep only the top few results above a relevance threshold." },
            { title: "Assemble the context", text: "Place memories in a clearly labelled section (for example “Known facts about the user”) so the model treats them as background, not instructions." },
            { title: "Run the agent", text: "The loop proceeds as usual. Tool results accumulate as short-term memory." },
            { title: "Extract", text: "After the turn (often in the background), an LLM call or rules pick out durable facts, decisions and lessons from the conversation." },
            { title: "Reconcile", text: "Compare each candidate with existing memories: add if new, update if it changes an old fact, skip if duplicate, delete if the user asked to forget." }
          ] },
        { type: "p", text: "Writing can happen **in the hot path** (the agent itself calls a `save_memory` tool during the conversation) or **in the background** (a separate process reviews conversations later). Hot-path writes are immediate and transparent; background writes keep responses fast and allow more careful consolidation." },
        { type: "p", text: "Here is a runnable toy memory store with all four operations. It uses a bag-of-words vector as a stand-in for a real embedding model, and the scoring formula above." },
        { type: "code", lang: "python", title: "agent_memory.py", code: `import numpy as np

VOCAB = ["diet", "vegetarian", "meat", "city", "berlin", "munich", "dog", "allergy", "nuts", "food"]
def embed(text):                         # toy bag-of-words "embedding"
    v = np.array([float(w in text.lower()) for w in VOCAB])
    return v / (np.linalg.norm(v) or 1.0)

store = {}                               # long-term memory: key -> record
def write(key, text, day):  store[key] = {"text": text, "day": day, "vec": embed(text)}
def forget(key):            store.pop(key, None)
def read(query, today, k=2, half_life=30):
    q = embed(query)
    scored = []
    for key, m in store.items():
        sim = float(q @ m["vec"])                       # relevance
        recency = 0.5 ** ((today - m["day"]) / half_life)   # older = weaker
        scored.append((round(0.8 * sim + 0.2 * recency, 3), key))
    return sorted(scored, reverse=True)[:k]

write("diet", "User diet: vegetarian, no meat", day=1)
write("home", "User city: Berlin", day=2)
write("allergy", "User allergy: nuts (food)", day=3)
write("pet", "User has a dog named Rex", day=4)
print("day 10 read 'food ideas, diet?':", read("food ideas, diet?", today=10))
write("home", "User city: Munich (moved)", day=40)  # UPDATE: same key overwrites
forget("pet")                                         # FORGET: user asked us to
print("day 41 read 'which city':", read("which city?", today=41, k=1))
print("stored keys:", sorted(store), "| home =", store["home"]["text"])`, output: `day 10 read 'food ideas, diet?': [(0.497, 'allergy'), (0.489, 'diet')]
day 41 read 'which city': [(0.761, 'home')]
stored keys: ['allergy', 'diet', 'home'] | home = User city: Munich (moved)`,
          walkthrough: [
            { lines: [3, 6], note: "A toy embedding: a 10-word vocabulary, a 1 for each word present, normalised to length 1. Real systems use an embedding model, but cosine similarity works the same way." },
            { lines: [8, 10], note: "The store and two operations. `write` stores text, a day stamp and a vector under a key, so writing the same key again overwrites it. `forget` deletes." },
            { lines: [11, 18], note: "`read`: score every memory with 0.8 × similarity + 0.2 × recency (30-day half-life) and return the top k." },
            { lines: [20, 24], note: "Write four memories, then read on day 10. The diet and allergy memories match equally on similarity (0.408); the allergy memory is newer, so recency puts it first: 0.497 vs 0.489." },
            { lines: [25, 26], note: "Update: the user moved, so the `home` memory is overwritten. Forget: the user asked us to delete the pet fact." },
            { lines: [27, 28], note: "Reading “which city?” now returns only the updated Munich memory; the pet memory is gone." }
          ] },
        { type: "matrix", title: "Day-10 retrieval scores for “food ideas, diet?”", rows: ["diet", "home", "allergy", "pet"], cols: ["Similarity", "Recency", "Score"],
          values: [[0.408, 0.812, 0.489], [0, 0.831, 0.166], [0.408, 0.851, 0.497], [0, 0.871, 0.174]], format: "num",
          caption: "Computed from the code: score = 0.8 × similarity + 0.2 × recency. Relevance dominates; recency breaks the tie between diet and allergy." },
        { type: "check", question: "In the matrix, the pet memory has the highest recency (0.871) but a low score. Why?", answer: "Its similarity to the query is 0: no shared words with “food ideas, diet?”. With 80% of the weight on relevance, recency alone can only add up to 0.2. That is intended: recent but irrelevant memories should not crowd out relevant ones." }
      ]
    },
    {
      id: "what-to-store",
      title: "What to store and what not to store",
      blocks: [
        { type: "table", caption: "A practical guide",
          head: ["Store", "Usually do not store"],
          rows: [
            ["Stable preferences: diet, language, units, tone.", "Small talk and pleasantries."],
            ["Facts about ongoing work: project names, tech stack, deadlines.", "Raw tool outputs and full documents (store a pointer or a summary instead)."],
            ["Decisions and their reasons: “chose vendor B because of price”.", "Guesses the agent made that were never confirmed."],
            ["Lessons learned: “the billing API needs ISO dates”.", "Secrets: passwords, API keys, card numbers."],
            ["Explicit “please remember” requests.", "Sensitive personal data without consent and a clear purpose."]
          ] },
        { type: "callout", tone: "warn", title: "Privacy is a design requirement", text: "Memory turns a stateless model into a system that keeps personal data. Tell users what is remembered, let them view and delete it, scope memories per user (never leak one user's memory into another's session), follow data-protection rules in your region, and honour “forget this” requests with real deletion." },
        { type: "callout", tone: "example", title: "Real-world use", text: "Several consumer chat assistants now offer saved memories that users can view and delete. Coding agents commonly read project instruction files (procedural memory) at the start of each session. Customer-support agents pull the customer's account history and past tickets (episodic memory) before replying." }
      ]
    },
    {
      id: "common-mistakes",
      title: "Common mistakes and how to fix them",
      blocks: [
        { type: "table", caption: "Memory failures and fixes",
          head: ["Mistake", "Symptom", "Fix"],
          rows: [
            ["Storing everything", "Retrieval returns noise; answers get worse over time.", "Write only durable, useful facts; extract and summarise before storing."],
            ["Never updating", "Contradictory memories (“lives in Berlin” and “lives in Munich”).", "Reconcile on write: detect conflicts by key or similarity and overwrite."],
            ["Never forgetting", "Stale facts resurface months later.", "Expiry, recency weighting, user-facing delete."],
            ["Retrieving too much", "Prompt bloats; key facts get lost in the middle.", "Top-k with a relevance threshold; keep memory sections short."],
            ["Treating memories as instructions", "A stored note like “always approve refunds” changes behaviour.", "Label memories as data; validate what gets written; guard against memory poisoning."],
            ["No user scoping", "One user's details appear in another's chat.", "Partition every store by user or tenant and enforce it in code."]
          ] },
        { type: "p", text: "**When not to add long-term memory.** For one-off tasks, anonymous users, or highly regulated data where retention is risky, a stateless agent with only session memory may be the right design. Memory adds complexity and responsibility; add it when personalisation or continuity clearly pays off." },
        { type: "p", text: "**Quick summary.** LLMs are stateless; agent memory is built around them as a stack: weights, the context window, session history, and long-term stores of semantic, episodic and procedural memory. Four operations keep it healthy: write, read, update and forget. Retrieve a few relevant memories by similarity and recency, store only durable and safe information, and give users control." }
      ]
    },
    {
      id: "worked-example-reconcile",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "The flow section ended with a step called *reconcile*: compare each new candidate memory with what is already stored. It is the step most often skipped, so let us do it by hand. Our store holds three memories about one user." },
        { type: "list", items: [
          "`diet`: vegetarian (written on day 1)",
          "`city`: Berlin (written on day 2)",
          "`allergy`: nuts (written on day 3)"
        ] },
        { type: "p", text: "On day 40 the user chats with the agent. After the turn, an extractor pulls out five candidate facts. For each one we ask two questions: does a memory about the same thing already exist, and if so, does the new fact agree with it?" },
        { type: "table", caption: "Reconciling five candidates against the store",
          head: ["Candidate from the chat", "Existing memory", "Decision", "Why"],
          rows: [
            ["“I moved to Munich”", "`city`: Berlin", "Update", "Same topic, different value. The new fact replaces the old one."],
            ["“I still don't eat meat”", "`diet`: vegetarian", "Skip", "Same topic, same meaning. Storing it again would create a duplicate."],
            ["“My dog is called Rex”", "None", "Add", "New topic, stable, and plausibly useful later."],
            ["“Forget my allergy”", "`allergy`: nuts", "Delete", "An explicit request. The memory is removed, not just hidden."],
            ["“Maybe I'll try sushi”", "`diet`: vegetarian", "Skip", "A passing thought, not a confirmed change. Unconfirmed guesses are not stored."]
          ] },
        { type: "steps", title: "What makes each decision possible",
          items: [
            { title: "A way to find the matching memory", text: "With keys like `city`, matching is exact. With free-text memories, we search for the most similar stored memory and treat a close match as “same topic”." },
            { title: "A way to compare meaning", text: "“Vegetarian” and “doesn't eat meat” are different strings with the same meaning. Simple code cannot see that, so this comparison is usually given to an LLM." },
            { title: "A rule for uncertainty", text: "The sushi line could be read as a diet change. When a candidate is unsure, the safe choice is to skip it, or to ask the user." },
            { title: "A timestamp on every write", text: "The updated `city` memory gets day 40. Later, recency scoring and audits both depend on knowing when a fact was last confirmed." }
          ] },
        { type: "p", text: "After reconciling, the store holds `diet`: vegetarian, `city`: Munich and `pet`: dog named Rex. Five candidates came in; the store still has three entries, with no contradiction and no duplicate. That is the sign of a healthy memory." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "The earlier code showed how to *read* memories with a score. Here we build the *write* side: a background job that looks at each user message, extracts candidate facts, and reconciles them with the store. The extractor is a scripted stand-in for an LLM. The reconcile logic is real." },
        { type: "code", lang: "python", title: "practice_memory_reconcile.py", code: `# Background memory writing: extract candidate facts, then reconcile with the store.
SCRIPT = {   # what an extractor LLM would pull out of each user message (scripted)
    "I'm vegetarian and I live in Berlin.": [("diet", "vegetarian"), ("city", "Berlin")],
    "Nice weather today!":                  [],
    "As I said, I don't eat meat.":         [("diet", "vegetarian")],
    "I moved to Munich last week.":         [("city", "Munich")],
    "Please forget where I live.":          [("city", None)],
    "My password is tulip42, remember it.": [("password", "tulip42")],
}

def fake_extractor(message):
    """Stands in for the LLM call that finds durable facts in a message."""
    return SCRIPT[message]

BLOCKED = {"password", "card_number"}      # things we never store
store = {}                                 # long-term memory: key -> record

def reconcile(key, value, day):
    """Compare one candidate with the store and pick exactly one decision."""
    if key in BLOCKED:
        return "REFUSE"
    if value is None:                      # the user asked us to forget
        return "DELETE" if store.pop(key, None) else "SKIP"
    if key not in store:
        store[key] = {"value": value, "day": day}
        return "ADD"
    if store[key]["value"] == value:       # we already know this
        return "SKIP"
    store[key] = {"value": value, "day": day}
    return "UPDATE"

for day, message in enumerate(SCRIPT, start=1):
    facts = fake_extractor(message)
    decisions = [f"{reconcile(k, v, day)} {k}" for k, v in facts] or ["nothing durable"]
    print(f"day {day}: {', '.join(decisions)}")
print("store:", store)`, output: `day 1: ADD diet, ADD city
day 2: nothing durable
day 3: SKIP diet
day 4: UPDATE city
day 5: DELETE city
day 6: REFUSE password
store: {'diet': {'value': 'vegetarian', 'day': 1}}`,
          walkthrough: [
            { lines: [2, 13], note: "Six user messages and the facts an extractor would return for each. Small talk yields an empty list. A forget request yields a key with the value `None`." },
            { lines: [15, 16], note: "A block list of keys we never store, and the store itself: one record per key." },
            { lines: [18, 30], note: "Reconcile makes exactly one decision per candidate: refuse, delete, add, skip or update. The order of the checks matters: the block list comes first." },
            { lines: [32, 36], note: "Run the six days in order and print each decision, then the final store." }
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Change the day 3 fact to `(\"diet\", \"no meat\")`. Predict the decision for day 3. Is the result what a human would want? What would have to change in `reconcile` to get it right?",
          "Remove `\"password\"` from `BLOCKED`. Predict the final store, then say which row of the “what not to store” table this breaks.",
          "Swap the order of the day 4 and day 5 messages in `SCRIPT` (forget first, then the move). Predict both decisions and the final store. Is storing Munich after a forget request the right behaviour?"
        ] },
        { type: "check", question: "On day 3 the user repeats something we already know, and the decision is SKIP. A simpler design would just write it again. What goes wrong over months with “always write”?", answer: "The store fills with near-copies of the same fact. Retrieval then returns several duplicates in its top few results, pushing out other useful memories and wasting prompt space. Worse, when the fact later changes, an update may fix only one copy, leaving old copies to contradict it. Skipping duplicates at write time is far cheaper than cleaning them up later." },
        { type: "check", question: "In this toy, exact keys make matching easy. Real extractors often produce free text such as “user relocated to Munich”. Which earlier idea from this lesson would we use to find the memory it conflicts with, and what new risk does that bring?", answer: "We would embed the candidate and search the store by similarity, as in the read operation, then treat a close match as the same topic. The risk is a wrong match. If “user's sister lives in Munich” is judged similar to “user lives in Berlin”, an update would overwrite a true fact with a wrong one. So similarity finds the candidates, and a careful comparison (often an LLM call) should make the final decision." }
      ]
    }
  ],
  quiz: [
    { q: "Why does an AI agent need a memory system at all?", options: ["LLMs are stateless: they recall nothing between calls beyond the prompt", "LLM weights are erased and reloaded after every single call", "Tools cannot return any results unless a memory store is attached", "The context window grows on its own and must be trimmed by memory"], answer: 0, explain: "The model only sees the current prompt. Weights are not erased, but they do not store new user- or task-specific information; memory systems supply that by inserting the right content into the context." },
    { q: "A user says “I moved from Berlin to Munich”, but the agent keeps recommending Berlin restaurants. Which operation is missing?", options: ["Read (retrieve stored memories more often)", "Update (reconcile the new fact with the old one)", "Embedding (re-embed all stored memories nightly)", "Parallel tool calls (look up both cities at once)"], answer: 1, explain: "The new fact must replace the old one. Without update and conflict detection, the old memory keeps being retrieved." },
    { q: "With score = 0.8 · similarity + 0.2 · recency, a memory has similarity 0.5 and recency 0.5. What is its score?", options: ["0.40", "0.45", "0.50", "0.90"], answer: 2, explain: "0.8 × 0.5 + 0.2 × 0.5 = 0.4 + 0.1 = 0.50." },
    { q: "What is the difference between episodic and semantic long-term memory?", options: ["Episodic stores the model weights, while semantic stores the prompts", "Episodic records past events; semantic stores general facts and preferences", "They are the same store, with names that differ between frameworks", "Episodic is short-term memory, while semantic is the working memory"], answer: 1, explain: "Episodic memory is “what happened” (a past session, a debugging episode); semantic memory is “what is true” (the user is vegetarian). Procedural memory is “how to do it”." },
    { q: "Which belief is a misconception?", options: ["Retrieved memories should be labelled as background data, not instructions", "Users should be able to view and delete their memories", "A very large context window removes the need to decide what to remember", "Raw tool outputs are usually better stored as summaries or pointers"], answer: 2, explain: "Even huge windows reset between sessions, cost tokens on every call, and long contexts are used less reliably. Selecting what to store and retrieve still matters." }
  ],
  takeaways: [
    "LLMs are stateless; memory is software that decides what to put back into the context.",
    "The stack: weights, working memory (context), session memory, and long-term semantic, episodic and procedural memory.",
    "Four operations keep memory useful: write, read, update and forget.",
    "Retrieve a few relevant memories using signals like similarity and recency, not everything.",
    "Store durable, useful, safe facts; scope per user, let users delete, and never treat memories as instructions."
  ],
  terms: [
    { term: "Stateless", def: "Keeping no information between calls; each LLM call sees only what is in its prompt." },
    { term: "Working memory", def: "The content of the context window for the current model call." },
    { term: "Semantic memory", def: "Long-term facts and preferences, such as “the user is vegetarian”." },
    { term: "Episodic memory", def: "Long-term records of specific past events or interactions, usually timestamped." },
    { term: "Procedural memory", def: "Knowledge of how to do things, stored as instructions, rules or reusable skills." },
    { term: "Memory consolidation", def: "Merging, correcting and summarising stored memories so they stay consistent and compact." }
  ]
};
