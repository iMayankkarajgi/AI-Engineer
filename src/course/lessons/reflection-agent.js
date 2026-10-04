export default {
  id: "reflection-agent",
  minutes: 18,
  hook: "Good writers rarely publish their first draft; can an agent improve its own work by reviewing it before handing it over?",
  summary: "A Reflection agent works in a generate → critique → revise loop: it produces a draft, a critic examines the draft against the goal and points out concrete problems, and the agent revises using that feedback, repeating until the critic is satisfied or a round limit is reached. Reflection works best when the critique is grounded in something real, such as test results, a checklist or a tool, because a model judging its own work without outside evidence often misses its own mistakes.",
  sections: [
    {
      id: "what-is-reflection",
      title: "What is a Reflection agent?",
      blocks: [
        { type: "p", text: "A **Reflection agent** improves an output by looking back at it. Instead of returning the first answer it generates, it runs a short quality loop:" },
        { type: "list", ordered: true, items: [
          "**Generate**: write a first draft (an answer, an essay, a piece of code, a plan).",
          "**Critique** (also called *reflect*): examine the draft against the task and list specific problems: a failing test, a missing requirement, a factual error, a tone issue.",
          "**Revise**: produce a new draft that fixes those problems, using the critique as guidance."
        ] },
        { type: "p", text: "The loop repeats until the critic finds nothing important to fix, or until a maximum number of rounds. The key idea is that **feedback written in plain language** can steer the next attempt, without retraining the model." },
        { type: "callout", tone: "analogy", title: "Think of it like a writer and an editor", text: "A writer drafts an article. An editor marks it up: “paragraph two contradicts paragraph one; the intro is too long; cite a source here.” The writer revises. A good editor is specific and checks against real standards. A vague editor (“make it better”) wastes everyone's time, and an editor who is the writer in a hurry tends to miss the same mistakes twice." },
        { type: "p", text: "Two well-known research works shaped this pattern. **Self-Refine** (Madaan and colleagues, 2023) showed that a single LLM can generate, give itself feedback and refine across several tasks, with no extra training. **Reflexion** (Shinn and colleagues, 2023) had agents write short verbal reflections after failing a task (for example, failing unit tests) and keep them in memory, so the next attempt could avoid the same error." }
      ]
    },
    {
      id: "vs-ai-agent",
      title: "Reflection agent vs a basic AI agent",
      blocks: [
        { type: "p", text: "A basic agent loop is about **getting things done**: choose a tool, observe, continue until the task is complete. A Reflection agent adds a different loop focused on **getting things right**: once a draft exists, examine and improve it." },
        { type: "table", caption: "What reflection adds",
          head: ["Aspect", "Basic AI agent", "Reflection agent"],
          rows: [
            ["Main loop", "Act → observe → act", "Generate → critique → revise"],
            ["What it improves", "Progress toward the goal", "Quality of the output"],
            ["When it stops", "Goal reached or limit hit", "Critic satisfied or round limit hit"],
            ["Typical extra cost", "One model call per action", "One critique + one revision call per round"]
          ] },
        { type: "p", text: "These are not rivals. A reflection step can be added on top of almost any agent: a ReAct agent can finish its research and then critique its own report before returning it." }
      ]
    },
    {
      id: "anatomy",
      title: "Anatomy of a Reflection agent",
      blocks: [
        { type: "table", caption: "The parts of a Reflection agent",
          head: ["Part", "Job", "Good practice"],
          rows: [
            ["Generator", "Produces the draft, and later the revisions.", "Give it the task, the previous draft, and the critique."],
            ["Critic (reflector)", "Evaluates the draft and returns specific, actionable feedback, or “no issues”.", "Ground it in evidence: tests, a rubric, a fact-check tool, or a different model."],
            ["Stop rule", "Decides when to stop revising.", "Stop when the critic passes, at a round limit, or when scores stop improving."],
            ["Memory (optional)", "Keeps reflections from past attempts.", "Store short lessons (“remember to handle punctuation”) for the next try."]
          ] },
        { type: "flow", title: "The reflection loop", loop: true,
          nodes: [
            { label: "Generate", detail: "Write a first draft, or a revised draft using the latest critique." },
            { label: "Critique", detail: "Check the draft against the goal using tests, a rubric or a second model. Output specific problems or “pass”." },
            { label: "Decide", detail: "Pass, or round limit reached? Return the draft. Otherwise continue." },
            { label: "Revise", detail: "Feed the draft and the critique back to the generator and ask for a fixed version." }
          ] },
        { type: "callout", tone: "tip", title: "Same model or different model?", text: "The generator and critic can be the same LLM with different prompts (cheap, simple), or different models (a second opinion that shares fewer blind spots). Where possible, make the critic a deterministic check, such as running tests, a linter, a schema validator or a fact lookup. Those critics cannot be talked out of a failure." }
      ]
    },
    {
      id: "how-it-works",
      title: "How a Reflection agent works",
      blocks: [
        { type: "steps", title: "One reflection run",
          items: [
            { title: "Set the bar", text: "Define what “good” means before generating: tests to pass, a rubric (accurate, under 150 words, cites sources), or constraints." },
            { title: "Generate the first draft", text: "The generator writes its best first attempt." },
            { title: "Critique with evidence", text: "Run the tests or rubric. Turn the findings into specific feedback: what failed, an example, and ideally why." },
            { title: "Check the stop rule", text: "If the critic passes, stop. If the round limit is reached, stop and return the best draft so far (and its known issues)." },
            { title: "Revise", text: "Give the generator the task, its last draft and the critique, and ask for a corrected version that changes only what is needed." },
            { title: "Repeat", text: "Go back to the critique step with the new draft." }
          ] },
        { type: "p", text: "Two choices make or break this loop. First, **specific critiques**: “test 3 fails: `is_palindrome('Racecar')` returns False, expected True” is far more useful than “the code has bugs”. Second, **tracking the best draft**: a revision can be worse than the one before, so keep the best-scoring version, not just the latest." },
        { type: "deeper", title: "Writing a strong critic prompt", blocks: [
          { type: "p", text: "When the critic must be an LLM (for writing, plans, or anything without automatic tests), its prompt decides everything. A strong critic prompt usually does four things:" },
          { type: "list", ordered: true, items: [
            "**States the criteria** as a checklist: “accurate against the sources below; under 150 words; answers the question in the first sentence; no unsupported numbers”.",
            "**Demands evidence**: for each problem, quote the exact part of the draft and say which criterion it breaks.",
            "**Separates must-fix from nice-to-have**, so the loop only continues for real problems.",
            "**Allows a clean pass**: “If every criterion is met, reply exactly PASS.” Without that option, critics tend to invent issues."
          ] },
          { type: "p", text: "Giving the critic the source documents or tool access (for example, a search tool to verify a claim) turns opinion into checking, which is the difference between reflection that helps and reflection that just adds cost." }
        ] },
        { type: "check", question: "A critic prompt says: “Review this answer and say if it could be improved.” Why is this a weak critic?", answer: "It has no standard to check against and invites vague or invented feedback. A strong critic checks against explicit criteria (tests, a rubric, source documents) and must name concrete problems with evidence, or explicitly pass the draft." }
      ]
    },
    {
      id: "full-trace",
      title: "A full trace example",
      blocks: [
        { type: "p", text: "Task: write `is_palindrome(s)`, which should ignore case, spaces and punctuation. The critic here is not an LLM opinion: it **actually runs four unit tests** and reports the first failure. The generator's drafts are scripted to show a realistic sequence of fixes." },
        { type: "code", lang: "python", title: "reflection_agent.py", code: `# Reflection loop: generate -> critique (run real tests) -> revise, max 3 rounds.
DRAFTS = iter([   # what the "generator" LLM writes on each attempt (scripted)
    "def is_palindrome(s):\\n    return s == s[::-1]",
    "def is_palindrome(s):\\n    s = s.lower()\\n    return s == s[::-1]",
    "def is_palindrome(s):\\n    s = ''.join(c for c in s.lower() if c.isalnum())\\n    return s == s[::-1]",
])
TESTS = [("racecar", True), ("Racecar", True),
         ("A man, a plan, a canal: Panama", True), ("hello", False)]

def critic(code):
    """External check: actually run the code against tests; return feedback."""
    ns = {}
    exec(code, ns)
    fails = [(x, want) for x, want in TESTS if ns["is_palindrome"](x) != want]
    if not fails:
        return None                                   # no problems -> stop
    x, want = fails[0]
    return f"{len(fails)} test(s) fail, e.g. is_palindrome({x!r}) should be {want}"

feedback = None
for round_ in range(1, 4):
    draft = next(DRAFTS)          # real agent: generate(task, previous draft, feedback)
    feedback = critic(draft)
    print(f"round {round_}: {'PASS' if feedback is None else feedback}")
    if feedback is None:
        break
print("final code:\\n" + draft)`, output: `round 1: 2 test(s) fail, e.g. is_palindrome('Racecar') should be True
round 2: 1 test(s) fail, e.g. is_palindrome('A man, a plan, a canal: Panama') should be True
round 3: PASS
final code:
def is_palindrome(s):
    s = ''.join(c for c in s.lower() if c.isalnum())
    return s == s[::-1]`,
          walkthrough: [
            { lines: [2, 6], note: "Three drafts a generator might write in turn: naive reversal, then lowercasing, then also stripping non-alphanumeric characters." },
            { lines: [7, 8], note: "The definition of “good”: four tests, including mixed case and a sentence with spaces and punctuation." },
            { lines: [10, 18], note: "The critic runs the draft against every test. No failures means pass (`None`); otherwise it returns specific, evidence-based feedback naming the failing input and the expected result." },
            { lines: [20, 26], note: "The reflection loop, capped at 3 rounds. In a real agent, the next draft would be generated from the task, the previous draft and this feedback." },
            { lines: [27, 27], note: "Return the final, passing draft." }
          ] },
        { type: "chart", kind: "bar", title: "Tests passed per round (from the run above)", yLabel: "Tests passed (of 4)", labels: ["Round 1", "Round 2", "Round 3"],
          series: [ { name: "Tests passed", values: [2, 3, 4] } ],
          caption: "Real numbers from the code output: 2 failures, then 1, then none. Each critique named one concrete failing case, and each revision fixed it." },
        { type: "p", text: "Notice how the feedback drove each change. Round 1's critique pointed at `'Racecar'`, so the revision added `lower()`. Round 2's critique pointed at the sentence with punctuation, so the revision filtered to letters and digits. That is the whole power of reflection, in miniature." }
      ]
    },
    {
      id: "vs-react",
      title: "Reflection agent vs ReAct agent",
      blocks: [
        { type: "compare", title: "ReAct vs Reflection",
          options: [
            { name: "ReAct", summary: "Interleave reasoning and tool actions to gather information and make progress.", pros: ["Grounds answers in real data", "Adapts step by step"], cons: ["Does not, by itself, review the final output", "Can finish with a flawed answer"], bestFor: "Finding information and taking actions" },
            { name: "Reflection", summary: "Generate a complete output, critique it, and revise it.", pros: ["Raises output quality", "Catches errors before the user sees them", "Works well with tests and rubrics"], cons: ["Extra calls per round", "Self-critique without evidence can be unreliable"], bestFor: "Code, writing, plans, any output with checkable quality" }
          ],
          rows: [
            ["Loop", "Thought → Action → Observation", "Generate → Critique → Revise"],
            ["Feedback comes from", "Tools and the environment", "A critic (tests, rubric, model)"],
            ["Typical length", "Many short steps", "A few full-draft rounds"],
            ["Question it answers", "What should I do next?", "Is this output good enough?"]
          ],
          verdict: "They combine well: use ReAct to gather facts and act, then a reflection pass to check the final answer against the goal." }
      ]
    },
    {
      id: "failure-modes",
      title: "Common failure modes and how to fix them",
      blocks: [
        { type: "callout", tone: "warn", title: "The big trap: self-critique without evidence", text: "A model asked to check its own reasoning, with no tests, tools or sources, often approves its own mistakes, and sometimes “fixes” a correct answer into a wrong one. Research such as *Large Language Models Cannot Self-Correct Reasoning Yet* (Huang and colleagues, 2023) reported that this kind of purely intrinsic self-correction did not reliably improve reasoning accuracy. Reflection is most reliable when the critic has outside feedback." },
        { type: "table", caption: "Reflection failures and fixes",
          head: ["Failure", "What happens", "Fix"],
          rows: [
            ["Rubber-stamp critic", "The critic says “looks great” to everything.", "Use tests, rubrics with required checks, or a different model as critic."],
            ["Nitpicking forever", "The critic always finds something, so the loop never ends.", "Round limit; only block on must-fix issues; stop when scores stop improving."],
            ["Regression", "A revision fixes one problem and breaks something that worked.", "Re-run all checks every round; keep the best version, not the latest."],
            ["Vague feedback", "“Improve clarity” gives the generator nothing to act on.", "Require the critic to cite the exact failing part and expected behaviour."],
            ["Cost and latency", "Each round adds at least two model calls.", "Use reflection only where quality matters; 1–3 rounds is usually enough."],
            ["Over-editing", "The revision rewrites everything, losing good parts.", "Ask the generator to change only what the critique mentions."]
          ] },
        { type: "timeline", title: "Key ideas behind reflection agents",
          items: [
            { when: "2023", title: "Self-Refine", text: "One model iteratively generates, critiques and refines its own output, without extra training." },
            { when: "2023", title: "Reflexion", text: "Agents write verbal reflections after failed attempts (e.g. failing tests) and use them as memory for the next attempt." },
            { when: "2023", title: "Limits of intrinsic self-correction", text: "Studies report that self-correction without external feedback does not reliably fix reasoning errors." },
            { when: "2024–2026", title: "Verification in practice", text: "Coding and research agents routinely run tests, linters or source checks as the critic before returning results." }
          ] },
        { type: "callout", tone: "example", title: "Real-world use", text: "Coding agents run the test suite after an edit and revise until tests pass. Writing assistants check a draft against a style guide and a word limit. Data agents re-run a query to confirm totals before reporting. In each case the critic is grounded in something checkable." },
        { type: "p", text: "**When not to use it.** For simple lookups, short factual answers, or tasks with no clear quality criteria, reflection mostly adds cost and latency. It earns its keep when mistakes are costly and quality can be checked." },
        { type: "p", text: "**Quick summary.** A Reflection agent drafts, critiques and revises in a loop until the critic passes or a round limit is hit. It improves quality rather than gathering information, and pairs naturally with ReAct. Its effectiveness depends on the critic: specific, evidence-based critiques (tests, rubrics, tools) work; vague self-review often does not." }
      ]
    }
  ],
  quiz: [
    { q: "What is the core loop of a Reflection agent?", options: ["Thought → Action → Observation", "Plan → Execute → Replan", "Generate → Critique → Revise", "Retrieve → Read → Answer"], answer: 2, explain: "Reflection agents improve a draft through critique and revision. Thought-Action-Observation is ReAct and Plan-Execute-Replan is Plan-and-Execute." },
    { q: "Our reflection agent's critic approves almost every draft, including ones with bugs. What is the best fix?", options: ["Ground the critic in evidence, such as running the unit tests", "Increase the number of rounds to 20 so the critic gets more chances", "Let the generator also act as the final judge of its own drafts", "Lower the generator's temperature so its drafts contain fewer bugs"], answer: 0, explain: "A rubber-stamp critic needs real evidence. Running tests (or using a rubric or a separate model) makes failures visible. More rounds with the same weak critic would not help." },
    { q: "In the code example, how many tests did the round 2 draft pass?", options: ["1", "2", "3", "4"], answer: 2, explain: "The round 2 critique reported 1 failing test out of 4, so 3 passed. Round 1 passed 2 and round 3 passed all 4." },
    { q: "How do ReAct and Reflection differ in where their feedback comes from?", options: ["Both get their feedback from the user, who reviews each step or draft", "ReAct observes tool results; Reflection gets a critic's feedback on a draft", "ReAct uses a critic on each draft, while Reflection relies on tool calls alone", "Neither uses feedback; both rely on the model's first answer being right"], answer: 1, explain: "ReAct's observations come from tool calls while doing the task. Reflection's feedback comes from a critic that judges a finished draft (which may itself use tools like tests)." },
    { q: "Which statement about reflection is a misconception?", options: ["Specific critiques lead to better revisions than vague, general ones", "A revision can be worse than the previous draft, so keep the best version", "Self-checking with no outside feedback reliably fixes a model's reasoning errors", "A round limit is needed so that the loop is guaranteed to terminate"], answer: 2, explain: "Research reports that purely intrinsic self-correction does not reliably improve reasoning; models can miss their own mistakes or break correct answers. External evidence makes reflection reliable." }
  ],
  takeaways: [
    "A Reflection agent loops generate → critique → revise until the critic passes or a round limit is hit.",
    "Reflection improves output quality; it complements action-taking loops like ReAct rather than replacing them.",
    "The critic is everything: ground it in tests, rubrics, tools or a different model, and make feedback specific.",
    "Self-critique without outside evidence is unreliable and can make correct answers worse.",
    "Cap rounds, re-run all checks each round, and keep the best draft, not just the latest."
  ],
  terms: [
    { term: "Reflection agent", def: "An agent that critiques its own draft and revises it, in a loop, to improve quality." },
    { term: "Critic (reflector)", def: "The component that evaluates a draft and returns specific problems or a pass." },
    { term: "Self-Refine", def: "A 2023 method in which one LLM iteratively gives feedback on and refines its own output." },
    { term: "Reflexion", def: "A 2023 method where agents store verbal reflections on failed attempts to do better on the next try." },
    { term: "Intrinsic self-correction", def: "A model revising its answer using only its own judgement, with no external feedback." },
    { term: "Regression", def: "When a revision breaks something that worked in an earlier draft." }
  ]
};
