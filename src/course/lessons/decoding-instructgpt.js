export default {
  id: 'decoding-instructgpt',
  minutes: 27,
  hook: 'How did a 1.3-billion-parameter model end up preferred by people over the 175-billion-parameter GPT-3 it was built from?',
  summary: 'InstructGPT (OpenAI, 2022) turned GPT-3 from a text-continuation engine into a model that follows instructions. It used three steps: supervised fine-tuning on human-written answers, a reward model trained on human rankings of answers, and reinforcement learning with PPO against that reward, kept close to the original model by a KL penalty. People preferred its answers strongly, it made up facts less often, and the recipe became the basis of ChatGPT-style assistants.',
  sections: [
    {
      id: 'what-is-instructgpt',
      title: 'What is the InstructGPT paper?',
      blocks: [
        { type: 'p', text: '“Training language models to follow instructions with human feedback” by Long Ouyang and colleagues at OpenAI (2022) describes **InstructGPT**: GPT-3 models fine-tuned so that they do what the user asks, rather than just continuing the text. It was the first large-scale demonstration of **RLHF** (reinforcement learning from human feedback) on a general-purpose language model, and the same approach was used for ChatGPT later that year.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like coaching a brilliant but literal new hire', text: 'The new hire has read every book in the library (pretraining) but answers a request like “write a short apology email” by writing three more requests, because that is what the documents they read looked like. Coaching has three stages: show them good examples, teach them to judge which drafts are better, then let them practise and reward the drafts that a judge likes.' },
      ],
    },
    {
      id: 'building-blocks',
      title: 'The building blocks we must know first',
      blocks: [
        { type: 'list', items: [
          '**Language model (LM):** a model that predicts the next token. GPT-3 (2020) is a 175-billion-parameter LM trained on internet text.',
          '**Prompt:** the input text we give the model. **Completion / response:** what it writes back.',
          '**Supervised fine-tuning (SFT):** further training on input → ideal-output examples, with the normal next-token loss.',
          '**Reward model (RM):** a model that reads a prompt and a response and outputs one number: how good humans would find it.',
          '**Reinforcement learning (RL):** improving a policy (here, the LM) by trying actions (writing responses) and increasing the probability of those that earn high reward.',
          '**PPO (Proximal Policy Optimization):** a popular, stable RL algorithm that limits how far each update can move the policy. It has its own lesson later.',
          '**KL divergence:** a measure of how different two probability distributions are; used to keep the trained model close to a reference model.',
        ] },
      ],
    },
    {
      id: 'why-gpt3-not-enough',
      title: 'Why GPT-3 was not enough',
      blocks: [
        { type: 'p', text: 'GPT-3 was trained to predict the next token on internet text. That objective is not the same as “help the user safely”. The paper calls this gap **misalignment**: the model optimises one thing (plausible continuation) while users want another (a helpful answer).' },
        { type: 'list', items: [
          '**Not following instructions:** asked “Explain the moon landing to a 6-year-old”, a base model might continue with a list of similar prompts, since that pattern appears online.',
          '**Making things up:** it confidently produces false facts, because plausible text is rewarded, not true text.',
          '**Toxic or biased output:** it can reproduce harmful text from its training data.',
          '**Needing careful prompt engineering:** to get useful behaviour, users had to write few-shot examples or clever prompt formats.',
        ] },
        { type: 'p', text: 'Running example: a user asks our bike-rental assistant, “Write a two-sentence reply to a customer whose e-bike battery died mid-ride.” GPT-3 might continue with “Write a reply to a customer whose…”, ramble, or invent a refund policy. We want a short, kind, accurate reply.' },
      ],
    },
    {
      id: 'hhh',
      title: 'Helpful, honest, and harmless',
      blocks: [
        { type: 'p', text: 'The paper frames alignment using three goals popularised by Askell and colleagues at Anthropic (2021):' },
        { type: 'list', items: [
          '**Helpful:** does what the user intends, including inferring intent from short or unclear instructions, and asks for clarification when needed.',
          '**Honest:** does not make up information or mislead. Because we cannot read a model’s “beliefs”, the paper measured proxies: truthfulness on benchmarks and how often it hallucinated (invented facts).',
          '**Harmless:** avoids causing physical, psychological or social harm, such as toxic or dangerous content.',
        ] },
        { type: 'p', text: 'These goals can conflict: the most “helpful” answer to a harmful request is not harmless. In InstructGPT’s training data, labelers were told to prioritise helpfulness to the user; in the final evaluations they were asked to weigh truthfulness and harmlessness more heavily. Defining these trade-offs is a judgement call that varies between organisations.' },
        { type: 'check', question: 'A user asks the assistant for a refund policy our shop does not have. Which of the three goals is most at risk if the model invents one?', answer: 'Honest. Inventing a plausible-sounding policy is a hallucination. A helpful and honest reply says it does not know the policy and points the user to where to check.' },
      ],
    },
    {
      id: 'three-steps',
      title: 'The three-step method',
      blocks: [
        { type: 'flow', title: 'InstructGPT training pipeline', nodes: [
          { label: 'GPT-3 (pretrained)', detail: 'Starting point: a large next-token predictor.' },
          { label: 'Step 1: SFT', detail: 'Fine-tune on prompts with answers written by human labelers.' },
          { label: 'Step 2: Reward model', detail: 'Labelers rank several model answers per prompt; a model learns to score answers the way they rank them.' },
          { label: 'Step 3: PPO', detail: 'The SFT model writes answers, the RM scores them, and PPO raises the probability of high-scoring answers, with a KL penalty to stay near the SFT model.' },
          { label: 'InstructGPT', detail: 'The final policy that follows instructions.' },
        ] },
        { type: 'p', text: 'The prompts came mostly from users of the OpenAI API (with personal information filtered out) plus prompts written by labelers to get started. A team of about 40 contract labelers wrote demonstrations and ranked outputs.' },
        { type: 'chart', kind: 'bar', title: 'Approximate number of training prompts per step', yLabel: 'Prompts (thousands)', labels: ['SFT', 'Reward model', 'PPO'], series: [ { name: 'Prompts (k)', values: [13, 33, 31] } ], caption: 'Approximate sizes reported in the paper. PPO prompts need no labels: the reward model scores the outputs.' },
      ],
    },
    {
      id: 'step1-sft',
      title: 'Step 1: supervised fine-tuning',
      blocks: [
        { type: 'p', text: 'Labelers wrote high-quality answers to prompts. GPT-3 was fine-tuned on these prompt → answer pairs with the usual next-token cross-entropy loss. This teaches the *format* of following instructions: answer the question, do not continue the list.' },
        { type: 'p', text: 'An interesting detail: the authors trained SFT for 16 epochs, which overfit by validation loss, but kept going because further training still improved reward-model scores and human preference ratings. This is a reminder that the loss we optimise and the quality we want are not the same thing.' },
        { type: 'p', text: 'Why not stop here? Writing ideal answers is slow and expensive, and SFT only imitates. It cannot learn that answer A is *better* than answer B unless someone writes the better one. Ranking is cheaper and gives a richer signal.' },
      ],
    },
    {
      id: 'step2-reward-model',
      title: 'Step 2: the reward model',
      blocks: [
        { type: 'p', text: 'For each prompt, the model generated **K** answers (K between 4 and 9), and a labeler **ranked** them from best to worst. A ranking of K answers contains `K·(K−1)/2` pairwise comparisons: 6 for K = 4, 36 for K = 9. Ranking 9 answers once is much faster than judging 36 separate pairs.' },
        { type: 'p', text: 'The reward model was a **6-billion-parameter** model initialised from the SFT model, with the final next-token layer replaced by a layer that outputs one number. (They reported that a 175B reward model was less stable to train.) The loss uses the Bradley–Terry idea from the previous lesson: for each pair where answer y_w beat y_l, push the score of the winner above the loser.' },
        { type: 'formula', expr: 'loss(θ) = −(1 / C(K,2)) · E[ log σ( r_θ(x, y_w) − r_θ(x, y_l) ) ]', where: [
          ['x', 'the prompt'],
          ['y_w, y_l', 'the preferred (winning) and less preferred (losing) answers'],
          ['r_θ', 'reward model’s scalar score'],
          ['σ', 'sigmoid function'],
          ['C(K,2)', 'number of pairs from one ranking; the loss is averaged over them'],
        ] },
        { type: 'p', text: 'One practical trick: the authors put all C(K,2) comparisons from one prompt into the **same batch element**. Treating them as separate shuffled examples made the reward model overfit, because each answer appears in many correlated pairs.' },
        { type: 'code', lang: 'python', title: 'ranking_to_pairs.py', code: `import numpy as np
from itertools import combinations

# A labeler ranked K=4 answers to one prompt, best first: C > A > D > B
ranking = ["C", "A", "D", "B"]
# Scalar scores the reward model currently gives each answer
rm_score = {"A": 1.2, "B": -0.3, "C": 0.9, "D": 0.1}

def log_sigmoid(x):
    return -np.log1p(np.exp(-x))

pairs = list(combinations(ranking, 2))      # every (winner, loser) pair
print(f"K=4 ranking gives {len(pairs)} comparisons")
losses = []
for win, lose in pairs:                     # earlier in ranking = winner
    diff = rm_score[win] - rm_score[lose]
    loss = -log_sigmoid(diff)               # -log sigma(r_w - r_l)
    losses.append(loss)
    flag = "  <- model has this pair backwards" if diff < 0 else ""
    print(f"{win} > {lose}: r_w - r_l = {diff:+.1f}  loss = {loss:.3f}{flag}")

# InstructGPT averages over all C(K,2) pairs of one prompt together
print(f"mean loss for this prompt = {np.mean(losses):.3f}")`, output: `K=4 ranking gives 6 comparisons
C > A: r_w - r_l = -0.3  loss = 0.854  <- model has this pair backwards
C > D: r_w - r_l = +0.8  loss = 0.371
C > B: r_w - r_l = +1.2  loss = 0.263
A > D: r_w - r_l = +1.1  loss = 0.287
A > B: r_w - r_l = +1.5  loss = 0.201
D > B: r_w - r_l = +0.4  loss = 0.513
mean loss for this prompt = 0.415`, walkthrough: [
          { lines: [4, 7], note: 'One labeler ranking of four answers, and the scores the reward model currently assigns. Note it scores A above C, which disagrees with the human.' },
          { lines: [9, 10], note: 'log σ(x) written in a numerically safe way.' },
          { lines: [12, 13], note: '`combinations` keeps ranking order, so the first item of each pair is always the human’s winner. 4 answers give 6 pairs.' },
          { lines: [15, 20], note: 'Pairwise loss −log σ(r_w − r_l). It is large when the model has a pair backwards (C vs A) and small when the margin is already big.' },
          { lines: [22, 23], note: 'Average over all pairs of this prompt. Training would lower this by raising C’s score relative to A.' },
        ] },
        { type: 'check', question: 'A labeler ranks 6 answers to one prompt. How many pairwise comparisons does the reward model learn from?', answer: 'C(6,2) = 6·5/2 = 15 comparisons, all from one ranking.' },
      ],
    },
    {
      id: 'step3-ppo',
      title: 'Step 3: reinforcement learning with PPO',
      blocks: [
        { type: 'p', text: 'Now the SFT model becomes the **policy**. For each prompt from a fresh set, it writes an answer; the reward model scores it; PPO updates the policy to make high-scoring answers more likely. Each whole answer is treated as one action with one reward at the end (a “bandit” setting).' },
        { type: 'formula', expr: 'objective(φ) = E[ r_θ(x, y) − β · log( π_φ^RL(y | x) / π^SFT(y | x) ) ] + γ · E_pretrain[ log π_φ^RL(x) ]', where: [
          ['π_φ^RL', 'the policy being trained'],
          ['π^SFT', 'the frozen SFT model, used as a reference'],
          ['β', 'strength of the KL penalty that keeps the policy close to SFT'],
          ['γ', 'weight on ordinary language modelling of pretraining data (0 for plain “PPO”, > 0 for “PPO-ptx”)'],
        ], caption: 'The InstructGPT RL objective, in words: get high reward, do not drift far from SFT, and (optionally) keep your pretraining skills.' },
        { type: 'p', text: 'The **KL penalty** matters a lot. Without it the policy can find odd answers that the reward model scores highly but humans dislike (reward hacking), or drift into repetitive text. Subtracting β · log(π_RL / π_SFT) charges the policy for every token where it strays from the SFT model.' },
        { type: 'steps', title: 'One PPO round in InstructGPT', items: [
          { title: 'Sample prompts', text: 'Take a batch of prompts from the PPO prompt set.' },
          { title: 'Generate answers', text: 'The current policy writes one answer per prompt.' },
          { title: 'Score', text: 'The reward model gives each answer a number; the KL penalty against the SFT model is subtracted.' },
          { title: 'Update with PPO', text: 'Increase the probability of tokens in answers that beat expectations, with PPO’s clipping to keep each update small.' },
          { title: 'Mix pretraining (PPO-ptx)', text: 'Also take gradient steps on ordinary pretraining text, to protect general abilities.' },
        ] },
      ],
    },
    {
      id: 'alignment-tax-results',
      title: 'The alignment tax and the results',
      blocks: [
        { type: 'p', text: 'The **alignment tax** is the drop in performance on some standard tasks that comes from alignment training. After plain PPO, InstructGPT got worse on several public NLP benchmarks (such as SQuAD, DROP, HellaSwag and WMT French→English translation). **PPO-ptx**, which mixes in pretraining gradients, greatly reduced these regressions without hurting human preference scores much. That is why PPO-ptx became the main InstructGPT model.' },
        { type: 'chart', kind: 'hbar', title: 'How often humans preferred 175B InstructGPT (PPO-ptx) outputs', xLabel: 'Win rate (%)', unit: '%', labels: ['vs GPT-3 175B', 'vs GPT-3 175B with few-shot prompt'], series: [ { name: 'Preferred', values: [85, 71] } ], caption: 'As reported in the paper (about ±3–4% uncertainty), on prompts from the API distribution.' },
        { type: 'list', items: [
          '**Preference:** outputs from the **1.3B** InstructGPT were preferred over the **175B** GPT-3, despite having over 100× fewer parameters.',
          '**Truthfulness:** on the TruthfulQA benchmark, InstructGPT produced truthful and informative answers about twice as often as GPT-3, and it made up facts less often on closed-domain tasks such as summarisation.',
          '**Toxicity:** when asked to be respectful, it produced about 25% fewer toxic outputs than GPT-3; with no such instruction, the gain largely disappeared.',
          '**Bias:** no significant improvement on the bias benchmarks they tested.',
          '**Generalisation:** it followed instructions somewhat in areas rare in the fine-tuning data, such as code and non-English prompts, and was preferred by held-out labelers who had produced no training data.',
          '**Still imperfect:** it could still follow harmful instructions, make simple mistakes, and hedge too much.',
        ] },
        { type: 'compare', title: 'GPT-3 vs InstructGPT', options: [
          { name: 'GPT-3 (base)', summary: 'Next-token predictor trained on internet text.', pros: ['Broad knowledge', 'Strong few-shot learner with careful prompts'], cons: ['Often ignores instructions', 'Makes up facts more often'], bestFor: 'Text continuation and few-shot experiments' },
          { name: 'InstructGPT', summary: 'GPT-3 + SFT + reward model + PPO-ptx.', pros: ['Follows instructions', 'Preferred by humans', 'Fewer hallucinations on tested tasks'], cons: ['Small alignment tax on some benchmarks', 'Behaviour reflects its labelers’ and authors’ preferences'], bestFor: 'Assistants and instruction-following products' },
        ], verdict: 'Alignment training made a smaller model more useful than a much bigger unaligned one: data about what humans want can matter more than scale.' },
        { type: 'callout', tone: 'warn', title: 'Common misconception', text: 'InstructGPT is not aligned “with humanity”. It is aligned with the preferences of a specific group: about 40 labelers, the instructions they were given by the researchers, and the API customers whose prompts were used. The paper itself stresses this.' },
      ],
    },
    {
      id: 'one-level-deeper',
      title: 'Going one level deeper',
      blocks: [
        { type: 'p', text: 'The step-3 objective is easier to trust once we have put numbers into it. Take one prompt from our bike-rental assistant and three answers the policy might write. For each we need two numbers: the reward model’s score `r`, and the **log-ratio** `log(π_RL / π_SFT)`, which says how much more likely the current policy makes this answer than the SFT model did. We use `β = 0.02` here; all numbers are illustrative.' },
        { type: 'table', caption: 'Reward minus KL penalty for three candidate answers (illustrative, β = 0.02)', head: ['Answer', 'Reward r', 'Log-ratio', 'Penalty β · log-ratio', 'Objective'], rows: [
          ['A: plain, in the SFT style', '1.2', '2', '0.04', '1.16'],
          ['B: clearer and more specific', '2.0', '15', '0.30', '1.70'],
          ['C: odd text the reward model happens to love', '3.0', '120', '2.40', '0.60'],
        ] },
        { type: 'steps', title: 'Reading the table', items: [
          { title: 'Where a log-ratio of 15 comes from', text: 'The log-ratio is summed over tokens. If answer B has 30 tokens and the policy makes each one about 0.5 more likely in log terms, the total is `30 × 0.5 = 15`.' },
          { title: 'Without the penalty', text: 'With β = 0 the objective is just the reward, so C (3.0) wins. The policy would be pulled toward text that the SFT model would almost never write.' },
          { title: 'With the penalty', text: 'C pays `0.02 × 120 = 2.40` and drops to 0.60. B pays only 0.30 and leads with 1.70. The policy is pulled toward B: better, and still close to home.' },
          { title: 'Why “close to home” matters', text: 'The reward model was trained on answers that look like SFT output. Its score for C is a guess far outside that range, and such guesses are the least reliable ones.' },
          { title: 'The third term', text: 'PPO-ptx adds `γ` times the log-likelihood of ordinary pretraining text. It does not look at these answers at all. It asks a separate question: can the model still predict normal text well?' },
        ] },
        { type: 'p', text: 'Two things follow. First, the penalty grows with **length**, since it is a sum over tokens; a long answer that drifts a little per token can pay as much as a short one that drifts a lot. Second, β is a dial, not a constant of nature: larger β keeps the policy nearer the SFT model and improves less; smaller β improves more on the reward model’s terms and risks answers like C.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will train the smallest possible reward model: one score per answer. Three labelers rank the same four answers and do not fully agree. We turn their rankings into pairs, run gradient descent on the pairwise loss from step 2, and see what scores come out when humans disagree.' },
        { type: 'code', lang: 'python', title: 'practice_reward_scores.py', code: `import numpy as np
from itertools import combinations

answers = ["A", "B", "C", "D"]
# Three labelers rank the same 4 answers, best first. They do not fully agree.
rankings = [["A", "B", "C", "D"],
            ["A", "C", "B", "D"],
            ["B", "A", "C", "D"]]

# Every ranking of K = 4 answers gives C(4,2) = 6 (winner, loser) pairs.
pairs = [p for rank in rankings for p in combinations(rank, 2)]
print("total pairs:", len(pairs))

scores = {a: 0.0 for a in answers}        # the reward model's score per answer
lr = 0.5
for step in range(200):
    grads = {a: 0.0 for a in answers}
    for win, lose in pairs:
        p = 1 / (1 + np.exp(-(scores[win] - scores[lose])))   # sigma(r_w - r_l)
        grads[win] -= (1 - p)             # gradient of -log(p): winner goes up
        grads[lose] += (1 - p)            # and the loser goes down
    for a in answers:
        scores[a] -= lr * grads[a] / len(pairs)

for a in answers:
    print(f"score {a}: {scores[a]:+.2f}")
sig = lambda x, y: 1 / (1 + np.exp(-(scores[x] - scores[y])))
print(f"P(A beats B) = {sig('A', 'B'):.2f}   (2 of 3 labelers agreed)")
print(f"P(B beats C) = {sig('B', 'C'):.2f}   (2 of 3 labelers agreed)")
print(f"P(C beats D) = {sig('C', 'D'):.2f}   (3 of 3 labelers agreed)")`, output: `total pairs: 18
score A: +2.20
score B: +1.10
score C: +0.02
score D: -3.31
P(A beats B) = 0.75   (2 of 3 labelers agreed)
P(B beats C) = 0.75   (2 of 3 labelers agreed)
P(C beats D) = 0.97   (3 of 3 labelers agreed)`,
          walkthrough: [
            { lines: [4, 8], note: 'Four answers and three rankings. Labelers 1 and 2 swap B and C; labeler 3 puts B above A.' },
            { lines: [10, 12], note: 'Each ranking becomes 6 (winner, loser) pairs, 18 in total.' },
            { lines: [14, 23], note: 'Gradient descent on −log σ(score of winner − score of loser), averaged over all pairs.' },
            { lines: [25, 30], note: 'Print the learned scores and what they imply for three head-to-head match-ups.' },
          ] },
        { type: 'p', text: 'The scores keep the majority order A > B > C > D, and the gaps reflect how *consistently* the labelers agreed: A over B is 0.75, while C over D, where everyone agreed, is 0.97.' },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Change the third ranking on line 8 to `["A", "B", "C", "D"]`, so A always beats B. Predict: does P(A beats B) rise a little, or head toward 1.00?',
          'Change `range(200)` on line 16 to `range(2000)`. Predict: which answer’s score moves the most with the extra training, and why does it never settle?',
          'Add a fourth labeler with the reversed ranking `["D", "C", "B", "A"]`. Predict: do the scores spread out or move closer together?',
        ] },
        { type: 'check', question: 'Answer D ends with a score of −3.31. Does that mean D is a harmful or terrible answer?', answer: 'Not necessarily. The loss only uses score *differences*, so −3.31 means “D lost every comparison against A, B and C”. All four answers could be good, with D simply the least good of this set. A reward model’s number has meaning only relative to other answers, which is why the paper shifts the reward model’s output to a fixed zero point before the RL step.' },
        { type: 'check', question: 'The labelers put A above B in 2 of 3 rankings (67%), yet the model says P(A beats B) = 0.75. Why is it not exactly 0.67?', answer: 'Each answer gets a single score, and that score has to explain *all* its comparisons at once. A also beat C in 3 of 3 rankings while B beat C in only 2 of 3, which is extra evidence that A sits above B. The fit is a compromise over all 18 pairs, not a copy of each pair’s win rate. This sharing is also what lets a reward model score answers it has never seen compared.' },
      ],
    },
    {
      id: 'today-and-summary',
      title: 'What alignment looks like today, and a quick summary',
      blocks: [
        { type: 'p', text: 'The three-step recipe (SFT, reward model, RL) shaped the first wave of chat assistants. Since then, teams have added and swapped parts: **DPO** and similar methods learn directly from preference pairs without a separate reward model or PPO loop; **RLAIF** and constitution-style methods use AI feedback to scale labelling; and **reinforcement learning with verifiable rewards** (for example checking math answers or running code tests), often with **GRPO**, drives reasoning models. Exact pipelines vary by lab and are often only partly published.' },
        { type: 'p', text: '**Quick summary:** InstructGPT showed that GPT-3’s problem was misalignment, not lack of knowledge. Fine-tune on demonstrations (SFT), learn a reward model from rankings (K answers give C(K,2) pairs, loss −log σ(r_w − r_l)), and optimise with PPO plus a KL penalty and pretraining mix (PPO-ptx). The result: a 1.3B model people preferred over 175B GPT-3, more truthful and less toxic when asked, at a small and mostly recoverable alignment tax.' },
      ],
    },
  ],
  quiz: [
    { q: 'What are the three steps of the InstructGPT method, in order?', options: ['Pretraining, knowledge distillation, then quantization for deployment', 'Supervised fine-tuning, reward model training, then RL with PPO', 'Reward model training, then supervised fine-tuning, then DPO on rankings', 'Prompt engineering, retrieval augmentation, then PPO on the results'], answer: 1, explain: 'SFT on demonstrations, then a reward model on rankings, then PPO against that reward. DPO came later (2023) and replaces the RM + PPO steps.' },
    { q: 'A labeler ranks K = 5 answers to one prompt. How many pairwise comparisons does that produce for the reward model?', options: ['5', '20', '25', '10'], answer: 3, explain: 'C(5,2) = 5·4/2 = 10. 20 counts ordered pairs (each pair twice); 25 is 5².' },
    { q: 'What was PPO-ptx designed to fix?', options: ['The alignment tax: score drops on standard NLP benchmarks after RLHF', 'The high cost of collecting human-written demonstrations for SFT', 'Toxic outputs when the prompt gives no instruction to be respectful', 'Reward model training instability at the full 175B parameter scale'], answer: 0, explain: 'PPO-ptx mixes pretraining gradients into PPO to reduce regressions on benchmarks like SQuAD and DROP. It did not target data cost, toxicity, or RM size.' },
    { q: 'During PPO, a team removes the KL penalty to “let the model improve faster”. Reward-model scores rise quickly, but humans rate outputs worse. What is the most likely explanation?', options: ['Without KL, PPO discards the SFT weights and effectively restarts from GPT-3', 'The policy drifted far from SFT and found answers that exploit reward-model flaws', 'The reward model became more accurate, so humans can no longer judge the outputs', 'The learning rate was too small for the policy to benefit from the extra freedom'], answer: 1, explain: 'The KL penalty keeps the policy near the SFT distribution, where the reward model is trustworthy. Without it, the policy can reward-hack, scoring high on the RM but not with humans.' },
    { q: 'Which statement about InstructGPT’s results is accurate?', options: ['The 175B InstructGPT beat GPT-3 on every benchmark with no regressions', 'It removed all bias, as measured on standard bias benchmarks', 'Humans preferred the 1.3B InstructGPT’s outputs over 175B GPT-3’s', 'It refused every harmful instruction it was given in testing'], answer: 2, explain: 'The 1.3B model was preferred over 175B GPT-3. The paper reported benchmark regressions (the alignment tax), no significant bias improvement, and that it could still follow harmful instructions.' },
  ],
  takeaways: [
    'GPT-3’s problem was misalignment: next-token prediction is not the same as helping the user.',
    'InstructGPT = SFT on demonstrations → reward model on rankings → PPO with a KL penalty.',
    'Rankings of K answers give C(K,2) comparisons, trained with −log σ(r_w − r_l).',
    'PPO-ptx mixes in pretraining gradients to reduce the alignment tax.',
    'A 1.3B aligned model was preferred over 175B GPT-3: human preference data can beat raw scale.',
  ],
  terms: [
    { term: 'InstructGPT', def: 'GPT-3 models fine-tuned with SFT and RLHF to follow instructions (OpenAI, 2022).' },
    { term: 'Alignment', def: 'Making a model’s behaviour match what its users and developers intend.' },
    { term: 'SFT', def: 'Supervised fine-tuning on human-written demonstration answers.' },
    { term: 'Reward model', def: 'A model that outputs a scalar score predicting how much humans would like a response.' },
    { term: 'KL penalty', def: 'A cost for the policy’s distribution moving away from the reference (SFT) model.' },
    { term: 'Alignment tax', def: 'Performance lost on some tasks as a side effect of alignment training.' },
    { term: 'PPO-ptx', def: 'PPO training mixed with pretraining-data gradients to limit the alignment tax.' },
  ],
};
