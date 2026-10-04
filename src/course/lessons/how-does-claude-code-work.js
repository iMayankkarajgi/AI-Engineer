export default {
  id: "how-does-claude-code-work",
  minutes: 27,
  hook: "How does an AI go from “here is a code snippet, good luck pasting it” to actually opening our files, running our tests and fixing the bug itself?",
  summary: "Claude Code is Anthropic's agentic coding tool. It runs a Claude model in an agent loop with real tools (read and edit files, search with patterns, run shell commands) inside our project, so it can gather context, make changes and verify them by running tests. Project instructions live in CLAUDE.md, permission rules keep us in control of risky actions, and plan mode, subagents and hooks let us shape how it works. It is a clear real-world example of harness and loop engineering.",
  sections: [
    {
      id: "what-is-claude-code",
      title: "What is Claude Code?",
      blocks: [
        { type: "p", text: "**Claude Code** is an **agentic coding tool** made by Anthropic. “Agentic” means it does not just suggest text: it takes actions toward a goal. It started as a command-line program that runs in our terminal (released as a research preview in February 2025 and generally available a few months later) and is now also available through IDE extensions, a desktop app and the web. In every form, the idea is the same: we describe a task in plain language, and Claude reads our code, edits files, runs commands, and reports back." },
        { type: "p", text: "Under the hood it is exactly what the previous lessons described: a strong model (Claude) plus a carefully engineered **harness**: tools, a loop, context management, project memory, permissions and extension points. In this lesson we describe only behaviour that Anthropic documents publicly; details such as exact tool names can change between versions." },
        { type: "callout", tone: "analogy", title: "Think of a new teammate at your desk", text: "A chatbot is like a friend on the phone: you read your code aloud, they suggest a fix, you type it in, you tell them the error. Claude Code is like a teammate sitting at your keyboard: they open the files themselves, run the tests themselves, and ask you before doing anything risky." },
        { type: "p", text: "Running example: a small shop project where `total([5, 10])` returns `10` instead of `15`, and a test is failing." }
      ]
    },
    {
      id: "chatbot-problem",
      title: "The problem with a normal AI chatbot",
      blocks: [
        { type: "p", text: "With a chat assistant in a browser, *we* are the harness. We copy code in, the model guesses at the parts it cannot see, we paste its answer back, run the tests, copy the error back, and repeat. Three problems follow:" },
        { type: "list", items: [
          "**Missing context:** the model sees only what we pasted. It does not know how `total` is called elsewhere, what the tests expect, or our project's conventions.",
          "**No verification:** it cannot run the code, so it cannot know whether its fix works. Plausible but wrong answers look identical to right ones.",
          "**We do the busywork:** every loop iteration (copy, paste, run, report) is manual, slow and error-prone."
        ] },
        { type: "compare", title: "Chat assistant vs agentic coding tool", options: [
          { name: "Chat assistant", summary: "We paste code in and copy answers out.", pros: ["Great for explanations and quick snippets", "No access to our machine, so low risk"], cons: ["Sees only what we paste", "Cannot run or test anything", "We run the loop by hand"], bestFor: "Learning, small isolated questions" },
          { name: "Claude Code", summary: "The model works directly in our project with tools, in a loop.", pros: ["Finds its own context", "Runs tests and fixes failures", "Handles multi-file changes"], cons: ["Acts on our machine, so permissions matter", "Long tasks use many tokens"], bestFor: "Real changes in real codebases: bugs, features, refactors" }
        ], rows: [
          ["Who gathers context", "We do", "The agent, with search and read tools"],
          ["Who runs the tests", "We do", "The agent, with our permission"],
          ["Who decides it worked", "We guess", "Test and build results"]
        ], verdict: "Chat is fine for questions; for changes to a real project, giving the model tools and a loop removes us from the copy-paste cycle." }
      ]
    },
    {
      id: "agent-loop",
      title: "The agent loop",
      blocks: [
        { type: "p", text: "Anthropic describes Claude Code's way of working as a loop of three phases: **gather context, take action, verify results**, repeated until the task is done, with us able to interrupt and steer at any point." },
        { type: "viz", name: "agent-loop", caption: "The same think → tool → observe cycle from earlier lessons. In Claude Code the tools are file reads, edits, searches and shell commands in our project." },
        { type: "steps", title: "One task through the loop", items: [
          { title: "Receive the task", text: "Our request, plus the system instructions, CLAUDE.md contents and the list of available tools, form the starting context." },
          { title: "Gather context", text: "The model calls search and read tools to find the relevant files, as a developer would." },
          { title: "Take action", text: "It proposes edits or commands. The harness checks permissions, asks us if needed, then runs them." },
          { title: "Verify", text: "It runs tests, builds or linters and reads the output." },
          { title: "Repeat or finish", text: "If verification fails, the error goes back into context and the loop continues. When it passes, Claude summarises what changed." }
        ] }
      ]
    },
    {
      id: "tools",
      title: "The tools of Claude Code",
      blocks: [
        { type: "p", text: "The model can only do what its tools allow. The built-in tool set covers what a developer does at a terminal. The documented set includes tools along these lines (names may evolve):" },
        { type: "table", caption: "Main built-in tool families and what they are for.", head: ["Tool", "What it does", "Needs permission by default?"], rows: [
          ["Read", "Read a file's contents (also images and PDFs)", "No"],
          ["Glob", "Find files by name pattern, e.g. `src/**/*.py`", "No"],
          ["Grep", "Search file contents with regular expressions", "No"],
          ["Edit / Write", "Change part of a file by exact string replacement, or write a whole file", "Yes"],
          ["Bash", "Run a shell command: tests, builds, git, package managers", "Yes"],
          ["WebFetch / WebSearch", "Read a web page or search the web", "Yes"],
          ["Agent (subagents)", "Hand a sub-task to a separate agent with its own context", "No"],
          ["To-do list", "Keep a visible task checklist for multi-step work", "No"]
        ] },
        { type: "p", text: "Two design choices are worth noticing. First, the **Edit** tool replaces an exact snippet of text with new text, and fails if the snippet is not found or not unique. That forces the model to have actually read the file and makes each change small and reviewable. Second, **Bash** is a universal tool: anything we can do in a shell (run `pytest`, `npm test`, `git diff`), the agent can do, which is powerful and is exactly why it is permission-gated." },
        { type: "p", text: "Beyond built-ins, Claude Code can connect to external tools through the **Model Context Protocol (MCP)**, such as issue trackers, databases or browsers." }
      ]
    },
    {
      id: "fixing-a-bug",
      title: "Example: fixing a bug",
      blocks: [
        { type: "p", text: "Here is a runnable simulation of the loop for our shop bug. The “model decisions” are scripted so the run is repeatable, but the tools work on a real in-memory project, the edit uses exact-match replacement, and edits go through a permission check." },
        { type: "code", lang: "python", title: "mini_claude_code.py", code: `import re
repo = {"cart.py": "def total(prices):\\n    return sum(prices[1:])\\n",
        "test_cart.py": "assert total([5, 10]) == 15\\n",
        "README.md": "Shop demo"}

def grep(pattern):  return [f for f, src in repo.items() if re.search(pattern, src)]
def read(path):     return repo[path]
def edit(path, old, new):
    assert repo[path].count(old) == 1, "old text must be unique"   # exact-match edit
    repo[path] = repo[path].replace(old, new)
def run_tests():
    env = {}; exec(repo["cart.py"], env)
    try: exec(repo["test_cart.py"], env); return "1 passed"
    except AssertionError: return "1 failed"

TOOLS = {"grep": grep, "read": read, "edit": edit, "run_tests": run_tests}
ALLOW = {"grep", "read", "run_tests"}          # read-only tools run freely

# What a model might decide, turn by turn, after seeing each result
plan = [("run_tests",), ("grep", r"def total"), ("read", "cart.py"),
        ("edit", "cart.py", "prices[1:]", "prices"), ("run_tests",)]

for name, *args in plan:
    if name not in ALLOW:
        print(f"  [permission] allow {name}{tuple(args)}? -> yes (user approved)")
    result = TOOLS[name](*args)
    shown = repr(result)[:40] if result is not None else "ok"
    print(f"{name:9} -> {shown}")
print("final cart.py:", repr(repo["cart.py"]))`, output: `run_tests -> '1 failed'
grep      -> ['cart.py']
read      -> 'def total(prices):\\n    return sum(pric
  [permission] allow edit('cart.py', 'prices[1:]', 'prices')? -> yes (user approved)
edit      -> ok
run_tests -> '1 passed'
final cart.py: 'def total(prices):\\n    return sum(prices)\\n'`, walkthrough: [
          { lines: [2, 4], note: "A tiny project: a buggy `total` that skips the first price, a test, and a README." },
          { lines: [6, 10], note: "Search, read and edit tools. Edit refuses unless the old text appears exactly once, like Claude Code's exact-replacement edits." },
          { lines: [11, 14], note: "The verification tool: run the test and report pass or fail." },
          { lines: [16, 17], note: "Permission policy: read-only tools run freely; edits require approval." },
          { lines: [19, 21], note: "The decisions a model would make: reproduce the failure, search, read, edit, re-test." },
          { lines: [23, 28], note: "The loop: check permission, run the tool, show the observation. The final test passes and the fix is one small change." }
        ] },
        { type: "p", text: "Notice the order: the agent **reproduced the failure first** (so it knows the test is a valid signal), then found and read the code, made the smallest change, and **verified** with the same test. That is good engineering practice, and it is what a well-instructed coding agent tries to do." },
        { type: "check", question: "What would the Edit tool do if the model tried to replace `prices` (instead of `prices[1:]`) in cart.py?", answer: "It would refuse. `prices` appears more than once in the file (in the parameter list and in the sum), so the exact-match rule fails with “old text must be unique”. The model must include enough surrounding text to identify one location." }
      ]
    },
    {
      id: "searching-and-verifying",
      title: "Searching a big project and verifying the work",
      blocks: [
        { type: "p", text: "**Searching.** A real repository may have thousands of files, far too many to put in the context window. Anthropic has explained that Claude Code relies on **agentic search**: the model uses Glob, Grep and Read step by step, the way a developer explores unfamiliar code (find files named like `*cart*`, grep for `def total`, read the hits, follow imports), rather than requiring a pre-built embedding index of the codebase. The benefits are that search always reflects the current files and there is no index to build or sync; the cost is extra tool calls on very large codebases." },
        { type: "p", text: "For broad investigations, Claude Code can hand searches to **subagents** (see below), which explore in their own context and return only a summary, keeping the main conversation focused." },
        { type: "p", text: "**Verifying.** The model's confidence is not evidence. Claude Code verifies by running the project's own checks through Bash: unit tests, type checkers, linters, builds. Failures come back as text the model can read and act on, which is the try–check–retry loop from the definition-of-done lesson. Its effectiveness therefore depends heavily on us: a project with good tests and a clear “how to run tests” instruction gives the agent a reliable definition of done." },
        { type: "callout", tone: "tip", title: "Make verification easy", text: "Tell Claude how to verify in CLAUDE.md (“run `pytest -q`”, “run `npm run typecheck` after edits”) and, where possible, ask for a failing test first. Agents are much better at hitting a target they can run." }
      ]
    },
    {
      id: "claude-md",
      title: "CLAUDE.md: the project memory",
      blocks: [
        { type: "p", text: "Each session starts with no memory of previous ones. To give Claude lasting knowledge about a project, we write a Markdown file called **CLAUDE.md**. Claude Code automatically loads it into context at the start of a session. Typical contents: how to build and test, code style rules, important directories, things to avoid (“never edit generated files in `gen/`”)." },
        { type: "list", items: [
          "**Project level:** `CLAUDE.md` in the repository root, committed so the whole team shares it.",
          "**User level:** `~/.claude/CLAUDE.md` for personal preferences that apply to all projects.",
          "**Subdirectories:** CLAUDE.md files in sub-folders are pulled in when Claude works with files there.",
          "**Helpers:** the `/init` command drafts a CLAUDE.md by exploring the project; files can import others with `@path` syntax."
        ] },
        { type: "callout", tone: "warn", title: "Keep it short and true", text: "CLAUDE.md is sent with every session, so it costs context each time, and stale instructions mislead the agent. Write concise, specific, current rules; prune what no longer applies." }
      ]
    },
    {
      id: "permissions",
      title: "Permissions: how we stay in control",
      blocks: [
        { type: "p", text: "An agent that can run shell commands could also delete files or push to production. Claude Code's answer is a **permission system**. By default, read-only actions run without asking, while file edits and shell commands ask for approval the first time (we can approve once or allow for the session)." },
        { type: "list", items: [
          "**Permission rules** in settings files can allow or deny specific tools and patterns, for example allow `Bash(npm run test:*)` but deny reading `.env` files. Deny rules take precedence.",
          "**Permission modes** change the default: a normal mode that asks, a mode that auto-accepts file edits, **plan mode** that is read-only, and a mode that skips prompts entirely, which is intended only for isolated environments such as containers.",
          "**Interrupting:** we can stop Claude at any time and redirect it, and file changes can be reviewed (and rewound via checkpoints) before we commit."
        ] },
        { type: "check", question: "A team wants Claude to run tests freely but never run `git push`. What permission setup fits?", answer: "An allow rule for the test command pattern (for example `Bash(npm run test:*)`) and a deny rule for `Bash(git push:*)`. Tests then run without prompts, and pushes are blocked even if the model tries." }
      ]
    },
    {
      id: "plan-subagents-hooks",
      title: "Plan mode, subagents and hooks",
      blocks: [
        { type: "p", text: "**Plan mode** is a read-only mode: Claude may explore and read but not edit or run changing commands. It produces a plan that we review and approve before any change is made. It is ideal for large or risky tasks where we want to agree on the approach first." },
        { type: "p", text: "**Subagents** are specialised helpers, each running in its **own context window** with its own instructions and allowed tools. Custom ones are defined as Markdown files (for example in `.claude/agents/`). The main agent delegates a sub-task (“find every place we parse dates”), the subagent does many searches and reads, and only its summary returns. This keeps the main context clean and lets work be split." },
        { type: "p", text: "**Hooks** are our own shell commands that Claude Code runs automatically at defined moments in its lifecycle, such as before a tool runs (`PreToolUse`), after a tool runs (`PostToolUse`), when we submit a prompt, or when Claude finishes. Unlike instructions in CLAUDE.md, which the model may or may not follow, hooks are **deterministic**: a hook can always run the formatter after every edit, or block an edit to a protected file." },
        { type: "flow", title: "Where hooks attach to the loop", loop: true, nodes: [
          { label: "User prompt", detail: "A UserPromptSubmit hook can add context or validate the request." },
          { label: "Model plans a tool call", detail: "For example, Edit cart.py." },
          { label: "PreToolUse hook", detail: "Runs our script first; it can block the call (for example, edits to migrations/ are forbidden)." },
          { label: "Tool runs", detail: "Subject to permission rules and prompts." },
          { label: "PostToolUse hook", detail: "Runs after, e.g. auto-format the edited file or run a quick lint." },
          { label: "Stop hook", detail: "When Claude finishes, a hook could run the test suite or send a notification." }
        ] }
      ]
    },
    {
      id: "worked-context-accounting",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "This lesson said that subagents keep the main context clean. Let us put illustrative numbers on that. We ask: “find every place we parse dates”. Answering takes 12 search and read calls, and each call returns about 1,500 tokens of file content." },
        { type: "steps", title: "Where do the tokens go?", items: [{ title: "Search in the main conversation", text: "12 × 1,500 = 18,000 tokens of file content are added to the main context. Most of it is code we looked at once and will not need again." }, { title: "Carry it on every turn", text: "An agent loop sends its context again on each later turn. If the task runs for 20 more turns, those 18,000 tokens are carried 20 more times." }, { title: "Delegate instead", text: "A subagent makes the same 12 calls in its own context window. That window fills with the same 18,000 tokens, but it is set aside when the subagent finishes." }, { title: "Only the summary returns", text: "The main agent receives a short report, say 300 tokens: the files and line numbers where dates are parsed." }, { title: "Compare", text: "18,000 tokens against 300 in the main context: 60 times less. The main conversation stays focused on the fix." }] },
        { type: "chart", kind: "hbar", title: "Tokens added to the main context by one investigation", xLabel: "Tokens", labels: ["Search in the main conversation", "Delegate to a subagent"], series: [{ name: "Tokens", values: [18000, 300] }], caption: "Illustrative numbers from the steps above. The search work is the same; only the place where its output lives changes." },
        { type: "p", text: "There is a price on the other side. The subagent starts with none of the main conversation, so the task we hand over must stand on its own: what to look for, where, and what to report back. A summary can also leave out a detail we need later, and then the main agent must read that file itself. Delegation suits broad searches with a short result. For one file we are about to edit, reading it directly is simpler." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build a small permission checker in the spirit of this lesson: read-only tools run freely, deny rules beat allow rules, anything the rules do not cover asks the user, and a hook that we wrote can block a call. The rule format is a simplified sketch, not the tool's exact syntax." },
        { type: "code", lang: "python", title: "practice_permission_rules.py", code: `from fnmatch import fnmatchcase

# A simplified sketch of permission rules: deny beats allow, the rest asks.
ALLOW = ["Read(*)", "Grep(*)", "Bash(npm run test*)"]
DENY = ["Bash(git push*)", "Read(.env)"]

def pre_tool_hook(tool, arg):
    # Our own deterministic check, run before every tool call
    if tool == "Edit" and arg.startswith("migrations/"):
        return "blocked by hook: migrations are protected"
    return None

def decide(tool, arg):
    call = f"{tool}({arg})"
    blocked = pre_tool_hook(tool, arg)
    if blocked:
        return blocked
    if any(fnmatchcase(call, rule) for rule in DENY):     # deny is checked first
        return "denied by rule"
    if any(fnmatchcase(call, rule) for rule in ALLOW):
        return "allowed, runs without asking"
    return "ask the user first"

# Tool calls a model might propose while fixing the cart bug
calls = [("Read", "cart.py"), ("Read", ".env"), ("Bash", "npm run test:unit"),
         ("Edit", "cart.py"), ("Edit", "migrations/001.sql"),
         ("Bash", "git push origin main"), ("Bash", "rm -rf build")]
for tool, arg in calls:
    print(f"{tool + '(' + arg + ')':27} -> {decide(tool, arg)}")`, output: `Read(cart.py)               -> allowed, runs without asking
Read(.env)                  -> denied by rule
Bash(npm run test:unit)     -> allowed, runs without asking
Edit(cart.py)               -> ask the user first
Edit(migrations/001.sql)    -> blocked by hook: migrations are protected
Bash(git push origin main)  -> denied by rule
Bash(rm -rf build)          -> ask the user first`, walkthrough: [{ lines: [3, 5], note: "Allow and deny lists as simple patterns, where `*` matches any text." }, { lines: [7, 11], note: "Our own hook: plain code that runs before every tool call and can block it. Here it protects the `migrations/` folder." }, { lines: [13, 22], note: "The decision order in our sketch: the hook first, then deny rules, then allow rules, and “ask the user” for everything else." }, { lines: [24, 29], note: "Seven tool calls a model might propose, each with the decision the checker reaches." }] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: ["Add `\"Edit(*)\"` to `ALLOW`. Predict the result for both Edit calls. Which one still does not run, and why?", "Add `\"Bash(*)\"` to `ALLOW`. Predict the results for `git push origin main` and for `rm -rf build`. Is this a rule we would want?", "Remove `\"Read(.env)\"` from `DENY`. Predict what happens to `Read(.env)`. Why does a broad allow rule make a specific deny rule necessary?"] },
        { type: "check", question: "`Read(.env)` matches the allow rule `Read(*)` and also the deny rule `Read(.env)`. Why is “deny wins” the safer way to settle the tie?", answer: "Allow rules are usually broad, so that routine work runs without prompts. Deny rules are narrow and protect specific things. If allow won, every broad allow rule would silently cancel the protections behind it, and we would have to remember each secret file whenever we wrote one. With deny winning, a mistake errs on the side of blocking, which costs us a prompt and not a leaked secret." },
        { type: "check", question: "`Bash(rm -rf build)` matched no rule and got “ask the user first”. Why is asking a better default for unmatched calls than allowing them or denying them?", answer: "We cannot list every command in advance. If unmatched calls were allowed, anything we forgot to deny would run, including destructive commands. If they were denied, the agent would be stopped by every new, harmless command. Asking puts a person in front of exactly the cases the rules did not foresee, and each answer shows us which rule to add next." }
      ]
    },
    {
      id: "putting-it-together",
      title: "Putting it all together",
      blocks: [
        { type: "p", text: "When we type “fix the failing cart test” into Claude Code, the harness assembles a context from the system instructions, our CLAUDE.md and the tool definitions. The model reproduces the failure with Bash, searches with Grep and Glob, reads the relevant files, proposes an exact-match Edit (which may trigger a permission prompt and hooks), re-runs the tests, and loops until they pass or it needs our input. Long sessions are kept within the context window by compaction (summarising earlier parts), and side investigations can go to subagents." },
        { type: "callout", tone: "example", title: "What it is good and less good at", text: "Strong: tasks with a runnable definition of done (failing tests, type errors, build failures), codebase exploration, multi-file refactors with tests, writing tests. Weaker: vague goals (“make it better”), tasks needing context that is not in the repo or docs, and projects with no way to verify. As always, review the diff before merging." },
        { type: "p", text: "Every idea from this module appears here: a **harness** (tools, permissions, hooks, CLAUDE.md), a **loop** with verification (gather, act, verify), and a **definition of done** supplied by our tests. The next lesson looks at Cursor, which wraps similar ideas inside a code editor." }
      ]
    }
  ],
  quiz: [
    { q: "Which three phases does Anthropic use to describe how Claude Code works on a task?", options: ["Train, fine-tune, deploy", "Gather context, act, verify", "Embed, index, then retrieve", "Plan, code, ship to production"], answer: 1, explain: "Claude Code loops through gathering context, acting and verifying until the task is done." },
    { q: "Claude Code keeps “fixing” a bug but the fix fails in CI. The repo has tests, but Claude never runs them. What is the best change?", options: ["Document the test command in CLAUDE.md and allow it", "Switch off all permission prompts so it can run anything", "Ask it in every prompt to be more confident in its fixes", "Delete the failing tests so that the CI pipeline passes"], answer: 0, explain: "Give the agent a runnable definition of done and permission to run it. Removing safety or tests hides the problem." },
    { q: "In the mini simulation, why did replacing `prices[1:]` succeed while replacing just `prices` would fail?", options: ["Edits to cart.py are always allowed without any check", "`prices` appears twice, so the exact-match edit is ambiguous", "The tests were already passing before the edit was made", "Edits only work on lines that contain square brackets"], answer: 1, explain: "The edit tool requires the old text to be unique so the change is unambiguous." },
    { q: "How do hooks differ from instructions written in CLAUDE.md?", options: ["Hooks are suggestions the model may ignore, while CLAUDE.md rules are always enforced", "There is no real difference; both are text the model reads at the start of a session", "Hooks are commands the harness always runs at set events", "Hooks only run while Claude Code is in plan mode and never during normal editing"], answer: 2, explain: "Hooks always run (and can block actions); CLAUDE.md shapes behaviour through the model's context." },
    { q: "Which statement is a misconception about Claude Code?", options: ["Subagents run with their own separate context windows", "Plan mode lets it read and plan without making edits", "It must first build an embedding index of the whole repo", "Deny permission rules take precedence over allow rules"], answer: 2, explain: "Anthropic has described Claude Code as using agentic search with tools like Glob, Grep and Read, not a required pre-built embedding index." }
  ],
  takeaways: [
    "Claude Code is a Claude model in an agent loop with real tools in our project: gather context, act, verify.",
    "Agentic search (Glob, Grep, Read) finds relevant code on demand instead of pasting it in.",
    "Verification through tests, builds and linters is what makes its changes trustworthy.",
    "CLAUDE.md gives persistent project instructions; keep it short and current.",
    "Permission rules and modes keep risky actions under our control.",
    "Plan mode, subagents and deterministic hooks let us shape and constrain how it works."
  ],
  terms: [
    { term: "Agentic coding tool", def: "A tool where an AI model acts in a codebase (reads, edits, runs commands) in a loop toward a goal." },
    { term: "Agentic search", def: "Finding relevant code by having the model call search and read tools step by step." },
    { term: "CLAUDE.md", def: "A Markdown file of project instructions that Claude Code loads into context at session start." },
    { term: "Permission mode", def: "A setting that controls which actions Claude Code may take without asking, such as plan mode or auto-accepting edits." },
    { term: "Subagent", def: "A helper agent with its own context window and tools that handles a delegated sub-task and returns a summary." },
    { term: "Hook", def: "A user-defined shell command the harness runs automatically at a lifecycle event, able to add checks or block actions." }
  ]
};
