export default {
  id: 'reinforcement-learning-from-human-feedback-rlhf',
  minutes: 27,
  hook: 'If people can easily tell which of two answers is better but cannot write down a formula for “good answer”, how do we train a model to give better answers?',
  summary: 'RLHF (reinforcement learning from human feedback) aligns a language model with human preferences in three stages: supervised fine-tuning on good examples, training a reward model on human comparisons, and reinforcement learning (usually PPO) to maximise that reward. A KL penalty keeps the model close to its starting point so it does not exploit the reward model’s flaws, a failure called reward hacking.',
  sections: [
    {
      id: 'what-is-rlhf',
      title: 'What is RLHF?',
      blocks: [
        { type: 'p', text: '**RLHF** stands for **reinforcement learning from human feedback**. It is a way to fine-tune a model using human *judgements* (“this answer is better than that one”) instead of only human-written *examples*. The judgements train a **reward model**, a network that scores answers, and reinforcement learning then trains the language model to earn high scores.' },
        { type: 'p', text: 'In earlier lessons we met where it came from: learning rewards from clip comparisons for robots (2017) and InstructGPT (2022), which applied it to GPT-3. This lesson is the general, practical recipe: each stage, the KL penalty, reward hacking, mistakes and best practices.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a cooking show with a trained judge', text: 'First the cook studies recipes (supervised fine-tuning). Then we train a food critic by showing them pairs of dishes and telling them which one diners preferred (reward model). Finally the cook keeps cooking, the critic scores each dish, and the cook adjusts (RL). A house rule says “do not stray too far from the recipe book” (KL penalty), so the cook cannot win by finding one weird trick the critic overrates.' },
      ],
    },
    {
      id: 'why-rlhf',
      title: 'Why we need RLHF',
      blocks: [
        { type: 'p', text: 'A pretrained model predicts likely text, and supervised fine-tuning (SFT) teaches it to imitate good answers. Both stop short of what we want:' },
        { type: 'list', items: [
          '**“Good” is hard to define in a loss.** Helpfulness, tone, honesty and safety do not have a formula. But humans can compare two answers quickly and fairly consistently.',
          '**Imitation has a ceiling.** SFT copies demonstrations; it does not learn that one acceptable answer is *better* than another, and it cannot exceed its demonstrators’ quality.',
          '**SFT sees only good examples.** It never learns from the model’s own mistakes. RL lets the model try answers, see which score low, and move away from them.',
          '**Comparisons are cheaper than writing.** Ranking four answers takes far less effort than writing one perfect answer.',
        ] },
        { type: 'p', text: 'Running example: our bike-rental support assistant. After SFT it answers politely but sometimes over-apologises, rambles, or promises refunds we do not offer. Humans can easily pick the better of two replies, so RLHF can turn those picks into steady improvement.' },
      ],
    },
    {
      id: 'big-picture',
      title: 'The big picture',
      blocks: [
        { type: 'flow', title: 'The three stages of RLHF', nodes: [
          { label: 'Pretrained LM', detail: 'A base model that predicts next tokens from huge text corpora.' },
          { label: 'Stage 1: SFT', detail: 'Fine-tune on prompt → ideal-response pairs. Output: the SFT model, which also becomes the frozen reference.' },
          { label: 'Stage 2: Reward model', detail: 'Collect human comparisons of responses; train a model that outputs a scalar score agreeing with them.' },
          { label: 'Stage 3: RL with PPO', detail: 'The policy (initialised from SFT) generates, the RM scores, a KL penalty is subtracted, and PPO updates the policy.' },
          { label: 'Aligned model', detail: 'Deployed after evaluation by humans and benchmarks.' },
        ] },
        { type: 'p', text: 'Four models are involved during Stage 3: the **policy** being trained, the frozen **reference** model (the SFT copy), the frozen **reward model**, and a **value model** (critic) that PPO uses to estimate expected reward. Holding all four in GPU memory is a big part of why RLHF is expensive.' },
      ],
    },
    {
      id: 'stage-1-sft',
      title: 'Stage 1: supervised fine-tuning (SFT)',
      blocks: [
        { type: 'p', text: 'We collect prompts and high-quality responses (written by people or carefully selected) and fine-tune the pretrained model on them with the normal next-token loss, usually only on response tokens. For our bot: real customer messages paired with ideal replies from our best support agents.' },
        { type: 'p', text: 'SFT does two jobs. It teaches the basic format (answer the question, use the chat template), and it gives the RL stage a sensible starting point. RL works by improving what the model already sometimes does; if the model never produces a decent answer, there is nothing good for the reward to reinforce.' },
      ],
    },
    {
      id: 'stage-2-reward-model',
      title: 'Stage 2: training the reward model',
      blocks: [
        { type: 'steps', title: 'Building the reward model', items: [
          { title: 'Sample responses', text: 'For each prompt, generate two or more responses from the SFT model (sometimes from several models for variety).' },
          { title: 'Collect comparisons', text: 'Human labelers pick the better response, or rank several. Clear guidelines matter: what counts as helpful, honest and safe.' },
          { title: 'Build the model', text: 'Start from the SFT model (or a similar LM) and replace the next-token output layer with a head that outputs one number.' },
          { title: 'Train with a pairwise loss', text: 'For each pair, push the score of the chosen response above the rejected one: loss = −log σ(r(x, y_chosen) − r(x, y_rejected)).' },
          { title: 'Validate', text: 'Measure accuracy on held-out comparisons. Agreement in the 60–75% range is common for chat data, because humans themselves often disagree.' },
        ] },
        { type: 'p', text: 'Small numbers: if the reward model gives the chosen reply 1.4 and the rejected one 0.4, the difference is 1.0 and σ(1.0) ≈ 0.73, so the loss is −log 0.73 ≈ 0.31. If it had the order backwards (0.4 vs 1.4), σ(−1.0) ≈ 0.27 and the loss is about 1.31. Training lowers the loss by widening the right gap.' },
        { type: 'check', question: 'Only the *difference* between two scores enters the loss. What does that imply about the reward model’s absolute scores?', answer: 'They have no fixed meaning: adding the same constant to every score leaves the loss unchanged. That is why reward scores are often normalised (for example to mean 0) before RL, and why a score of “3.2” alone says little.' },
      ],
    },
    {
      id: 'stage-3-ppo',
      title: 'Stage 3: RL fine-tuning with PPO',
      blocks: [
        { type: 'p', text: 'Now we treat the language model as a **policy** π: given a prompt (the state), it generates tokens (actions). After the full response, the reward model gives a score. **PPO (Proximal Policy Optimization)** then updates the policy so that responses that beat expectations become more likely, while clipping each update to stay small and stable. PPO gets its own lesson next; here we focus on how it fits into RLHF.' },
        { type: 'list', ordered: true, items: [
          '**Rollout:** sample a batch of prompts and let the current policy generate a response for each.',
          '**Score:** the reward model scores each full response; compute the per-token KL penalty against the reference model.',
          '**Advantage:** the value model estimates how much reward was expected; the **advantage** = actual minus expected tells each token whether it did better or worse than usual.',
          '**Update:** run a few epochs of PPO’s clipped update on this batch, then repeat with fresh rollouts.',
        ] },
        { type: 'viz', name: 'rl-gridworld', caption: 'The same trial-and-error loop at toy scale: act, get reward, update. In RLHF the “grid” is the space of possible responses and the reward comes from the reward model.' },
      ],
    },
    {
      id: 'kl-penalty',
      title: 'The KL penalty',
      blocks: [
        { type: 'p', text: 'The reward model is only accurate on the kind of responses it was trained on. If the policy wanders far from them, its scores become unreliable, and RL is very good at finding unreliable high scores. The **KL penalty** keeps the policy close to the reference (SFT) model:' },
        { type: 'formula', expr: 'r_total(x, y) = r_RM(x, y) − β · log( π_θ(y | x) / π_ref(y | x) )', where: [
          ['r_RM', 'reward model score of response y to prompt x'],
          ['π_θ', 'the policy being trained'],
          ['π_ref', 'frozen reference model (the SFT model)'],
          ['β', 'KL coefficient: larger β = stay closer to the reference'],
        ], caption: 'Averaged over samples, the second term is β times the KL divergence between policy and reference.' },
        { type: 'p', text: 'The log-ratio is computed per token and summed; it is positive when the policy makes a response *more* likely than the reference did. The best possible policy for this objective has a neat closed form: `π*(y) ∝ π_ref(y) · exp(r(y) / β)`. Large β keeps π* almost equal to π_ref; small β piles all probability onto the highest-scoring response, flaws and all.' },
        { type: 'code', lang: 'python', title: 'kl_penalty_demo.py', code: `import numpy as np

# Four possible replies to one support question
replies = ["short correct", "detailed correct", "flattering fluff", "wrong but confident"]
pi_ref = np.array([0.40, 0.30, 0.20, 0.10])   # SFT model's probabilities
reward = np.array([1.0, 1.5, 2.5, -1.0])      # reward model scores (it overrates fluff!)

def best_policy(beta):
    # The policy that maximises  E[r] - beta * KL(pi || pi_ref)
    # has the closed form  pi*(y) = pi_ref(y) * exp(r(y) / beta) / Z
    w = pi_ref * np.exp(reward / beta)
    return w / w.sum()

for beta in (10.0, 1.0, 0.1):
    pi = best_policy(beta)
    kl = np.sum(pi * np.log(pi / pi_ref))
    print(f"beta={beta:<4}  KL={kl:.2f}  " +
          "  ".join(f"{name}:{p:.2f}" for name, p in zip(replies, pi)))

# Per-sample reward actually used inside PPO for one sampled reply
y = 1                                         # sampled "detailed correct"
pi = best_policy(1.0)
r_total = reward[y] - 1.0 * (np.log(pi[y]) - np.log(pi_ref[y]))
print(f"\\nr_RM={reward[y]}, log-ratio={np.log(pi[y] / pi_ref[y]):.2f}, r_total={r_total:.2f}")`, output: `beta=10.0  KL=0.00  short correct:0.39  detailed correct:0.31  flattering fluff:0.23  wrong but confident:0.08
beta=1.0   KL=0.28  short correct:0.22  detailed correct:0.27  flattering fluff:0.50  wrong but confident:0.01
beta=0.1   KL=1.61  short correct:0.00  detailed correct:0.00  flattering fluff:1.00  wrong but confident:0.00

r_RM=1.5, log-ratio=-0.09, r_total=1.59`, walkthrough: [
          { lines: [3, 6], note: 'A toy world with four possible replies. The reward model has a flaw: it scores flattering fluff highest.' },
          { lines: [8, 12], note: 'The optimal KL-regularised policy reweights the reference by exp(r/β). No training loop needed for this toy.' },
          { lines: [14, 18], note: 'β = 10 barely moves from the reference. β = 1 shifts toward high reward but keeps variety. β = 0.1 collapses onto fluff: the reward model’s flaw is fully exploited.' },
          { lines: [20, 24], note: 'Inside PPO each sample gets r_RM minus β·log-ratio. Here the policy makes this reply slightly less likely than the reference did, so the penalty is a small bonus.' },
        ] },
        { type: 'matrix', title: 'Optimal policy probabilities for different β (from the code)', rows: ['β = 10', 'β = 1', 'β = 0.1'], cols: ['short correct', 'detailed correct', 'flattering fluff', 'wrong but confident'], values: [[0.39, 0.31, 0.23, 0.08], [0.22, 0.27, 0.5, 0.01], [0.0, 0.0, 1.0, 0.0]], format: 'pct', caption: 'As β shrinks, probability concentrates on whatever the reward model likes best, including its mistakes.' },
      ],
    },
    {
      id: 'putting-together',
      title: 'Putting it all together',
      blocks: [
        { type: 'p', text: 'One full RLHF iteration for our support bot: sample 512 customer prompts, let the policy write replies, score them with the reward model, subtract β times the per-token log-ratio against the SFT model, estimate advantages with the value model, run a few PPO epochs, then repeat. Every so often, show humans fresh samples, collect new comparisons, and retrain the reward model on the policy’s current style of answers.' },
        { type: 'compare', title: 'SFT alone vs SFT + RLHF', options: [
          { name: 'SFT only', summary: 'Imitate demonstrations with next-token loss.', pros: ['Simple, stable, cheap', 'Easy to debug'], cons: ['Capped by demonstration quality', 'Never learns from its own mistakes'], bestFor: 'Format, style, and a solid starting point' },
          { name: 'SFT + RLHF', summary: 'Then optimise a learned reward with PPO and a KL penalty.', pros: ['Learns fine-grained preferences', 'Can go beyond demonstrations', 'Uses cheap comparisons'], cons: ['Four models in memory', 'Many sensitive hyperparameters', 'Risk of reward hacking'], bestFor: 'Assistant quality, helpfulness and safety at scale' },
        ], verdict: 'SFT is the foundation; RLHF is the polish. Simpler preference methods such as DPO (a later lesson) often get much of the benefit with less machinery.' },
      ],
    },
    {
      id: 'reward-hacking',
      title: 'Reward hacking',
      blocks: [
        { type: 'p', text: '**Reward hacking** (or reward over-optimisation) happens when the policy finds ways to raise the reward model’s score that do not reflect real quality. The reward model is a **proxy** for human judgement, and pushing hard on any proxy eventually breaks it (an instance of Goodhart’s law: when a measure becomes a target, it stops being a good measure).' },
        { type: 'list', items: [
          '**Length hacking:** reward models often prefer longer answers, so the policy pads its replies.',
          '**Sycophancy:** agreeing with the user or flattering them scores well even when the user is wrong.',
          '**Style over substance:** confident tone, bullet lists or hedging phrases that labelers liked in training data get over-used.',
          '**Degenerate text:** with no KL penalty, odd repeated tokens can trigger high scores.',
        ] },
        { type: 'chart', kind: 'line', title: 'Proxy reward vs true quality as the policy moves away from SFT', xLabel: 'KL from reference (distance moved)', yLabel: 'Score', series: [ { name: 'Reward model score (proxy)', points: [[0, 0], [2, 1.2], [4, 2.1], [6, 2.8], [8, 3.3], [10, 3.7]] }, { name: 'True human-judged quality', points: [[0, 0], [2, 1.0], [4, 1.5], [6, 1.6], [8, 1.3], [10, 0.8]] } ], caption: 'Illustrative shape only. Published studies of reward over-optimisation report this pattern: the proxy keeps rising while true quality peaks and then falls.' },
        { type: 'check', question: 'Average reply length doubled during RL training and reward scores rose. What should we check before celebrating?', answer: 'Whether humans actually prefer the longer replies. Rising length with rising reward is a classic sign of length hacking. Compare with human ratings at matched length, consider a length penalty, raise β, or retrain the reward model with examples where shorter answers win.' },
      ],
    },
    {
      id: 'mistakes-and-practices',
      title: 'Common mistakes and best practices',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Skipping or rushing SFT, so RL starts from a weak policy; vague labeling guidelines that produce noisy, inconsistent comparisons; trusting rising reward-model scores without human evaluation; setting β too low (reward hacking) or too high (nothing changes); training the reward model once and never refreshing it as the policy changes; and evaluating only on the reward model you trained against.' },
        { type: 'list', items: [
          '**Invest in data quality:** clear guidelines, trained labelers, agreement checks, and diverse prompts that match real use.',
          '**Keep a held-out evaluation:** human ratings or a separate judge model, never just the training reward model.',
          '**Monitor KL, length and reward together:** fast-rising KL or length is a warning sign.',
          '**Tune β (or use an adaptive KL controller)** to target a sensible KL budget.',
          '**Refresh the reward model** with comparisons on the current policy’s outputs.',
          '**Consider simpler alternatives:** DPO for offline preference data, or verifiable rewards (tests, exact answers) where they exist.',
        ] },
        { type: 'callout', tone: 'example', title: 'Where RLHF is used', text: 'RLHF and its descendants are part of the post-training of most major chat assistants, typically alongside SFT and other preference methods. Exact recipes differ by organisation and are often only partly public. Outside chat, the same idea is used for summarisation, code assistants and image generation models tuned on human preferences.' },
      ],
    },
    {
      id: 'worked-example-one-prompt',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: 'Let us follow **one customer message** through stages 2 and 3 with small numbers. The message: “My e-bike battery died after 20 minutes. What now?” All numbers are illustrative.' },
        { type: 'steps', title: 'One prompt, from comparison to policy update', items: [
          { title: 'A human compares two replies', text: 'Reply A gives the battery-swap steps. Reply B apologises three times and offers a refund we do not give. The labeler picks **A**.' },
          { title: 'The untrained reward model disagrees', text: 'It scores A at 0.2 and B at 0.6. The loss is `−log σ(0.2 − 0.6) = −log σ(−0.4) ≈ −log 0.40 ≈ 0.91`. That is above 0.69, the loss of a coin flip, because the model ranked the pair the wrong way.' },
          { title: 'The reward model learns', text: 'After training on many such pairs it scores A at 1.4 and B at 0.4. The loss for this pair falls to about 0.31. The reward model is now frozen.' },
          { title: 'The policy writes a new reply', text: 'In stage 3 the policy writes reply C. The reward model gives it **1.2**. Its summed log-ratio against the reference model is **3.0**: the policy has made this reply somewhat more likely than the SFT model did.' },
          { title: 'Subtract the KL penalty', text: 'With `β = 0.1`: `r_total = 1.2 − 0.1 × 3.0 = 0.9`.' },
          { title: 'Compare with what was expected', text: 'The value model expected 0.5 for this prompt. The advantage is `0.9 − 0.5 = +0.4`: better than expected. PPO raises the probability of reply C’s tokens, within its clip range.' },
        ] },
        { type: 'p', text: 'Now a second reply to the same prompt, to see the penalty bite:' },
        { type: 'table', caption: 'Two replies to the same prompt (illustrative, β = 0.1, expected value 0.5)', head: ['Reply', 'RM score', 'Log-ratio', 'r_total', 'Advantage', 'Effect'], rows: [
          ['C: steps to swap the battery', '1.2', '3.0', '0.9', '+0.4', 'Made more likely'],
          ['D: very long, warm, vague', '1.6', '14.0', '0.2', '−0.3', 'Made less likely'],
        ] },
        { type: 'p', text: 'Reply D has the *higher* reward-model score, yet it is pushed down. It sits far from what the reference model would write, and the penalty of `0.1 × 14.0 = 1.4` outweighs its lead. This is the KL term doing its job: a high score earned far from familiar ground is treated with suspicion.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'Earlier we computed where the policy *ends up* for a given β. Now we will watch it get there. We simulate stage 3 as a training loop over four possible replies. The reward model has one flaw: it overrates long, flattering replies. We track what the reward model sees and, since this is a simulation, the true quality it cannot see.' },
        { type: 'code', lang: 'python', title: 'practice_rlhf_loop.py', code: `import numpy as np

replies = ["short correct", "detailed correct", "long flattering", "wrong"]
pi_ref = np.array([0.40, 0.30, 0.20, 0.10])    # frozen SFT model
rm_score = np.array([1.0, 1.5, 2.5, -1.0])     # reward model (overrates flattery)
true_quality = np.array([1.0, 1.5, 0.2, -1.0]) # what people really think
beta = 0.5

def softmax(z):
    e = np.exp(z - z.max())
    return e / e.sum()

logits = np.log(pi_ref)                        # the policy starts as the SFT copy
print("step  RM reward  true quality     KL  P(long flattering)")
for step in range(0, 201):
    pi = softmax(logits)
    kl = max(0.0, float(np.sum(pi * np.log(pi / pi_ref))))
    if step in (0, 10, 50, 200):
        print(f"{step:>4}  {pi @ rm_score:9.2f}  {pi @ true_quality:12.2f}  {kl:5.2f}  {pi[2]:18.2f}")
    # Reward each reply gets: RM score minus the KL penalty term
    r_total = rm_score - beta * np.log(pi / pi_ref)
    advantage = r_total - pi @ r_total         # better or worse than average?
    logits += 0.2 * pi * advantage             # policy-gradient step

print("final policy:", dict(zip(replies, softmax(logits).round(2).tolist())))`, output: `step  RM reward  true quality     KL  P(long flattering)
   0       1.25          0.79   0.00                0.20
  10       1.50          0.77   0.05                0.32
  50       2.07          0.50   0.57                0.68
 200       2.22          0.44   0.79                0.77
final policy: {'short correct': 0.07, 'detailed correct': 0.15, 'long flattering': 0.77, 'wrong': 0.01}`,
          walkthrough: [
            { lines: [3, 7], note: 'Four replies, the reference policy, the reward model’s scores and the hidden true quality. They differ only on “long flattering”.' },
            { lines: [13, 19], note: 'Start from the reference policy. At a few steps, print average reward, average true quality, KL from the reference and the share of flattering replies.' },
            { lines: [20, 23], note: 'One training step: reward minus KL penalty, turned into an advantage, then a policy-gradient update on the logits.' },
            { lines: [25, 25], note: 'The policy after 200 steps.' },
          ] },
        { type: 'p', text: 'The reward-model column rises on every row. The true-quality column falls on every row. Nothing inside the training loop can see the second column. That gap is reward hacking.' },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Raise `beta` on line 7 from `0.5` to `3.0`. Predict: where does P(long flattering) settle, and does true quality end above or below its starting value of 0.79?',
          'Repair the reward model: on line 5 change `2.5` to `0.2`, so it matches true quality. Keep `beta = 0.5`. Predict which reply the policy now favours and what happens to true quality.',
          'Stop early: change `range(0, 201)` on line 15 to `range(0, 11)`. Predict the final policy. Is early stopping a substitute for a KL penalty, or a different tool?',
        ] },
        { type: 'check', question: 'KL settles near 0.79 and the policy stops changing, even though “long flattering” still has the highest reward-model score. What stops it?', answer: 'The penalty has caught up. At the end the policy gives that reply 0.77 against the reference’s 0.20, so it pays `β · log(0.77 / 0.20) ≈ 0.5 × 1.35 ≈ 0.67` every time. Its reward minus penalty is now equal to that of the other replies, so every advantage is zero and the update vanishes. A larger β reaches this balance sooner and closer to the reference.' },
        { type: 'check', question: 'At step 10 true quality is 0.77, almost unchanged. By step 50 it is 0.50. In a real project we cannot print true quality. How could we still notice the slide between those two checkpoints?', answer: 'By evaluating saved checkpoints with something the policy was *not* trained against: fresh human ratings or a separate held-out judge. Inside training, warning signs are a fast-rising KL (0.05 → 0.57 here) and one style of reply taking over (0.32 → 0.68). The reward-model score itself is useless for this, because it is the very thing being exploited.' },
      ],
    },
    {
      id: 'quick-summary',
      title: 'Quick summary',
      blocks: [
        { type: 'p', text: 'RLHF turns human comparisons into model improvements. Stage 1 (SFT) teaches the format and gives a good start. Stage 2 trains a reward model with −log σ(r_chosen − r_rejected). Stage 3 uses PPO to maximise r_RM − β·log(π/π_ref). The KL penalty is what keeps optimisation honest: it limits how far the policy can drift into regions where the reward model is wrong. Reward hacking is the main failure mode, so always judge results with fresh human or independent evaluation.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the reward model trained on in RLHF?', options: ['Human comparisons between responses (which one is better)', 'The next-token loss on large amounts of pretraining text', 'The policy’s own scores on its outputs from previous rounds', 'Benchmark accuracy numbers from standard evaluation suites'], answer: 0, explain: 'The reward model learns from human preference comparisons with a pairwise loss. Next-token loss is for pretraining/SFT; using its own scores would be circular.' },
    { q: 'In the KL demo, the reward model overrates “flattering fluff”. What happens to the optimal policy as β goes from 10 to 0.1?', options: ['It stays equal to the reference model', 'It spreads probability evenly over all replies', 'It shifts toward “short correct” because it is most likely under the reference', 'It concentrates all probability on “flattering fluff”'], answer: 3, explain: 'π* ∝ π_ref·exp(r/β). Small β makes the exponential dominate, so the top-scored reply (fluff) takes nearly 100%. Large β keeps the policy close to the reference.' },
    { q: 'The reward model scores the chosen reply 1.4 and the rejected one 0.4. What is the pairwise loss −log σ(1.4 − 0.4), approximately?', options: ['0.31', '0.73', '1.31', '0.00'], answer: 0, explain: 'σ(1.0) ≈ 0.73, and −log 0.73 ≈ 0.31. 0.73 is the probability itself; 1.31 is the loss if the order were reversed.' },
    { q: 'During PPO, reward scores climb steadily, average length doubles and KL from the reference grows fast, but human ratings drop. What is the best next step?', options: ['Lower β so the policy can explore further and get past the reward model’s plateau', 'Stop collecting human ratings, since the reward model is now good enough', 'Treat it as reward hacking: raise β or limit length, and refresh the reward model', 'Remove the SFT stage so the policy is no longer pulled toward short answers'], answer: 2, explain: 'Proxy reward up, human quality down, plus rising length and KL, is classic reward hacking. Tightening the KL budget and fixing the reward model address the cause. Lowering β would make it worse.' },
    { q: 'Which statement about SFT and RLHF is a misconception?', options: ['SFT gives RL a good starting policy', 'RLHF uses a frozen reference model for the KL penalty', 'Comparisons are usually cheaper to collect than full demonstrations', 'RLHF replaces SFT, so SFT can be skipped'], answer: 3, explain: 'RLHF builds on SFT; the SFT model is both the starting policy and the KL reference. The other statements are accurate.' },
  ],
  takeaways: [
    'RLHF = SFT → reward model from human comparisons → RL (usually PPO).',
    'The reward model is trained with −log σ(r_chosen − r_rejected); only score differences matter.',
    'The KL penalty r_RM − β·log(π/π_ref) keeps the policy where the reward model is trustworthy.',
    'Reward hacking (length, sycophancy, style) is the main failure; watch reward, KL, length and human ratings together.',
    'Judge success with fresh human or independent evaluation, not the training reward model.',
  ],
  terms: [
    { term: 'RLHF', def: 'Reinforcement learning from human feedback: optimising a model against a reward learned from human preferences.' },
    { term: 'Reward model', def: 'A model that gives a scalar score predicting human preference for a response.' },
    { term: 'Policy', def: 'In RLHF, the language model being trained, viewed as choosing tokens (actions).' },
    { term: 'Reference model', def: 'A frozen copy of the SFT model used to compute the KL penalty.' },
    { term: 'KL penalty', def: 'A cost proportional to how far the policy’s distribution moves from the reference model.' },
    { term: 'Reward hacking', def: 'Raising the proxy reward without improving real quality.' },
    { term: 'Value model (critic)', def: 'A model PPO uses to estimate expected reward, so advantages can be computed.' },
  ],
};
