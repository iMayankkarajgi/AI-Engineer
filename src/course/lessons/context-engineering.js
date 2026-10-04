export default {
  id: "context-engineering",
  minutes: 23,
  hook: "When an AI assistant gives a wrong answer, is the model usually the problem, or is it what we showed the model?",
  summary: "Context engineering is the work of deciding what information goes into an LLM's context window for each call: instructions, memory, history, retrieved documents, tool definitions and tool results. The model only knows what is in front of it, so selecting, ordering, compressing and isolating that information often matters more than clever wording. Good context is relevant, sufficient, compact and well structured.",
  sections: [
    {
      id: "what-is-it",
      title: "What is context engineering?",
      blocks: [
        { type: "p", text: "A large language model (LLM) has no memory between calls and cannot look anything up by itself. Each time we call it, it sees only the **context window**: the full block of tokens we send in that request, up to a maximum size (its context length). Everything the model “knows” about our user, our product and the task at hand must be in that window." },
        { type: "p", text: "**Context engineering** is the discipline of building that window well: choosing which pieces of information to include, in what form, in what order, and within what token budget, for every single model call. The term became popular in 2025, as people building AI agents noticed that most failures came from missing, wrong or cluttered context rather than from the model itself." },
        { type: "callout", tone: "analogy", title: "Think of it like briefing a brilliant new colleague", text: "A new colleague is smart but knows nothing about our company. Hand them a 500-page binder and they drown. Hand them nothing and they guess. Hand them a one-page brief with the goal, the three relevant documents, the customer's history and the tools they may use, and they do great work. Context engineering is writing that brief, automatically, for every call." },
        { type: "p", text: "Our running example: **Acme's support assistant** answering “How do I fix the X200 leak, and does the warranty cover it?” We will build its context piece by piece." }
      ]
    },
    {
      id: "big-picture",
      title: "The big picture: the context is assembled, not written",
      blocks: [
        { type: "p", text: "In a simple chat demo, the context is one prompt a person typed. In a real application, a program **assembles** the context from many sources at run time, and does so again for every call. For an agent, that can mean dozens of calls per task, each needing a fresh, well-chosen context." },
        { type: "flow", title: "How an application builds the context for one call", nodes: [
          { label: "Request", detail: "The user's new message arrives: “How do I fix the X200 leak, and does the warranty cover it?”" },
          { label: "Gather", detail: "Collect candidates: system prompt, user memory, recent history, documents from search, tool definitions, earlier tool results." },
          { label: "Select", detail: "Keep only what is relevant to this request. Drop the office-hours doc and the discontinued X100 page." },
          { label: "Compress", detail: "Summarize old conversation turns, trim long tool outputs, keep only key fields." },
          { label: "Order & format", detail: "Stable instructions first, then data in labelled sections, the question last." },
          { label: "Call model", detail: "Send the assembled window. The answer quality depends on everything above." }
        ] }
      ]
    },
    {
      id: "why-it-matters",
      title: "Why context engineering matters",
      blocks: [
        { type: "list", items: [
          "**The model cannot use what it cannot see.** If the warranty document is not retrieved, the model either says it does not know or, worse, makes something up (a hallucination).",
          "**More is not better.** Irrelevant text distracts the model. Studies of long contexts show that models use information at the start and end of a long context more reliably than information buried in the middle (the “lost in the middle” effect), and that accuracy on many tasks tends to drop as the context grows, a problem people sometimes call *context rot*.",
          "**Tokens cost money and time.** Every token in the window is billed and adds latency. A bloated context can cost several times more than a lean one.",
          "**Agents compound the problem.** Each tool call adds output to the context. Without management, an agent's context fills with stale logs and old search results until it loses track of the goal."
        ] },
        { type: "viz", name: "lost-in-middle", caption: "Move the relevant document through a long context. Accuracy is often highest at the edges and dips in the middle, so placement is part of context engineering." },
        { type: "check", question: "Pause and predict: we double the number of retrieved documents from 5 to 10 “to be safe”. Can that make answers worse?", answer: "Yes. The extra 5 documents are usually less relevant. They push the useful ones toward the middle of the context, add distraction and contradictions, and increase cost and latency. More context helps only when the extra content is actually relevant." }
      ]
    },
    {
      id: "pe-vs-ce",
      title: "Prompt engineering vs context engineering",
      blocks: [
        { type: "p", text: "**Prompt engineering** focuses on how we *phrase* instructions: the wording, examples and format of a prompt. **Context engineering** is broader: it is about the whole information environment of each call, most of which is not hand-written at all but retrieved, remembered or produced by tools." },
        { type: "compare", title: "Two layers of the same job",
          options: [
            { name: "Prompt engineering", summary: "Crafting the wording of instructions and examples.", pros: ["Quick to iterate", "Big wins on simple, single-call tasks"], cons: ["Cannot fix missing information", "Static: the same text for every request"], bestFor: "Single-turn tasks, prototypes, writing system prompts" },
            { name: "Context engineering", summary: "Designing the system that fills the context window for every call.", pros: ["Gives the model the facts it needs", "Scales to agents and long conversations", "Controls cost and latency"], cons: ["Needs retrieval, memory and pipelines", "More moving parts to test"], bestFor: "Production assistants, RAG, multi-step agents" }
          ],
          rows: [
            ["Main question", "How should we say it?", "What should the model see right now?"],
            ["Unit of work", "One prompt string", "Every call in a pipeline or agent loop"],
            ["Typical tools", "Instructions, few-shot examples, output formats", "Retrieval, memory stores, summarization, tool-output trimming"],
            ["Relationship", "A part of context engineering", "Includes prompt engineering"]
          ],
          verdict: "Prompt engineering is one component of context engineering. A perfect instruction still fails if the needed facts are missing from the window." }
      ]
    },
    {
      id: "components",
      title: "The components of the context",
      blocks: [
        { type: "table", caption: "What typically goes into an assistant's context window", head: ["Component", "What it is", "In our support bot"], rows: [
          ["System prompt", "Standing instructions: role, rules, tone, output format", "“Answer only from the docs below and cite doc ids.”"],
          ["User message", "The current request", "“How do I fix the X200 leak…?”"],
          ["Short-term memory", "Recent conversation turns, possibly summarized", "“user: the X200”"],
          ["Long-term memory", "Facts saved across sessions", "“Prefers short answers. Plan: Pro.”"],
          ["Retrieved knowledge", "Documents found by search (RAG)", "Gasket repair doc, warranty doc"],
          ["Tool definitions", "Names, descriptions and parameters of tools the model may call", "`lookup_order(order_id)`"],
          ["Tool results", "Outputs returned by earlier tool calls", "Order 1009: purchased 2025-08-03"],
          ["Output format", "Schema or template for the answer", "JSON with `answer` and `sources`"]
        ] },
        { type: "p", text: "Each component competes for the same token budget. Context engineering is largely the art of deciding how much room each gets for this particular call." }
      ]
    },
    {
      id: "code",
      title: "Code you can run: assembling context under a budget",
      blocks: [
        { type: "p", text: "This toy assembler builds the support bot's context. It keeps the system prompt and memory, trims history to the last two turns, retrieves documents by keyword overlap (a stand-in for real search), adds only relevant documents that fit the budget, and puts the question last. Token counting uses words as a rough stand-in for a tokenizer." },
        { type: "code", lang: "python", title: "assemble_context.py", code: `def tokens(text):
    return len(text.split())   # rough stand-in for a real tokenizer

BUDGET = 70
system = "You are Acme's support assistant. Answer only from the docs below and cite doc ids."
memory = "User prefers short answers. Plan: Pro."
history = ["user: my blender leaks", "assistant: which model?", "user: the X200"]
docs = {
    "D1": "An X200 leak is usually a worn gasket; fix it with the free gasket kit.",
    "D2": "Our office is closed on public holidays.",
    "D3": "X200 warranty: we cover parts for 2 years from purchase.",
    "D4": "The X100 was discontinued in 2021 and is no longer covered.",
}
query = "how do I fix the X200 leak and does the warranty cover it"
STOP = {"how", "do", "i", "the", "and", "does", "it", "a", "is", "for", "with"}

def score(doc):
    # Retrieval stand-in: count meaningful words shared with the query
    words = lambda t: {w.strip(".,;:") for w in t.lower().split()} - STOP
    return len(words(doc) & words(query))

ranked = sorted(docs, key=lambda d: score(docs[d]), reverse=True)
parts = [("system", system), ("memory", memory), ("history", " | ".join(history[-2:]))]
used = sum(tokens(t) for _, t in parts) + tokens(query)

for d in ranked:                       # add the best docs while they fit
    cost = tokens(docs[d])
    if score(docs[d]) >= 2 and used + cost <= BUDGET:
        parts.append((f"doc {d}", docs[d]))
        used += cost
parts.append(("question", query))     # question last, close to the answer

for name, text in parts:
    print(f"[{name:8}] {tokens(text):2} tok | {text[:48]}")
print("scores:", {d: score(docs[d]) for d in ranked})
print(f"total: {used} of {BUDGET} tokens")`, output: `[system  ] 15 tok | You are Acme's support assistant. Answer only fr
[memory  ]  6 tok | User prefers short answers. Plan: Pro.
[history ]  7 tok | assistant: which model? | user: the X200
[doc D1  ] 15 tok | An X200 leak is usually a worn gasket; fix it wi
[doc D3  ] 10 tok | X200 warranty: we cover parts for 2 years from p
[question] 13 tok | how do I fix the X200 leak and does the warranty
scores: {'D1': 3, 'D3': 3, 'D2': 0, 'D4': 0}
total: 66 of 70 tokens`,
          walkthrough: [
            { lines: [1, 7], note: "A word-count tokenizer stand-in, a 70-token budget, and the fixed parts: system prompt, long-term memory and chat history." },
            { lines: [8, 15], note: "Four candidate documents and the user's question. Only D1 and D3 are actually useful." },
            { lines: [17, 22], note: "A toy retriever: score each doc by meaningful words shared with the query, then rank." },
            { lines: [23, 24], note: "Always-on parts go in first. History is trimmed to the last two turns to save budget." },
            { lines: [26, 31], note: "Add documents in rank order only if they are relevant (score ≥ 2) and still fit. The question goes last." },
            { lines: [33, 36], note: "Print what the model will see, and the budget used." }
          ] },
        { type: "chart", kind: "hbar", title: "Where the 66 tokens went", xLabel: "Tokens", labels: ["System prompt", "Memory", "History (trimmed)", "Doc D1", "Doc D3", "Question"], series: [ { name: "Tokens", values: [15, 6, 7, 15, 10, 13] } ], caption: "From the code output. The irrelevant docs D2 and D4 used zero tokens because selection filtered them out." },
        { type: "check", question: "D4 mentions “covered” and the question asks about coverage. Why did D4 score 0?", answer: "The query word is “cover” and D4 says “covered”; our toy retriever matches exact words only, and D4's other words (X100, discontinued) do not appear in the query. Real systems use embeddings or stemming, but the lesson is the same: selection decides what reaches the model, so we must test retrieval quality, not just the prompt." }
      ]
    },
    {
      id: "patterns",
      title: "Common patterns in context engineering",
      blocks: [
        { type: "steps", title: "Four moves that cover most patterns", items: [
          { title: "Write (save outside the window)", text: "Store information outside the context so it is not lost: long-term memory, a scratchpad file, or an agent's to-do list. The context holds a pointer or a short note, not everything." },
          { title: "Select (pull in what is relevant)", text: "Retrieve only the documents, memories and tools relevant to this call. RAG, memory search and choosing a subset of tools for the current step are all selection." },
          { title: "Compress (keep the meaning, drop tokens)", text: "Summarize old conversation turns, trim verbose tool outputs to the needed fields, deduplicate repeated content. Context compaction is this move applied to long sessions." },
          { title: "Isolate (split across contexts)", text: "Give sub-tasks to sub-agents with their own clean windows, and pass back only a short result. Keep big raw data (a 10 MB log) in a tool environment and send the model a summary." }
        ] },
        { type: "list", items: [
          "**Just-in-time retrieval.** Instead of preloading every file, give the agent tools (search, read file) and let it fetch what it needs when it needs it.",
          "**Structured sections.** Wrap each component in clear labels, for example `<docs>`, `<history>`, `<memory>`, so the model can tell instructions from data.",
          "**Stable prefix first.** Put unchanging parts at the start so prompt caching can reuse them."
        ] }
      ]
    },
    {
      id: "mistakes-and-best-practices",
      title: "Common mistakes and best practices",
      blocks: [
        { type: "callout", tone: "warn", title: "Common mistakes", text: "Stuffing everything into the window because the context limit is large. Retrieving many weakly relevant chunks. Letting raw tool outputs (full HTML pages, huge JSON) pile up. Keeping contradictory old instructions in history. Exposing 40 tools when the task needs 3, which confuses tool choice. Mixing untrusted data with instructions without labels, which also opens the door to prompt injection." },
        { type: "list", items: [
          "**Aim for the smallest set of high-signal tokens** that lets the model do the task.",
          "**Measure retrieval separately**: is the right document in the context at all? Many “model errors” are retrieval errors.",
          "**Budget each component** (for example: system ≤ 1,500 tokens, docs ≤ 6,000, history ≤ 3,000) and enforce the budget in code.",
          "**Put the question and key facts where the model attends best**, usually near the end, and keep critical rules in the system prompt.",
          "**Log the exact context of every call**, so when an answer is wrong we can see what the model actually saw.",
          "**Evaluate end to end** with a test set of real questions whenever the assembly logic changes."
        ] },
        { type: "callout", tone: "example", title: "Real-world use", text: "Coding agents decide which files, error messages and test results to show the model at each step, and summarize the session when it gets long. Customer-support bots combine a customer profile from a database, the last few messages, policy documents from search and order data from tools. Research assistants hand sub-questions to sub-agents and merge their short reports." }
      ]
    },
    {
      id: "budget-and-diagnosis",
      title: "Going one level deeper",
      blocks: [
        { type: "p", text: "Two skills turn the ideas above into daily practice: doing the budget arithmetic before we build, and reading a failed call to find which part of the context let us down." },
        { type: "steps", title: "A worked budget (illustrative numbers)", items: [{ title: "Start from the window", text: "Say our model has an 8,000-token window." }, { title: "Reserve the answer", text: "Input and output share the window. We keep 1,000 tokens for the reply, which leaves 7,000 for input." }, { title: "Subtract the fixed parts", text: "System prompt 600, tool definitions 900, output format 100. That is 1,600, so 5,400 tokens remain." }, { title: "Split the flexible parts", text: "Question up to 200, memory 300, history 1,400, retrieved documents 3,500. Together: 5,400." }, { title: "Turn tokens into counts", text: "With chunks of about 500 tokens, 3,500 tokens means at most 7 chunks. If retrieval returns 10, three must be dropped or compressed, and code should decide which." }] },
        { type: "p", text: "The budget in our code example was only 70 tokens, but the logic is the same at any size: fixed parts first, then a hard cap for each flexible part." },
        { type: "table", caption: "From symptom to cause: what to look for in the logged context", head: ["Symptom", "Likely context cause", "What to check in the log"], rows: [["A confident answer that is wrong", "The needed document was never retrieved", "Search the logged context for the fact. If it is absent, fix retrieval."], ["The fact is present but ignored", "It sits in the middle of a long, cluttered window", "Count the tokens around it. Cut weak chunks and move the fact near the question."], ["The model follows an outdated rule", "An old instruction in the history contradicts the system prompt", "Look for two rules that disagree. Summarize or drop the old one."], ["The answer stops mid-sentence", "The input left too little room for the output", "Compare the input token count with the window size."]] }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build a packer that works by priority. Each piece of context has a priority, a full version and, for some pieces, a short version. Under a tight budget the packer tries the full text first, then the short one, and only then drops the piece. At the end it lays out the kept pieces in a fixed order, with the question last." },
        { type: "code", lang: "python", title: "practice_priority_packer.py", code: `def tokens(text):
    return len(text.split())          # rough stand-in for a tokenizer

# (name, priority, full text, short version). Lower number = more important.
items = [
    ("system",   0, "You are Acme's support assistant. Cite doc ids.", None),
    ("question", 0, "Does the warranty cover my X200 leak?", None),
    ("warranty", 1, "X200 warranty: we cover parts for 2 years from purchase. "
                    "A worn gasket counts as a part.", "X200 warranty: parts and gaskets, 2 years."),
    ("order",    1, "order_id=1009 status=delivered purchased=2025-08-03 carrier=FastShip "
                    "tracking=ZX81 gift_wrap=no", "Order 1009 purchased 2025-08-03."),
    ("history",  2, "user: my blender leaks | assistant: which model? | user: the X200",
                    "User has a leaking X200."),
    ("promo",    3, "This month all Acme mixers are cheaper for Pro members.", None),
]
ORDER = ["system", "promo", "history", "order", "warranty", "question"]  # question last

def pack(budget):
    chosen, used = {}, 0
    for name, _, full, short in sorted(items, key=lambda it: it[1]):
        for label, text in (("full", full), ("short", short)):
            if text and used + tokens(text) <= budget:   # try full, then short
                chosen[name] = (label, tokens(text))
                used += tokens(text)
                break
    return [n for n in ORDER if n in chosen], chosen, used

for budget in (70, 44, 30):
    layout, chosen, used = pack(budget)
    print(f"budget {budget}: used {used}")
    print("  kept:", ", ".join(f"{n}({chosen[n][0]}, {chosen[n][1]})" for n in layout))
    print("  dropped:", [it[0] for it in items if it[0] not in chosen])`, output: `budget 70: used 60
  kept: system(full, 8), promo(full, 10), history(full, 12), order(full, 6), warranty(full, 17), question(full, 7)
  dropped: []
budget 44: used 43
  kept: system(full, 8), history(short, 5), order(full, 6), warranty(full, 17), question(full, 7)
  dropped: ['promo']
budget 30: used 28
  kept: system(full, 8), order(full, 6), warranty(short, 7), question(full, 7)
  dropped: ['history', 'promo']`, walkthrough: [{ lines: [4, 15], note: "The candidate pieces. Each has a priority (0 is most important), a full text and an optional short version." }, { lines: [16, 16], note: "The layout order used in the final window. It is separate from priority: the question is top priority but goes last." }, { lines: [18, 26], note: "The packer: walk the pieces by priority, take the full version if it fits, else the short one, else nothing." }, { lines: [28, 32], note: "Run three budgets and print what was kept in which form, and what was dropped." }] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: ["Add `50` to the list of budgets. Before running, predict which pieces are full, short or dropped.", "Give `promo` priority 0 and look at budget 30. Predict which piece gets squeezed out. Is that what we want from a wrongly set priority?", "Give `promo` a short version such as `\"Mixers cheaper for Pro.\"` and look at budget 44 again. Predict whether it gets in."] },
        { type: "check", question: "At budget 30 the warranty document is kept in its short form, while the history is dropped. Why is that a better outcome for this question than full history and no warranty?", answer: "The question asks about warranty cover, so the warranty text is the one piece the model cannot answer without. The short version still carries the key fact: parts and gaskets, 2 years. The history only repeats that the user has a leaking X200, which the question already says. Compressing a high-value piece beats keeping a low-value piece whole." },
        { type: "check", question: "The packer chooses pieces by priority but lays them out in the `ORDER` list. Why keep those two orders separate?", answer: "They answer different questions. Priority decides *what survives* when space is short. Layout decides *where each survivor sits* in the window: stable instructions first, so a cache can reuse them, and the question last, close to where the answer begins. If we laid the pieces out by priority, the question would sit near the top with all the documents after it." }
      ]
    },
    {
      id: "summary",
      title: "Quick summary",
      blocks: [
        { type: "p", text: "The model's output can only be as good as its input. Context engineering treats the context window as a scarce, carefully managed resource: we **write** information to places outside it, **select** only what is relevant, **compress** what we keep, **isolate** sub-tasks into separate windows, and **order and label** everything clearly. Prompt wording still matters, but it is one piece of this larger system." }
      ]
    }
  ],
  quiz: [
    { q: "What is context engineering mainly about?", options: ["Finding the perfect wording for a single, hand-written prompt", "Training the model on a company's documents so it knows them", "Choosing what information fills the context window for each call", "Increasing the model's maximum context length with new hardware"], answer: 2, explain: "It is about selecting, compressing, ordering and formatting everything the model sees per call. Wording is only part of it, training changes weights, and context length is a model property." },
    { q: "Our support bot often answers warranty questions wrongly. Logs show the warranty document is usually not in the context. What should we fix first?", options: ["Retrieval, so the warranty doc is selected", "The wording of the system prompt's rules", "The model's temperature and top-p settings", "Add few-shot examples of polite answers"], answer: 0, explain: "The model cannot use a document it never sees. This is a selection (retrieval) failure, so better wording or examples will not help." },
    { q: "In the code example, the budget is 70 tokens and the context used 66. Which documents made it in?", options: ["All four documents", "D4 and D1", "Only D1", "D1 and D3"], answer: 3, explain: "D1 and D3 each scored 3 and fit in the budget. D2 and D4 scored 0 and were filtered out by the relevance check." },
    { q: "How does context engineering relate to prompt engineering?", options: ["They are unrelated: one is for agents and the other is for images", "Context engineering includes prompt engineering as one of its parts", "Prompt engineering is the broader field and contains context work", "Context engineering removes the need for any written prompt at all"], answer: 1, explain: "Context engineering covers the whole information environment (memory, retrieval, tools, history), and the wording of instructions is one component of it." },
    { q: "Which belief is a misconception?", options: ["Long-term memory can live outside the window and be selected when relevant", "Sub-agents can isolate work in their own separate context windows", "With huge context windows, including everything is the safest strategy", "Trimming verbose tool outputs down to key fields is a form of compression"], answer: 2, explain: "Large windows do not make clutter free: irrelevant text distracts, buries key facts in the middle, and adds cost and latency. The other three are real context-engineering patterns." }
  ],
  takeaways: [
    "The model only knows what is in its context window for this call, so building that window is a core engineering task.",
    "Context is assembled at run time from system prompt, memory, history, retrieved docs, tools and tool results.",
    "More context is not better: aim for the smallest set of relevant, well-ordered tokens.",
    "Four core moves: write, select, compress and isolate.",
    "Prompt engineering is one part of context engineering; log and evaluate the exact context the model saw."
  ],
  terms: [
    { term: "Context window", def: "All the tokens an LLM can see in one call, up to its maximum context length." },
    { term: "Context engineering", def: "Designing what information goes into the context window for each model call, and in what form and order." },
    { term: "Retrieval (RAG)", def: "Searching a knowledge source and inserting the most relevant results into the context." },
    { term: "Long-term memory", def: "Information saved outside the context across sessions and pulled back in when relevant." },
    { term: "Lost in the middle", def: "The tendency of models to use information in the middle of a long context less reliably than at its edges." },
    { term: "Sub-agent isolation", def: "Running a sub-task in a separate context window and returning only a compact result." }
  ]
};
