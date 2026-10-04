export default {
  id: 'large-reasoning-models',
  minutes: 22,
  hook: 'Why would a model that answers more slowly, and costs more per question, be the right choice for your hardest problems?',
  summary: 'A Large Reasoning Model (LRM) is an LLM trained, mostly with reinforcement learning on problems with checkable answers, to produce a long chain of reasoning before its final answer. Spending more tokens on thinking at answer time (test-time compute) makes it markedly better at maths, coding, logic and planning. The cost is latency and tokens, so we use LRMs for hard, multi-step problems and regular LLMs for simple, fast tasks.',
  sections: [
    {
      id: 'big-picture',
      title: 'The big picture',
      blocks: [
        { type: 'p', text: 'A regular LLM answers by predicting the next token, immediately. For "What is the capital of Japan?" that is perfect. For "Find the bug in this 300-line concurrency code" or a tricky maths proof, answering immediately is like blurting out the first thought. In 2024–2025 a new kind of model appeared that first **thinks** in a long internal monologue, checks itself, backtracks, and only then answers.' },
        { type: 'p', text: 'OpenAI\'s **o1** (September 2024) was the first widely used example. **DeepSeek-R1** (January 2025) showed openly how to train one. Since then most labs offer reasoning models or "thinking" modes. We call them **Large Reasoning Models (LRMs)**.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like an exam with scratch paper', text: 'A regular LLM must write the final answer straight onto the answer sheet. An LRM gets scratch paper: it can try an approach, notice an error, try another, and only then copy a clean answer over. On easy questions the scratch paper is a waste of time; on hard ones it makes all the difference.' },
        { type: 'p', text: 'Running example: a developer tools company with two jobs. Job A: label incoming GitHub issues as bug, feature or question. Job B: given a failing test and the code, find the root cause and propose a fix. We will see why these call for different kinds of models.' },
      ],
    },
    {
      id: 'what-is-lrm',
      title: 'What is a Large Reasoning Model (LRM)?',
      blocks: [
        { type: 'p', text: 'An LRM is still a Transformer language model, usually starting from a strong pre-trained LLM. What changes is **training** and **behaviour**: it is trained to generate a long stream of **reasoning tokens** (also called a chain of thought or "thinking") before the **final answer**. The reasoning may be shown to the user, summarised, or hidden, depending on the product.' },
        { type: 'p', text: 'In its thinking, an LRM typically breaks the problem into parts, tries a solution, verifies intermediate results, notices mistakes ("wait, that contradicts step 2"), and explores alternatives. These behaviours were not hand-coded; they emerged or were reinforced because they led to correct answers during training.' },
      ],
    },
    {
      id: 'llm-vs-lrm',
      title: 'LLM vs LRM',
      blocks: [
        { type: 'compare', title: 'Regular LLM vs Large Reasoning Model', options: [
          { name: 'Regular LLM', summary: 'Answers directly after reading the prompt.', pros: ['Fast, low latency', 'Cheap per request', 'Great for fluent writing, chat, extraction'], cons: ['Weaker on multi-step maths, logic, hard code', 'Commits to early mistakes'], bestFor: 'Simple Q&A, classification, summarisation, drafting' },
          { name: 'LRM', summary: 'Generates a long reasoning trace, then answers.', pros: ['Much stronger on maths, code, planning', 'Self-checks and backtracks', 'Quality scales with thinking budget'], cons: ['Slower (seconds to minutes)', 'Many more output tokens, so higher cost', 'Can overthink easy questions'], bestFor: 'Hard, multi-step problems with a checkable answer' },
        ], rows: [
          ['Output', 'Answer', 'Reasoning + answer'],
          ['Typical output tokens', 'Tens to hundreds', 'Hundreds to tens of thousands'],
          ['Key training stage', 'Instruction tuning + preference tuning', 'Plus large-scale RL on verifiable problems'],
          ['Prompting style', 'Examples and "think step by step" can help', 'Clear goal and constraints; let it think on its own'],
        ], verdict: 'Use an LRM when correctness on a hard problem matters more than speed; use a regular LLM for everything simple.' },
      ],
    },
    {
      id: 'how-it-thinks',
      title: 'How does an LRM actually think?',
      blocks: [
        { type: 'p', text: 'Mechanically, thinking is just more next-token prediction. The difference is that the model writes intermediate steps into its own context, and every later token can attend to them. Each written step becomes working memory. A Transformer has a fixed amount of computation per token, so producing more tokens is literally giving it more computation for the problem.' },
        { type: 'flow', title: 'An LRM answering a hard question', nodes: [
          { label: 'Prompt', detail: 'The question, e.g. a failing test plus the code under test.' },
          { label: 'Plan', detail: 'The model restates the goal and sketches an approach: "The test expects sorted output; check the comparator first."' },
          { label: 'Try', detail: 'It works through a hypothesis step by step, writing intermediate results.' },
          { label: 'Verify', detail: 'It checks the result against the requirements: "If I swap these lines, does test 3 still pass?"' },
          { label: 'Backtrack', detail: 'If a check fails, it revises: "Wait, the bug is in the off-by-one, not the comparator."' },
          { label: 'Answer', detail: 'A concise final answer, written after the thinking ends (often marked by a special end-of-thinking token).' },
        ] },
        { type: 'callout', tone: 'warn', title: 'The trace is not a perfect window into the model', text: 'Research has found that reasoning traces do not always faithfully reflect what drove the final answer; a model can reach an answer for reasons it does not write down. Treat the trace as a useful debugging aid, not as proof that the answer is right.' },
      ],
    },
    {
      id: 'test-time-compute',
      title: 'Test-time compute: thinking longer makes them smarter',
      blocks: [
        { type: 'p', text: '**Test-time compute** (or inference-time compute) means spending more computation when answering, rather than only when training. OpenAI reported with o1 that accuracy improved smoothly as the model was allowed to think longer, a new scaling axis alongside model size and training data. There are two main ways to spend it:' },
        { type: 'list', items: [
          '**Sequential:** one longer chain of thought, with more steps, checks and revisions. This is what an LRM\'s "reasoning effort" setting usually controls.',
          '**Parallel:** sample several independent solutions and combine them, for example by **majority vote** (also called self-consistency) or by a verifier that picks the best one.',
        ] },
        { type: 'code', lang: 'python', title: 'more_samples_more_accuracy.py', code: `import numpy as np
rng = np.random.default_rng(0)

# A model solves a problem correctly 60% of the time per attempt.
# Wrong attempts scatter across 4 different wrong answers.
p_correct, n_wrong, trials = 0.6, 4, 20_000

def one_attempt(size):
    correct = rng.random(size) < p_correct
    wrong_choice = rng.integers(1, n_wrong + 1, size)   # answers 1..4 are wrong
    return np.where(correct, 0, wrong_choice)            # answer 0 is right

for k in [1, 3, 5, 9, 17]:
    answers = one_attempt((trials, k))                   # k samples per question
    votes = np.apply_along_axis(np.bincount, 1, answers, minlength=n_wrong + 1)
    votes = votes + rng.random(votes.shape) * 0.1         # break ties at random
    majority_right = (votes.argmax(1) == 0).mean()
    print(f"samples={k:>2}  majority-vote accuracy={majority_right:.3f}  "
          f"tokens spent ~ {k * 800:>6} (800 per attempt)")

# Reward used in RL with verifiable answers: 1 if the final answer matches, else 0
def reward(model_answer, reference):
    return 1.0 if model_answer.strip() == reference.strip() else 0.0
print("reward('42', '42') =", reward("42", "42"), "| reward('41', '42') =", reward("41", "42"))`, output: `samples= 1  majority-vote accuracy=0.597  tokens spent ~    800 (800 per attempt)
samples= 3  majority-vote accuracy=0.725  tokens spent ~   2400 (800 per attempt)
samples= 5  majority-vote accuracy=0.836  tokens spent ~   4000 (800 per attempt)
samples= 9  majority-vote accuracy=0.940  tokens spent ~   7200 (800 per attempt)
samples=17  majority-vote accuracy=0.993  tokens spent ~  13600 (800 per attempt)
reward('42', '42') = 1.0 | reward('41', '42') = 0.0`,
          walkthrough: [
            { lines: [4, 11], note: 'A simulated model: right 60% of the time; when wrong, it picks one of 4 different wrong answers. Wrong answers disagree with each other; right answers agree.' },
            { lines: [13, 19], note: 'Draw k samples per question, count votes, break ties at random, and check if the most common answer is right. Accuracy climbs from 0.60 to 0.99 while tokens grow 17×.' },
            { lines: [21, 24], note: 'A verifiable reward: 1 for a matching final answer, 0 otherwise. Rewards like this drive the RL training described next.' },
          ] },
        { type: 'chart', kind: 'line', title: 'Accuracy vs test-time compute (from the simulation above)', xLabel: 'Tokens spent per question (thousands)', yLabel: 'Accuracy', series: [ { name: 'Majority vote', points: [[0.8, 0.597], [2.4, 0.725], [4.0, 0.836], [7.2, 0.94], [13.6, 0.993]] } ], caption: 'Simulated with a 60%-accurate model and spread-out wrong answers. Real gains depend on the task; if the model is usually wrong in the same way, voting helps little.' },
        { type: 'check', question: 'In the simulation, why does voting help so much? When would it fail?', answer: 'Correct answers agree with each other while wrong answers scatter, so the right answer usually wins the vote. If the model makes the same wrong answer most of the time (a systematic error), voting amplifies that error instead, and more samples do not help.' },
      ],
    },
    {
      id: 'how-trained',
      title: 'How are LRMs trained?',
      blocks: [
        { type: 'p', text: 'The key ingredient is **reinforcement learning with verifiable rewards (RLVR)**. Instead of humans rating answers, the training uses problems whose answers can be checked automatically: maths with known results, code with unit tests, puzzles with a checker. The model generates reasoning and an answer; a program checks the answer and gives a reward; the model is updated to make rewarded reasoning more likely.' },
        { type: 'steps', title: 'A typical LRM training pipeline (details vary by lab)', items: [
          { title: 'Start from a strong base LLM', text: 'Pre-training gives knowledge and language skill.' },
          { title: 'Cold-start SFT (optional)', text: 'Fine-tune on a small set of high-quality long reasoning examples so the model learns the format and readable style.' },
          { title: 'Large-scale RL on verifiable tasks', text: 'Sample several solutions per problem, reward correct final answers (and often a correct format), and update with a policy-gradient method. DeepSeek-R1 used **GRPO**, which compares each sample\'s reward with the average of its group instead of training a separate value model.' },
          { title: 'Broaden and align', text: 'More SFT and RL on general tasks so the model stays helpful and safe outside maths and code.' },
          { title: 'Distil (optional)', text: 'Use the LRM\'s reasoning traces to fine-tune smaller models, which become surprisingly good reasoners. DeepSeek released such distilled models alongside R1.' },
        ] },
        { type: 'p', text: 'A striking result from DeepSeek\'s report: **R1-Zero**, trained with RL alone and no SFT, learned on its own to produce longer reasoning and to re-check its work, with the response length growing during training. Its output was harder to read, which is why the released R1 added a cold-start SFT stage.' },
      ],
    },
    {
      id: 'inputs-outputs',
      title: 'Input and output: training phase vs prediction phase',
      blocks: [
        { type: 'table', head: ['', 'Training phase (RL)', 'Prediction phase (use)'], rows: [
          ['Input', 'A problem plus a hidden reference answer or test suite', 'The user\'s prompt (and optionally a reasoning-effort setting)'],
          ['What the model produces', 'Several sampled reasoning traces with final answers', 'One reasoning trace, then the final answer'],
          ['What happens next', 'A checker scores each final answer; the model is updated toward higher-reward traces', 'The answer (and maybe a summary of the reasoning) is returned'],
          ['Who checks correctness', 'An automatic verifier', 'Nobody, unless we add a verifier or tests'],
        ] },
        { type: 'p', text: 'Note the last row: in training, wrong answers are caught by the checker. In use, the model\'s confident-sounding reasoning still needs our own checks (tests, validation) for high-stakes outputs.' },
      ],
    },
    {
      id: 'when-to-use',
      title: 'When to use an LRM, and when to use a regular LLM',
      blocks: [
        { type: 'list', items: [
          '**Use an LRM** for multi-step maths and science, debugging and non-trivial coding, planning with constraints, careful analysis of long documents, and agent tasks where one wrong step ruins the result.',
          '**Use a regular LLM** for chat, rewriting, translation, summaries, simple extraction and classification, and anything latency-sensitive such as autocomplete or voice.',
          '**Mix them:** route by difficulty, or let a fast model handle routine steps and call a reasoning model for the hard ones. Many APIs expose a reasoning-effort knob (e.g. low / medium / high) so one model can do both.',
        ] },
        { type: 'callout', tone: 'example', title: 'The developer tools company', text: 'Job A (labelling issues) goes to a regular LLM or even a small model: it is simple, high-volume and latency-sensitive. Job B (root-causing a failing test) goes to an LRM with a high reasoning effort, and its proposed fix is validated by actually running the tests.' },
      ],
    },
    {
      id: 'popular-lrms',
      title: 'Popular LRMs we should know',
      blocks: [
        { type: 'timeline', title: 'Notable reasoning models', items: [
          { when: 'Sep 2024', title: 'OpenAI o1', text: 'First widely used reasoning model; showed accuracy rising with thinking time.' },
          { when: 'Jan 2025', title: 'DeepSeek-R1', text: 'Open weights and a public recipe: RL with verifiable rewards (GRPO), plus distilled smaller models.' },
          { when: '2025', title: 'Thinking modes everywhere', text: 'Anthropic Claude extended thinking, Google Gemini 2.5 thinking, OpenAI o3/o4-mini, Qwen3 thinking mode, gpt-oss reasoning effort levels.' },
          { when: '2026', title: 'Reasoning as a dial', text: 'Models such as DeepSeek-V4 offer several modes (e.g. Non-think, Think High, Think Max) in one model.' },
        ] },
        { type: 'p', text: 'Names and versions change quickly; the pattern to remember is that reasoning has become a setting on many general models rather than only a separate model family.' },
      ],
    },
    {
      id: 'common-mistakes',
      title: 'Common mistakes when using LRMs',
      blocks: [
        { type: 'list', items: [
          '**Using them for everything.** Simple tasks become slow and expensive, and models can **overthink**, talking themselves out of a correct easy answer.',
          '**Ignoring reasoning tokens in the budget.** Thinking tokens are usually billed as output tokens and count against output limits even when hidden. Set a sensible effort level and max tokens.',
          '**Over-prompting.** Adding "think step by step" or long few-shot examples is often unnecessary and can even hurt; vendors generally advise giving a clear goal, constraints and success criteria instead.',
          '**Trusting the trace as proof.** A fluent reasoning trace can still end in a wrong answer. Verify with tests, calculations or sources.',
          '**Expecting unlimited scaling.** Studies have found that on puzzles beyond a certain complexity, reasoning models can still collapse; more thinking is not a guarantee.',
        ] },
        { type: 'check', question: 'A team switches its customer FAQ bot from a regular LLM to an LRM. Answers barely improve, but latency triples and the bill doubles. What went wrong?', answer: 'FAQ answers are simple lookups that do not need multi-step reasoning, so the extra thinking adds cost and latency without benefit. Use a regular LLM (plus retrieval) for the FAQ and reserve the LRM, or a higher reasoning effort, for genuinely hard queries.' },
      ],
    },
    {
      id: 'quick-summary',
      title: 'Quick summary',
      blocks: [
        { type: 'list', items: [
          'An LRM is an LLM trained to think in a long reasoning trace before answering.',
          'More test-time compute (longer thinking or more samples) buys accuracy on hard problems.',
          'RL with automatically verifiable rewards is the core training ingredient; GRPO is a common method.',
          'Use LRMs for hard, checkable, multi-step work; use regular LLMs for simple, fast tasks.',
          'Budget for reasoning tokens, prompt simply, and verify outputs.',
        ] },
      ],
    },
  ],
  quiz: [
    { q: 'What most distinguishes a Large Reasoning Model from a regular LLM?', options: ['It uses a completely different, non-Transformer architecture', 'It is trained, mainly with RL, to reason before it answers', 'It has no context window limit, so it can read any input', 'It only works on images and diagrams, not plain text'], answer: 1, explain: 'LRMs are usually Transformers like regular LLMs; the difference is training (RL with verifiable rewards) and the think-then-answer behaviour.' },
    { q: 'In the simulation, a model is right 60% of the time and wrong answers are spread out. What happens as we go from 1 to 17 majority-voted samples?', options: ['Accuracy stays at 60% because each sample is no better', 'Accuracy falls because the extra samples only add noise', 'Accuracy rises to ~99%, but tokens spent grow 17×', 'Accuracy reaches 100% with no extra cost in tokens'], answer: 2, explain: 'Agreeing correct answers win the vote, so accuracy rose from ~0.60 to ~0.99, while cost grew with the number of samples.' },
    { q: 'What is a "verifiable reward" in LRM training?', options: ['An automatic check, e.g. a known result or unit tests', 'A human rating of how pleasant and polite the answer sounds', 'The model\'s own stated confidence in its final answer', 'The number of tokens in the reasoning trace, longer is better'], answer: 0, explain: 'RLVR uses programs that check correctness automatically, which scales far better than human ratings.' },
    { q: 'Which task is the best fit for an LRM rather than a regular LLM?', options: ['Translating a short product description into Spanish', 'Autocompleting the user\'s sentence in real time as they type', 'Finding the root cause of a failing test in a codebase', 'Tagging each support email as positive or negative'], answer: 2, explain: 'Debugging is multi-step and checkable, exactly where thinking helps. The others are simple or latency-sensitive.' },
    { q: 'A developer says: "The LRM\'s reasoning trace looks careful and logical, so the answer must be correct." Why is this a mistake?', options: ['Reasoning traces are random text unrelated to the answer', 'A trace can be unfaithful or wrong; verify the answer', 'LRMs never show any part of their reasoning to users', 'Only answers shorter than 100 tokens can be trusted'], answer: 1, explain: 'A fluent trace can still contain errors or not reflect what drove the answer. Verify with tests, calculations or sources.' },
  ],
  takeaways: [
    'An LRM is an LLM trained to reason in a long chain of thought before answering.',
    'Test-time compute (longer thinking, more samples) is a new way to buy accuracy.',
    'RL with automatically verifiable rewards (maths, code, puzzles) is the core training method.',
    'LRMs are slower and cost more tokens, so use them for hard, multi-step, checkable problems.',
    'Prompt simply, budget reasoning tokens, and verify answers instead of trusting the trace.',
  ],
  terms: [
    { term: 'Large Reasoning Model (LRM)', def: 'An LLM trained to produce a long reasoning trace before its final answer.' },
    { term: 'Chain of thought', def: 'Intermediate reasoning steps written out before the final answer.' },
    { term: 'Test-time compute', def: 'Extra computation spent while answering, such as longer reasoning or more samples.' },
    { term: 'Self-consistency', def: 'Sampling several answers and choosing the most common one.' },
    { term: 'RLVR', def: 'Reinforcement learning with verifiable rewards: rewards come from automatic correctness checks.' },
    { term: 'GRPO', def: 'Group Relative Policy Optimization: an RL method that scores each sample against its group\'s average reward.' },
    { term: 'Reasoning effort', def: 'An API setting that controls how much a model thinks before answering.' },
  ],
};
