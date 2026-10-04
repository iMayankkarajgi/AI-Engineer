export default {
  id: "llm-as-a-judge",
  minutes: 23,
  hook: "If we need to grade 10,000 chatbot answers by tomorrow, could another LLM do the grading, and could we trust it?",
  summary: "LLM as a judge means using a capable language model, given a clear rubric, to evaluate the outputs of another model or system. It scales open-ended evaluation that string metrics cannot handle and that humans cannot afford to do at volume. Judges come in pointwise, pairwise and reference-guided forms; they work best with explicit criteria and step-by-step reasoning, and they must be checked for biases such as position and length preference and validated against human labels.",
  sections: [
    {
      id: "what-and-why",
      title: "What is LLM as a judge, and why do we need it?",
      blocks: [
        { type: "p", text: "**LLM as a judge** is an evaluation technique where we prompt a large language model to assess the quality of a text, usually the output of another LLM application. The judge receives the input, the output to grade, a **rubric** (the criteria and scale) and sometimes a reference answer, and it returns a score, a label or a preference, ideally with a short justification." },
        { type: "p", text: "Why not just use metrics or people? Our support bot writes free-form answers. **String metrics** such as exact match or ROUGE only count overlapping words, so they punish correct paraphrases and reward fluent wrong answers. **Human reviewers** understand meaning, but grading thousands of answers after every prompt change is slow and expensive. An LLM judge sits in between: it reads for meaning like a person and runs at the speed and price of software." },
        { type: "callout", tone: "analogy", title: "Think of it like a teaching assistant with a marking scheme", text: "A professor cannot grade 800 exams alone, so teaching assistants grade using a detailed marking scheme, and the professor spot-checks a sample to make sure the assistants grade fairly. The LLM judge is the teaching assistant, the rubric is the marking scheme, and our human-labelled sample is the professor's spot-check." },
        { type: "p", text: "The approach was popularized in 2023 by work such as the MT-Bench and Chatbot Arena paper (Zheng et al., *Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena*), which reported that a strong judge model agreed with human preferences about as often as humans agreed with each other on their test, while also documenting the judge's biases." }
      ]
    },
    {
      id: "how-it-works",
      title: "How does LLM as a judge work?",
      blocks: [
        { type: "flow", title: "One judging call", nodes: [
          { label: "Test case", detail: "The user question, plus any context the system used (for RAG, the retrieved documents)." },
          { label: "Candidate output", detail: "The answer produced by the system we are evaluating." },
          { label: "Judge prompt", detail: "Role, rubric with clear criteria and scale, optional reference answer, and an output format." },
          { label: "Judge model", detail: "A capable LLM reasons about the criteria, usually at temperature 0 for consistency." },
          { label: "Verdict", detail: "Structured result such as {\"reasoning\": \"...\", \"score\": 4}, parsed by code and aggregated over the test set." }
        ] },
        { type: "p", text: "The judge is just another LLM call. Everything that makes it reliable lives in the prompt design, the choice of judge model and the validation we do around it." }
      ]
    },
    {
      id: "types",
      title: "Types of LLM as a judge",
      blocks: [
        { type: "compare", title: "Three common judging setups",
          options: [
            { name: "Pointwise (single-output) scoring", summary: "Grade one output on its own, on a scale (1–5) or as pass/fail.", pros: ["Simple; one call per output", "Gives absolute scores we can track over time"], cons: ["Scores drift and cluster (lots of 4s)", "Scale meaning is fuzzy without anchors"], bestFor: "Monitoring quality, pass/fail checks like “Is it grounded?”" },
            { name: "Pairwise comparison", summary: "Show two outputs for the same input and ask which is better (or a tie).", pros: ["Relative judgments are easier and more consistent", "Ideal for A/B testing prompts or models"], cons: ["Position bias", "Number of comparisons grows with candidates"], bestFor: "Choosing between two versions" },
            { name: "Reference-guided", summary: "Give the judge a correct reference answer and ask whether the output matches it in meaning.", pros: ["Most accurate on factual tasks", "Judge need not know the answer itself"], cons: ["Needs a reference for every case"], bestFor: "QA and math with known answers" }
          ],
          rows: [
            ["Judge sees", "One output", "Two outputs", "One output + reference"],
            ["Returns", "Score or pass/fail", "A, B or tie", "Correct / incorrect (or a score)"],
            ["Main risk", "Uncalibrated scale", "Position bias", "Bad references"]
          ],
          verdict: "Use binary or small-scale pointwise checks for monitoring, pairwise for comparing versions, and reference-guided whenever a correct answer exists." },
        { type: "p", text: "Judges can also be **reference-free** (judge faithfulness to retrieved documents without any gold answer) and **multi-criteria** (separate scores for correctness, completeness and tone, each with its own rubric line)." }
      ]
    },
    {
      id: "build-steps",
      title: "Steps to build an LLM judge",
      blocks: [
        { type: "steps", title: "From idea to a trusted judge", items: [
          { title: "Pick one criterion at a time", text: "“Good answer” is too vague. Choose concrete criteria: correctness, groundedness, follows refund policy, polite tone. One judge prompt per criterion is often more reliable than one prompt for everything." },
          { title: "Write a rubric with anchors", text: "Define every score level with an example of what it looks like. Prefer binary pass/fail or a small 1–3 or 1–5 scale over 1–10." },
          { title: "Collect human labels", text: "Have people grade a sample (for example 100–200 outputs) with the same rubric. This is the ground truth for the judge." },
          { title: "Run the judge and measure agreement", text: "Compare judge and human labels: accuracy, Cohen's kappa, a confusion matrix. Read every disagreement." },
          { title: "Iterate", text: "Fix the rubric or examples where the judge disagrees, try a stronger judge model, then re-measure." },
          { title: "Deploy and re-check", text: "Use the judge at scale, and re-validate on fresh human labels from time to time or whenever the judge model changes." }
        ] }
      ]
    },
    {
      id: "template",
      title: "A prompt template for LLM as a judge",
      blocks: [
        { type: "p", text: "A practical pointwise template for our support bot's correctness criterion. Placeholders in curly braces are filled by code." },
        { type: "code", lang: "text", title: "judge_prompt.txt", code: `You are an impartial evaluator of customer-support answers.

Task: grade the ANSWER for CORRECTNESS against the POLICY DOCUMENTS.

Scale:
1 = states something that contradicts the policy, or invents a policy
2 = partly correct but misses or misstates an important condition
3 = fully consistent with the policy and answers the question

Rules:
- Judge only correctness. Ignore length, style and politeness.
- If the policy does not cover the question, an answer that says so scores 3.

<question>{question}</question>
<policy>{retrieved_docs}</policy>
<answer>{answer}</answer>

First write your reasoning in 2-4 sentences, then output JSON:
{"reasoning": "...", "score": 1|2|3}` },
        { type: "list", items: [
          "**Role and task** tell the judge what it is grading and against what.",
          "**Anchored scale**: each score has a concrete description.",
          "**Explicit exclusions** (“ignore length”) fight known biases.",
          "**Delimiters** separate the data from the instructions, which also makes it harder for an answer to manipulate the judge.",
          "**Reasoning before the score** and **JSON output** make verdicts more accurate and easy to parse."
        ] }
      ]
    },
    {
      id: "g-eval",
      title: "Chain-of-thought judging (G-Eval)",
      blocks: [
        { type: "p", text: "Asking the judge to reason before scoring usually improves agreement with humans, for the same reason chain-of-thought helps other tasks: the model works through the criteria instead of jumping to a number. **G-Eval** (Liu et al., 2023) is a well-known recipe built on this idea." },
        { type: "list", ordered: true, items: [
          "Give the judge the task and the criterion (for example “coherence of a summary”).",
          "Let the model generate detailed **evaluation steps** for that criterion (chain of thought), once.",
          "Use those steps in a form-filling prompt to grade each output.",
          "Instead of taking the single score token the model writes, read the **probabilities** it assigns to each possible score and compute a weighted average. This gives finer-grained, less tie-prone scores."
        ] },
        { type: "formula", expr: "score = ∑ᵢ p(sᵢ) · sᵢ", where: [["sᵢ", "a possible score, e.g. 1 to 5"], ["p(sᵢ)", "the judge model's probability of writing that score"]], caption: "Example: p(3) = 0.2, p(4) = 0.7, p(5) = 0.1 gives 0.6 + 2.8 + 0.5 = 3.9 rather than a flat 4." },
        { type: "p", text: "The probability trick needs an API that exposes token log-probabilities; many judge setups simply use “reason first, then score” without it." }
      ]
    },
    {
      id: "biases",
      title: "Biases in LLM as a judge",
      blocks: [
        { type: "table", head: ["Bias", "What happens", "Mitigation"], rows: [
          ["Position bias", "In pairwise mode, the judge favours the answer shown first (or second)", "Judge both orders; count it as a win only if both agree, else a tie"],
          ["Verbosity (length) bias", "Longer, more detailed-looking answers get higher scores even when not better", "Rubric says “ignore length”; compare length-matched answers; check correlation of score with length"],
          ["Self-enhancement bias", "A model may rate outputs from itself or its own family higher", "Use a judge from a different model family, or several judges"],
          ["Leniency and scale compression", "Most scores land on 4 out of 5; small differences vanish", "Binary or 3-point scales with anchors"],
          ["Style over substance", "Confident tone, formatting or citations impress the judge even when facts are wrong", "Reference-guided judging; separate criteria for correctness and style"]
        ] },
        { type: "p", text: "The code below simulates a pairwise judge with a built-in preference for whichever answer is shown first, and shows how running both orders exposes it." },
        { type: "code", lang: "python", title: "position_bias.py", code: `import numpy as np
rng = np.random.default_rng(42)

N = 400
gap = rng.normal(0, 1, N)              # > 0 means answer A is truly better
human = (gap > 0).astype(int)          # human label: 1 = A wins

def judge(g, first_bonus=0.6, noise=0.7):
    # Simulated judge: sees true quality, plus a bonus for the answer shown first
    return int(g + first_bonus + rng.normal(0, noise) > 0)

a_first = np.array([judge(g) for g in gap])          # order: A, B
b_first = np.array([1 - judge(-g) for g in gap])     # order: B, A (flip verdict back)
consistent = a_first == b_first

print(f"A wins | A shown first: {a_first.mean():.2f}")
print(f"A wins | B shown first: {b_first.mean():.2f}")
print(f"A wins | humans:        {human.mean():.2f}")
print(f"order-consistent verdicts: {consistent.mean():.2f}")
print(f"agree with humans, one order only:     {(a_first == human).mean():.2f}")
keep = consistent                                    # inconsistent pairs -> 'tie'
print(f"agree with humans, consistent pairs:   {(a_first[keep] == human[keep]).mean():.2f}")

# Cohen's kappa: agreement corrected for chance
po = (a_first == human).mean()
pe = a_first.mean() * human.mean() + (1 - a_first.mean()) * (1 - human.mean())
print(f"Cohen's kappa (one order): {(po - pe) / (1 - pe):.2f}")`, output: `A wins | A shown first: 0.67
A wins | B shown first: 0.33
A wins | humans:        0.51
order-consistent verdicts: 0.59
agree with humans, one order only:     0.74
agree with humans, consistent pairs:   0.91
Cohen's kappa (one order): 0.48`,
          walkthrough: [
            { lines: [4, 6], note: "400 answer pairs with a hidden true quality gap. Humans pick the truly better answer." },
            { lines: [8, 10], note: "The simulated judge sees the true gap but adds a bonus to whichever answer it reads first, plus noise." },
            { lines: [12, 14], note: "Ask twice: A first, then B first (flipping the verdict back so 1 still means “A wins”). Consistent = both orders agree." },
            { lines: [16, 22], note: "Win rates by order, consistency, and agreement with humans for single-order verdicts vs order-consistent verdicts only." },
            { lines: [24, 27], note: "Cohen's kappa corrects raw agreement for the agreement expected by chance." }
          ] },
        { type: "chart", kind: "bar", title: "How often “A wins”, depending on who judges and the order", yLabel: "Share of pairs", labels: ["Judge, A shown first", "Judge, B shown first", "Humans"], series: [ { name: "A wins", values: [0.67, 0.33, 0.51] } ], caption: "From the simulation output. The same pairs get opposite majority verdicts depending only on order, a clear sign of position bias." },
        { type: "matrix", title: "Judge (A shown first) vs human labels, 400 pairs", rows: ["Human: A better", "Human: B better"], cols: ["Judge: A", "Judge: B"], values: [[183, 20], [83, 114]], format: "int", caption: "Computed from the same simulation. The errors are lopsided: 83 pairs where humans preferred B but the judge, reading A first, picked A, versus only 20 mistakes in the other direction. Agreement = (183 + 114) / 400 ≈ 0.74." },
        { type: "check", question: "From the output: single-order agreement with humans is 0.74, but on order-consistent pairs it is 0.91. Why do we not simply report 0.91?", answer: "Because 0.91 is measured only on the 59% of pairs where both orders agreed. The other 41% become ties or need human review. Swapping order gives us a trustworthy verdict on fewer pairs, plus a flag on the rest, which is honest; reporting 0.91 as overall accuracy would hide the ties." }
      ]
    },
    {
      id: "best-practices-use-cases",
      title: "Best practices and real-world use cases",
      blocks: [
        { type: "list", items: [
          "**Validate before trusting**: measure agreement with human labels and read disagreements.",
          "**Small, anchored scales**, ideally binary pass/fail per criterion.",
          "**One criterion per judge** call; combine scores in code.",
          "**Reason, then score**, in structured JSON, at temperature 0.",
          "**Swap order in pairwise mode**; treat inconsistent verdicts as ties.",
          "**Use a strong judge**, often stronger than the model being judged, and ideally from a different family.",
          "**Version the judge** (model + prompt). Changing either changes the scores, so old and new numbers are not comparable.",
          "**Keep humans in the loop** for high-stakes decisions and periodic recalibration."
        ] },
        { type: "callout", tone: "example", title: "Real-world use cases", text: "Regression testing of prompts and models in CI (“did groundedness drop?”); scoring RAG answers for faithfulness to retrieved documents (evaluation libraries such as Ragas and DeepEval provide judge-based metrics for this); A/B comparisons between two model versions; online monitoring that samples live conversations and flags low-scoring ones for human review; filtering or ranking synthetic training data; and producing preference labels for training reward models (often called RL from AI feedback)." },
        { type: "callout", tone: "warn", title: "The common mistake", text: "Writing “Rate this answer from 1 to 10” with no rubric, using the numbers immediately, and never checking them against people. Such scores look precise but often measure length and confidence, not correctness." }
      ]
    },
    {
      id: 'worked-example-agreement',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: '“Our judge agrees with humans 91% of the time” sounds like a pass. Let us check that claim by hand. We have **100 support answers**. A human reviewer marked 90 as pass and 10 as fail. Our judge graded the same 100. The table of counts is below; the numbers are illustrative.' },
        { type: 'matrix', title: 'Human labels (rows) vs judge verdicts (columns), 100 answers', rows: ['Human: pass', 'Human: fail'], cols: ['Judge: pass', 'Judge: fail'],
          values: [[88, 2], [7, 3]], format: 'int',
          caption: 'Illustrative counts. The diagonal (88 and 3) is where they agree.' },
        { type: 'steps', title: 'Is 91% agreement good?', items: [
          { title: 'Raw agreement', text: '`(88 + 3) / 100 = 0.91`. This is the number that sounded good.' },
          { title: 'How often each says “pass”', text: 'The human passes 90 of 100 answers (0.90). The judge passes `88 + 7 = 95` (0.95). The judge is more generous.' },
          { title: 'Agreement by chance', text: 'Two graders who pass that often would agree a lot even if they ignored the answers: `0.90 × 0.95 + 0.10 × 0.05 = 0.855 + 0.005 = 0.86`.' },
          { title: 'Cohen’s kappa', text: '`κ = (observed − chance) / (1 − chance) = (0.91 − 0.86) / (1 − 0.86) ≈ 0.36`. On a scale where 0 is chance and 1 is perfect, this judge is only a third of the way.' },
          { title: 'Look at the row that matters', text: 'Of the 10 answers the human failed, the judge failed only 3. If the judge is meant to *catch bad answers*, it misses 7 of every 10.' },
        ] },
        { type: 'p', text: 'The lesson of the arithmetic: when most answers are good, raw agreement is dominated by the easy passes. A judge that says “pass” to everything would score 90% here.' },
        { type: 'p', text: 'The off-diagonal cells also tell us what to fix. Seven answers in “human fail, judge pass” and only two the other way means the judge is **too lenient**. We read those seven, find what the human saw that the rubric does not mention (perhaps an invented policy), and add it to the rubric as an explicit fail condition. Then we measure again, on answers the judge prompt was not tuned on.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will write a small function that takes the four counts from a human-vs-judge table and returns raw agreement, chance agreement and kappa. Then we compare three judges on the same 100 answers, including one that passes everything.' },
        { type: 'code', lang: 'python', title: 'practice_judge_agreement.py', code: `def kappa(both_pass, human_only, judge_only, both_fail):
    # Confusion counts between human labels and judge verdicts (pass / fail)
    n = both_pass + human_only + judge_only + both_fail
    observed = (both_pass + both_fail) / n            # raw agreement
    human_pass = (both_pass + human_only) / n         # how often the human passes
    judge_pass = (both_pass + judge_only) / n         # how often the judge passes
    # Agreement we would expect if the two graded independently, by chance
    chance = human_pass * judge_pass + (1 - human_pass) * (1 - judge_pass)
    return observed, chance, (observed - chance) / (1 - chance)

judges = {
    # name: (both pass, human pass / judge fail, human fail / judge pass, both fail)
    "always-pass judge": (90, 0, 10, 0),
    "lenient judge":     (88, 2, 7, 3),
    "careful judge":     (85, 5, 2, 8),
}

print("judge              agreement  by chance  kappa  bad answers caught")
for name, counts in judges.items():
    observed, chance, k = kappa(*counts)
    caught = counts[3] / (counts[2] + counts[3])      # of the 10 human fails
    print(f"{name:<18} {observed:9.2f}  {chance:9.2f}  {k:5.2f}  {caught:18.0%}")`, output: `judge              agreement  by chance  kappa  bad answers caught
always-pass judge       0.90       0.90   0.00                  0%
lenient judge           0.91       0.86   0.36                 30%
careful judge           0.93       0.80   0.66                 80%`,
          walkthrough: [
            { lines: [1, 9], note: 'From four counts: raw agreement, each grader’s pass rate, the agreement expected by chance, and kappa.' },
            { lines: [11, 16], note: 'Three judges on the same data (90 human passes, 10 human fails). Each tuple is the four cells of the table.' },
            { lines: [18, 22], note: 'Print the three agreement numbers, and how many of the 10 human-failed answers each judge also failed.' },
          ] },
        { type: 'p', text: 'Raw agreement barely separates the three judges: 0.90, 0.91, 0.93. Kappa and the last column separate them clearly: 0.00, 0.36, 0.66, and 0%, 30%, 80% of bad answers caught.' },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Add a strict judge: `"strict judge": (70, 20, 0, 10)`. It fails every bad answer but also 20 good ones. Predict: is its raw agreement above or below the lenient judge’s? And its kappa?',
          'Rebalance the data: change the careful judge to `(45, 5, 2, 48)`, a test set that is half fails. Predict how the gap between agreement and kappa changes.',
          'Change the always-pass judge to an always-fail judge, `(0, 90, 0, 10)`. Predict its agreement and its kappa before running.',
        ] },
        { type: 'check', question: 'We want to use the judge as a release gate that blocks bad answers. The lenient judge has 91% agreement. Why is that number the wrong one to look at, and what is the right one?', answer: 'Agreement is dominated by the 90 easy passes. A gate is only useful if it catches failures, and the lenient judge catches 3 of 10. The number to watch is the share of human-failed answers the judge also fails (its recall on failures), with kappa as a summary. We should also check the opposite error: how many good answers it blocks.' },
        { type: 'check', question: 'A teammate validates a new judge on 20 hand-picked answers that are all obvious passes or obvious fails, and reports perfect agreement. What is wrong with this check?', answer: 'It tests the judge only where judging is easy. Real traffic contains borderline answers: mostly right with one invented detail, or correct but incomplete. That is where judges and humans disagree. The sample should be drawn from real outputs with a realistic mix, include hard cases on purpose, and be large enough that a few disagreements do not swing the result.' },
      ],
    },
  ],
  quiz: [
    { q: "What is LLM as a judge?", options: ["Fine-tuning a model on a large set of human quality ratings", "Using an LLM with a rubric to grade an LLM system's outputs", "Letting real users vote on answers inside the live product", "Computing BLEU and ROUGE scores with a neural network model"], answer: 1, explain: "A judge model reads the input, the output and a rubric, and returns a score or preference. The other options describe training, human feedback or a metric." },
    { q: "Our pairwise judge prefers version A 67% of the time when A is shown first, but only 33% when B is shown first. What should we do?", options: ["Report the 67% result, since that was the first run we did", "Average the two runs to 50% and call the versions equal", "Switch the judge to a 1–10 scale to get finer distinctions", "Judge both orders; count a win only when both orders agree"], answer: 3, explain: "The flip shows strong position bias. Running both orders and keeping only consistent verdicts (others become ties) removes the order effect. Averaging hides the bias rather than measuring quality." },
    { q: "In G-Eval style scoring, a judge gives p(3) = 0.2, p(4) = 0.7, p(5) = 0.1. What is the probability-weighted score?", options: ["4.0", "3.9", "3.5", "4.2"], answer: 1, explain: "0.2·3 + 0.7·4 + 0.1·5 = 0.6 + 2.8 + 0.5 = 3.9." },
    { q: "When is pairwise comparison a better choice than pointwise scoring?", options: ["When deciding which of two prompt versions is better", "When we need an absolute score to track every week", "When there is only one output to grade per input", "When we specifically want to avoid position bias"], answer: 0, explain: "Pairwise judgments are relative, which makes them well suited to A/B decisions. Absolute tracking suits pointwise scoring, and pairwise mode is exactly where position bias appears." },
    { q: "Which statement is a misconception?", options: ["Judges may give higher scores to longer answers", "Asking for reasoning before the score often helps", "A written judge prompt needs no human-label check", "A judge from another model family reduces self-bias"], answer: 2, explain: "Judge scores must be validated against human labels; uncalibrated judges often reward length or confidence. The other statements are standard findings and practices." }
  ],
  takeaways: [
    "An LLM judge grades outputs with a rubric, scaling meaning-aware evaluation far beyond what humans can label.",
    "Main setups: pointwise scoring, pairwise comparison and reference-guided grading.",
    "Clear criteria, anchored small scales, reasoning before the score and JSON output make judges more reliable.",
    "Judges have biases (position, verbosity, self-preference); swap orders and use rubrics to counter them.",
    "Always validate judge verdicts against human labels before trusting the numbers."
  ],
  terms: [
    { term: "LLM as a judge", def: "Using a language model with a rubric to evaluate the outputs of an LLM system." },
    { term: "Rubric", def: "The written criteria and score definitions the judge applies." },
    { term: "Pairwise comparison", def: "A judging mode where the judge picks the better of two outputs for the same input." },
    { term: "G-Eval", def: "A judging recipe using generated evaluation steps and probability-weighted scores." },
    { term: "Position bias", def: "A judge's tendency to prefer an answer because of where it appears, not its quality." },
    { term: "Verbosity bias", def: "A judge's tendency to rate longer answers higher regardless of quality." },
    { term: "Cohen's kappa", def: "An agreement score between two raters that corrects for agreement expected by chance." }
  ]
};
