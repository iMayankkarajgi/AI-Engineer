export default {
  id: 'decoding-sakana-fugu',
  minutes: 20,
  hook: 'What if, instead of training one giant model to be best at everything, we trained a model whose only skill is knowing which other model to ask, and how to make them work together?',
  summary: 'Sakana Fugu is an orchestration model from Sakana AI: a trained language model that sits in front of a pool of other LLMs and decides who should handle each request. Fugu routes each query to a single best worker using a small "selection head", trained first with supervised fine-tuning and then polished with evolutionary strategies. Fugu-Ultra writes whole multi-agent workflows in natural language, is trained with reinforcement learning (GRPO), and controls what each agent can see so agents do not simply copy each other.',
  sections: [
    {
      id: 'what-is-fugu',
      title: 'What is Sakana Fugu?',
      blocks: [
        { type: 'p', text: '**Sakana Fugu** is a family of *orchestration models* from the Tokyo-based lab Sakana AI, described in the "Sakana Fugu Technical Report" (arXiv, June 2026) and offered through an API that looks like an ordinary chat-model endpoint. You send a request to Fugu; behind the scenes Fugu decides which models in its **worker pool** (frontier LLMs from several providers, plus others) should handle it, calls them, and returns the answer.' },
        { type: 'p', text: 'An **orchestrator** here is not hand-written code with if/else rules. It is itself a trained model. Sakana calls the overall idea **collective intelligence**: many models with different strengths, coordinated well, can beat any one of them alone.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a hospital\'s triage nurse and case manager', text: 'A triage nurse is not the best surgeon or the best cardiologist. Their expertise is knowing, within seconds, which specialist a patient needs. For complex cases, a case manager goes further: they organise a team, decide who examines first, who reviews whose notes, and who makes the final call. Fugu is the triage nurse; Fugu-Ultra is the case manager.' },
        { type: 'p', text: 'This is a young system and many details (the backbone model, the exact pool, training data) are not public. In this lesson we explain the mechanisms the report describes, at the level we can state with confidence, and we mark what is uncertain.' },
      ],
    },
    {
      id: 'why-fugu',
      title: 'Why Fugu was needed',
      blocks: [
        { type: 'list', items: [
          '**No model is best at everything.** One frontier model may lead on coding, another on science questions, a third on long-context reading. Strengths shift with every release.',
          '**Users and developers must choose.** Picking a model per task by hand is tedious, and hand-written routing rules ("if the prompt mentions Python, use model A") are brittle.',
          '**Combining models is hard.** Debate, review and voting can help, but designing who does what, for each kind of question, is a skill in itself.',
          '**New models arrive constantly.** A system that composes models through their APIs can add a new worker without retraining it, or even seeing its weights.',
        ] },
        { type: 'p', text: 'Fugu\'s bet is that **coordination can be learned**: train a model on many tasks where we can check the answer, and let it discover which worker, or which team arrangement, tends to succeed.' },
      ],
    },
    {
      id: 'big-picture',
      title: 'The big picture: what Fugu does',
      blocks: [
        { type: 'flow', title: 'A request through Fugu and Fugu-Ultra', nodes: [
          { label: 'Request', detail: 'A user or app sends a normal chat request to the Fugu endpoint.' },
          { label: 'Fugu: pick one', detail: 'Fugu reads the request and its selection head scores every worker; the top-scoring worker answers. Latency is close to calling that model directly.' },
          { label: 'Fugu-Ultra: plan a team', detail: 'For hard tasks, Fugu-Ultra writes a workflow: subtasks, which worker does each, and which earlier results each worker may see.' },
          { label: 'Workers run', detail: 'Pool models (and possibly Fugu itself, recursively) carry out their parts.' },
          { label: 'Answer', detail: 'The final result returns to the user as one response.' },
        ] },
        { type: 'compare', title: 'The two Fugus', options: [
          { name: 'Fugu', summary: 'Picks a single worker per request.', pros: ['Latency close to a direct model call', 'Cost close to the chosen model', 'Simple to reason about'], cons: ['No teamwork: one model must solve it alone'], bestFor: 'Everyday chat, coding help, quick questions' },
          { name: 'Fugu-Ultra', summary: 'Composes multi-agent workflows per request.', pros: ['Can split, cross-check and combine work', 'Higher quality on hard tasks (as reported)'], cons: ['More latency and tokens', 'Harder to audit what happened'], bestFor: 'Long, complex tasks: hard coding, research, difficult reasoning' },
        ], rows: [
          ['Decision per request', 'Which one worker?', 'Which team, which steps, who sees what?'],
          ['Output of the orchestrator', 'A choice (scores over workers)', 'A workflow written in natural language'],
          ['Training (as described)', 'SFT, then evolutionary strategies', 'Reinforcement learning with GRPO'],
        ], verdict: 'Fugu optimises for speed with smart routing; Fugu-Ultra trades latency for teamwork on the hardest tasks.' },
      ],
    },
    {
      id: 'collective-intelligence',
      title: 'Collective intelligence',
      blocks: [
        { type: 'p', text: '**Collective intelligence** is the idea that a group can be smarter than its best member, if the members are different from each other and their contributions are combined well. For LLMs this works through two effects:' },
        { type: 'list', items: [
          '**Selection**: for each question, pick the member most likely to be right. If models are strong in different areas, picking per question beats always using one.',
          '**Combination**: let several members contribute, then check, debate or merge. This can catch errors that any single model would make, *if* their errors are not all the same.',
        ] },
        { type: 'matrix', title: 'Toy success rates: worker × domain (illustrative)', rows: ['Worker A', 'Worker B', 'Worker C', 'Worker D'], cols: ['Code', 'Math', 'Science'], values: [[0.80, 0.55, 0.60], [0.60, 0.85, 0.65], [0.62, 0.60, 0.82], [0.70, 0.70, 0.70]], format: 'pct', caption: 'Illustrative numbers used in this lesson\'s code. No single row is best in every column. Always using D gives 70%; picking the best worker per domain gives (80 + 85 + 82) / 3 ≈ 82%.' },
        { type: 'check', question: 'If every worker had exactly the same strengths and weaknesses, how much would per-question selection help?', answer: 'Almost nothing. Selection only pays off when workers differ; if every row of the matrix were identical, choosing among them could not beat always using one. Diversity in the pool is what an orchestrator exploits.' },
      ],
    },
    {
      id: 'selection-head',
      title: 'How Fugu picks the right model: the lightweight selection head',
      blocks: [
        { type: 'p', text: 'A naive LLM router would *generate text* like "Use worker B" and parse it. That costs decoding time. Fugu instead adds a **selection head**: a small extra layer that sits next to the normal language-model output head of its backbone model.' },
        { type: 'steps', title: 'How a selection decision is made', items: [
          { title: 'Read the request', text: 'The backbone transformer processes the request, producing a **hidden state** (a vector) for each token position.' },
          { title: 'Take one hidden state', text: 'Per the report, a hidden state from an early position is used, so no long text needs to be generated first.' },
          { title: 'Score every worker', text: 'The selection head maps that vector to one **logit** (a raw score) per worker in the pool. With 4 workers we get 4 numbers.' },
          { title: 'Pick and dispatch', text: 'The highest-scoring worker is called immediately with the request. The orchestration overhead is a single forward pass.' },
        ] },
        { type: 'formula', expr: 'scores = W · h + b,   p(worker = i | request) = softmax(scores)ᵢ', where: [ ['h', 'hidden-state vector of the backbone for this request'], ['W, b', 'the selection head\'s weights: one row per worker'], ['softmax', 'turns scores into probabilities that sum to 1'] ], caption: 'A selection head is essentially a linear classifier over workers on top of the backbone\'s understanding of the request.' },
        { type: 'p', text: 'This is why Fugu can be fast: the expensive part (the chosen worker\'s answer) is unavoidable, and the routing part adds very little.' },
      ],
    },
    {
      id: 'sft-and-es',
      title: 'Teaching Fugu who is best: SFT, then evolutionary strategies',
      blocks: [
        { type: 'p', text: '**Supervised fine-tuning (SFT)** means training on examples with known targets. For Fugu, the targets come from experiments: on tasks with checkable answers (code with tests, maths with known results), every worker is tried several times. Each worker\'s success rate becomes a reward, and a softmax turns the rewards into a **soft target**: a probability distribution that puts most weight on the best workers but still gives some to good alternatives. The head is trained to make its predicted distribution close to that target, by minimising the **KL divergence** (a measure of how different two probability distributions are).' },
        { type: 'p', text: 'SFT has a gap: it imitates per-step rewards measured offline, while what we really care about is the end result, including multi-turn and interactive tasks where one routing choice affects later ones. So the report describes a second stage using an **evolutionary strategy (ES)**: a black-box optimiser that perturbs the parameters, measures the real end-to-end score of each perturbed version, and moves towards the better ones. The specific algorithm named is **sep-CMA-ES**, a variant of CMA-ES (Covariance Matrix Adaptation Evolution Strategy) that keeps only a diagonal covariance so it scales to many parameters. ES needs no gradients, so the reward can be any score, even one produced by running full agent sessions.' },
        { type: 'code', lang: 'python', title: 'selection_head_toy.py', code: `# A toy "selection head": learn which worker model to call for each query (numpy).
import numpy as np
rng = np.random.default_rng(0)

# 4 workers x 3 domains (code, math, science): true success rates (illustrative)
P = np.array([[0.80, 0.55, 0.60],    # worker A: strong coder
              [0.60, 0.85, 0.65],    # worker B: strong at math
              [0.62, 0.60, 0.82],    # worker C: strong at science
              [0.70, 0.70, 0.70]])   # worker D: good all-rounder
def queries(n):                      # hidden state stand-in: domain one-hot + noise
    d = rng.integers(0, 3, n)
    return np.eye(3)[d] + 0.3 * rng.normal(size=(n, 3)), d

X, d = queries(600)
# SFT targets: try every worker 8 times per query, softmax the average reward
wins = rng.binomial(8, P[:, d].T) / 8           # (600 queries, 4 workers)
T = np.exp(wins / 0.1); T /= T.sum(1, keepdims=True)

W = np.zeros((3, 4))                            # the selection head: one logit per worker
for _ in range(300):                            # minimise KL(T || softmax(XW))
    Z = X @ W; Q = np.exp(Z - Z.max(1, keepdims=True)); Q /= Q.sum(1, keepdims=True)
    W -= 0.5 * X.T @ (Q - T) / len(X)           # gradient of cross-entropy w.r.t. W

def success(W, n=3000):                         # expected success if we follow the head
    Xt, dt = queries(n)
    return P[(Xt @ W).argmax(1), dt].mean()

print("always one model (worker D): ", round(P[3].mean(), 3))
print("oracle (best worker per query):", round(P.max(0).mean(), 3))
print("after SFT selection head:     ", round(success(W), 3))

for _ in range(30):                             # evolution strategy: perturb, keep the best
    cands = [W] + [W + 0.2 * rng.normal(size=W.shape) for _ in range(8)]
    W = max(cands, key=lambda c: success(c, 1000))
print("after ES polishing:           ", round(success(W), 3))`, output: `always one model (worker D):  0.7
oracle (best worker per query): 0.823
after SFT selection head:      0.819
after ES polishing:            0.82`, walkthrough: [
          { lines: [5, 9], note: 'Illustrative success rates for 4 workers in 3 domains (the matrix above).' },
          { lines: [10, 12], note: 'A stand-in for the backbone\'s hidden state: the query\'s domain as a one-hot vector plus noise, so the head must learn to read it.' },
          { lines: [14, 17], note: 'SFT targets: try every worker 8 times per training query, average the wins, and softmax with temperature 0.1 to get a soft target over workers.' },
          { lines: [19, 22], note: 'Train the selection head W (one logit per worker) by gradient descent on the cross-entropy to the soft targets, which minimises the KL divergence.' },
          { lines: [24, 30], note: 'Measure expected success on fresh queries if we always follow the head, and compare with always using one model and with a perfect oracle.' },
          { lines: [32, 35], note: 'A very simple evolution strategy: try 8 random perturbations of W, keep whichever scores best end-to-end, repeat 30 times. (Real sep-CMA-ES also adapts the step size and shape.)' },
        ] },
        { type: 'p', text: 'In this toy, SFT already gets the head to 81.9%, very close to the 82.3% oracle and far above the 70% of always using one model. ES adds almost nothing here, because the SFT targets already match our goal exactly. ES matters in the real system where offline per-step rewards do *not* fully reflect end-to-end success.' },
        { type: 'deeper', title: 'Why soft targets instead of "the single best worker"?', blocks: [
          { type: 'p', text: 'With 8 trials per worker, success estimates are noisy: a worker with true rate 0.80 may score 6/8 or 8/8 by chance. A hard label ("worker A won") throws away how close the others were and overreacts to noise. A soft target such as `[0.64, 0.12, 0.12, 0.12]` tells the head "A is likely best, the rest are similar", which is more honest and trains a better-calibrated router. The softmax temperature sets how sharp the target is: lower temperature = closer to a hard label.' },
        ] },
      ],
    },
    {
      id: 'conductor-and-grpo',
      title: 'How Fugu-Ultra conducts an orchestra: the Conductor, GRPO and isolation',
      blocks: [
        { type: 'p', text: 'Fugu-Ultra builds on Sakana\'s earlier research system called the **Conductor**. Instead of outputting a choice, the Conductor writes a **workflow in natural language**. Each step in the workflow contains three things:' },
        { type: 'list', items: [
          '**A subtask**: what this step should accomplish, in plain language (for example, "write a failing test that reproduces the bug").',
          '**An assigned worker**: which model in the pool performs it (possibly Fugu itself, recursively).',
          '**An access list**: which earlier steps\' outputs this worker is allowed to see.',
        ] },
        { type: 'p', text: 'Because the workflow is free-form text, any coordination shape that can be described in words is possible: a pipeline, parallel attempts with a judge, a debate, a tree. The report adds **adaptive agent memory** for long, tool-heavy tasks: persistent shared memory across turns of a conversation, but isolation inside a workflow (next section).' },
        { type: 'p', text: 'How do we teach a model to write good workflows? There is no dataset of "correct workflows". So Fugu-Ultra is trained with reinforcement learning using **GRPO (Group Relative Policy Optimization)**. For one training question, the model samples a *group* of different workflows; each is executed and scored (for example, a reward for a well-formed workflow and a reward for a correct final answer). Each workflow\'s **advantage** is how much better it did than the group average. Workflows that beat their siblings become more likely; worse ones, less likely. No separate value model is needed.' },
        { type: 'formula', expr: 'Aᵢ = (rᵢ − mean(r₁…r_G)) / std(r₁…r_G)', where: [ ['rᵢ', 'reward of workflow i in the group'], ['G', 'group size: how many workflows were sampled for this question'], ['Aᵢ', 'advantage: positive means better than its siblings'] ], caption: 'Example: rewards [1, 0, 1, 0] have mean 0.5 and std 0.5, giving advantages [+1, −1, +1, −1].' },
        { type: 'check', question: 'For one question, GRPO samples four workflows with rewards [1, 1, 1, 1]. What do the advantages look like and what does the model learn from this group?', answer: 'All rewards equal the mean, so every advantage is 0 (implementations guard against dividing by a zero std). The group gives no learning signal: when every workflow succeeds (or every one fails), there is nothing to prefer. Useful questions are those where some workflows succeed and others fail.' },
        { type: 'p', text: '**Stopping the agents from copying each other.** A team of models helps only if members bring **independent** ideas. If the second agent can read everything the first agent did, it tends to follow the same path, including the same mistakes. The team collapses into one opinion, and the extra calls are wasted.' },
        { type: 'p', text: 'Fugu-Ultra handles this with **intra-workflow isolation**. Inside a workflow, an agent sees only its own past actions plus the outputs that the access list explicitly grants. So the Conductor can ask three workers to solve a problem *independently*, then give a fourth worker access to all three answers to compare and decide. Isolation is the default; sharing is a deliberate choice written into the plan.' },
        { type: 'callout', tone: 'tip', title: 'A lesson that applies to any multi-agent system', text: 'Independent first, then combine. Whether you are building your own debate, review or voting system, do not let every agent see every other agent\'s draft before it has formed its own answer.' },
      ],
    },
    {
      id: 'performance',
      title: 'How well does Fugu perform?',
      blocks: [
        { type: 'p', text: 'Sakana reports state-of-the-art or near state-of-the-art results across coding, science and reasoning benchmarks, often above the individual frontier models in its pool. Some headline numbers it published for Fugu-Ultra:' },
        { type: 'chart', kind: 'hbar', title: 'Fugu-Ultra scores reported by Sakana (%)', xLabel: 'Score (%)', unit: '%', labels: ['GPQA-Diamond', 'LiveCodeBench', 'Terminal-Bench 2.1', 'SWE-Bench Pro'], series: [ { name: 'Fugu-Ultra (reported)', values: [95.5, 93.2, 82.1, 73.7] } ], caption: 'Numbers as reported by Sakana AI at launch (2026). Different benchmarks have different scales of difficulty, so do not compare bars with each other. Independent reproduction was limited at the time of writing.' },
        { type: 'p', text: 'Sakana also reported strong results for the cheaper Fugu on some tasks (for example around 60% on SciCode). Treat all of these carefully:' },
        { type: 'list', items: [
          '**Self-reported**: published by the vendor, not yet widely reproduced.',
          '**The pool is not fully disclosed** per request, so it is hard to tell how much gain comes from orchestration versus simply having access to strong workers.',
          '**Cost and latency**: early hands-on reviews noted that Fugu-Ultra can spend many tokens and much time on orchestration for simple questions. The faster Fugu is meant for those.',
          '**Moving target**: as workers are updated, scores change.',
        ] },
      ],
    },
    {
      id: 'discovered-strategies',
      title: 'The clever strategies Fugu discovered on its own',
      blocks: [
        { type: 'p', text: 'Because the Conductor can describe any workflow in words, and GRPO rewards whatever works, Fugu-Ultra was not told which strategies to use. The report describes patterns that emerged from training, such as:' },
        { type: 'list', items: [
          '**Domain-aware routing**: sending questions to different workers depending on subject area, even within one benchmark.',
          '**Debate and aggregation**: several workers answer independently, possibly over multiple rounds, and a final worker weighs the answers. Useful for knowledge-heavy questions.',
          '**Tree-shaped teams**: splitting a question into branches explored by different workers, then merging.',
          '**Build-and-debug**: for coding, one worker writes, another tests or reviews, and the work is revised.',
        ] },
        { type: 'p', text: 'These are familiar human-designed patterns from the orchestration lesson. The interesting part is that a trained orchestrator chose *when* to use each one, per question.' },
        { type: 'callout', tone: 'warn', title: 'Do not over-read "it discovered strategies"', text: 'Emergent here means the strategies were not hard-coded, not that the model invented new science. RL rediscovers what works on its training tasks, and it can also overfit to benchmarks. Real-world gains depend on whether your tasks look like those it was trained on.' },
      ],
    },
    {
      id: 'quick-summary',
      title: 'Quick summary',
      blocks: [
        { type: 'p', text: 'Sakana Fugu is a trained orchestration model that coordinates a pool of other LLMs. Fugu picks one worker per request using a light selection head on the backbone\'s hidden state, trained with SFT on soft targets from measured worker success and polished with sep-CMA-ES on end-to-end results. Fugu-Ultra builds on the Conductor: it writes natural-language workflows of subtasks, workers and access lists, and is trained with GRPO, which rewards workflows that beat their siblings. Intra-workflow isolation keeps agents independent so the team does not collapse into one opinion. Reported benchmark results are strong but self-reported; the pool and training details are only partly public.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does Fugu\'s selection head output?', options: ['A full natural-language workflow of subtasks', 'One score (logit) per worker in the pool', 'A merged answer combining all the workers', 'A new set of weights for the chosen worker'], answer: 1, explain: 'The selection head is a small layer that maps a hidden state to one logit per worker; the highest-scoring worker is called. Natural-language workflows are what Fugu-Ultra\'s Conductor produces.' },
    { q: 'A team builds a "review" system: agent 2 reads agent 1\'s full reasoning before answering, then agent 3 reads both. They find agent 2 and 3 almost always agree with agent 1, even when it is wrong. What idea from Fugu-Ultra addresses this?', options: ['Use a higher sampling temperature for agent 1 only', 'Isolate agents; share only via explicit access lists', 'Replace all three agents with copies of one model', 'Add more agents that also read agent 1\'s reasoning'], answer: 1, explain: 'Seeing the first agent\'s full path makes later agents copy it. Intra-workflow isolation keeps each agent\'s work independent, and explicit access lists share outputs only at a deliberate combining step.' },
    { q: 'In GRPO, one question\'s group of four workflows gets rewards [1, 0, 0, 1]. What are the advantages?', options: ['[+1, −1, −1, +1]', '[1, 0, 0, 1]', '[+0.5, −0.5, −0.5, +0.5]', '[0, 0, 0, 0]'], answer: 0, explain: 'Mean = 0.5, standard deviation = 0.5. Advantage = (r − 0.5) / 0.5, giving +1 for the successes and −1 for the failures. [+0.5, −0.5, …] forgets to divide by the standard deviation.' },
    { q: 'How do Fugu and Fugu-Ultra differ?', options: ['Fugu writes multi-agent workflows; Fugu-Ultra picks one worker', 'Fugu routes to one worker; Fugu-Ultra builds agent teams', 'They are the same model sold under two different names', 'Fugu-Ultra is just a larger worker model inside Fugu\'s pool'], answer: 1, explain: 'Fugu is the fast router (one worker, latency close to a direct call). Fugu-Ultra writes workflows with multiple agents and access lists, trading latency for quality on harder tasks.' },
    { q: 'Which statement about Fugu is a misconception?', options: ['Fugu composes workers through their APIs, without needing their weights', 'Evolution strategies can optimise end-to-end scores with no gradients', 'Its reported scores prove orchestration wins on every task', 'Soft targets keep information about how close other workers were'], answer: 2, explain: 'The results are self-reported on specific benchmarks, the pool is not fully disclosed, and orchestration adds cost and latency. Gains depend on the task; they are not guaranteed everywhere.' },
  ],
  takeaways: [
    'Fugu is a trained orchestration model: its skill is choosing and coordinating other LLMs.',
    'Fugu routes each request to one worker via a light selection head on the backbone\'s hidden state.',
    'Training: SFT towards soft targets from measured worker success, then sep-CMA-ES on end-to-end results.',
    'Fugu-Ultra writes natural-language workflows (subtask, worker, access list) and is trained with GRPO.',
    'Isolation inside a workflow keeps agents independent, so teamwork adds diversity instead of copies.',
    'Reported scores are strong but vendor-reported; details of the pool and training are only partly public.',
  ],
  terms: [
    { term: 'Orchestration model', def: 'A model trained to decide which other models to call and how to combine them.' },
    { term: 'Worker pool', def: 'The set of LLMs an orchestrator can delegate to.' },
    { term: 'Selection head', def: 'A small layer that maps the backbone\'s hidden state to one score per worker.' },
    { term: 'Soft target', def: 'A probability distribution used as a training label instead of a single correct class.' },
    { term: 'sep-CMA-ES', def: 'A scalable evolution strategy that searches parameters using only end-to-end scores, no gradients.' },
    { term: 'GRPO', def: 'Group Relative Policy Optimization: RL that scores each sample relative to the average of its group.' },
    { term: 'Intra-workflow isolation', def: 'Letting each agent see only its own work plus outputs explicitly granted by the access list.' },
  ],
};
