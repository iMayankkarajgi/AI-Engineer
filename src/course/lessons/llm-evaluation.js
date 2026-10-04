export default {
  id: "llm-evaluation",
  minutes: 25,
  hook: "How do we know a new prompt or a new model is actually better, and not just better on the three examples we happened to try?",
  summary: "LLM evaluation is the practice of measuring how well a language model or LLM application performs, using test sets, metrics, benchmarks, human reviewers and other models as judges. Because LLM outputs are open-ended and non-deterministic, no single number is enough. We combine cheap automatic checks, task-specific tests, human judgment and safety testing, and we treat our own evaluation set as a core asset.",
  sections: [
    {
      id: "what-and-why",
      title: "What is LLM evaluation, and why do we need it?",
      blocks: [
        { type: "p", text: "**LLM evaluation** means systematically measuring the quality of a large language model's outputs: are they correct, relevant, safe, well formatted, fast and affordable enough for our purpose? We can evaluate a raw model (“Is model A better at math than model B?”) or a whole application (“Does our support bot answer refund questions correctly?”)." },
        { type: "p", text: "Traditional software is tested with exact assertions: `add(2, 3) == 5`. LLMs are harder to test because:" },
        { type: "list", items: [
          "**Outputs are open-ended.** “The capital is Paris.” and “Paris” are both correct, but are not equal strings.",
          "**Outputs are non-deterministic.** With sampling, the same prompt can produce different answers.",
          "**Small changes have big effects.** A reworded prompt or a model upgrade can fix ten cases and silently break five others (a **regression**).",
          "**Quality has many dimensions.** Correctness, helpfulness, tone, safety, latency and cost can pull in different directions."
        ] },
        { type: "callout", tone: "analogy", title: "Think of it like a driving test", text: "We do not license a driver because they drove well around one block. A driving test covers many situations (parking, highways, a pedestrian stepping out), uses a written rule sheet (a rubric), and has an examiner. LLM evaluation is the same: many representative cases, clear criteria and a trustworthy grader." },
        { type: "p", text: "Without evaluation we are guessing. With it we can choose models, compare prompts, catch regressions before users do, and prove that a system is safe enough to launch. Our running example is Acme's support bot, which answers product and warranty questions." }
      ]
    },
    {
      id: "types",
      title: "Types of LLM evaluation",
      blocks: [
        { type: "table", caption: "Four ways to slice evaluation", head: ["Dimension", "Option A", "Option B"], rows: [
          ["When", "**Offline**: on a fixed test set before release", "**Online**: on live traffic after release (user feedback, A/B tests)"],
          ["Ground truth", "**Reference-based**: compare to a known correct answer", "**Reference-free**: judge the output on its own (is it faithful to the sources? polite?)"],
          ["Grader", "**Automatic**: code or metrics", "**Human** or **model-based** (LLM as a judge)"],
          ["Scope", "**General capability**: public benchmarks", "**Task-specific**: our own data and success criteria"]
        ] },
        { type: "p", text: "A mature setup uses several of these at once: an offline task-specific test set with automatic checks on every change, LLM-judge scoring for open-ended quality, periodic human review, and online monitoring after launch." },
        { type: "steps", title: "How an evaluation run works, step by step", items: [
          { title: "Define success", text: "Write down what a good answer must do. For the support bot: states the correct policy, cites the right document, stays under 120 words, never promises a refund that the policy does not allow." },
          { title: "Build the test set", text: "Collect representative inputs, including hard and edge cases (vague questions, wrong product names, angry customers), with reference answers or criteria." },
          { title: "Run the system", text: "Send every test input through the exact system we want to measure: same prompt, model, retrieval and settings. Save every output." },
          { title: "Score the outputs", text: "Apply graders: code checks for format, metrics for short answers, an LLM judge or humans for open-ended quality." },
          { title: "Aggregate and compare", text: "Compute averages and per-category scores, with uncertainty, and compare against the previous version." },
          { title: "Read the failures", text: "Look at the actual failing outputs. Numbers say *how much* is wrong; examples say *why*, and tell us what to fix next." }
        ] }
      ]
    },
    {
      id: "automatic-metrics",
      title: "Automatic metrics",
      blocks: [
        { type: "p", text: "Automatic metrics are formulas computed by code. They are fast, cheap and repeatable, which makes them ideal for running on every change." },
        { type: "table", head: ["Metric", "What it measures", "Good for", "Weakness"], rows: [
          ["Exact match (EM)", "Output equals the reference after normalizing case and punctuation", "Short factual answers, labels", "Marks correct paraphrases as wrong"],
          ["Token F1", "Word overlap between output and reference (precision and recall of words)", "Short QA answers", "Rewards shared words, not meaning"],
          ["BLEU", "N-gram precision against references, with a brevity penalty", "Machine translation", "Weak correlation with quality for open-ended text"],
          ["ROUGE", "N-gram and longest-common-subsequence recall against references", "Summarization", "Same surface-overlap problem"],
          ["BERTScore", "Similarity of contextual embeddings between output and reference", "Paraphrase-tolerant comparison", "Needs a model; scores hard to interpret"],
          ["Perplexity", "How surprised a model is by real text (lower is better)", "Comparing language models during training", "Says little about usefulness of answers"],
          ["pass@k", "Probability that at least one of k generated programs passes unit tests", "Code generation", "Needs runnable tests"]
        ] },
        { type: "formula", expr: "F1 = 2 · P · R / (P + R),  P = shared words / output words,  R = shared words / reference words", where: [["P", "precision: how much of the output is in the reference"], ["R", "recall: how much of the reference is in the output"]], caption: "Token F1, as used in SQuAD-style question answering." },
        { type: "check", question: "Pause and predict: the reference is “Paris” and the model answers “The capital is Paris.” What are exact match and token F1?", answer: "EM = 0, because the strings differ. F1: 1 shared word; precision = 1/4, recall = 1/1, so F1 = 2 · 0.25 · 1 / 1.25 = 0.40. The answer is correct, yet both metrics penalize it, which is why surface metrics must be used with care." }
      ]
    },
    {
      id: "benchmarks",
      title: "Benchmarks",
      blocks: [
        { type: "p", text: "A **benchmark** is a public, standardized test set with a fixed scoring method, so different models can be compared on equal terms. Benchmarks measure general capabilities such as knowledge, reasoning, coding or conversation quality." },
        { type: "timeline", title: "Some influential benchmarks", items: [
          { when: "2018–19", title: "GLUE and SuperGLUE", text: "Suites of language-understanding tasks (sentiment, entailment, and more) used for BERT-era models." },
          { when: "2020", title: "MMLU", text: "Multiple-choice questions across 57 subjects, from math to law, measuring broad knowledge." },
          { when: "2021", title: "HumanEval and GSM8K", text: "HumanEval checks Python functions with unit tests (pass@k); GSM8K tests grade-school math word problems." },
          { when: "2022", title: "HELM and BIG-bench", text: "Broad evaluation suites covering many tasks and metrics beyond accuracy." },
          { when: "2023", title: "MT-Bench, Chatbot Arena, SWE-bench, GPQA", text: "Multi-turn chat judged by a strong LLM; crowd-sourced head-to-head votes ranked with an Elo-style rating; real GitHub issues to fix; hard expert-written science questions." },
          { when: "2024–25", title: "Harder successors", text: "Benchmarks such as MMLU-Pro and Humanity's Last Exam appeared as older ones saturated, alongside agent benchmarks." }
        ] },
        { type: "p", text: "Benchmarks are useful for shortlisting models, but they do not tell us how a model will do on *our* task. A model that tops a math leaderboard may still answer our warranty questions badly." }
      ]
    },
    {
      id: "human-and-judge",
      title: "Human evaluation and LLM as a judge",
      blocks: [
        { type: "p", text: "**Human evaluation** asks people to rate outputs. Common formats: a **rating scale** (1–5 for helpfulness), a **pairwise comparison** (“Which of these two answers is better?”), or a **rubric** checklist (“Cites a source? Correct policy? Polite?”). Humans catch subtle problems no metric sees, and they are the ground truth for what users want." },
        { type: "p", text: "Human evaluation is also slow, expensive and noisy: two reviewers often disagree. We measure that with **inter-annotator agreement** (for example Cohen's kappa) and improve it with clear guidelines and examples." },
        { type: "p", text: "**LLM as a judge** uses a strong language model, given a rubric, to grade outputs. It is much cheaper and faster than people and handles open-ended answers that string metrics cannot, but it has its own biases (for example favouring longer answers or the first answer shown). We cover it in depth in the next lesson. The usual practice is to check the judge against a sample of human labels before trusting it." }
      ]
    },
    {
      id: "task-specific",
      title: "Task-specific evaluation",
      blocks: [
        { type: "p", text: "The most valuable evaluation is usually a **custom test set** built from our own use case: 50 to a few hundred real or realistic inputs, each with the expected answer or the criteria a good answer must meet. Each task type has its natural checks:" },
        { type: "list", items: [
          "**Classification** (route a ticket, detect intent): accuracy, precision, recall and F1 per class.",
          "**Extraction** (pull fields into JSON): schema validity and per-field accuracy.",
          "**RAG** (answer from documents): did retrieval find the right document (context recall)? Is the answer supported by the retrieved text (**faithfulness** or groundedness)? Does it answer the question (answer relevance)?",
          "**Summarization**: coverage of key points, factual consistency with the source, length.",
          "**Code**: does it compile, and does it pass unit tests?",
          "**Chat assistants**: rubric-based judging of correctness, helpfulness and tone."
        ] },
        { type: "viz", name: "precision-recall", caption: "For classification-style tasks (for example “is this ticket a refund request?”), move the threshold and watch precision, recall and F1 trade off." }
      ]
    },
    {
      id: "safety",
      title: "Safety and red-teaming evaluation",
      blocks: [
        { type: "p", text: "Quality is not enough; we also measure whether the system can be made to do harm. **Safety evaluation** tests for harmful content, privacy leaks, bias, and policy violations. **Red-teaming** means people (or automated attackers, often other LLMs) deliberately try to break the system: jailbreak prompts, prompt injection through documents, attempts to extract the system prompt or private data." },
        { type: "list", items: [
          "**Attack success rate**: the share of adversarial prompts that produce a policy-violating output (lower is better).",
          "**Refusal rate on harmful requests** (should be high) and **over-refusal rate on harmless requests** (should be low: a bot that refuses “How do I kill a Python process?” is broken in a different way).",
          "**Groundedness / hallucination rate**: how often answers contain claims not supported by the sources."
        ] }
      ]
    },
    {
      id: "code",
      title: "Code you can run: metrics and a confidence interval",
      blocks: [
        { type: "p", text: "This script computes exact match and token F1 for five answers, then estimates how uncertain an accuracy measured on 200 test items is, using the **bootstrap**: resample the results with replacement many times and look at the spread of the accuracies." },
        { type: "code", lang: "python", title: "eval_metrics.py", code: `import numpy as np
from collections import Counter

def norm(s):
    return s.lower().strip(" .").split()

def exact_match(pred, ref):
    return float(norm(pred) == norm(ref))

def token_f1(pred, ref):
    # Word-overlap F1, as used in SQuAD-style QA scoring
    p, r = norm(pred), norm(ref)
    common = sum((Counter(p) & Counter(r)).values())
    if common == 0:
        return 0.0
    prec, rec = common / len(p), common / len(r)
    return 2 * prec * rec / (prec + rec)

data = [  # (model answer, reference answer)
    ("Paris", "Paris"),
    ("The capital is Paris.", "Paris"),
    ("Lyon", "Paris"),
    ("Two years of parts warranty", "2 years"),
    ("2 years", "2 years"),
]
for pred, ref in data:
    print(f"EM={exact_match(pred, ref):.0f}  F1={token_f1(pred, ref):.2f}  | {pred!r} vs {ref!r}")

# Bootstrap: how sure are we about an accuracy measured on 200 test items?
rng = np.random.default_rng(0)
correct = rng.random(200) < 0.78                 # pretend graded results
boots = [rng.choice(correct, 200).mean() for _ in range(2000)]
lo, hi = np.percentile(boots, [2.5, 97.5])
print(f"accuracy={correct.mean():.3f}  95% CI=[{lo:.3f}, {hi:.3f}]")`, output: `EM=1  F1=1.00  | 'Paris' vs 'Paris'
EM=0  F1=0.40  | 'The capital is Paris.' vs 'Paris'
EM=0  F1=0.00  | 'Lyon' vs 'Paris'
EM=0  F1=0.29  | 'Two years of parts warranty' vs '2 years'
EM=1  F1=1.00  | '2 years' vs '2 years'
accuracy=0.710  95% CI=[0.645, 0.775]`,
          walkthrough: [
            { lines: [4, 8], note: "Normalize (lowercase, strip trailing punctuation, split into words) and compare for exact match." },
            { lines: [10, 17], note: "Token F1: count shared words with a multiset intersection, then combine precision and recall." },
            { lines: [19, 27], note: "Five (answer, reference) pairs. Note the correct-but-wordy answers that EM marks wrong." },
            { lines: [29, 34], note: "Bootstrap: resample the 200 graded results 2,000 times; the 2.5th and 97.5th percentiles give a 95% confidence interval." }
          ] },
        { type: "chart", kind: "bar", title: "Exact match vs token F1 on the five answers", yLabel: "Score", labels: ["Paris", "The capital is Paris.", "Lyon", "Two years of parts warranty", "2 years"], series: [ { name: "EM", values: [1, 0, 0, 0, 1] }, { name: "Token F1", values: [1, 0.4, 0, 0.29, 1] } ], caption: "From the code output. Two correct answers get low scores because they use different words than the reference; surface metrics measure overlap, not truth." },
        { type: "check", question: "The output says accuracy 0.710 with a 95% interval of about [0.645, 0.775]. A new prompt scores 0.73 on the same 200 items. Is it clearly better?", answer: "No. 0.73 sits well inside the uncertainty range of the old score. With 200 items, differences of a few points can be noise. We would need a larger test set, or a paired comparison on the same items, before claiming an improvement." }
      ]
    },
    {
      id: "challenges-best-practices",
      title: "Challenges, best practices and when to use which method",
      blocks: [
        { type: "callout", tone: "warn", title: "Challenges", text: "**Data contamination**: benchmark questions leak into training data, inflating scores. **Saturation**: top models all score near the maximum, so the benchmark stops separating them. **Prompt sensitivity**: small wording or formatting changes move scores by several points. **Non-determinism**: one run is a sample, not a fact. **Metric mismatch**: overlap metrics reward wording, not correctness. **Goodhart's law**: once a metric becomes a target, teams optimize it instead of real quality." },
        { type: "list", items: [
          "**Build a golden test set from real usage** and keep growing it: every production bug becomes a new test case.",
          "**Define success criteria before testing**: what exactly makes an answer acceptable?",
          "**Run evaluations on every change** to prompts, models, retrieval or tools, like unit tests in CI.",
          "**Use several methods**: code checks for format, metrics or judges for content, humans for calibration.",
          "**Report uncertainty**: test-set size, confidence intervals, multiple runs.",
          "**Track cost and latency** next to quality; a 1% gain that doubles cost may not be worth it.",
          "**Keep evaluating after launch**: monitor live outputs and user feedback."
        ] },
        { type: "compare", title: "Which evaluation method when?",
          options: [
            { name: "Automatic metrics & code checks", summary: "Formulas and assertions computed by code.", pros: ["Instant and free", "Perfectly repeatable", "Great for CI"], cons: ["Shallow for open-ended text", "Need references or rules"], bestFor: "Formats, labels, short answers, code with tests" },
            { name: "LLM as a judge", summary: "A strong model grades outputs with a rubric.", pros: ["Handles open-ended answers", "Cheap at scale"], cons: ["Has biases", "Must be validated against humans"], bestFor: "Helpfulness, faithfulness, tone at scale" },
            { name: "Human evaluation", summary: "People rate or compare outputs.", pros: ["Closest to real user judgment", "Catches subtle issues"], cons: ["Slow and expensive", "Reviewers disagree"], bestFor: "Calibration, high-stakes launches, building gold labels" },
            { name: "Benchmarks", summary: "Public standardized test sets.", pros: ["Comparable across models", "No data to build"], cons: ["May not reflect our task", "Contamination and saturation"], bestFor: "Shortlisting models" }
          ],
          verdict: "Shortlist with benchmarks, gate every change with automatic checks on our own test set, scale open-ended grading with a validated LLM judge, and anchor everything with periodic human review." }
      ]
    },
    {
      id: 'one-level-deeper',
      title: 'Going one level deeper',
      blocks: [
        { type: 'p', text: 'A question every team meets sooner or later: **how many test items do we need?** There is a formula that answers it well enough to plan with. If the true accuracy is `p` and we test on `n` items, the measured accuracy wobbles by about one **standard error**, `SE = √(p · (1 − p) / n)`. A 95% interval is roughly `± 2 · SE`.' },
        { type: 'steps', title: 'Sizing a test set for our support bot', items: [
          { title: 'Start with 50 items', text: 'Say accuracy is around 0.70. `SE = √(0.7 × 0.3 / 50) ≈ 0.065`. The interval is about **±13 points**. A score of 70% could really be anywhere from 57% to 83%.' },
          { title: 'Grow to 200 items', text: '`SE = √(0.21 / 200) ≈ 0.032`, so about **±6 points**. This matches the bootstrap interval we computed earlier, [0.645, 0.775].' },
          { title: 'Notice the square root', text: 'Four times the data only halved the interval. To halve it again, to ±3 points, we need about 800 items.' },
          { title: 'Ask what change we need to see', text: 'If prompt edits usually move accuracy by 2 to 3 points, a 200-item set cannot confirm them with separate measurements. We either need a much larger set, or a smarter comparison.' },
          { title: 'The smarter comparison', text: 'Run both versions on the **same items** and look only at the items where they differ. Most of the noise comes from item difficulty, which is shared, so it cancels. The practice below shows this.' },
        ] },
        { type: 'chart', kind: 'line', title: 'Width of the 95% interval vs test-set size (accuracy 0.70)', xLabel: 'Test items', yLabel: '± percentage points',
          series: [ { name: '± margin', points: [[50, 12.7], [100, 9.0], [200, 6.4], [400, 4.5], [800, 3.2], [1600, 2.2]] } ],
          caption: 'Computed from 1.96 · √(0.7 · 0.3 / n). The curve flattens: each extra item helps less than the one before.' },
        { type: 'p', text: 'One more trap hides here. If we try twenty prompt variants on the same 200 items and keep the best, the winner’s score is flattering: with that many tries, one will look good by luck alone. This is **overfitting to the test set**. The usual defence is two sets: a *development* set we look at freely while iterating, and a *held-out* set we run only on the final candidates.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will compare two prompts, A and B, on the same 200 simulated test items, and compute the uncertainty of “B minus A” in two ways: as if the two prompts were tested on separate item sets (unpaired), and using the fact that they share items (paired).' },
        { type: 'code', lang: 'python', title: 'practice_paired_eval.py', code: `import numpy as np
rng = np.random.default_rng(7)

n = 200                                   # test items, the same for both prompts
difficulty = rng.random(n)                # hidden: how hard each item is
# 1 = correct, 0 = wrong. Prompt A fails more often on hard items.
a = (rng.random(n) > difficulty * 0.60).astype(int)
# Prompt B fixes some of A's failures and breaks a few of A's successes.
flip = rng.random(n)
b = np.where(a == 0, (flip < 0.25).astype(int), (flip > 0.03).astype(int))

print(f"accuracy A = {a.mean():.3f}   accuracy B = {b.mean():.3f}")
print("B right, A wrong:", int(((b == 1) & (a == 0)).sum()),
      "| A right, B wrong:", int(((a == 1) & (b == 0)).sum()))

def interval(values):
    lo, hi = np.percentile(values, [2.5, 97.5])
    return f"[{lo:+.3f}, {hi:+.3f}]"

unpaired, paired = [], []
for _ in range(2000):
    i = rng.integers(0, n, n)             # resample items for A
    j = rng.integers(0, n, n)             # a different resample for B
    unpaired.append(b[j].mean() - a[i].mean())   # as if on different test sets
    paired.append((b[i] - a[i]).mean())          # same items for both prompts

print("95% interval for B - A, unpaired:", interval(unpaired))
print("95% interval for B - A, paired:  ", interval(paired))`, output: `accuracy A = 0.700   accuracy B = 0.750
B right, A wrong: 13 | A right, B wrong: 3
95% interval for B - A, unpaired: [-0.035, +0.135]
95% interval for B - A, paired:   [+0.015, +0.090]`,
          walkthrough: [
            { lines: [4, 10], note: 'Simulate per-item results. A fails more on hard items. B copies A, fixes about a quarter of A’s failures and breaks about 3% of A’s successes.' },
            { lines: [12, 14], note: 'The headline accuracies, and the only items that matter for the comparison: those where A and B differ.' },
            { lines: [20, 25], note: 'Bootstrap 2,000 times. Unpaired resamples items separately for A and B. Paired resamples items once and compares A and B on the same ones.' },
            { lines: [27, 28], note: 'The two 95% intervals for the difference.' },
          ] },
        { type: 'p', text: 'Same data, two conclusions. The unpaired interval includes 0, so we could not claim B is better. The paired interval is entirely above 0. The paired view is the right one here, because both prompts really did see the same items.' },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Shrink the test set: set `n = 50` on line 4. Predict: will the paired interval still exclude 0?',
          'Make B break more: on line 10 change `flip > 0.03` to `flip > 0.10`. Predict the two accuracies and the “B right, A wrong / A right, B wrong” counts. Would the headline numbers alone reveal what changed?',
          'Make B’s gain smaller: on line 10 change `flip < 0.25` to `flip < 0.10`. Predict whether 200 items are still enough to see it in the paired interval.',
        ] },
        { type: 'check', question: 'Only 16 of the 200 items differ between A and B (13 fixed, 3 broken). Why is the paired interval so much narrower than the unpaired one?', answer: 'On the other 184 items A and B give the same result, so those items add nothing to the difference. In the unpaired view, the luck of drawing easier or harder items shifts A and B independently, and that noise lands in the difference. Pairing removes it. All that remains is the uncertainty in the 16 items that changed.' },
        { type: 'check', question: 'B is better overall, but it broke 3 items that A got right. What should we do before shipping B?', answer: 'Read those 3 items. An average hides *which* cases moved. If the 3 are, say, refund-policy questions, B may have a real regression in an area that matters more than the 13 it fixed. If they look unrelated, they may just be sampling noise, and re-running those items a few times will show it. Reading failures is part of the evaluation, not an optional extra.' },
      ],
    },
  ],
  quiz: [
    { q: "Why is evaluating an LLM application harder than testing ordinary code?", options: ["LLMs cannot be called from automated test scripts or CI", "Outputs are open-ended and vary, so exact asserts often fail", "LLM outputs never change, so tests cannot reveal anything", "Only trained human raters are allowed to evaluate LLMs"], answer: 1, explain: "Correct answers can be phrased many ways and sampling makes outputs vary. That is why we need metrics, rubrics and judges rather than only string equality." },
    { q: "A new model scores higher on MMLU than our current one. Our support bot is about warranty questions. What should we do before switching?", options: ["Switch right away, because MMLU already covers all knowledge", "Run an even bigger public benchmark to confirm the result", "Compare both on our own set of real warranty questions", "Ask the new model directly whether it is the better one"], answer: 2, explain: "General benchmarks help shortlist models but do not predict performance on our specific task. Our own test set measures what matters for our users." },
    { q: "Reference: “Paris”. Output: “The capital is Paris.” Using the lesson's token F1, what is the score?", options: ["0.40", "1.00", "0.25", "0.00"], answer: 0, explain: "1 shared word. Precision = 1/4, recall = 1/1, F1 = 2·0.25·1/(0.25+1) = 0.40. Exact match would be 0." },
    { q: "Compared with human evaluation, what is the main trade-off of LLM-as-a-judge?", options: ["It is slower than people but completely free of any bias", "Cheaper and faster at scale, but biased; check it on human labels", "It only works when every test case has an exact-match reference", "It can grade code outputs but cannot grade any written answers"], answer: 1, explain: "Judges scale cheaply and handle open-ended outputs, but show biases such as preferring longer or first-shown answers. Validating against human labels is standard practice." },
    { q: "Which statement is a misconception about benchmarks?", options: ["A high benchmark score guarantees success in our app", "Benchmark questions can leak into a model's training data", "Benchmarks saturate when top models all score near the max", "Benchmarks let different models be compared on equal terms"], answer: 0, explain: "Benchmarks measure general capability on their own test set. Contamination, prompt sensitivity and task mismatch mean a high score does not guarantee success on our use case." }
  ],
  takeaways: [
    "LLM evaluation measures correctness, relevance, safety, format, cost and latency, not one number.",
    "Combine automatic metrics, task-specific tests, LLM judges, human review and red-teaming.",
    "Surface metrics like EM, F1, BLEU and ROUGE measure word overlap, not meaning.",
    "Benchmarks shortlist models; our own golden test set decides.",
    "Report uncertainty, beware contamination and saturation, and evaluate on every change."
  ],
  terms: [
    { term: "LLM evaluation", def: "Systematically measuring how well an LLM or LLM application performs on defined criteria." },
    { term: "Exact match (EM)", def: "A metric that scores 1 only if the normalized output equals the reference." },
    { term: "Token F1", def: "Harmonic mean of word-level precision and recall between output and reference." },
    { term: "Benchmark", def: "A public standardized test set with fixed scoring used to compare models." },
    { term: "Golden test set", def: "A curated set of inputs with expected answers or criteria for our own task." },
    { term: "Data contamination", def: "When test questions appear in a model's training data, inflating its scores." },
    { term: "Red-teaming", def: "Deliberately attacking a system to find unsafe or unwanted behaviour." }
  ]
};
