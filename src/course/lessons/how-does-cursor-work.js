export default {
  id: "how-does-cursor-work",
  minutes: 22,
  hook: "When we type in Cursor and a grey suggestion appears before we have finished thinking, or the agent edits five files in one go, what is actually happening behind the screen?",
  summary: "Cursor is a code editor (built on VS Code) with AI woven into every part of it. It indexes our codebase into embeddings so it can find relevant code by meaning, uses a small fast model for Tab predictions, larger models for Chat and the Agent, and a specialised apply step that merges suggested edits into files quickly. Different jobs use different models because each job has a different trade-off between speed, cost and intelligence, and privacy settings control what is stored.",
  sections: [
    {
      id: "what-is-cursor",
      title: "What is Cursor? Code editor + AI",
      blocks: [
        { type: "p", text: "**Cursor** is an AI code editor made by the company Anysphere. It is a **fork of Visual Studio Code**: it started from VS Code's open-source code, so it looks and feels familiar, and most VS Code extensions, themes and keyboard shortcuts work. On top of that editor, Cursor adds AI features at several levels: next-edit prediction as we type (**Tab**), a conversation panel (**Chat**/Ask), and an autonomous **Agent** that can search, edit many files and run commands." },
        { type: "p", text: "A simple way to remember it: **Cursor = code editor + AI everywhere**. The editor provides files, cursor position, open tabs, recent edits, terminal and diagnostics; the AI uses all of that as context. In this lesson we describe publicly documented behaviour; Cursor ships fast, so feature names and details change often." },
        { type: "callout", tone: "analogy", title: "Think of a co-pilot at three distances", text: "Sometimes the co-pilot finishes your sentence (Tab), sometimes you turn and ask them a question (Chat), and sometimes you hand them the controls for a while with a destination (Agent). Same co-pilot knowledge of the route, three levels of autonomy." }
      ]
    },
    {
      id: "big-idea",
      title: "The big idea behind Cursor",
      blocks: [
        { type: "p", text: "Two ideas run through Cursor's design. First, **context is everything**: a model's answer about our code is only as good as the code it sees, so the editor works hard to gather the right files, symbols and recent changes automatically. Second, **match the model to the moment**: a suggestion while typing must appear in a fraction of a second, while a multi-file refactor can take minutes. One model cannot be both the fastest and the smartest, so Cursor uses several." },
        { type: "flow", title: "The three ways we work with Cursor's AI", loop: false, nodes: [
          { label: "Tab", detail: "As we type, a small fast model predicts our next edit (possibly several lines, possibly elsewhere in the file). Press Tab to accept." },
          { label: "Chat / Ask", detail: "We ask a question; Cursor adds relevant code to the prompt and a larger model answers, often with code blocks we can apply." },
          { label: "Agent", detail: "We describe a goal; a model runs in a loop with tools (search, read, edit, terminal) until it is done, showing diffs for review." },
          { label: "Apply + review", detail: "Suggested changes are merged into the real files and shown as diffs we accept or reject." }
        ] }
      ]
    },
    {
      id: "understanding-code",
      title: "How does Cursor understand our code?",
      blocks: [
        { type: "p", text: "A model has no idea what is in our repository unless the editor puts it into the prompt. Cursor gathers context from several sources:" },
        { type: "list", items: [
          "**What we are looking at:** the current file, cursor position, selection and open tabs.",
          "**What we just did:** recent edits, which hint at what we will do next (vital for Tab).",
          "**What we point at:** `@` mentions in Chat or Agent to include specific files, folders, docs or web results.",
          "**What the editor knows:** errors and warnings from language servers and linters, terminal output.",
          "**What search finds:** results of semantic search over the codebase index, plus exact text search (grep).",
          "**What we told it:** project rules (for example files in `.cursor/rules` or an `AGENTS.md`) that are added to prompts."
        ] },
        { type: "p", text: "Semantic search needs an index, which is the next topic." }
      ]
    },
    {
      id: "indexing",
      title: "How does Cursor index our codebase?",
      blocks: [
        { type: "p", text: "When codebase indexing is on, Cursor builds a **semantic index**, so it can answer “where do we check the password?” even if no file contains that exact phrase. Cursor's documentation describes the pipeline roughly as follows:" },
        { type: "steps", title: "Building and updating the index", items: [
          { title: "Chunk", text: "Files are split into smaller pieces (chunks), aiming for meaningful units such as functions or classes. Files matched by `.gitignore` or `.cursorignore` are skipped." },
          { title: "Embed", text: "Each chunk is turned into an **embedding**, a vector of numbers where similar meaning gives nearby vectors." },
          { title: "Store", text: "Embeddings are stored in a remote vector database together with metadata such as (obfuscated) file paths and line ranges, so results can be mapped back to local files." },
          { title: "Sync with a Merkle tree", text: "To stay current without re-uploading everything, Cursor hashes files into a **Merkle tree** (each folder's hash is built from its children's hashes) and periodically compares it with the server's copy. Only branches whose hashes differ are walked, and only changed files are re-embedded." },
          { title: "Search", text: "At question time, the query is embedded and the nearest chunks are returned; the editor then reads the actual code from our local files to put into the prompt." }
        ] },
        { type: "viz", name: "chunking", caption: "Chunk size and overlap decide what one search hit contains. Too small and a function is cut in half; too large and one hit drags in unrelated code." },
        { type: "code", lang: "python", title: "mini_index.py: chunk, embed, Merkle-sync, search", code: `import hashlib, re
import numpy as np

files = {"auth/login.py": "def login(user, password): check password hash and create session token",
         "auth/logout.py": "def logout(session): delete session token from store",
         "billing/invoice.py": "def make_invoice(order): sum line items add tax return pdf"}

def h(text): return hashlib.sha256(text.encode()).hexdigest()[:8]

def embed(text, dim=256):   # toy embedding: hashed bag of words, unit length
    v = np.zeros(dim)
    for w in re.findall(r"[a-z]+", text.lower()):
        v[int(hashlib.md5(w.encode()).hexdigest(), 16) % dim] += 1
    return v / np.linalg.norm(v)

def merkle(files):         # folder hash = hash of its children's hashes
    leaves = {p: h(src) for p, src in files.items()}
    dirs = {}
    for p, x in sorted(leaves.items()):
        dirs.setdefault(p.split("/")[0], []).append(x)
    folders = {d: h("".join(xs)) for d, xs in dirs.items()}
    return h("".join(folders.values())), folders, leaves

root1, folders1, leaves1 = merkle(files)
index = {p: embed(src) for p, src in files.items()}          # initial full index

files["billing/invoice.py"] += " with discount"                # we edit one file
root2, folders2, leaves2 = merkle(files)
changed = [d for d in folders2 if folders2[d] != folders1[d]]
stale = [p for p in leaves2 if leaves2[p] != leaves1[p]]
print("root changed:", root1 != root2, "| folders to walk:", changed, "| re-embed:", stale)
for p in stale: index[p] = embed(files[p])

q = embed("where do we check the password at login")
for p, s in sorted(((p, float(q @ v)) for p, v in index.items()), key=lambda t: -t[1]):
    print(f"{s:.2f}  {p}")`, output: `root changed: True | folders to walk: ['billing'] | re-embed: ['billing/invoice.py']
0.49  auth/login.py
0.22  auth/logout.py
0.00  billing/invoice.py`, walkthrough: [
          { lines: [4, 6], note: "A three-file project; each file is one chunk here to keep it small." },
          { lines: [10, 14], note: "A toy embedding: count hashed words into a 256-number vector and normalise it. Real systems use a trained embedding model that captures meaning, not just shared words." },
          { lines: [16, 22], note: "A two-level Merkle tree: file hashes → folder hashes → one root hash. Any change in a file changes its folder's hash and the root." },
          { lines: [24, 25], note: "Build the first full index." },
          { lines: [27, 32], note: "Edit one file. Comparing roots says “something changed”; comparing folders says only `billing` needs walking; comparing leaves finds the single file to re-embed." },
          { lines: [34, 36], note: "Semantic search: embed the question and rank chunks by cosine similarity (a dot product of unit vectors). The login file wins." }
        ] },
        { type: "check", question: "A project has 20,000 files and we edit 3. Why does the Merkle tree make syncing cheap?", answer: "Comparing the root hash tells us immediately that something changed, and then we only descend into folders whose hashes differ. Unchanged folders (almost all of them) are skipped as a whole, so we find and re-embed just the 3 changed files instead of re-processing 20,000." }
      ]
    },
    {
      id: "tab-autocomplete",
      title: "How does Tab autocomplete work?",
      blocks: [
        { type: "p", text: "Classic autocomplete completes the word at the cursor. Cursor's **Tab** predicts our **next edit**: it can suggest several lines, modify existing code around the cursor (not only insert), and suggest a jump to the next place that likely needs the same change. For example, after we rename a parameter in a function signature, Tab can propose updating its uses below, and pressing Tab moves through them." },
        { type: "p", text: "To do this, Tab uses Cursor's **own specialised model**, trained for this task, with context such as the code around the cursor and our recent edits. Speed dominates the design: a suggestion that appears after we have already typed the line is useless, so the model is small enough to answer within a fraction of a second on every keystroke pause. Cursor has said it improves Tab using signals from which suggestions people accept or reject." },
        { type: "callout", tone: "note", title: "Why a frontier model is not used for Tab", text: "A large chat model might predict slightly better, but it would be too slow and too expensive to call on nearly every keystroke for millions of users. For Tab, a fast good guess beats a slow perfect one." }
      ]
    },
    {
      id: "chat-and-agent",
      title: "How do Chat and Agent mode work?",
      blocks: [
        { type: "p", text: "**Chat (Ask)** is a conversation in a side panel. Cursor builds a prompt from our question, the current file or selection, anything we `@`-mention, project rules, and (when useful) semantic search results. A larger model answers, often with code blocks. In Ask mode it only reads and explains." },
        { type: "p", text: "**Agent mode** turns the chat into an agent loop like the ones in earlier lessons. The model is given tools: semantic search, grep, read file, edit file, run terminal commands, search the web, and tools from connected MCP servers. It decides which to call, sees the results, and continues until the task is done. Terminal commands can require our approval (or be allowed by a list we configure), and Cursor keeps checkpoints so we can roll back the agent's changes." },
        { type: "viz", name: "agent-loop", caption: "Cursor's Agent follows the same think → tool → observe loop. Its tools are editor actions: search the index, read files, apply edits, run commands." },
        { type: "compare", title: "Tab vs Chat vs Agent", options: [
          { name: "Tab", summary: "Predicts the next edit as we type.", pros: ["Instant", "Stays in our flow"], cons: ["Local view only", "Small edits"], bestFor: "Routine edits, repetitive changes" },
          { name: "Chat / Ask", summary: "Answers questions about code with relevant context.", pros: ["Explains and suggests", "We stay in control of every change"], cons: ["We still do multi-step work"], bestFor: "Understanding code, design questions, targeted snippets" },
          { name: "Agent", summary: "Runs a tool loop to complete a goal across files.", pros: ["Multi-file changes", "Runs commands and tests"], cons: ["Slower and costlier", "Needs careful review"], bestFor: "Features, refactors, bug fixes with tests" }
        ], rows: [
          ["Typical latency", "Under a second", "Seconds", "Seconds to minutes"],
          ["Model size", "Small, specialised", "Large", "Large, tool-calling"],
          ["Who drives", "We do", "We do", "The agent, with our approval"]
        ], verdict: "Use the lightest level that fits: Tab for flow, Chat for understanding, Agent for multi-step tasks with a clear goal." }
      ]
    },
    {
      id: "applying-changes",
      title: "How does Cursor apply the changes?",
      blocks: [
        { type: "p", text: "A chat model often writes a change as a sketch: the new function body, with comments like `// ... existing code ...` for unchanged parts. Somebody has to turn that sketch into the exact new file. Asking the big model to rewrite the whole file is slow and risks accidental changes. Cursor instead uses a separate **apply** step with a specialised model that takes the original file and the suggested edit and produces the full updated file, which is then shown as a **diff** we can accept or reject." },
        { type: "p", text: "Speed comes from a trick Cursor has written about called **speculative edits**, a cousin of speculative decoding. Most of the new file is identical to the old file, so the old file is used as the “draft”: the model verifies long runs of unchanged tokens in one parallel step and only generates token by token where the code actually changes." },
        { type: "viz", name: "speculative-decoding", caption: "Speculative decoding: a draft proposes tokens and the model verifies them in parallel. In Cursor's apply step, the draft is simply the original file, which is right for most tokens." },
        { type: "callout", tone: "warn", title: "Always read the diff", text: "The apply step can misplace or drop code, especially with ambiguous sketches. Accepting every diff without reading it is the most common way AI edits introduce bugs." }
      ]
    },
    {
      id: "models-and-privacy",
      title: "Why different models, and how privacy works",
      blocks: [
        { type: "p", text: "**Different models.** Each feature has a different budget. Tab needs very low latency and runs constantly, so it uses a small custom model. Apply needs fast, faithful rewriting, so it uses a specialised model. Chat and Agent need deep reasoning and tool use, so they use frontier models from providers such as Anthropic, OpenAI and Google, or Cursor's own agent model (Cursor introduced one called Composer in late 2025). Indexing needs an embedding model. Users can usually pick the chat or agent model, or let an automatic setting choose." },
        { type: "chart", kind: "hbar", title: "Rough latency budget per feature", unit: " s", labels: ["Tab suggestion", "Apply an edit", "Chat answer", "Agent task"], series: [ { name: "Typical seconds", values: [0.3, 2, 10, 120] } ], caption: "Illustrative orders of magnitude only, not measured figures. The point: budgets differ by more than 100×, so one model cannot serve all features well." },
        { type: "p", text: "**Privacy.** Requests go from the editor through Cursor's servers to the model providers. Cursor offers a **Privacy Mode**; with it enabled, Cursor states that code is not stored by Cursor or its model providers for training (it relies on zero-data-retention agreements with providers). For indexing, embeddings and obfuscated metadata are stored, while the plain code is read from our local machine when needed. `.cursorignore` keeps files out of indexing and AI features. Organisations should check the current security documentation, because these policies are what really matter for compliance." },
        { type: "check", question: "A teammate worries that turning on codebase indexing uploads the whole repo as plain text to be stored. How would you answer, based on Cursor's documented design?", answer: "Chunks are sent to compute embeddings, and what is stored remotely is the embeddings plus obfuscated paths and line ranges; the actual code shown to the model is read locally at request time. Files can be excluded with `.cursorignore`, and Privacy Mode controls retention. For strict compliance, verify against Cursor's current security docs." }
      ]
    },
    {
      id: "complete-flow",
      title: "The complete flow of Cursor",
      blocks: [
        { type: "steps", title: "From opening a project to merged change", items: [
          { title: "Open the project", text: "Cursor indexes it (chunk → embed → store) and keeps the index in sync using Merkle-tree hashing." },
          { title: "Type code", text: "Tab's fast model predicts next edits from local context and recent changes." },
          { title: "Ask a question", text: "Chat gathers context (current file, @-mentions, rules, semantic search) and a large model answers." },
          { title: "Give a goal to the Agent", text: "The agent loops: search the index and grep, read files, edit, run commands (with approval), check results." },
          { title: "Apply and review", text: "Edits are merged by the apply step and shown as diffs; we accept, reject or roll back to a checkpoint." }
        ] },
        { type: "p", text: "Compared with Claude Code from the previous lesson, the agent loop is the same idea. The differences are in the harness: Cursor lives inside an editor and offers a pre-built semantic index plus Tab, while Claude Code started in the terminal and leans on agentic search with grep and file reads. Both depend on our tests and reviews for a real definition of done." }
      ]
    }
  ],
  quiz: [
    { q: "Why does Cursor use a small specialised model for Tab instead of the strongest chat model?", options: ["Large chat models are not able to write or complete code at all", "Tab must respond in a fraction of a second, so speed rules", "Tab does not use any model; it is a list of saved snippets", "Privacy rules forbid sending code to large models from editors"], answer: 1, explain: "Different features have different latency and cost budgets. A fast, good prediction beats a slow perfect one while typing." },
    { q: "In a 20,000-file repo we edit 3 files. What lets Cursor re-index just those files?", options: ["Re-embedding every file in the project once every minute", "Asking the chat model to guess which files have changed", "A Merkle tree of hashes that pinpoints changed files", "Indexing only the file that is open in the current tab"], answer: 2, explain: "Comparing hashes top-down skips unchanged folders entirely and finds the few changed files." },
    { q: "In the lesson's mini index, why does the query rank `auth/login.py` first?", options: ["Its embedding has the highest cosine similarity to the query", "It was the most recently edited file in the whole project", "It comes first in alphabetical order among the indexed files", "It is the longest file, so it contains the most words"], answer: 0, explain: "Search ranks chunks by cosine similarity between query and chunk embeddings; login.py shares the most (hashed) words with the query." },
    { q: "How does Cursor's Agent mode differ from Chat (Ask) mode?", options: ["Agent mode works without any code context from the project", "Chat edits files automatically, while Agent only explains code", "There is no difference apart from the colour of the panel", "Agent runs a tool loop toward a goal; Ask only answers"], answer: 3, explain: "Agent mode is an agent loop with tools; Ask is a read-only conversation." },
    { q: "Which statement is a misconception?", options: ["Cursor started as a fork of the VS Code editor", "Diffs from the apply model never need review", "Speculative edits reuse the original file as a draft", "`.cursorignore` can keep files out of indexing"], answer: 1, explain: "The apply step can still misplace or drop code. Reviewing diffs remains essential." }
  ],
  takeaways: [
    "Cursor is VS Code plus AI at three levels: Tab, Chat and Agent.",
    "A semantic index (chunk, embed, store) lets it find code by meaning; Merkle-tree hashing keeps it in sync cheaply.",
    "Tab predicts the next edit with a small fast model because latency is everything while typing.",
    "Agent mode is a tool loop: search, read, edit, run commands, check, with our approval and checkpoints.",
    "A separate apply step merges sketches into files quickly using speculative edits; always review the diff.",
    "Different features use different models because their speed, cost and intelligence needs differ."
  ],
  terms: [
    { term: "Fork", def: "A new project built from a copy of another project's source code, here VS Code." },
    { term: "Codebase index", def: "Embeddings of code chunks stored for semantic search over a project." },
    { term: "Merkle tree", def: "A tree of hashes where each parent's hash is computed from its children's, so changes can be located quickly." },
    { term: "Tab (next-edit prediction)", def: "Cursor's feature that predicts and suggests the next code edit as we type." },
    { term: "Apply model", def: "A specialised model that merges a suggested code change into the full file." },
    { term: "Speculative edits", def: "Speeding up file rewriting by using the original file as a draft that the model verifies in parallel." }
  ]
};
