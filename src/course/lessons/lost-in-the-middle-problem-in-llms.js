export default {
  id: 'lost-in-the-middle-problem-in-llms',
  minutes: 23,
  hook: 'You give a model 20 documents and the answer is right there in document 10. Why might it do worse than if you had given it no documents at all?',
  summary: 'LLMs tend to use information at the beginning and end of a long context much better than information in the middle. Plotting accuracy against the position of the key fact gives a U-shaped curve. This "lost in the middle" effect, documented in a 2023 study, matters for RAG, long chats and document analysis. We can test for it by moving a known fact through the context, and reduce it by sending fewer, better-ranked chunks, placing the most relevant ones at the edges, and putting the question after the documents.',
  sections: [
    {
      id: 'context-window',
      title: 'What is a context window?',
      blocks: [
        { type: 'p', text: 'The **context window** is the maximum number of tokens an LLM can take into account at once: the system prompt, the conversation so far, any retrieved documents, the question, and the answer being written. Anything outside the window is invisible to the model. Windows have grown from a few thousand tokens in early chat models to hundreds of thousands or more in many 2025–2026 models.' },
        { type: 'p', text: 'It is tempting to read a large window as "the model will read everything carefully". The window only sets what the model **can** see. How well it **uses** each part is a separate question, and the answer turns out to depend on where the information sits.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a long meeting', text: 'After a three-hour meeting, most people remember the opening agenda and the final decisions, but the details from the hour-two discussion are fuzzy. Psychologists call these the **primacy** and **recency** effects. LLMs show a surprisingly similar pattern with long contexts.' },
      ],
    },
    {
      id: 'what-is-the-problem',
      title: 'What is the lost-in-the-middle problem?',
      blocks: [
        { type: 'p', text: 'The **lost-in-the-middle problem** is the tendency of LLMs to answer more accurately when the relevant information is near the **start** or the **end** of the context, and less accurately when it is buried in the **middle**, even though all of it fits comfortably in the window.' },
        { type: 'p', text: 'The name comes from the 2023 paper "Lost in the Middle: How Language Models Use Long Contexts" by Nelson F. Liu and colleagues (Stanford and others, later published in TACL). They gave models a question plus 10, 20 or 30 retrieved documents, exactly one of which contained the answer, and moved that document from first to last. They also used a synthetic task: find the value for a given key in a long list of random key-value pairs. Across the models they tested, accuracy was highest at the edges and dropped in the middle. In some settings, accuracy with the answer in the middle fell **below** the model\'s accuracy with no documents at all.' },
      ],
    },
    {
      id: 'example',
      title: 'Let us understand it with an example',
      blocks: [
        { type: 'p', text: 'Our support bot uses retrieval-augmented generation (RAG): for each question it retrieves 10 policy snippets and pastes them into the prompt. A customer asks **"How many days do I have to request a refund?"** One snippet says *"Refunds are allowed within 45 days of delivery."* The other nine are about gift cards, shipping and loyalty points.' },
        { type: 'list', items: [
          'Refund snippet placed **first**: the bot answers "45 days" reliably.',
          'Refund snippet placed **last**, right before the question: also reliable.',
          'Refund snippet placed **fifth**: the bot is more likely to say "30 days" (a common default it has seen in training), mix in a gift-card rule, or say the policy does not mention refunds.',
        ] },
        { type: 'p', text: 'Nothing about the information changed. Only its **position** did. That is what makes this problem sneaky: your retrieval can be perfect and the answer can still be wrong.' },
        { type: 'check', question: 'Pause and think: why can middle-position accuracy drop below "no documents" accuracy?', answer: 'Without documents the model answers from what it learned in training (closed-book). With documents, it tries to answer from the context, but if it fails to use the buried relevant one, it may be distracted by the other, irrelevant documents and do worse than if it had just relied on memory.' },
      ],
    },
    {
      id: 'u-shaped-curve',
      title: 'The U-shaped curve',
      blocks: [
        { type: 'chart', kind: 'line', title: 'Accuracy vs position of the relevant document (20 documents)', xLabel: 'Position of the relevant document', yLabel: 'Accuracy (%)', series: [
          { name: 'With documents', points: [[1, 75], [5, 62], [10, 55], [15, 58], [20, 70]] },
          { name: 'No documents (closed-book)', points: [[1, 56], [5, 56], [10, 56], [15, 56], [20, 56]] },
        ], caption: 'Illustrative numbers that show the typical shape reported for some models in the 2023 study. The exact depth of the dip varies widely by model, task and context length.' },
        { type: 'p', text: 'Accuracy plotted against position forms a **U**: high at the start (primacy), high at the end (recency), lower in between. Two further patterns are common: the dip tends to get **deeper as the context gets longer**, and, in the original study, models marketed with longer context windows were not automatically better at using the context they already had.' },
        { type: 'viz', name: 'lost-in-middle', caption: 'Drag the relevant document through the context and watch the expected accuracy follow the U-shaped curve.' },
        { type: 'callout', tone: 'note', title: 'It varies by model', text: 'Newer long-context models are trained specifically to retrieve from anywhere in the window, and many now score near-perfectly on simple "find this sentence" tests. The effect tends to reappear on harder tasks: several relevant facts, facts that must be combined, or near-duplicate distractors. Measure your own model on your own task rather than assuming either way.' },
      ],
    },
    {
      id: 'why-it-happens',
      title: 'Why does this happen?',
      blocks: [
        { type: 'p', text: 'There is no single proven cause. These are the leading explanations, and several likely combine:' },
        { type: 'list', items: [
          '**Patterns in training data.** In real text, the most important information is often at the start (titles, instructions, topic sentences) or immediately before what you are predicting (the most recent words). Models learn to weight those positions heavily.',
          '**Causal attention favours early tokens.** With a causal mask, the first tokens are visible to every later position and tend to collect a lot of attention. Researchers studying streaming models observed that LLMs put unusually large attention on the very first tokens, sometimes called **attention sinks**.',
          '**Position encodings favour nearby tokens.** With RoPE, attention scores tend to decay with distance, so tokens near the end of the context (close to where the answer is being generated) get a natural boost.',
          '**Limited long-context training.** Much fine-tuning data is short. A model may rarely have been rewarded for finding one fact in the middle of 50,000 tokens.',
          '**Distractors.** The middle is usually filled with plausible but irrelevant text, and attention is a finite budget shared across all of it.',
        ] },
      ],
    },
    {
      id: 'where-it-hurts',
      title: 'Where this hurts us in real life',
      blocks: [
        { type: 'table', caption: 'Common situations where middle content gets under-used', head: ['Scenario', 'What goes wrong'], rows: [
          ['RAG with many retrieved chunks', 'The best chunk lands in position 6 of 12 and is ignored; the answer comes from a weaker chunk or from memory'],
          ['Long chat sessions', 'A user preference stated 40 turns ago (now mid-context) is forgotten'],
          ['Long document review (contracts, reports)', 'A clause on page 30 of 60 is missed in a summary or risk check'],
          ['Long system prompts', 'Rules buried in the middle of a long instruction block are followed less reliably'],
          ['Agents with long tool histories', 'An important tool result from many steps ago is not used'],
        ] },
        { type: 'callout', tone: 'example', title: 'Real-world pattern', text: 'Teams often discover this when they raise the number of retrieved chunks from 5 to 20 "to be safe" and see answer quality go **down**. More context means more middle and more distractors.' },
      ],
    },
    {
      id: 'how-to-test',
      title: 'How to test for the lost-in-the-middle problem',
      blocks: [
        { type: 'steps', title: 'A position sweep for your own model and task', items: [
          { title: 'Pick a known fact', text: 'Choose a question whose answer is in exactly one document or sentence (the "needle").' },
          { title: 'Build filler', text: 'Surround it with realistic, irrelevant documents from your own domain (the "haystack"). Realistic distractors make the test honest.' },
          { title: 'Sweep the position', text: 'Insert the fact at several depths: 0%, 25%, 50%, 75%, 100% of the context.' },
          { title: 'Sweep the length', text: 'Repeat at several total lengths, e.g. 4K, 16K, 64K tokens.' },
          { title: 'Score many runs', text: 'Ask the question many times per cell (with several different facts), score correctness, and plot accuracy by depth and length.' },
        ] },
        { type: 'code', lang: 'python', title: 'position_test.py', code: `# 1) Build a position test: same question, the key fact moved through the context
filler = [f"Doc {i}: Store policy note {i} about gift cards." for i in range(1, 10)]
needle = "Doc X: Refunds are allowed within 45 days of delivery."
question = "Q: How many days do customers have to request a refund?"

def build_prompt(depth):
    docs = filler[:depth] + [needle] + filler[depth:]
    return "\\n".join(docs + [question])

for depth in [0, 4, 9]:
    lines = build_prompt(depth).splitlines()
    pos = next(i for i, l in enumerate(lines) if l.startswith("Doc X"))
    print(f"depth {depth}: fact is line {pos + 1} of {len(lines) - 1} docs")

# 2) Fix: put the most relevant chunks at the START and END, weakest in the middle
def edges_first(chunks_by_relevance):
    front, back = [], []
    for i, c in enumerate(chunks_by_relevance):     # best first
        (front if i % 2 == 0 else back).append(c)
    return front + back[::-1]

ranked = ["R1", "R2", "R3", "R4", "R5", "R6", "R7"]  # R1 = most relevant
print("retriever order:", ranked)
print("edges-first    :", edges_first(ranked))`,
          output: `depth 0: fact is line 1 of 10 docs
depth 4: fact is line 5 of 10 docs
depth 9: fact is line 10 of 10 docs
retriever order: ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']
edges-first    : ['R1', 'R3', 'R5', 'R7', 'R6', 'R4', 'R2']`,
          walkthrough: [
            { lines: [1, 4], note: 'Nine filler documents, one "needle" containing the answer, and the question. In a real test, use realistic distractors from your domain.' },
            { lines: [6, 8], note: 'build_prompt inserts the needle after depth filler documents, with the question at the end.' },
            { lines: [10, 13], note: 'Generate prompts with the fact at the start, middle and end. In a real harness you would send each to the model many times and score the answers.' },
            { lines: [15, 20], note: 'A mitigation: deal ranked chunks alternately to the front and the back, so the strongest sit at the edges and the weakest end up in the middle.' },
            { lines: [22, 24], note: 'R1 (best) goes first, R2 goes last, and R7 (weakest) lands in the middle.' },
          ] },
        { type: 'matrix', title: 'How a depth × length test is usually reported (illustrative)', rows: ['8K tokens', '32K tokens', '128K tokens'], cols: ['0%', '25%', '50%', '75%', '100%'], values: [[0.98, 0.96, 0.95, 0.96, 0.99], [0.97, 0.9, 0.84, 0.88, 0.98], [0.95, 0.8, 0.68, 0.76, 0.97]], format: 'pct', caption: 'Illustrative values only. The typical pattern: the middle columns weaken as total length grows.' },
        { type: 'p', text: 'Simple single-needle tests became popular in 2023 and many current models pass them easily, so also test harder variants: several needles, questions that require combining two facts, and benchmarks designed for this, such as RULER (2024), which add multi-hop and aggregation tasks.' },
      ],
    },
    {
      id: 'how-to-solve',
      title: 'How to solve the lost-in-the-middle problem',
      blocks: [
        { type: 'compare', title: 'Mitigations and their trade-offs', options: [
          { name: 'Send less, but better', summary: 'Retrieve more candidates, rerank them, and keep only the top few.', pros: ['Fewer distractors and less middle', 'Cheaper and faster prompts'], cons: ['Needs a good reranker', 'Risk of dropping a needed chunk'], bestFor: 'Most RAG systems: the first fix to try' },
          { name: 'Reorder to the edges', summary: 'Place the most relevant chunks first and last.', pros: ['One line of code', 'No extra model calls'], cons: ['Only helps if your ranking is good', 'Does not remove distractors'], bestFor: 'When you must send many chunks' },
          { name: 'Restructure the prompt', summary: 'Put documents first and the question and instructions at the end (or repeat them there).', pros: ['Uses the recency effect for the question', 'Free to try'], cons: ['Gains vary by model'], bestFor: 'Long-document Q&A and long system prompts' },
          { name: 'Divide and conquer', summary: 'Process chunks separately (map), then combine the results (reduce).', pros: ['Each call has a short context', 'Scales to very long inputs'], cons: ['More calls, cost and latency', 'Cross-chunk reasoning is harder'], bestFor: 'Summarizing or auditing very long documents' },
        ], rows: [
          ['Extra model calls', 'Reranker only', 'None', 'None', 'Many'],
          ['Reduces distractors', 'Yes', 'No', 'No', 'Yes'],
        ], verdict: 'Start by sending fewer, better-ranked chunks and putting the question last; add edge reordering; use map-reduce when the input is truly huge. Then re-run your position test to confirm.' },
        { type: 'p', text: 'Two more techniques help: ask the model to first **quote the relevant passages** and then answer from those quotes (this forces it to search the context explicitly), and keep long chats healthy by periodically **summarizing** older turns and pinning key facts (like user preferences) near the end of the prompt.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Assuming "it fits in the window" means "the model will use it". Raising top-k retrieval to 20 or 50 chunks without testing. Putting the question at the very top followed by 30,000 tokens of documents. Trusting a vendor\'s single-needle score for a task that needs combining several facts. And reordering chunks by relevance score from a weak retriever, which just puts the wrong chunks at the edges.' },
      ],
    },
    {
      id: 'reading-a-sweep',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: 'The test recipe said "score many runs". How many is "many"? Let us work through one result to see why this matters. Suppose (illustrative numbers) we ran our refund question 20 times at each depth and got 18 correct with the fact first (90%), 14 correct in the middle (70%) and 17 correct at the end (85%). It looks like a clear dip. Is it?' },
        { type: 'formula', expr: 'standard error = √( p · (1 − p) / n )', where: [['p', 'the measured accuracy as a fraction, e.g. 0.70'], ['n', 'the number of runs behind that accuracy'], ['standard error', 'how far the measured value typically lands from the true one, by chance alone']], caption: 'A rough rule: the true accuracy is very likely within about 2 standard errors of what we measured.' },
        { type: 'steps', title: 'Is a 70% middle really worse than a 90% edge?', items: [
          { title: 'Error of the middle cell', text: '`√(0.7 · 0.3 / 20) = √0.0105 ≈ 0.10`, so about 10 points.' },
          { title: 'Plausible range', text: 'Two standard errors each way: the true middle accuracy could be anywhere from about 50% to 90%.' },
          { title: 'Compare', text: 'That range reaches the 90% we measured at the edge. With 20 runs we **cannot** say the middle is worse. The dip may be chance.' },
          { title: 'Repeat with 100 runs', text: 'Suppose we again measure 70%. Now the error is `√(0.7 · 0.3 / 100) ≈ 0.046`, so the range is about 61% to 79%.' },
          { title: 'Compare again', text: 'The edge at 90% with 100 runs has an error of 3 points, so a range of about 84% to 96%. The two ranges no longer overlap. Now the dip is real.' },
        ] },
        { type: 'table', caption: 'Standard error of a measured accuracy near 60%, from the formula', head: ['Runs per cell', 'Standard error', 'Rough range around 60%'], rows: [
          ['10', '15.5 points', '29% to 91%'],
          ['20', '11.0 points', '38% to 82%'],
          ['50', '6.9 points', '46% to 74%'],
          ['100', '4.9 points', '50% to 70%'],
          ['400', '2.4 points', '55% to 65%'],
        ] },
        { type: 'p', text: 'To halve the error we need **four times** as many runs. That is expensive, so spend runs where they matter: fewer depths (start, middle, end) with more runs each tells us more than many depths with a handful of runs. And use several different facts and questions, not one question repeated, so that a single lucky or unlucky wording does not decide the result.' },
        { type: 'callout', tone: 'warn', title: 'The mistake this prevents', text: 'Teams often change the prompt, re-run a small sweep, see the middle go from 60% to 70% and ship the change. With 20 runs per cell, a 10-point move is well inside the noise. The "improvement" may vanish on the next run.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We cannot call a real model here, so we build a stand-in: a **simulated** model whose chance of using the fact follows a made-up U-shape. Because we know its true accuracy at every depth, we can see how well a position sweep recovers it, with 20 runs and with 1,000 runs per depth.' },
        { type: 'code', lang: 'python', title: 'practice_position_sweep.py', code: `import random

# A SIMULATED model, not a real one: its chance of using the fact follows a
# made-up U-shape. 0.95 at the edges of the context, 0.60 in the middle.
def simulated_model(depth, rng):
    p_correct = 0.60 + 0.35 * (2 * depth - 1) ** 2
    if rng.random() < p_correct:
        return "You have 45 days from delivery to request a refund."
    return "Refunds are usually possible within 30 days."      # the wrong default

def is_correct(answer):
    return "45 days" in answer                # simple string check for the needle

def sweep(runs, seed):
    rng = random.Random(seed)
    row = []
    for depth in (0.0, 0.25, 0.5, 0.75, 1.0):
        hits = sum(is_correct(simulated_model(depth, rng)) for _ in range(runs))
        row.append(100 * hits / runs)
    return row

print("depth of the fact       0%    25%    50%    75%   100%")
print("true chance (made up) " + "".join(
    f"{100 * (0.60 + 0.35 * (2 * d - 1) ** 2):7.1f}" for d in (0, 0.25, 0.5, 0.75, 1)))
for runs, seed in [(20, 1), (20, 2), (20, 3), (1000, 4)]:
    print(f"{runs:5d} runs per depth  " + "".join(f"{v:7.1f}" for v in sweep(runs, seed)))`, output: `depth of the fact       0%    25%    50%    75%   100%
true chance (made up)    95.0   68.8   60.0   68.8   95.0
   20 runs per depth    100.0   90.0   50.0   75.0   90.0
   20 runs per depth     90.0   70.0   45.0   65.0  100.0
   20 runs per depth     95.0   55.0   45.0   60.0   85.0
 1000 runs per depth     94.1   69.0   61.6   69.5   95.5`, walkthrough: [
          { lines: [3, 9], note: 'The stand-in for a model. `depth` runs from 0 (fact first) to 1 (fact last). It answers correctly with a probability that is 0.95 at both edges and 0.60 in the middle; otherwise it falls back to a wrong "30 days".' },
          { lines: [11, 12], note: 'The scorer: an answer counts as correct if it contains the needle text "45 days".' },
          { lines: [14, 20], note: 'The sweep: for each of five depths, ask `runs` times and record the percentage of correct answers.' },
          { lines: [22, 26], note: 'Three small sweeps of 20 runs disagree with each other: at 25% depth they report 90, 70 and 55 for a true value of 68.8. The 1,000-run sweep lands within about 2 points of the truth everywhere.' },
        ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Remove the U-shape: set `p_correct = 0.8` for every depth. Run the three 20-run sweeps again. Before running, predict whether any row will still *look* like it has a dip in the middle.',
          'Change the wrong answer to `"Refunds are possible within 30 days, not 45 days."` Predict the measured accuracy at every depth. What does this say about scoring by substring?',
          'Change the 20-run sweeps to 100 runs. Using the table from the previous section, predict how far the measured values will typically be from the true ones.',
        ] },
        { type: 'check', question: 'In the first 20-run sweep, the 25% depth scored 90%. A teammate concludes that this model has no problem at 25% depth. What do we tell them?', answer: 'That 20 runs cannot support the claim. The true value in our simulation is 68.8%. With 20 runs the standard error is about 10 points, so a result of 90% is an unlucky draw about two standard errors high, and such draws do happen: the other two sweeps gave 70% and 55% for the same depth. We need more runs, or at least several repeated sweeps, before we read anything into one cell.' },
        { type: 'check', question: 'Our scorer checks whether the answer contains "45 days". Name one answer it would wrongly count as correct and one it would wrongly count as wrong.', answer: 'Wrongly correct: "The policy is 30 days, not 45 days", which contains the text but gives the wrong answer. Wrongly wrong: "You have forty-five days" or "a 45-day window", which are right but do not contain the exact text. A substring check is quick, but we should read a sample of scored answers by hand, and tighten the check or use a more careful grader when the two disagree.' },
      ],
    },
    {
      id: 'key-points',
      title: 'Key points to remember',
      blocks: [
        { type: 'list', items: [
          'A big context window tells you what fits, not what gets used well.',
          'Accuracy versus position is often U-shaped: strong at the start and end, weaker in the middle, and worse with longer contexts.',
          'Causes are believed to include training-data patterns, attention favouring early tokens, distance decay in position encodings and distractors.',
          'Measure it on your model and task by sweeping the position and length of a known fact.',
          'Mitigate with fewer, reranked chunks, edges-first ordering, question-last prompts, quote-then-answer and map-reduce.',
        ] },
      ],
    },
  ],
  quiz: [
    { q: 'What does the "lost in the middle" problem describe?', options: ['Models simply cannot accept any input longer than their context window', 'Information at the start and end of a long context is used better than in the middle', 'Models gradually forget their own training data as a conversation gets longer and longer', 'Tokens in the middle of a long word are split incorrectly by the tokenizer'], answer: 1, explain: 'It is about how well information is used depending on its position, even when everything fits in the window.' },
    { q: 'In a position test, accuracy is 80% with the fact first, 55% in the middle, and 78% last. What shape is this, and which effects explain the ends?', options: ['A flat line; position has no real effect on accuracy', 'An upward slope; only recency at the end matters', 'A U-shape; primacy at the start, recency at the end', 'A downward slope; only primacy at the start matters'], answer: 2, explain: 'High at both ends and low in the middle is the U-shape. Start = primacy, end = recency.' },
    { q: 'Our RAG bot got worse after we increased retrieved chunks from 5 to 25. What is the best first change?', options: ['Rerank a larger candidate set, send only the top few, and ask the question last', 'Increase the temperature so the model explores more of the long retrieved context', 'Send 50 chunks instead so the right answer is definitely somewhere in there', 'Move the question to the very beginning of the prompt, before all the chunks'], answer: 0, explain: 'More chunks add distractors and push relevant ones into the middle. Fewer, better-ranked chunks and question-last ordering address both problems.' },
    { q: 'An edges-first reorder receives chunks ranked R1 (best) to R5. Which order does it produce?', options: ['R1, R2, R3, R4, R5', 'R5, R4, R3, R2, R1', 'R3, R1, R2, R4, R5', 'R1, R3, R5, R4, R2'], answer: 3, explain: 'Odd-ranked chunks go to the front (R1, R3, R5) and even-ranked chunks fill the back in reverse (R4, R2), so the two best are at the edges and the weakest in the middle.' },
    { q: 'Which statement is a misconception?', options: ['A model with a 1-million-token window will use information equally well wherever it appears', 'Passing a single-needle test does not guarantee good multi-fact reasoning over long contexts', 'Putting the question after long documents often helps', 'The dip in the middle tends to grow as the context gets longer'], answer: 0, explain: 'Window size says what fits, not how evenly it is used. Position effects should be measured on your own task, especially with harder multi-fact questions.' },
  ],
  takeaways: [
    'The context window limits what the model can see; position affects how well it uses what it sees.',
    'Accuracy vs position of the key fact is often U-shaped, and the middle dip tends to deepen with length.',
    'Likely causes: training-data patterns, attention favouring early tokens, distance decay in position encodings and distractors.',
    'Test with a depth × length sweep on your own task, including harder multi-fact variants.',
    'Fix with fewer reranked chunks, edges-first ordering, question-last prompts, quote-then-answer and map-reduce.',
  ],
  terms: [
    { term: 'Context window', def: 'The maximum number of tokens a model can take into account at once.' },
    { term: 'Lost in the middle', def: 'The tendency to under-use information placed in the middle of a long context.' },
    { term: 'Primacy effect', def: 'Better use or recall of information that appears first.' },
    { term: 'Recency effect', def: 'Better use or recall of information that appears last.' },
    { term: 'Needle in a haystack test', def: 'Hiding a known fact at different depths of filler text and checking if the model finds it.' },
    { term: 'Reranker', def: 'A model that re-scores retrieved chunks so only the most relevant few are sent to the LLM.' },
    { term: 'Map-reduce', def: 'Processing chunks separately and then combining the partial results.' },
  ],
};
