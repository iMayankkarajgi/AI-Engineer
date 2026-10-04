export default {
  id: "ai-is-only-as-good-as-our-definition-of-done",
  minutes: 23,
  hook: "Why can an AI agent fix a tricky failing test in minutes, yet struggle to write a “good” product description that we are happy with?",
  summary: "A definition of done is the clear line between a finished task and an unfinished one. When that line can be checked by a machine (tests pass, the number matches, the JSON validates), AI systems can try, check and retry on their own, and they look magical. When the line lives only in someone's head (“make it nicer”), the loop has nothing reliable to aim at. The practical skill is turning fuzzy goals into checkable ones.",
  sections: [
    {
      id: "what-is-a-definition-of-done",
      title: "What is a definition of done?",
      blocks: [
        { type: "p", text: "A **definition of done** (often shortened to DoD) is a clear statement of the conditions a piece of work must meet to count as finished. The term comes from agile software teams, where a story is not “done” just because code was written: it must also, for example, pass tests, be reviewed and be deployed to staging. The point is to remove arguments about whether something is finished." },
        { type: "callout", tone: "analogy", title: "Think of a parcel delivery", text: "“Deliver the parcel” is vague. Is it done when the van reaches the street? When the parcel is on the doorstep? A delivery company defines done precisely: the parcel is handed over or left in a safe place, and a photo and timestamp are recorded. Because done is checkable, drivers, managers and customers all agree when the job is finished." },
        { type: "p", text: "With AI, a definition of done matters even more, because an AI agent is a loop that keeps working until *something* tells it to stop (see the loop engineering lesson). That something is the definition of done. If it is precise, the loop stops at the right place. If it is vague, the loop stops at the first plausible-looking output, or never stops." },
        { type: "p", text: "Our running example: we ask an AI to write a `slugify` function that turns a blog post title into a URL slug, like “Hello World” → `hello-world`." }
      ]
    },
    {
      id: "exact-tasks",
      title: "Tasks where the definition of done is exact",
      blocks: [
        { type: "p", text: "Some tasks come with a built-in, mechanical check. A program can say yes or no in milliseconds, with no human judgement:" },
        { type: "list", items: [
          "**Code with tests:** done when all tests pass, the code compiles and the linter is clean.",
          "**Maths with a known answer:** done when the final number equals the expected value.",
          "**Structured output:** done when the JSON validates against a schema and the required fields are present.",
          "**Data tasks:** done when the row counts match, no nulls remain in a column, the totals reconcile.",
          "**Games and puzzles:** done when the game is won or the puzzle constraints are all satisfied."
        ] },
        { type: "p", text: "These checks are called **verifiers**. A verifier is any procedure that takes an output and returns pass or fail (or a score) without needing a human. Exact tasks are tasks with a cheap, reliable verifier." }
      ]
    },
    {
      id: "fuzzy-tasks",
      title: "Tasks where the definition of done is fuzzy",
      blocks: [
        { type: "p", text: "Many valuable tasks have no mechanical check. The judgement lives in a person's head and can change with mood, context and audience:" },
        { type: "list", items: [
          "“Write an engaging blog post about our product.”",
          "“Make this landing page look more modern.”",
          "“Give helpful advice to this upset customer.”",
          "“Summarise this report for the board.”"
        ] },
        { type: "p", text: "Here an AI can produce something that *looks* finished but is not what we wanted, and nothing in the loop can tell. We often discover the gap only when a human reads the output. And because the target is in our head, two reviewers may disagree about whether the same output is done." },
        { type: "check", question: "Is “summarise this 20-page report in under 200 words, mentioning the three risks listed in section 4” exact or fuzzy?", answer: "Partly exact. Word count and the presence of the three named risks can be checked by a program. Whether the summary is clear and well judged is still fuzzy. Most real tasks are a mix, and the trick is to make as much of the definition checkable as possible." }
      ]
    },
    {
      id: "why-ai-is-strong-where-we-can-measure",
      title: "Why AI is so strong exactly where we can measure",
      blocks: [
        { type: "p", text: "There are two reasons, one about *using* AI and one about *training* it." },
        { type: "steps", title: "Reason 1: the try–check–retry loop at run time", items: [
          { title: "Try", text: "The model produces an attempt: a patch, an answer, a JSON object." },
          { title: "Check", text: "A verifier runs: tests, a schema validator, a calculator." },
          { title: "Feed back", text: "If it fails, the exact failure (which test, which field) goes back into the model's context." },
          { title: "Retry", text: "The model fixes the specific problem. Each retry is better informed than the last." },
          { title: "Stop", text: "The loop ends the moment the verifier passes, so the output we receive is known to meet the definition." }
        ] },
        { type: "p", text: "Even if a model gets the task right only half the time on a single try, a loop with a reliable verifier and a few retries can deliver a verified correct result most of the time. Without a verifier, the same model gives us its first try, right or wrong, and we cannot tell which." },
        { type: "chart", kind: "line", title: "Verified success with retries (illustrative)", xLabel: "Attempts allowed", yLabel: "Chance of a correct, verified result", series: [
          { name: "With a reliable verifier", points: [[1, 0.5], [2, 0.75], [3, 0.875], [4, 0.938], [5, 0.969]] },
          { name: "No verifier (first answer)", points: [[1, 0.5], [2, 0.5], [3, 0.5], [4, 0.5], [5, 0.5]] }
        ], caption: "Illustrative: 50% chance per independent attempt, so 1 − 0.5ⁿ with a verifier. Real attempts are not fully independent, but the shape holds: checkable tasks reward retries, uncheckable ones do not." },
        { type: "p", text: "**Reason 2: training.** Modern reasoning models are improved with reinforcement learning on tasks whose answers can be checked automatically, such as maths problems and coding problems with tests. This is often called **reinforcement learning with verifiable rewards**. Because a program can grade millions of attempts, the models get enormous amounts of practice on exactly these kinds of tasks. Fuzzy tasks need human or AI judges for feedback, which is slower, costlier and noisier." },
        { type: "callout", tone: "note", title: "The pattern to remember", text: "AI progress is fastest where success is cheap to verify. When we can turn our task into one with a verifier, we inherit that speed." }
      ]
    },
    {
      id: "code-vague-vs-exact",
      title: "Seeing it in code",
      blocks: [
        { type: "p", text: "Below, an AI has produced three attempts at `slugify`. We run the same loop with two definitions of done: a vague one (“returns a lowercase string”) and an exact one (three input → output examples)." },
        { type: "code", lang: "python", title: "definition_of_done.py", code: `# Three attempts an AI might produce for: "turn a title into a URL slug"
attempts = [
    lambda t: t.lower().replace(" ", "-"),
    lambda t: "-".join(t.lower().split()),
    lambda t: "-".join("".join(c for c in t.lower() if c.isalnum() or c == " ").split()),
]

# Vague definition of done: "it returns a lowercase string"
def vague_done(f):
    out = f("Hello World")
    return isinstance(out, str) and out == out.lower()

# Exact definition of done: concrete input -> expected output pairs
tests = [("Hello World", "hello-world"),
         ("  Many   spaces ", "many-spaces"),
         ("C++ & Rust!", "c-rust")]
def exact_done(f):
    return sum(f(i) == want for i, want in tests)

for n, f in enumerate(attempts, 1):
    print(f"attempt {n}: vague={'DONE' if vague_done(f) else 'no  '}  "
          f"exact={exact_done(f)}/{len(tests)} tests pass")

# The loop stops at the first attempt that meets the definition of done
first_vague = next(n for n, f in enumerate(attempts, 1) if vague_done(f))
first_exact = next(n for n, f in enumerate(attempts, 1) if exact_done(f) == len(tests))
print("loop with vague DoD stops at attempt", first_vague)
print("loop with exact DoD stops at attempt", first_exact)`, output: `attempt 1: vague=DONE  exact=1/3 tests pass
attempt 2: vague=DONE  exact=2/3 tests pass
attempt 3: vague=DONE  exact=3/3 tests pass
loop with vague DoD stops at attempt 1
loop with exact DoD stops at attempt 3`, walkthrough: [
          { lines: [1, 6], note: "Three attempts of increasing quality. Attempt 1 only swaps spaces; attempt 2 also collapses repeated spaces; attempt 3 also drops punctuation." },
          { lines: [8, 11], note: "The vague definition: any lowercase string passes. All three attempts satisfy it." },
          { lines: [13, 18], note: "The exact definition: three concrete examples, including edge cases (extra spaces, symbols). This is just a tiny test suite." },
          { lines: [20, 22], note: "Score each attempt both ways. The vague check cannot tell them apart; the exact check ranks them 1, 2, 3." },
          { lines: [24, 28], note: "A loop stops at the first attempt that counts as done. With the vague DoD we ship the weakest attempt; with the exact DoD we ship the correct one." }
        ] },
        { type: "p", text: "The model was the same in both runs. Only the definition of done changed, and it decided whether we shipped a buggy or a correct function. That is the whole lesson in five lines of output." },
        { type: "check", question: "Which single test case in the exact definition is the one that rejects attempt 2?", answer: "`(\"C++ & Rust!\", \"c-rust\")`. Attempt 2 collapses spaces but keeps symbols, producing `c++-&-rust!`. Edge cases like this are what make a definition of done strong." }
      ]
    },
    {
      id: "compare-definitions",
      title: "Vague, exact and rubric-based definitions",
      blocks: [
        { type: "compare", title: "Three kinds of definition of done", options: [
          { name: "Vague", summary: "A feeling: “make it good”, “fix the bug”.", pros: ["Fast to write"], cons: ["Agent stops at the first plausible output", "Reviewers disagree", "Nothing to retry against"], bestFor: "Brainstorming, where any idea is useful" },
          { name: "Exact (verifier)", summary: "Machine-checkable conditions: tests, schemas, expected values.", pros: ["Enables try–check–retry", "Objective and repeatable", "Cheap at scale"], cons: ["Only covers what the checks test", "Can be gamed if checks are weak"], bestFor: "Code, data, structured outputs, maths" },
          { name: "Rubric + judge", summary: "A written checklist scored by a human or an LLM judge.", pros: ["Brings structure to fuzzy tasks", "Explains why something fails"], cons: ["Judges are noisy and can be biased", "Slower and costlier than code checks"], bestFor: "Writing, support replies, summaries" }
        ], rows: [
          ["Who checks", "A person, later", "A program, instantly", "A judge model or a person, with a checklist"],
          ["Good for AI loops", "No", "Yes, ideal", "Partly; add human spot checks"]
        ], verdict: "Push every task as far right as possible: make the checkable parts exact, put the rest in a rubric, and keep humans for what remains." }
      ]
    },
    {
      id: "how-to-write-a-better-definition-of-done",
      title: "How to write a better definition of done",
      blocks: [
        { type: "steps", title: "Turning a fuzzy request into a checkable one", items: [
          { title: "State the outcome, not the activity", text: "Not “work on the login bug” but “users with a + in their email can log in”." },
          { title: "Give concrete examples", text: "Write input → expected output pairs, including edge cases: empty input, huge input, odd characters. Examples are the cheapest verifier there is." },
          { title: "Make it executable", text: "Turn the examples into tests, a schema or a script the agent can run itself. If the agent can run the check, it can loop on it." },
          { title: "List constraints", text: "What must not change (public API, other tests still pass), limits (under 200 words, under 100 ms), and forbidden shortcuts." },
          { title: "Write a rubric for the rest", text: "For the parts no program can check, list 3–6 specific criteria (“mentions the refund deadline”, “no jargon”) for a judge or reviewer." },
          { title: "Decide the human gate", text: "Say which outputs a person must approve before they count as done, and what they should look at." }
        ] },
        { type: "callout", tone: "warn", title: "A weak verifier gets gamed", text: "Optimising against a check can satisfy the check without satisfying the goal. Agents have been observed special-casing a test's exact inputs or weakening a test instead of fixing the code. This is a form of Goodhart's law: when a measure becomes a target, it stops being a good measure. Protect the check (agents may not edit tests), use varied hidden cases, and review the diff, not just the green tick." },
        { type: "callout", tone: "example", title: "Real-world use", text: "Coding-agent teams write the failing test first and tell the agent “done = this test and all existing tests pass”. Data teams give agents validation queries to run. Content teams give LLM judges explicit rubrics and still sample outputs for human review. In each case the work before the AI runs, writing the definition of done, is what makes the AI reliable." }
      ]
    },
    {
      id: "leaky-verifier-example",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "The retry chart earlier assumed a perfect verifier. Real checks leak: some wrong outputs pass. Let us see what that does, with illustrative numbers. Our model writes a correct solution on 50% of its tries. Our test suite passes every correct solution, but it also passes 20% of the wrong ones, because it misses an edge case." },
        { type: "steps", title: "What reaches us when the loop stops", items: [{ title: "Split 100 tries", text: "50 are correct and 50 are wrong." }, { title: "Run the check", text: "All 50 correct tries pass. Of the 50 wrong ones, 20% pass: that is 10." }, { title: "Look at what passed", text: "60 tries passed and 50 of them are correct. So an output that passes is correct 50 ÷ 60 ≈ 83% of the time." }, { title: "Add retries", text: "A failed try is retried, and the same split applies to each new try (we assume tries are independent). The loop stops at the first pass, and that pass is still correct only about 83% of the time." }] },
        { type: "p", text: "This is the key point: **retries raise the chance that we get a passing output, but they cannot raise the quality of what passes.** Only a better check can do that." },
        { type: "table", caption: "Illustrative: the model is correct on 50% of tries", head: ["Verifier", "Wrong outputs that pass", "Shipped output is correct"], rows: [["None (ship the first try)", "100%", "50%"], ["Leaky tests", "20%", "50 ÷ 60 ≈ 83%"], ["Tighter tests", "5%", "50 ÷ 52.5 ≈ 95%"], ["Perfect check", "0%", "100%"]] },
        { type: "p", text: "So when shipped work is wrong more often than we like, the first question is not “how many retries?” but “what does our check let through?” Each edge case we add to the definition of done moves us one row down this table." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build the full try, check, feed back, retry loop for a small task: write `median(xs)`. The verifier returns the first failing case as feedback. One of the attempts cheats by memorising the visible test inputs, so we can see what a weak definition of done lets through." },
        { type: "code", lang: "python", title: "practice_verify_loop.py", code: `# Try, check, feed back, retry -- and how a weak verifier gets gamed.
visible = [([3, 1, 2], 2), ([5], 5)]
hidden = [([4, 1, 3, 2], 2.5), ([7, 7], 7)]

def verify(f, cases):
    # Returns (passed, feedback). The feedback names the first failing case.
    for xs, want in cases:
        try:
            got = f(list(xs))
        except Exception as e:
            return False, f"median({xs}) raised {type(e).__name__}"
        if got != want:
            return False, f"median({xs}) gave {got}, want {want}"
    return True, "all checks pass"

def v3(xs):
    s, n = sorted(xs), len(xs)
    return (s[(n - 1) // 2] + s[n // 2]) / 2

attempts = {                       # what a model might write for median(xs)
    "cheat: lookup table": lambda xs: {(3, 1, 2): 2, (5,): 5}[tuple(xs)],
    "v1: middle, unsorted": lambda xs: xs[len(xs) // 2],
    "v2: middle, sorted": lambda xs: sorted(xs)[len(xs) // 2],
    "v3: handles even": v3,
}

def loop(cases):
    # Stop at the first attempt the verifier accepts
    for n, (name, f) in enumerate(attempts.items(), 1):
        ok, feedback = verify(f, cases)
        print(f"  try {n}: {name:21} -> {feedback}")
        if ok:
            return name

print("DoD = visible cases only")
print("  shipped:", loop(visible))
print("DoD = visible + hidden cases")
print("  shipped:", loop(visible + hidden))`, output: `DoD = visible cases only
  try 1: cheat: lookup table   -> all checks pass
  shipped: cheat: lookup table
DoD = visible + hidden cases
  try 1: cheat: lookup table   -> median([4, 1, 3, 2]) raised KeyError
  try 2: v1: middle, unsorted  -> median([3, 1, 2]) gave 1, want 2
  try 3: v2: middle, sorted    -> median([4, 1, 3, 2]) gave 3, want 2.5
  try 4: v3: handles even      -> all checks pass
  shipped: v3: handles even`, walkthrough: [{ lines: [2, 3], note: "Two sets of cases. The visible ones are all the agent is shown; the hidden ones include a list of even length." }, { lines: [5, 14], note: "The verifier. It returns pass or fail plus feedback that names the first failing case, including crashes." }, { lines: [20, 25], note: "Four attempts a model might write, starting with a cheat that just looks up the visible inputs." }, { lines: [27, 38], note: "The loop stops at the first attempt the verifier accepts. We run it with a weak definition of done, then a stronger one." }] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: ["Move `([4, 1, 3, 2], 2.5)` from `hidden` to `visible`. Predict what the first loop ships now.", "Remove the cheat from `attempts`. Predict what the visible-only loop ships, and whether that function is a correct median.", "Add the case `([], None)` to `hidden`. Predict the feedback for `v3`. Is the function wrong, or is the definition of done unclear?"] },
        { type: "check", question: "The cheat passed the visible-only check on its first try, and the verifier had no bug. What exactly was weak?", answer: "The definition of done. It said “these two inputs give these two outputs”, and a lookup table meets that statement perfectly. The check verified what it was asked to verify; it was just too easy to satisfy without solving the task. Hidden cases, varied inputs and a look at the code are what close the gap between passing the check and meeting the goal." },
        { type: "check", question: "The verifier returns feedback such as “median([4, 1, 3, 2]) gave 3, want 2.5” and not just “fail”. Why does that matter for a real model in the loop?", answer: "Because the next attempt can only be as good as what the model knows about the failure. A bare “fail” invites a random rewrite. The exact input, the wrong output and the expected output point straight at the even-length case, so the retry can target it. A definition of done that explains its failures makes every retry better informed." }
      ]
    },
    {
      id: "when-it-is-hard",
      title: "Limits: when done cannot be defined",
      blocks: [
        { type: "p", text: "Some goals resist definition: taste, strategy, novelty, “is this the right product to build?”. For these, AI is best used as a generator of options and a critic, with a human making the final call. Forcing a fake exact check onto a taste-based task (for example “done = Flesch reading score above 60”) can push the AI toward something that scores well and reads badly." },
        { type: "p", text: "The honest summary: AI is only as good as our definition of done. When we can write a precise one, AI can grind toward it tirelessly. When we cannot, our own judgement remains the bottleneck, and the most useful thing we can do is make that judgement as explicit as possible." }
      ]
    }
  ],
  quiz: [
    { q: "What is a definition of done?", options: ["The deadline by which a task has to be delivered to the customer", "Clear conditions that must hold for work to count as finished", "The final status message that an agent prints when it stops", "The number of steps an agent is allowed to take on a task"], answer: 1, explain: "It is the line between finished and not finished. Deadlines and step budgets are different limits." },
    { q: "Our agent writes a CSV export and keeps shipping files with missing columns, even though it says “Export complete”. What is the best fix?", options: ["Use a larger model that is less likely to forget columns", "Ask it in the prompt to be more careful about columns", "Lower the temperature to 0 so the output is consistent", "Add a validation script it must run and pass to finish"], answer: 3, explain: "Turning done into an executable check lets the loop retry until the export is actually correct. Prompt tweaks and model size do not create a check." },
    { q: "In the lesson's code, why does the loop with the vague definition ship attempt 1?", options: ["Attempt 1 passes all three of the exact input → output tests", "It returns lowercase text, so the vague check passes first", "The vague check crashes on attempt 1 and the loop gives up", "Attempt 1 is the fastest of the three to run on every input"], answer: 1, explain: "All three attempts pass the vague check; the loop stops at the first one that passes, which is the weakest. Attempt 1 passes only 1 of 3 exact tests." },
    { q: "Compared with an exact verifier, what is the main weakness of a rubric scored by an LLM judge?", options: ["It cannot be used for writing tasks of any kind", "It is always slower and costlier than a human", "Its scores are noisier and can be biased", "It only works on code that compiles"], answer: 2, explain: "Rubrics bring structure to fuzzy tasks, but judges are noisy and biased compared with a program checking tests or schemas." },
    { q: "Which belief is a misconception?", options: ["With automatic tests as our DoD, the result is guaranteed to be what we wanted", "Concrete input → output examples are a cheap and useful kind of verifier", "AI tends to improve fastest on tasks that can be checked automatically", "Most real tasks mix parts that are exact with parts that are fuzzy"], answer: 0, explain: "Checks only cover what they test, and agents can game weak checks (for example special-casing test inputs). We still need good coverage, protected tests and review." }
  ],
  takeaways: [
    "A definition of done is the checkable line between finished and unfinished work.",
    "With a reliable verifier, AI can try, check and retry until the result is verified.",
    "AI is strongest where success is cheap to verify, both at run time and in training.",
    "Turn fuzzy goals into concrete examples, executable checks and a rubric for the rest.",
    "Weak checks get gamed; protect tests, add edge cases and still review the work."
  ],
  terms: [
    { term: "Definition of done", def: "The explicit conditions a piece of work must meet to count as finished." },
    { term: "Verifier", def: "A procedure, usually a program, that checks an output and returns pass, fail or a score without a human." },
    { term: "Rubric", def: "A written list of specific criteria used by a human or LLM judge to score fuzzy outputs." },
    { term: "Verifiable reward", def: "A training signal computed automatically by checking an answer, such as running tests or comparing to a known result." },
    { term: "Goodhart's law", def: "When a measure becomes a target, it tends to stop being a good measure, because it gets optimised directly." }
  ]
};
