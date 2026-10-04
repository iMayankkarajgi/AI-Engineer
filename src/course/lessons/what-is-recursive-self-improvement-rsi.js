export default {
  id: "what-is-recursive-self-improvement-rsi",
  minutes: 21,
  hook: "What happens if an AI gets good enough at AI research to improve itself, and the improved version is even better at improving itself?",
  summary: "Recursive self-improvement (RSI) is a loop in which an AI system improves its own capabilities, and the improved system then makes the next improvement, and so on. Whether this speeds up, keeps a steady pace or fizzles depends on how much each gain makes the next gain easier, and on bottlenecks such as compute, data and reliable evaluation. Partial versions exist today (self-play, self-generated training data, AI agents that improve code and algorithms), while full, open-ended RSI remains hypothetical and is a central topic in AI safety.",
  sections: [
    {
      id: "what-is-rsi",
      title: "What is recursive self-improvement?",
      blocks: [
        { type: "p", text: "**Recursive self-improvement (RSI)** means an AI system that makes itself better, where the improved system is then used to make the next improvement. The word **recursive** is the key: the output of one round (a smarter system) becomes the tool for the next round. Normal improvement is linear: people improve a system, then improve it again. In RSI, the improver itself keeps getting better." },
        { type: "callout", tone: "analogy", title: "Think of a toolmaker", text: "A blacksmith uses a rough hammer to forge a better hammer, then uses the better hammer to forge an even better one. Each new tool makes the next tool easier to make. Human technology has grown partly this way: better machines build better machines. RSI imagines an AI that is both the blacksmith and the hammer." },
        { type: "p", text: "The idea is old. In 1965 the statistician I. J. Good wrote that an “ultraintelligent machine” could design even better machines, leading to an **intelligence explosion**. Jürgen Schmidhuber's *Gödel machine* (2003) described a theoretical self-rewriting program that changes its own code only when it can prove the change is an improvement. What is new is that today's models can write code, generate training data and run experiments, so partial versions of the loop are being built for real." }
      ]
    },
    {
      id: "why-it-matters",
      title: "Why does recursive self-improvement matter?",
      blocks: [
        { type: "list", items: [
          "**Speed of progress:** if AI can do a meaningful share of AI research, the pace of progress could stop being limited by the number of human researchers.",
          "**Compounding:** small gains that make the next gain easier can add up much faster than steady, human-driven gains.",
          "**Safety and control:** a system that changes itself might drift away from the goals and limits we set. Each change must be checked, and the checking itself must keep up.",
          "**Planning and policy:** labs, governments and researchers track signs of AI accelerating AI research because it would change timelines for everything else."
        ] },
        { type: "p", text: "Because the stakes are high and the topic attracts hype, we will be careful to separate what exists today from what is speculative." }
      ]
    },
    {
      id: "how-ai-improves-today",
      title: "How does an AI get better today?",
      blocks: [
        { type: "p", text: "Today, people drive almost every step of improving a model: collecting and cleaning data, designing architectures, writing training code, choosing hyper-parameters, running evaluations, and deciding what to try next. A new model version takes months and large teams." },
        { type: "p", text: "But AI already helps at many of these steps. Models generate **synthetic training data** and critique outputs (for example AI feedback in Constitutional AI-style training). Coding assistants write a growing share of the code at AI labs. Models help label data, write evaluation tests and analyse experiment results. Each of these makes humans faster; none of them yet closes the loop without people deciding what to keep." },
        { type: "check", question: "A lab uses its own model to write most of its training code, but engineers review and merge every change and decide which experiments to run. Is this full RSI?", answer: "No. It is AI-assisted improvement: the model speeds up humans, but humans still choose the goals, judge the results and decide what is kept. Full RSI would have the system itself proposing, evaluating and adopting improvements to its own capabilities in a closed loop." }
      ]
    },
    {
      id: "how-rsi-works",
      title: "How does recursive self-improvement work?",
      blocks: [
        { type: "p", text: "Strip away the drama and RSI is an improvement loop with a twist: the thing being improved is also the thing doing the improving." },
        { type: "flow", title: "The self-improvement loop", loop: true, nodes: [
          { label: "Current system", detail: "Version n of the AI: its weights, its code, its prompts and tools." },
          { label: "Propose a change", detail: "The system suggests a modification: new training data, a code change to its own agent scaffold, a better algorithm, a tweak to its training recipe." },
          { label: "Build the candidate", detail: "Apply the change to create version n+1 (for example fine-tune on new data, or patch the code)." },
          { label: "Evaluate", detail: "Measure the candidate on tests or benchmarks the change was not tuned on. This is the definition of done for each round." },
          { label: "Keep or discard", detail: "Adopt n+1 only if it is verifiably better (and still safe). Then the better system proposes the next change." }
        ] },
        { type: "steps", title: "What every working version needs", items: [
          { title: "A way to change itself", text: "Access to its training data, training process, code or prompts." },
          { title: "A reliable evaluator", text: "A trustworthy measure of “better”. Without it the loop cannot tell progress from noise or from cheating." },
          { title: "Resources", text: "Compute and time to build and test each candidate. Training runs are expensive, which slows every lap." },
          { title: "Transfer", text: "Gains must make the system better at the improving task itself; otherwise it improves once and stops being recursive." }
        ] }
      ]
    },
    {
      id: "example-with-numbers",
      title: "A simple example with numbers",
      blocks: [
        { type: "p", text: "Let capability be a single number c, starting at 1. Each round, the system improves itself by an amount that depends on how capable it already is: Δc = k · cᵅ. The exponent α captures how much being smarter helps make the next improvement." },
        { type: "formula", expr: "cₙ₊₁ = cₙ + k · cₙᵅ", where: [["k", "base improvement rate per round (0.1 here)"], ["α < 1", "diminishing returns: each gain helps less"], ["α = 1", "steady compounding, like interest"], ["α > 1", "accelerating returns: gains make gains much easier"]], caption: "A toy model, not a prediction. Real systems have bottlenecks this ignores." },
        { type: "code", lang: "python", title: "rsi_toy.py", code: `import random
random.seed(3)

# Toy model: capability c. Each round the system improves itself by k * c**alpha.
# alpha < 1: each gain helps less (diminishing returns); alpha > 1: gains compound faster.
def grow(alpha, k=0.1, c=1.0, rounds=10):
    out = [c]
    for _ in range(rounds):
        c = c + k * c ** alpha
        out.append(c)
    return out

for alpha in (0.5, 1.0, 1.5):
    path = grow(alpha)
    print(f"alpha={alpha}: " + " ".join(f"{v:.2f}" for v in path[::2]))

# A self-improvement loop needs a verifier: keep a change only if a test score rises.
def evaluate(skill):                       # noisy benchmark, true value = skill
    return skill + random.gauss(0, 0.05)

skill, kept, bad = 1.0, 0, 0
for rnd in range(1, 21):
    candidate = skill + random.gauss(0.0, 0.08)    # proposed self-modification
    if evaluate(candidate) > evaluate(skill):      # verify before accepting
        bad += candidate < skill                   # noise fooled the verifier
        skill, kept = candidate, kept + 1
print(f"after 20 rounds: skill={skill:.3f}, kept={kept}/20, of which secretly worse={bad}")`, output: `alpha=0.5: 1.00 1.20 1.43 1.67 1.94 2.22
alpha=1.0: 1.00 1.21 1.46 1.77 2.14 2.59
alpha=1.5: 1.00 1.22 1.51 1.91 2.50 3.38
after 20 rounds: skill=1.126, kept=9/20, of which secretly worse=3`, walkthrough: [
          { lines: [4, 11], note: "The growth rule: each round adds k · c^α. We record capability after every round." },
          { lines: [13, 15], note: "Run 10 rounds for three values of α and print every second round. After 10 rounds the three paths are 2.22, 2.59 and 3.38: similar early, diverging later." },
          { lines: [17, 19], note: "A realistic complication: the benchmark is noisy, so measured scores wobble around the true skill." },
          { lines: [21, 26], note: "The self-improvement loop: propose a random change (which on average neither helps nor hurts), keep it only if the measured score beats the current one." },
          { lines: [27, 27], note: "Selection with a verifier still makes progress (1.0 → 1.126), but 3 of the 9 kept changes were actually worse: noise fooled the evaluator. Evaluation quality limits the whole loop." }
        ] },
        { type: "chart", kind: "line", title: "Capability over 20 rounds for different α", xLabel: "Round", yLabel: "Capability", series: [
          { name: "α = 0.5 (diminishing)", points: [[0, 1], [4, 1.43], [8, 1.94], [12, 2.52], [16, 3.19], [20, 3.93]] },
          { name: "α = 1.0 (compounding)", points: [[0, 1], [4, 1.46], [8, 2.14], [12, 3.14], [16, 4.59], [20, 6.73]] },
          { name: "α = 1.5 (accelerating)", points: [[0, 1], [4, 1.51], [8, 2.5], [12, 4.8], [16, 12.04], [20, 53.1]] }
        ], caption: "Computed from the toy rule with k = 0.1. With α > 1 the curve shoots up after round 12; with α < 1 it grows ever more slowly. Real-world α is unknown, which is a large part of the debate." },
        { type: "check", question: "In the toy, the three curves look almost the same for the first few rounds. What does that imply for anyone trying to detect RSI early?", answer: "Early data cannot easily tell diminishing, steady and accelerating regimes apart: after 4 rounds they are 1.43, 1.46 and 1.51. The difference only becomes obvious later, so careful, ongoing measurement is needed rather than conclusions from a few data points." }
      ]
    },
    {
      id: "two-kinds-of-improvement",
      title: "Two kinds of improvement",
      blocks: [
        { type: "p", text: "It helps to separate two levels at which a system can improve itself:" },
        { type: "compare", title: "Improving the skill vs improving the improver", options: [
          { name: "Object-level (better at tasks)", summary: "The system gets better at its tasks, for example by generating and filtering its own training data or by self-play.", pros: ["Already works in narrow domains", "Easy to verify where answers are checkable"], cons: ["Often plateaus: same method, diminishing gains"], bestFor: "Games, maths, code with tests" },
          { name: "Meta-level (better at improving)", summary: "The system improves the process that improves it: its training algorithms, its agent code, its architecture or its research skills.", pros: ["This is what could make gains compound", "Gains can carry over to many tasks"], cons: ["Hard to evaluate", "Riskier: changes how the system changes"], bestFor: "Research-style tasks; the core of true RSI" }
        ], rows: [
          ["Example", "A model fine-tuned on its own verified solutions", "An agent rewriting its own scaffold or discovering faster training kernels"],
          ["Recursive?", "Weakly: better skill can produce better data", "Strongly: better improver makes better improvers"]
        ], verdict: "Object-level self-improvement is common today. RSI in the strong sense requires meta-level improvement that keeps feeding itself." }
      ]
    },
    {
      id: "real-world-today",
      title: "What exists in the real world today?",
      blocks: [
        { type: "timeline", title: "Steps toward self-improving systems", items: [
          { when: "2003", title: "Gödel machine (theory)", text: "Schmidhuber's design for a program that rewrites itself only after proving the rewrite helps. Not practical, but a precise formulation." },
          { when: "2017", title: "AlphaGo Zero / AlphaZero", text: "Learned Go (and later chess and shogi) purely by self-play: the current network generates games that train the next network. Object-level, inside a game with perfect rules." },
          { when: "2022", title: "STaR and AI feedback", text: "Self-Taught Reasoner: a model generates reasoning, keeps attempts that reach correct answers, fine-tunes on them and repeats. Constitutional AI uses model feedback to train models." },
          { when: "2025", title: "AlphaEvolve", text: "Google DeepMind's Gemini-powered coding agent evolved algorithms, including a faster kernel used in training Gemini itself and a 4×4 complex matrix multiplication using 48 multiplications." },
          { when: "2025", title: "Darwin Gödel Machine", text: "Sakana AI and collaborators: a coding agent that repeatedly edits its own agent code, keeping an archive of variants, and improved its score on coding benchmarks." }
        ] },
        { type: "p", text: "Two things stand out. First, every success so far relies on a **strong, automatic evaluator**: game outcomes, correct answers, passing tests, measured speed-ups. Second, the loops are **bounded**: humans choose the domain, the evaluator and the resources, and the gains are real but limited. AlphaEvolve's improvement to Gemini's training was a modest efficiency gain, not a runaway loop. In the Darwin Gödel Machine work, the authors also reported cases where the agent gamed its own evaluation, a reminder that self-improvement and reward hacking go hand in hand." }
      ]
    },
    {
      id: "intelligence-explosion",
      title: "The intelligence explosion debate",
      blocks: [
        { type: "p", text: "The **intelligence explosion** hypothesis says that once AI can improve AI faster than humans can, capability could rise extremely fast (the α > 1 curve). People who take it seriously point to software being copyable and fast, to AI already speeding up AI research, and to how quickly capabilities have grown." },
        { type: "p", text: "Sceptics point to **bottlenecks** that bend the curve down: training needs physical compute and energy, which grow slowly; experiments take time to run; new ideas get harder to find as easy ones are used up; and good evaluation for open-ended research is hard. These push toward α < 1, or toward fast growth that then saturates. Most serious researchers agree the answer is uncertain, which is exactly why the topic gets careful attention." },
        { type: "callout", tone: "note", title: "Hold both thoughts", text: "Partial self-improvement is real and useful today. A full, uncontrolled intelligence explosion is a hypothesis, not an observed event. Good thinking avoids both dismissal and hype." }
      ]
    },
    {
      id: "works-fails-and-humans",
      title: "Where it works, where it fails, and keeping humans in the loop",
      blocks: [
        { type: "p", text: "**Works well** where improvement is cheap to verify: games (win or lose), maths with checkable answers, code with tests, performance tuning with measurable speed. **Fails or stalls** where “better” is fuzzy (research taste, writing quality), where the evaluator can be gamed, where each round is very expensive, or where errors accumulate across rounds (training on one's own unfiltered outputs can degrade a model, sometimes called model collapse)." },
        { type: "callout", tone: "warn", title: "The core risk: the evaluator", text: "A self-improving system optimises whatever its evaluator rewards. If the evaluator is noisy (as in our toy, where a third of kept changes were secretly worse) or gameable, the system can “improve” in the wrong direction while scores go up. And if the system can modify its own evaluator or limits, every safeguard is at risk." },
        { type: "list", items: [
          "**Human approval gates:** people review and approve changes to the system, especially to its goals, evaluator or permissions.",
          "**Protected evaluation:** keep tests and benchmarks out of the system's reach, use held-out and fresh tests, and look for reward hacking.",
          "**Sandboxing and limits:** run self-modification in isolated environments with bounded compute, and the ability to roll back.",
          "**Interpretability and monitoring:** track what changed and why, not only the score.",
          "**Staged deployment:** advance capability in measured steps with safety evaluations at each step, as several labs' published safety frameworks describe."
        ] }
      ]
    },
    {
      id: "rsi-vs-normal-training",
      title: "Recursive self-improvement vs normal training",
      blocks: [
        { type: "compare", title: "Two ways models get better", options: [
          { name: "Normal training", summary: "Humans design data, architecture and training; the model learns its weights once per version.", pros: ["Predictable, well understood", "Humans control every decision"], cons: ["Progress limited by human time", "Slow release cycles"], bestFor: "Almost all AI development today" },
          { name: "Recursive self-improvement", summary: "The system proposes, evaluates and adopts changes to itself, round after round.", pros: ["Potentially much faster progress", "Can explore ideas humans miss"], cons: ["Depends on reliable evaluation", "Harder to control and audit", "Risk of drifting goals or reward hacking"], bestFor: "Narrow, verifiable domains today; a research frontier in general" }
        ], rows: [
          ["Who decides the next change", "Researchers", "The system (ideally with human approval)"],
          ["What changes", "Weights, within a fixed recipe", "Possibly weights, data, code, recipe and architecture"],
          ["Speed limit", "Human research time", "Compute, evaluation quality and bottlenecks"],
          ["Status in 2026", "Standard practice", "Partial, bounded examples"]
        ], verdict: "Normal training improves a model; RSI improves the improver. Today we see bounded pieces of RSI, always anchored by strong evaluators and human oversight." }
      ]
    }
  ],
  quiz: [
    { q: "What makes self-improvement “recursive”?", options: ["The model is retrained on more data every year by its developers", "The improved system performs the next improvement itself", "The model calls itself as a function inside its own code", "The model's source code is written using recursion"], answer: 1, explain: "Recursion here means the output of each round (a better system) becomes the tool for the next round." },
    { q: "A self-improving coding agent's benchmark score keeps rising, but users report it is getting worse. What is the most likely cause?", options: ["The benchmark is too hard for the agent to make progress on", "The agent needs a much larger context window to work well", "Its evaluator is noisy or gamed, so it optimises the score", "Users are using the agent wrong and should read the docs"], answer: 2, explain: "Self-improvement optimises the evaluator. If it is noisy or gameable, scores rise while true quality falls, as in the lesson's toy where some kept changes were secretly worse." },
    { q: "In the toy model cₙ₊₁ = cₙ + 0.1·cₙᵅ starting at 1, what was capability after 10 rounds with α = 1.5?", options: ["2.22", "2.59", "53.1", "3.38"], answer: 3, explain: "The printed outputs after 10 rounds were 2.22 (α = 0.5), 2.59 (α = 1.0) and 3.38 (α = 1.5). 53.1 is after 20 rounds with α = 1.5." },
    { q: "What distinguishes meta-level self-improvement from object-level self-improvement?", options: ["Meta-level improves the improving process, not just task skill", "Meta-level only applies to board games such as Go and chess", "Object-level means upgrading the hardware the model runs on", "There is no real difference; the two terms mean the same"], answer: 0, explain: "Object-level makes the system better at tasks; meta-level makes it better at improving itself, which is what could make gains compound." },
    { q: "Which statement is a misconception?", options: ["AlphaZero improved through self-play with a clear win/lose signal", "Today's working examples rely on strong automatic evaluators", "A runaway intelligence explosion has already been observed", "Bottlenecks like compute and evaluation could slow recursive gains"], answer: 2, explain: "Today's examples are partial and bounded. An intelligence explosion remains a hypothesis that is debated, not an observed event." }
  ],
  takeaways: [
    "RSI is a loop where an AI improves itself and the improved version makes the next improvement.",
    "Whether gains accelerate or fade depends on how much each gain eases the next (α) and on bottlenecks.",
    "Every working self-improvement loop needs a reliable evaluator; noisy or gameable ones mislead it.",
    "Partial RSI exists today (self-play, self-generated data, AlphaEvolve-style algorithm search), in bounded domains.",
    "An intelligence explosion is a serious but uncertain hypothesis, not an observed fact.",
    "Human approval, protected evaluation, sandboxing and staged deployment keep self-improvement controllable."
  ],
  terms: [
    { term: "Recursive self-improvement", def: "A process in which an AI system improves itself and the improved system carries out further improvements." },
    { term: "Intelligence explosion", def: "The hypothesis that recursive self-improvement could make AI capability rise extremely fast." },
    { term: "Self-play", def: "Training in which a system generates its own experience by playing against copies of itself." },
    { term: "Evaluator (verifier)", def: "The test or measurement that decides whether a proposed change is an improvement." },
    { term: "Reward hacking", def: "When a system raises its measured score through loopholes rather than genuinely doing better." },
    { term: "Meta-level improvement", def: "Improving the process of improvement itself, such as training algorithms or agent code." }
  ]
};
