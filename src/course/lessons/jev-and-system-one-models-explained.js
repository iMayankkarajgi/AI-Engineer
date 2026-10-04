export default {
  id: 'jev-and-system-one-models-explained',
  minutes: 21,
  hook: 'Why pay a chatbot to write a paragraph when all you needed was "yes, 92% sure"?',
  summary: 'A System One model is a model built only to make fast, typed decisions (pick an option, give a score, answer yes or no) with a probability attached, instead of generating free text. Jev, released by TypeSafe in September 2026, is the first model marketed under that name; it is trained with what TypeSafe calls Reinforcement Learning for Calibrated Decisions (RLCD) so that its stated confidence matches how often it is right. Because its output can only be one of the answers we define, it cannot invent text, though it can still choose the wrong option, so it suits high-volume classification, routing, scoring and guardrails, while LLMs remain the tool for writing and reasoning.',
  sections: [
    {
      id: 'what-is-system-one',
      title: 'What is a System One model?',
      blocks: [
        { type: 'p', text: 'A **System One model** answers a **decision question** rather than writing text. We hand it some input (a message, a document, a set of facts) and a question with a **fixed answer type**: pick one of these options, rate on this scale, or say whether this statement is true. It returns the answer together with **probabilities**, typically in a fraction of a second.' },
        { type: 'p', text: 'The name is new (it was popularised with Jev in 2026), but the idea is familiar from classical machine learning: a classifier also returns a label and a probability. What is new is a large, general model that can take such questions in natural language about arbitrary input, without us training a separate classifier for every task.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a referee vs a commentator', text: 'A commentator (an LLM) can talk at length about a play. A referee (a System One model) must decide instantly: foul or no foul, which team gets the ball. Nobody wants the referee to give a speech; they want a quick, consistent and honest call, and a signal when the call is close.' },
        { type: 'p', text: 'Running example: an online shop gets 2 million customer messages a day. For each one we need three decisions: which department (billing, shipping, returns, technical), how urgent (1–5), and "does this message threaten legal action?" (yes/no).' },
      ],
    },
    {
      id: 'system-one-vs-two',
      title: 'System One vs System Two thinking',
      blocks: [
        { type: 'p', text: 'The terms come from psychology, popularised by Daniel Kahneman\'s book *Thinking, Fast and Slow* (2011). **System 1** is fast, automatic and intuitive: recognising a face, reading a stop sign. **System 2** is slow, deliberate and effortful: doing long multiplication, planning a trip.' },
        { type: 'compare', title: 'The two modes, applied to AI', options: [
          { name: 'System One (fast)', summary: 'Instant, intuitive judgement over a fixed set of answers.', pros: ['Milliseconds', 'Cheap', 'Consistent'], cons: ['No step-by-step reasoning', 'Cannot produce new text'], bestFor: 'Classify, route, score, check' },
          { name: 'System Two (slow)', summary: 'Deliberate, multi-step reasoning, often written out.', pros: ['Handles novel, complex problems', 'Explains itself'], cons: ['Seconds to minutes', 'Costly', 'Variable'], bestFor: 'Write, plan, solve, code' },
        ], verdict: 'In this analogy, reasoning LLMs are System Two machines; Jev positions itself as a System One machine.' },
      ],
    },
    {
      id: 'problem-with-llms',
      title: 'The problem with using an LLM for decisions',
      blocks: [
        { type: 'p', text: 'Teams often use a chat LLM as a classifier: "Here is a message. Reply with one of: billing, shipping, returns, technical." It works, but at scale several problems appear:' },
        { type: 'list', items: [
          '**Latency and cost:** a generative model that reads a prompt and writes tokens takes from hundreds of milliseconds to seconds and is priced for generation, even when the answer is one word. For 2 million messages a day, that adds up.',
          '**Format failures:** the model sometimes replies "Billing." or "This seems like a billing issue" or invents a category ("payments"). We need parsing, retries and validation code.',
          '**Unreliable confidence:** asking an LLM "how confident are you?" yields a number it writes as text, which often does not match how often it is actually right. Token log-probabilities help but need extra calibration work.',
          '**Inconsistency:** the same input can get different answers across runs, especially with sampling.',
        ] },
        { type: 'check', question: 'Our LLM classifier says "95% confident" on 1,000 messages, but only 70% of those were labelled correctly. What property is missing, and why does it matter for automation?', answer: 'Calibration: stated confidence (95%) does not match actual accuracy (70%). It matters because we cannot use the confidence to decide which cases are safe to automate and which need a human; overconfident errors slip through unchecked.' },
      ],
    },
    {
      id: 'what-is-jev',
      title: 'What is Jev?',
      blocks: [
        { type: 'p', text: '**Jev** is a model released by the company **TypeSafe** in September 2026 and presented as the first System One model. It accepts input plus a typed decision question and returns a typed answer with a full probability distribution over the allowed answers. It does **not** produce free-form text, does not chat, and does not write code.' },
        { type: 'callout', tone: 'note', title: 'How sure can we be about the details?', text: 'Jev is very new. TypeSafe has published its interface, training goal and benchmark claims, but not a full technical description of the architecture. In this lesson, internal details are described only at the level TypeSafe and independent write-ups state them, and performance numbers are vendor claims that have not yet been widely reproduced.' },
      ],
    },
    {
      id: 'how-jev-works',
      title: 'How Jev works',
      blocks: [
        { type: 'p', text: 'From the user\'s side, a Jev call looks like filling in a form rather than writing a prompt:' },
        { type: 'flow', title: 'One Jev decision', nodes: [
          { label: 'Input state', detail: 'The material to judge: a customer message, a document, an LLM answer plus its source, metadata.' },
          { label: 'Typed question', detail: 'For example "Which department?" with the options [billing, shipping, returns, technical].' },
          { label: 'Single pass', detail: 'According to TypeSafe, the model scores all allowed answers together in one query instead of writing tokens one by one, so there is no generation loop.' },
          { label: 'Typed answer', detail: 'A probability for each option (e.g. billing 0.81, returns 0.12, shipping 0.05, technical 0.02), the top choice and a confidence value.' },
          { label: 'Our code decides', detail: 'Branch on the answer and confidence: auto-route, or escalate if the confidence is low.' },
        ] },
        { type: 'steps', title: 'Handling one shop message with Jev', items: [
          { title: 'Define the questions once', text: 'Choice: department (4 options). Score: urgency on levels 1–5. Yes/no: "The customer threatens legal action."' },
          { title: 'Send the message', text: 'Ask the three questions about the same message, in parallel.' },
          { title: 'Read typed answers', text: 'department = billing (0.81); urgency distribution peaks at 4; legal threat = 0.03.' },
          { title: 'Apply thresholds', text: 'Department confidence is above our 0.75 threshold, so route automatically; legal-threat probability is low, so no lawyer alert.' },
          { title: 'Monitor', text: 'Log predictions and outcomes to check calibration over time.' },
        ] },
      ],
    },
    {
      id: 'typed-answers',
      title: 'Typed answers: Choice, Score, and Yes/No',
      blocks: [
        { type: 'table', caption: 'Jev\'s three question types', head: ['Type', 'What we provide', 'What comes back', 'Shop example'], rows: [
          ['Choice', 'A finite list of options', 'A probability for each option and the chosen one', 'Department: billing / shipping / returns / technical'],
          ['Score', 'An ordered scale or rubric of levels', 'A distribution over the levels', 'Urgency 1–5; "how well does this answer follow the source?" 1–5'],
          ['Yes/No', 'A statement to judge', 'The probability that the statement is true', '"This message threatens legal action" → 0.03'],
        ] },
        { type: 'p', text: 'TypeSafe\'s materials refer to the yes/no type by its own name (a "noul"), but the idea is simply a true/false proposition with a probability. Bigger decisions are built by **composing** several small questions rather than asking one complex one.' },
      ],
    },
    {
      id: 'calibration-rlcd',
      title: 'Calibration and RLCD',
      blocks: [
        { type: 'p', text: 'A model is **calibrated** when its confidence matches reality across many predictions: of all answers given with 80% confidence, about 80% should be correct. Calibration is a property of **groups** of predictions, not a promise about any single answer.' },
        { type: 'p', text: 'TypeSafe trains Jev with what it calls **RLCD, Reinforcement Learning for Calibrated Decisions**. Where RLHF rewards answers humans prefer and RLVR rewards answers a program can verify as correct, RLCD is described as rewarding **honest probabilities**: the model is rewarded when its stated probabilities match how often answers turn out right. TypeSafe has not published the exact reward; in standard practice such goals are measured with **proper scoring rules** such as the Brier score or log loss, which are lowest when predicted probabilities equal true frequencies.' },
        { type: 'formula', expr: 'Brier = (1/N) ∑ᵢ (pᵢ − yᵢ)²     ECE = ∑_b (n_b / N) · |conf_b − acc_b|', where: [ ['pᵢ', 'predicted probability of "yes" for case i'], ['yᵢ', '1 if the outcome was yes, else 0'], ['b', 'a confidence bin, e.g. 0.7–0.8'], ['conf_b, acc_b', 'average confidence and actual accuracy in bin b'], ['ECE', 'Expected Calibration Error: 0 means perfectly calibrated'] ], caption: 'Two standard ways to measure calibration; lower is better for both.' },
        { type: 'code', lang: 'python', title: 'calibration_check.py', code: `import numpy as np
rng = np.random.default_rng(1)
n = 10_000

# Hidden truth: each yes/no question has a real chance of being "yes"
true_p = rng.uniform(0.05, 0.95, n)
outcome = rng.random(n) < true_p                     # what actually happened

calibrated = true_p                                  # says 0.7 when right 70% of the time
overconfident = np.clip(0.5 + 1.8 * (true_p - 0.5), 0.01, 0.99)   # pushes toward 0 / 1

def ece(p, y, bins=10):
    # Expected Calibration Error: average gap between confidence and accuracy per bin
    edges = np.linspace(0, 1, bins + 1)
    idx = np.clip(np.digitize(p, edges) - 1, 0, bins - 1)
    return sum(abs(p[idx == b].mean() - y[idx == b].mean()) * (idx == b).mean()
               for b in range(bins) if (idx == b).any())

for name, p in [("calibrated", calibrated), ("overconfident", overconfident)]:
    brier = np.mean((p - outcome) ** 2)
    print(f"{name:13s} ECE={ece(p, outcome):.3f}  Brier={brier:.3f}")

# Using calibrated probabilities: auto-decide only when confident, else escalate
p = calibrated
auto = (p >= 0.85) | (p <= 0.15)
decision = p >= 0.5
print(f"auto-decided {auto.mean():.0%} of cases, accuracy there = "
      f"{(decision[auto] == outcome[auto]).mean():.1%}; the rest go to a human or an LLM")`, output: `calibrated    ECE=0.012  Brier=0.181
overconfident ECE=0.116  Brier=0.198
auto-decided 23% of cases, accuracy there = 90.6%; the rest go to a human or an LLM`,
          walkthrough: [
            { lines: [4, 7], note: 'Simulate 10,000 yes/no questions, each with a hidden true chance of "yes", and draw what actually happened.' },
            { lines: [9, 10], note: 'Two predictors: one reports the true chance (calibrated); one exaggerates toward 0 or 1 (overconfident). Both rank cases the same way.' },
            { lines: [12, 17], note: 'ECE: bin predictions by confidence and average the gap between confidence and accuracy, weighted by bin size.' },
            { lines: [19, 21], note: 'The calibrated model has ECE ≈ 0.01 vs 0.12, and a better (lower) Brier score, even with the same ranking.' },
            { lines: [23, 27], note: 'Why calibration pays off: we can safely auto-decide only confident cases (here 23%, at ~91% accuracy) and escalate the rest.' },
          ] },
        { type: 'p', text: 'This is a simulation of the concept, not of Jev. It shows why a calibrated model is useful even when it is not more accurate: the confidence becomes something our code can trust for routing decisions.' },
      ],
    },
    {
      id: 'why-no-hallucination',
      title: 'Why Jev "cannot hallucinate"',
      blocks: [
        { type: 'p', text: 'An LLM **hallucinates** when it generates fluent text that is false or made up: an invented citation, a category that does not exist, a malformed JSON field. Jev has no way to generate text at all. Its output space is exactly the set of answers we defined, so it can never return an invented option, extra fields, or broken formatting. In that **structural** sense, hallucination is impossible.' },
        { type: 'callout', tone: 'warn', title: 'Valid is not the same as correct', text: 'Jev can still pick the **wrong option**: label a billing complaint as shipping, or give a low legal-threat probability to a real threat. "Cannot hallucinate" means it cannot make things up or break the format; it does not mean it is always right. That is exactly why calibration matters: a wrong answer should come with lower confidence so we can catch it.' },
        { type: 'check', question: 'A manager reads "Jev cannot hallucinate" and proposes removing all human review of its legal-threat flags. What is the flaw?', answer: 'The guarantee is structural: answers are always valid options with probabilities. Jev can still misjudge a message. For high-stakes decisions we should keep review for low-confidence or high-impact cases, using the calibrated probabilities to decide which ones.' },
      ],
    },
    {
      id: 'jev-vs-llm',
      title: 'Jev vs LLM',
      blocks: [
        { type: 'compare', title: 'Jev (System One) vs a general LLM', options: [
          { name: 'Jev', summary: 'Typed decisions with calibrated probabilities, no text.', pros: ['Answers in milliseconds to well under a second (vendor claim)', 'Output always matches the schema', 'Confidence designed to be calibrated', 'Very low cost per decision (vendor claim)'], cons: ['Cannot write, explain, code or reason step by step', 'Answers must be defined in advance', 'New; claims not yet widely independently verified'], bestFor: 'High-volume classification, routing, scoring, guardrails, evaluation' },
          { name: 'General LLM', summary: 'Generates free text; can reason, write and use tools.', pros: ['Extremely flexible', 'Explains its answers', 'Handles open-ended tasks'], cons: ['Slower and costlier per decision', 'Needs output parsing and validation', 'Stated confidence often miscalibrated'], bestFor: 'Writing, summarising, coding, multi-step reasoning, conversation' },
        ], rows: [
          ['Output', 'One of the predefined answers + probabilities', 'Any text'],
          ['Typical latency', 'Milliseconds to sub-second (vendor)', 'Hundreds of ms to many seconds'],
          ['Hallucination', 'Structurally impossible; can still be wrong', 'Possible'],
          ['Training signal', 'RLCD: honest probabilities', 'RLHF / RLVR: preference or verified correctness'],
        ], verdict: 'They are complementary: let a System One model handle the many small decisions and an LLM handle the generative work.' },
        { type: 'p', text: 'TypeSafe reports latencies of roughly 0.1 seconds and costs hundreds of times lower than calling small frontier LLMs for the same decision, with very low variance between repeated runs. These are vendor figures from internal evaluations. An honest comparison should also include a classic trained classifier (for example a gradient-boosted tree or a fine-tuned small model), which can be even cheaper when we have enough labelled data.' },
      ],
    },
    {
      id: 'where-it-works',
      title: 'Where Jev works well and where it fails',
      blocks: [
        { type: 'list', items: [
          '**Works well:** ticket and message routing; content moderation and safety guardrails; scoring LLM outputs as an automatic judge ("is this answer grounded in the source?"); lead or fraud triage; choosing which model or tool an agent should call next; data labelling at scale.',
          '**Fails or does not apply:** anything that needs generated text (replies, summaries, explanations); code generation; maths derivations and long multi-step reasoning; open-ended questions whose answer set we cannot list; optimisation problems such as building a delivery schedule.',
          '**Use with care:** inputs very different from what it was trained on, where calibration may drift; high-stakes decisions without human review; very large option sets (documentation mentions limits on the number of options).',
        ] },
        { type: 'viz', name: 'guardrails', caption: 'Guardrails are a natural System One job: each check is a fast yes/no or choice decision before and after the main model.' },
      ],
    },
    {
      id: 'when-to-use-which',
      title: 'When to use which one',
      blocks: [
        { type: 'steps', title: 'A simple decision procedure', items: [
          { title: 'Is the output a decision from a set we can list?', text: 'If no (we need text, code or a plan), use an LLM.' },
          { title: 'Is volume high or latency tight?', text: 'If yes, a System One model or classic classifier is attractive; if it is a handful of calls a day, an LLM may be simpler.' },
          { title: 'Do we need trustworthy confidence?', text: 'If our system branches on confidence (auto-approve vs human review), calibration is essential; check it on our own data.' },
          { title: 'Does the decision need deep reasoning?', text: 'If a human would need minutes of careful thought, a fast System One answer may be shallow; escalate such cases to a reasoning LLM.' },
          { title: 'Combine', text: 'A common pattern: System One triage first, confident cases handled automatically, uncertain or complex ones sent to an LLM or a person.' },
        ] },
        { type: 'callout', tone: 'example', title: 'The shop, decided', text: 'Jev (or a similar System One model) labels department, urgency and legal risk for all 2 million messages. Confident routine cases are routed instantly; low-confidence or high-risk ones go to an LLM that drafts a reply for a human agent to approve. The LLM now handles a small fraction of the traffic.' },
        { type: 'viz', name: 'llm-routing', caption: 'Routing by difficulty: cheap fast decisions for most traffic, a bigger model for the hard cases.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does a System One model like Jev return?', options: ['A typed answer from a set we define, with probabilities', 'A paragraph of free text explaining its reasoning', 'Generated source code that solves the given task', 'A long chain of thought followed by a final answer'], answer: 0, explain: 'System One models make fast typed decisions (choice, score, yes/no) with probabilities; they do not generate text or reasoning traces.' },
    { q: 'A model makes 1,000 predictions with 80% confidence and 600 of them are correct. What does this show?', options: ['It is well calibrated for these cases', 'It is overconfident (80% vs 60%)', 'It is underconfident for these cases', 'It is hallucinating free-form text'], answer: 1, explain: 'Calibrated would mean about 800 correct. 600 correct at 80% confidence means confidence is too high.' },
    { q: 'What is RLCD designed to optimise, according to TypeSafe?', options: ['How much human raters prefer each answer', 'How short and concise each answer is', 'How fast tokens are generated per second', 'Probabilities that match real accuracy'], answer: 3, explain: 'RLCD targets calibration (honest probabilities). Human preference is RLHF\'s target.' },
    { q: 'Our support bot must write a personalised reply to each angry customer. Should we use Jev for that step?', options: ['Yes, because Jev writes text faster than any LLM', 'Yes, since Jev cannot hallucinate, replies will be perfect', 'No; use an LLM to write, maybe after Jev triages', 'No, because Jev is unable to read customer messages'], answer: 2, explain: 'Jev cannot produce free text. It can triage (urgency, department), and an LLM writes the reply.' },
    { q: 'Which statement about "Jev cannot hallucinate" is accurate?', options: ['Jev is always correct on every decision it makes', 'It cannot invent answers but can pick a wrong option', 'Jev never needs any monitoring once deployed', 'Jev double-checks every answer with a large LLM'], answer: 1, explain: 'The guarantee is structural validity, not correctness. Monitoring calibration and reviewing low-confidence cases is still needed.' },
  ],
  takeaways: [
    'System One models make fast, typed decisions (choice, score, yes/no) with probabilities instead of generating text.',
    'Jev, from TypeSafe (September 2026), is the first model marketed this way; many of its numbers are still vendor claims.',
    'Calibration means stated confidence matches real accuracy; RLCD is TypeSafe\'s training method aimed at it.',
    'Jev cannot invent outputs or break the schema, but it can still pick the wrong answer.',
    'Use System One models for high-volume decisions and LLMs for generative or reasoning work; combine them with confidence-based routing.',
  ],
  terms: [
    { term: 'System One model', def: 'A model that returns fast, typed decisions with probabilities instead of generating text.' },
    { term: 'System 1 / System 2', def: 'Kahneman\'s terms for fast intuitive thinking versus slow deliberate reasoning.' },
    { term: 'Jev', def: 'TypeSafe\'s System One model, released in September 2026, that answers choice, score and yes/no questions.' },
    { term: 'Calibration', def: 'The match between a model\'s stated confidence and how often it is actually right.' },
    { term: 'RLCD', def: 'Reinforcement Learning for Calibrated Decisions: TypeSafe\'s training method rewarding honest probabilities.' },
    { term: 'Expected Calibration Error (ECE)', def: 'The average gap between confidence and accuracy across confidence bins.' },
    { term: 'Hallucination', def: 'Fluent but false or invented model output.' },
  ],
};
