export default {
  id: 'continual-learning-in-llms',
  minutes: 23,
  hook: 'If we teach a trained model one new thing, why might it suddenly get worse at the things it already knew?',
  summary: 'Continual learning is training a model on a stream of new data or tasks over time without losing what it learned before. Neural networks tend to suffer catastrophic forgetting: new training overwrites shared weights that old skills depended on. Practical fixes include replaying old data, penalising changes to important weights, giving new tasks their own parameters, and keeping fast-changing facts outside the model.',
  sections: [
    {
      id: 'what-is-cl',
      title: 'What is continual learning?',
      blocks: [
        { type: 'p', text: '**Continual learning** (also called **lifelong** or **incremental learning**) means a model keeps learning from new data or new tasks that arrive over time, while keeping what it learned earlier. The data arrives as a **stream**: task A, then task B, then task C, and we usually cannot retrain from scratch on everything each time.' },
        { type: 'p', text: 'Humans do this naturally. Learning to ride a scooter does not make us forget how to ride a bike. Standard neural networks, however, are trained on one fixed dataset and are not built for this. When we keep training them on new data only, they often lose old abilities.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a shared whiteboard', text: 'One whiteboard holds all of a team’s notes. A new project arrives and someone writes its notes over the old ones because that is the quickest space. The new project looks great; the old notes are half erased. A neural network stores all skills in the same shared weights, so new training can “write over” old skills in the same way.' },
        { type: 'p', text: 'Running example: our bike-rental support model was fine-tuned on rental questions last year. This year we add e-scooters, with new safety rules and pricing. We want the model to learn scooters without becoming worse at bikes.' },
      ],
    },
    {
      id: 'why-cl',
      title: 'Why we need continual learning in LLMs',
      blocks: [
        { type: 'p', text: 'An LLM is a snapshot. Its knowledge stops at its **training cutoff** (the date of its latest training data). After that, the world changes: new products, laws, software versions, medical guidelines, and words. Pretraining a large model from scratch costs a great deal of compute, so we want ways to *add* to a model instead of rebuilding it.' },
        { type: 'list', items: [
          '**Stay current:** add recent knowledge, such as a new version of a programming library.',
          '**Specialise:** adapt to a new domain (legal, medical, our company) without breaking general skills.',
          '**Add skills step by step:** first instruction following, then tool use, then a new language.',
          '**Learn from users:** improve from feedback collected after deployment.',
        ] },
        { type: 'p', text: 'In LLMs this shows up at several stages: **continual pretraining** (more raw text in a new domain or time period), **continual instruction tuning** (new tasks in sequence), and **continual alignment** (updating preferences and safety behaviour over time).' },
      ],
    },
    {
      id: 'catastrophic-forgetting',
      title: 'The big problem: catastrophic forgetting',
      blocks: [
        { type: 'p', text: '**Catastrophic forgetting** (first described as “catastrophic interference” by McCloskey and Cohen in 1989) is the sharp loss of earlier skills when a network is trained on new data. The word *catastrophic* is apt: performance on old tasks can drop a lot after only a little new training.' },
        { type: 'p', text: 'Why does it happen? Gradient descent changes weights to reduce the loss on *the current data only*. Nothing in that loss mentions the old task. Because the same weights serve every skill, a step that helps task B can quietly move weights that task A relied on.' },
        { type: 'p', text: 'This is the **stability–plasticity dilemma**: a model that is very **plastic** (changes easily) learns new tasks fast but forgets; a very **stable** model remembers but struggles to learn. Every continual learning method picks a point between the two.' },
        { type: 'p', text: 'Let us see forgetting happen. Our tiny model has fixed random features and one shared trainable weight vector. Task A lives in one region of input space, task B in another, with different target rules. A single weight vector can fit both reasonably, but only if training keeps A in mind.' },
        { type: 'code', lang: 'python', title: 'forgetting_demo.py', code: `import numpy as np
rng = np.random.default_rng(1)

# A tiny "model": fixed random ReLU features + one shared trainable weight vector
R = rng.normal(size=(2, 60))
feats = lambda X: np.maximum(X @ R, 0)

# Task A lives around (+1, +1), task B around (-1, -1); different target rules
XA = rng.normal(loc=+1, scale=0.7, size=(200, 2)); yA = np.sin(2 * XA[:, 0])
XB = rng.normal(loc=-1, scale=0.7, size=(200, 2)); yB = XB[:, 1] ** 2
FA, FB = feats(XA), feats(XB)

def mse(w, F, y): return float(np.mean((F @ w - y) ** 2))

def train(w, F, y, steps=3000, lr=0.003, anchor=None, lam=0.0):
    w = w.copy()
    for _ in range(steps):
        g = 2 * F.T @ (F @ w - y) / len(y)
        if anchor is not None:
            g += 2 * lam * (w - anchor)    # pull back toward the old weights
        w -= lr * g
    return w

w0 = train(np.zeros(60), FA, yA)           # 1) learn task A
print(f"after task A:          A err {mse(w0, FA, yA):.3f}  B err {mse(w0, FB, yB):.3f}")

w_naive = train(w0, FB, yB)                # 2) then fine-tune on B only
print(f"naive fine-tune on B:  A err {mse(w_naive, FA, yA):.3f}  B err {mse(w_naive, FB, yB):.3f}")

idx = rng.choice(200, 40, replace=False)   # 3) mix 20% of old A data back in
w_replay = train(w0, np.vstack([FB, FA[idx]]), np.concatenate([yB, yA[idx]]))
print(f"B + 20% replay of A:   A err {mse(w_replay, FA, yA):.3f}  B err {mse(w_replay, FB, yB):.3f}")

w_reg = train(w0, FB, yB, anchor=w0, lam=0.5)  # 4) L2 anchor (EWC-like idea)
print(f"B + L2 anchor:         A err {mse(w_reg, FA, yA):.3f}  B err {mse(w_reg, FB, yB):.3f}")`, output: `after task A:          A err 0.273  B err 8.687
naive fine-tune on B:  A err 1.097  B err 0.360
B + 20% replay of A:   A err 0.316  B err 0.374
B + L2 anchor:         A err 0.408  B err 0.378`, walkthrough: [
          { lines: [4, 6], note: 'The “model”: 60 fixed random ReLU features followed by one shared weight vector that we train. All tasks share these 60 weights.' },
          { lines: [8, 11], note: 'Two tasks in different input regions with different rules: like bike questions and scooter questions.' },
          { lines: [15, 22], note: 'Plain gradient descent on mean squared error. The optional anchor term adds λ·‖w − w_old‖² to the loss, pulling weights back toward their old values.' },
          { lines: [24, 28], note: 'Learn A, then fine-tune on B only. B becomes good, but A’s error quadruples (0.273 → 1.097): catastrophic forgetting.' },
          { lines: [30, 32], note: 'Replay: mixing 40 old A examples into B training keeps A almost as good as before while still learning B.' },
          { lines: [34, 35], note: 'Regularisation: penalising movement away from the old weights also limits forgetting, at a small cost on B.' },
        ] },
        { type: 'chart', kind: 'bar', title: 'Error on old task A after learning task B', yLabel: 'Task A error (MSE)', labels: ['Before B', 'Naive fine-tune', 'With replay', 'With L2 anchor'], series: [ { name: 'Task A error', values: [0.273, 1.097, 0.316, 0.408] } ], caption: 'Numbers from the code output above. Lower is better.' },
        { type: 'check', question: 'In the demo, why did naive fine-tuning on B make task A worse even though we never showed it any wrong A examples?', answer: 'Because the loss during B training only measures B. Gradient steps move the shared weights wherever B wants, and nothing pushes back to protect A. Forgetting comes from interference in shared weights, not from bad data.' },
      ],
    },
    {
      id: 'approaches',
      title: 'Approaches to continual learning in LLMs',
      blocks: [
        { type: 'p', text: 'Methods fall into a few families. Real systems often combine them.' },
        { type: 'list', items: [
          '**Replay (rehearsal):** keep a sample of old data and mix it into new training. For LLMs this often means mixing some general pretraining or instruction data into domain training. A variant, **generative replay**, uses a model to generate pseudo-examples of old tasks when the original data cannot be stored.',
          '**Regularisation:** add a penalty that discourages changing weights that matter for old tasks. **EWC** (Elastic Weight Consolidation, Kirkpatrick et al., 2017) estimates each weight’s importance with the Fisher information and penalises important weights more. **Learning without Forgetting** uses distillation from the old model’s outputs as the penalty.',
          '**Parameter isolation (architecture):** give new tasks their own parameters. With LLMs this is natural: train a separate LoRA adapter per task or domain while the base stays frozen, then pick or combine adapters.',
          '**Careful continual pretraining:** when adding a lot of new text, re-warm and then re-decay the learning rate and include replay of older data; published studies have found this simple recipe recovers much of the quality of retraining from scratch.',
          '**Knowledge editing:** methods such as ROME and MEMIT change specific facts by editing a small set of weights, useful for a few targeted corrections rather than broad learning.',
          '**Keep knowledge outside the model:** retrieval (RAG), tools and memory stores let a frozen model use fresh information with no forgetting at all.',
        ] },
        { type: 'compare', title: 'Main strategies side by side', options: [
          { name: 'Replay', summary: 'Mix old data into new training.', pros: ['Simple and very effective', 'Works with any model'], cons: ['Must store old data (privacy, licences)', 'Training cost grows with the mix'], bestFor: 'Domain adaptation and continual pretraining' },
          { name: 'Regularisation (EWC)', summary: 'Penalise changes to important weights.', pros: ['No old data needed at train time'], cons: ['Importance estimates are approximate', 'Too strong blocks learning'], bestFor: 'When old data cannot be kept' },
          { name: 'Parameter isolation', summary: 'Separate adapters or modules per task.', pros: ['Old tasks fully protected', 'Easy to add or remove tasks'], cons: ['Need to route each request to the right adapter', 'Little knowledge sharing across tasks'], bestFor: 'Many distinct tasks or customers' },
          { name: 'RAG / external memory', summary: 'Leave weights alone; fetch knowledge at query time.', pros: ['Instant updates, no forgetting', 'Facts are traceable'], cons: ['Does not teach new skills or styles', 'Depends on retrieval quality'], bestFor: 'Fast-changing facts' },
        ], verdict: 'Use RAG for facts, adapters for distinct tasks, and replay (plus a gentle learning-rate schedule) whenever weights must absorb new knowledge.' },
        { type: 'flow', title: 'A practical continual-update cycle', loop: true, nodes: [
          { label: 'New data arrives', detail: 'Scooter manuals, new pricing rules, recent support chats.' },
          { label: 'Decide where it goes', detail: 'Fast-changing facts → retrieval index. Stable skills or style → training.' },
          { label: 'Train with protection', detail: 'Mix in replay data, use LoRA or a small learning rate, optionally a regulariser.' },
          { label: 'Evaluate old and new', detail: 'Run the old test suite (bikes) and the new one (scooters). Forgetting shows up here.' },
          { label: 'Deploy and monitor', detail: 'Ship if both suites pass; collect feedback for the next round.' },
        ] },
        { type: 'deeper', title: 'How EWC decides which weights matter', blocks: [
          { type: 'formula', expr: 'L(θ) = L_B(θ) + (λ / 2) · ∑ᵢ Fᵢ · (θᵢ − θ*ᵢ)²', where: [
            ['L_B', 'loss on the new task B'],
            ['θ*ᵢ', 'value of weight i after learning task A'],
            ['Fᵢ', 'Fisher information: roughly how sensitive task A’s predictions are to weight i'],
            ['λ', 'how strongly to protect old knowledge'],
          ] },
          { type: 'p', text: 'Our demo used the simplest version, where every Fᵢ is the same (plain L2 toward the old weights). EWC makes the spring stiffer for weights that task A depends on and looser for the rest, so B can use the “free” weights.' },
        ] },
      ],
    },
    {
      id: 'challenges',
      title: 'Challenges in continual learning',
      blocks: [
        { type: 'list', items: [
          '**Measuring forgetting is hard.** LLMs have countless skills; we can only test a sample. Forgetting can hide in skills nobody re-checked.',
          '**Scale and cost.** Replay data and evaluation suites grow with every update.',
          '**Data retention limits.** Privacy rules or licences may forbid keeping old data for replay.',
          '**Conflicting knowledge.** New facts may contradict old ones (“the price is now 15, not 12”). The model can end up mixing both.',
          '**Safety drift.** Even small fine-tunes on harmless-looking data have been reported to weaken safety behaviour, so alignment must be re-tested after each update.',
          '**No universal recipe.** The best mix ratio, learning rate and method vary by model, domain and data size.',
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistake', text: 'Evaluating only on the new task. A model fine-tuned on scooter questions can score brilliantly on scooters while quietly getting worse at bike refunds, general chat, or safety refusals. Always keep and rerun a fixed regression suite for old abilities.' },
        { type: 'check', question: 'Our scooter prices change every month. Should we continually fine-tune the model monthly to keep prices right?', answer: 'Usually not. Fast-changing facts belong in a database or retrieval index that the model reads at answer time. Monthly fine-tunes would be costly, risk forgetting, and could leave old prices mixed in the weights.' },
      ],
    },
    {
      id: 'use-cases',
      title: 'Real-world use cases',
      blocks: [
        { type: 'steps', title: 'Adding scooters to our support bot, safely', items: [
          { title: 'Split knowledge from skills', text: 'Put scooter prices and station lists in the retrieval index. Keep training data for tone and the new safety-check conversation flow.' },
          { title: 'Freeze base, add an adapter', text: 'Train a scooter LoRA adapter, or continue the existing adapter with replay.' },
          { title: 'Mix replay data', text: 'Include a share of past bike conversations and general instructions in every batch.' },
          { title: 'Run both test suites', text: 'Compare bike accuracy before and after; the change should be near zero.' },
          { title: 'Ship and monitor', text: 'Watch real conversations for regressions and log new failure cases for the next round.' },
        ] },
        { type: 'callout', tone: 'example', title: 'Where continual learning matters', text: 'Code assistants that must learn new library versions; domain models (law, medicine, finance) updated as rules change; enterprise assistants adapting to a company’s new products; model providers releasing updated versions with later knowledge cutoffs; and personal assistants that adapt to a user over time. In practice most teams combine retrieval for facts with periodic, carefully evaluated fine-tunes for skills.' },
        { type: 'p', text: '**When not to bother:** if a task can be solved with retrieval or a better prompt, or if we can afford to retrain on the full combined dataset each time, a dedicated continual learning method may not be needed. Continual learning techniques earn their place when data arrives over time and full retraining is too costly.' },
      ],
    },
    {
      id: 'measuring-forgetting',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: 'We keep saying “check the old tasks”. Here is how to turn that into numbers. Suppose our support model learns three tasks in order: **bikes**, then **scooters**, then **helmets**. After each stage we test it on all three. That gives an **accuracy matrix**: each row is a moment in time, each column is a test set. The numbers below are illustrative.' },
        { type: 'matrix', title: 'Accuracy after each training stage (illustrative)', rows: ['After bikes', 'After scooters', 'After helmets'], cols: ['Bikes test', 'Scooters test', 'Helmets test'],
          values: [[0.90, 0.40, 0.35], [0.72, 0.88, 0.38], [0.65, 0.80, 0.91]], format: 'pct',
          caption: 'Read down a column to see what happens to one skill over time. The diagonal is each task right after it was learned.' },
        { type: 'steps', title: 'Three numbers from one matrix', items: [
          { title: 'Final average accuracy', text: 'Average the last row: `(0.65 + 0.80 + 0.91) / 3 ≈ 0.79`. This is how good the model is now, across everything it was taught.' },
          { title: 'Forgetting per task', text: 'For each old task, take its best earlier score minus its final score. Bikes: `0.90 − 0.65 = 0.25`. Scooters: `0.88 − 0.80 = 0.08`. Average forgetting: `(0.25 + 0.08) / 2 ≈ 0.17`.' },
          { title: 'Forward transfer', text: 'Look above the diagonal. Before any scooter training the model scored 0.40 on scooters. If a model with no bike training scored, say, 0.30, then bikes helped scooters by 0.10. Earlier learning can help later tasks.' },
          { title: 'Find the worst step', text: 'Bikes fell 0.18 when we added scooters and only 0.07 when we added helmets. The scooter update did most of the damage, so that is the one to redo with replay or an adapter.' },
        ] },
        { type: 'p', text: 'Two models can share the same final average and still be very different. One may be steady on every task. The other may be excellent on the newest task and poor on the oldest. That is why we report **average accuracy and forgetting together**.' },
        { type: 'p', text: 'There is also a trap in the other direction. A model with *zero* forgetting and a low score on the new task has not solved the problem either. It was simply too stable to learn. The matrix shows both failures: look at the first column for forgetting and at the diagonal for learning.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will shrink the whole stability–plasticity trade-off to **two weights**. Task A depends heavily on the first weight and hardly at all on the second. Task B wants to move both. We compare three ways of learning B: no protection, the same spring on every weight, and a spring that is stiff only where task A needs it.' },
        { type: 'code', lang: 'python', title: 'practice_weight_importance.py', code: `import numpy as np

# Two weights. Task A needs w1 badly and barely cares about w2.
imp_A = np.array([10.0, 0.1])      # importance of each weight for task A
w_A = np.array([1.0, 1.0])         # weights after learning task A
w_B = np.array([3.0, 3.0])         # the weights task B would like

def loss_A(w):
    return float(np.sum(imp_A * (w - w_A) ** 2))

def loss_B(w):
    return float(np.sum((w - w_B) ** 2))

def train_on_B(penalty, lam, steps=2000, lr=0.01):
    w = w_A.copy()                 # start from the task-A solution
    for _ in range(steps):
        grad_B = 2 * (w - w_B)                      # pull toward task B
        grad_pen = 2 * lam * penalty * (w - w_A)    # spring back to old weights
        w -= lr * (grad_B + grad_pen)
    return w

methods = [("naive fine-tune", np.zeros(2), 0.0),
           ("uniform L2", np.ones(2), 1.0),
           ("importance-weighted", imp_A, 1.0)]
print("method                  w1     w2  loss A  loss B")
for name, penalty, lam in methods:
    w = train_on_B(penalty, lam)
    print(f"{name:<20} {w[0]:5.2f}  {w[1]:5.2f}  {loss_A(w):6.2f}  {loss_B(w):6.2f}")`, output: `method                  w1     w2  loss A  loss B
naive fine-tune       3.00   3.00   40.40    0.00
uniform L2            2.00   2.00   10.10    2.00
importance-weighted   1.18   2.82    0.66    3.34`,
          walkthrough: [
            { lines: [3, 6], note: 'Importance of each weight for task A, the weights after learning A, and where task B would like them to be.' },
            { lines: [14, 20], note: 'Train on B by gradient descent. A penalty pulls each weight back toward its old value; `penalty` sets how hard, per weight.' },
            { lines: [22, 28], note: 'Run the three methods and print where the weights end up and what each task loses.' },
          ] },
        { type: 'p', text: 'The importance-weighted run keeps `w1` near 1 (task A needs it) and lets `w2` travel almost all the way to 3 (task A does not care). It gives up a little on B and saves almost all of A.' },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Raise `lam` for the importance-weighted method on line 24 from `1.0` to `10.0`. Predict: which loss goes up and which goes down?',
          'Make task A care about both weights: set `imp_A` on line 4 to `[10.0, 10.0]`. Predict: can any method now keep both losses low? What does that say about tasks that truly conflict?',
          'Set `w_B` on line 6 to `[1.0, 3.0]`, so task B only wants to move the weight A does not need. Predict the loss A of naive fine-tuning before you run it.',
        ] },
        { type: 'check', question: 'Uniform L2 ends with total loss 10.10 + 2.00 = 12.10. The importance-weighted run ends with 0.66 + 3.34 = 4.00. Both use the same strength λ = 1. Where does the difference come from?', answer: 'Uniform L2 holds both weights back equally, so it stops `w2` from moving even though task A barely uses it, and still lets `w1` drift to 2.0 where task A is badly hurt. The importance-weighted penalty spends its “stiffness” only on `w1`. Same budget, placed where it matters. This is the idea behind EWC.' },
        { type: 'check', question: 'In a real model we cannot hand-write `imp_A`. If our importance estimates were wrong and swapped the two weights, what would we expect?', answer: 'The penalty would protect `w2` and free `w1`, the opposite of what task A needs. We would get strong forgetting of A *and* a worse fit on B than naive fine-tuning. Regularisation methods are only as good as their importance estimates, which is one reason replay is often used alongside them.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is catastrophic forgetting?', options: ['When a model is unable to learn a new task at all, however long it trains', 'When a model loses previously learned skills after training on new data', 'When the context window overflows and the model drops its early tokens', 'When old training data is deleted for privacy and cannot be used again'], answer: 1, explain: 'Catastrophic forgetting is the sharp drop in old-task performance caused by training on new data, because shared weights are overwritten. Context overflow is a different, inference-time issue.' },
    { q: 'In the demo, task A error went from 0.273 to 1.097 after naive fine-tuning on B, but stayed at 0.316 with 20% replay. What does replay change?', options: ['It raises the learning rate for task B so it is learned in fewer steps', 'It freezes the weights that matter for task A while B is being learned', 'It deletes task B examples that conflict with what was learned for A', 'It mixes old A examples into training so the loss still penalises breaking A'], answer: 3, explain: 'Replay puts some task A data back into the loss, so gradient steps must keep A working while learning B. No weights are frozen and no B data is removed.' },
    { q: 'How does EWC (Elastic Weight Consolidation) reduce forgetting?', options: ['It penalises changes to weights important for old tasks, weighted by that importance', 'It stores all old data and retrains the whole model from scratch whenever new data arrives', 'It trains a separate copy of the model for each task and routes inputs between them', 'It retrieves relevant old-task documents at query time instead of changing weights'], answer: 0, explain: 'EWC adds λ/2·∑Fᵢ(θᵢ − θ*ᵢ)², with Fisher information estimating each weight’s importance. The other options describe full retraining, isolation and RAG.' },
    { q: 'Our model must answer questions about a product catalogue that changes daily. Which approach fits best?', options: ['Fine-tune the model every night on that day’s full version of the catalogue', 'Use EWC so the model protects what it learned about older prices', 'Keep the catalogue in a retrieval index the model reads at answer time', 'Train a new LoRA adapter for every product and load the right one'], answer: 2, explain: 'Daily-changing facts belong outside the weights. RAG updates instantly with no forgetting. Daily fine-tuning is costly and risky; EWC would protect stale prices; per-product adapters do not scale.' },
    { q: 'A teammate says: "Our scooter fine-tune scored 95% on the scooter test set, so the model is strictly better now." What is the flaw?', options: ['95% is too low to ship; scooter accuracy should reach 99% before release', 'It may have forgotten old skills, so the bike, general and safety suites must be rerun', 'Scooter tests are easier than bike tests, so the 95% overstates real quality', 'Fine-tuning cannot raise test scores this much, so the result must be a bug'], answer: 1, explain: 'A new-task score says nothing about old abilities. Forgetting only shows up when we re-evaluate old tasks, so a fixed regression suite is essential.' },
  ],
  takeaways: [
    'Continual learning means learning from a stream of new data without losing old skills.',
    'Catastrophic forgetting happens because new training changes shared weights with no regard for old tasks.',
    'Replay, regularisation (EWC), and parameter isolation (per-task adapters) are the main protections.',
    'Keep fast-changing facts in retrieval; use training for stable skills and style.',
    'Always rerun old test suites after an update; forgetting is invisible otherwise.',
  ],
  terms: [
    { term: 'Continual learning', def: 'Training a model on data or tasks that arrive over time while keeping earlier knowledge.' },
    { term: 'Catastrophic forgetting', def: 'A sharp loss of old abilities after training on new data.' },
    { term: 'Stability–plasticity dilemma', def: 'The trade-off between remembering old knowledge and being able to learn new knowledge.' },
    { term: 'Replay', def: 'Mixing stored or generated old examples into new training.' },
    { term: 'EWC', def: 'Elastic Weight Consolidation: a penalty that protects weights important to earlier tasks.' },
    { term: 'Continual pretraining', def: 'Further pretraining an existing model on new raw text, such as a new domain or time period.' },
  ],
};
