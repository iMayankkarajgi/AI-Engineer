export default {
  id: 'proximal-policy-optimization-ppo',
  minutes: 26,
  hook: 'One overly eager update can wreck a policy that took days to train; how does PPO let a model learn from its own experience without taking that kind of leap?',
  summary: 'PPO (Proximal Policy Optimization) is a reinforcement learning algorithm that improves a policy in small, safe steps. It compares how likely an action is under the new policy versus the old one (the probability ratio), multiplies by the advantage (how much better than expected the action was), and clips the ratio to a narrow band such as [0.8, 1.2] so no single update can move the policy too far. It is simple, stable and was the standard RL algorithm in RLHF for language models.',
  sections: [
    {
      id: 'what-is-rl',
      title: 'What is reinforcement learning?',
      blocks: [
        { type: 'p', text: '**Reinforcement learning (RL)** is learning from trial and error. An **agent** observes a **state**, takes an **action**, and receives a **reward** (a number: good or bad). Over many tries it learns which actions lead to high total reward. Unlike supervised learning, nobody tells the agent the right action; it only sees how well things turned out.' },
        { type: 'viz', name: 'rl-gridworld', caption: 'An agent exploring a grid and slowly learning a path to the goal from rewards alone.' },
        { type: 'p', text: 'Running example: our bike-rental support assistant writes a reply (a sequence of actions, one token each). A reward model scores the reply. RL should make high-scoring replies more likely next time.' },
      ],
    },
    {
      id: 'what-is-policy',
      title: 'What is a policy?',
      blocks: [
        { type: 'p', text: 'A **policy**, written π, is the agent’s strategy: a function that gives the probability of each action in a state, π(a | s). In a language model the policy *is* the model: the state is the prompt plus tokens written so far, the actions are possible next tokens, and π gives their probabilities.' },
        { type: 'p', text: '**Policy-gradient methods** improve a policy directly by changing its parameters θ to raise the probability of actions that turned out well and lower it for actions that turned out badly. The simplest version updates θ in the direction of `∇θ log πθ(a | s) · A`, where **A** is the **advantage**: how much better the action was than what we expected on average in that state.' },
        { type: 'p', text: 'Why use the advantage instead of the raw reward? If every reply gets a reward between 7 and 9, raw rewards would push *every* reply up. The advantage subtracts a baseline (the expected reward, estimated by a **value function** V(s)), so a reply scoring 9 when 8 was expected gets +1, and one scoring 7 gets −1. Only better-than-usual actions are reinforced.' },
      ],
    },
    {
      id: 'problem',
      title: 'The problem with simple policy updates',
      blocks: [
        { type: 'p', text: 'Vanilla policy gradient has two weaknesses:' },
        { type: 'list', items: [
          '**Steps are hard to size.** The gradient is noisy because it comes from a few random samples. A big learning rate can move the policy so far that it starts producing nonsense; then it collects bad data from that nonsense and may never recover. A small learning rate makes training painfully slow.',
          '**Each batch is used once.** Generating experience is expensive (for an LLM, every rollout means generating text). But after one gradient step the data was collected by a policy that no longer exists, so reusing it for more steps is risky without a correction.',
        ] },
        { type: 'viz', name: 'gradient-descent', caption: 'Push the learning rate up and the ball overshoots and diverges. In RL an overshoot is worse: the policy then gathers its own bad data.' },
        { type: 'p', text: '**TRPO** (Trust Region Policy Optimization, Schulman et al., 2015) addressed this by requiring each update to keep the KL divergence between old and new policy below a limit. It works well but needs second-order math (conjugate gradient, line searches) that is complex to implement and scale.' },
      ],
    },
    {
      id: 'what-is-ppo',
      title: 'What is PPO, and the key idea: clipping',
      blocks: [
        { type: 'p', text: '**PPO** was introduced by John Schulman and colleagues at OpenAI in 2017. It keeps TRPO’s spirit, “do not move too far from the old policy”, but replaces the hard constraint with a simple trick in the loss function: **clipping**. *Proximal* means “nearby”: each new policy stays near the previous one.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like adjusting a recipe', text: 'A cook gets feedback that a dish was great. A wise cook does not triple every ingredient tomorrow; they change things by a bounded amount, maybe 20%, then taste again. PPO is that rule: learn from the feedback, but never change any action’s probability by more than a set fraction per round.' },
        { type: 'p', text: 'The central quantity is the **probability ratio**:' },
        { type: 'formula', expr: 'rₜ(θ) = π_θ(aₜ | sₜ) / π_θ_old(aₜ | sₜ)', where: [
          ['π_θ', 'the policy being updated'],
          ['π_θ_old', 'the policy that collected the data (frozen during this round)'],
          ['rₜ = 1', 'no change; rₜ = 1.5 means the action is now 50% more likely'],
        ] },
        { type: 'p', text: 'Example: the old policy gave the token “sorry” probability 0.30, the new one 0.45, so the ratio is 1.5. The ratio also fixes the data-reuse problem: weighting the old data by r is a standard correction (importance sampling) that lets us take several gradient steps on one batch.' },
      ],
    },
    {
      id: 'objective',
      title: 'The PPO objective in simple words',
      blocks: [
        { type: 'formula', expr: 'L^CLIP(θ) = E[ min( rₜ(θ) · Aₜ ,  clip(rₜ(θ), 1 − ε, 1 + ε) · Aₜ ) ]', where: [
          ['Aₜ', 'advantage of action aₜ (positive = better than expected)'],
          ['ε', 'clip range, commonly 0.2, so ratios are clipped to [0.8, 1.2]'],
          ['clip(x, lo, hi)', 'x limited to the range [lo, hi]'],
          ['min', 'take the more pessimistic of the two terms'],
        ], caption: 'PPO maximises this (or minimises its negative).' },
        { type: 'p', text: 'In words:' },
        { type: 'list', items: [
          '**Good action (A > 0):** increase its probability, but once the ratio passes 1 + ε there is no extra credit. The gradient becomes zero, so there is no incentive to push further this round.',
          '**Bad action (A < 0):** decrease its probability, but once the ratio falls below 1 − ε there is no extra credit for pushing it down further.',
          '**The min:** if an update has already moved things in the *wrong* direction (a bad action got more likely, or a good one less likely), the unclipped term is the smaller one, so PPO keeps the full penalty and corrects it. Clipping only removes the incentive to over-improve, never the incentive to fix a mistake.',
        ] },
        { type: 'chart', kind: 'line', title: 'PPO objective per sample vs probability ratio (ε = 0.2)', xLabel: 'Ratio r = π_new / π_old', yLabel: 'Objective value', series: [ { name: 'A = +1', points: [[0.5, 0.5], [0.8, 0.8], [1.0, 1.0], [1.2, 1.2], [1.5, 1.2]] }, { name: 'A = −1', points: [[0.5, -0.8], [0.8, -0.8], [1.0, -1.0], [1.2, -1.2], [1.5, -1.5]] } ], caption: 'Computed from the formula. Flat parts have zero gradient: for A > 0 above r = 1.2, for A < 0 below r = 0.8.' },
        { type: 'code', lang: 'python', title: 'ppo_clip_table.py', code: `import numpy as np

eps = 0.2                                    # PPO clip range

def ppo_term(ratio, adv):
    unclipped = ratio * adv
    clipped = np.clip(ratio, 1 - eps, 1 + eps) * adv
    return min(unclipped, clipped)           # the pessimistic choice

print("ratio  adv   unclipped  clipped   PPO uses")
for adv in (+2.0, -2.0):
    for ratio in (0.5, 0.9, 1.0, 1.1, 1.5):
        u = ratio * adv
        c = np.clip(ratio, 1 - eps, 1 + eps) * adv
        print(f"{ratio:4.1f}  {adv:+.0f}   {u:+8.2f}  {c:+8.2f}  {ppo_term(ratio, adv):+8.2f}")

# Where do ratios come from? new vs old probability of the SAME action
logp_old, logp_new = np.log(0.30), np.log(0.45)
print(f"\\nold p=0.30, new p=0.45 -> ratio = {np.exp(logp_new - logp_old):.2f}")

# Advantage with a value baseline: how much better than expected?
reward, value_estimate = 0.8, 0.5
print(f"advantage = reward - V(s) = {reward - value_estimate:+.1f}")`, output: `ratio  adv   unclipped  clipped   PPO uses
 0.5  +2      +1.00     +1.60     +1.00
 0.9  +2      +1.80     +1.80     +1.80
 1.0  +2      +2.00     +2.00     +2.00
 1.1  +2      +2.20     +2.20     +2.20
 1.5  +2      +3.00     +2.40     +2.40
 0.5  -2      -1.00     -1.60     -1.60
 0.9  -2      -1.80     -1.80     -1.80
 1.0  -2      -2.00     -2.00     -2.00
 1.1  -2      -2.20     -2.20     -2.20
 1.5  -2      -3.00     -2.40     -3.00

old p=0.30, new p=0.45 -> ratio = 1.50
advantage = reward - V(s) = +0.3`, walkthrough: [
          { lines: [3, 8], note: 'The PPO term for one sample: compute both versions and keep the smaller (more pessimistic) one.' },
          { lines: [10, 15], note: 'A table over ratios for a good action (A = +2) and a bad action (A = −2).' },
          { lines: [17, 19], note: 'In practice ratios are computed from log-probabilities: exp(log π_new − log π_old). Here 0.45 / 0.30 = 1.5.' },
          { lines: [21, 23], note: 'The advantage: the actual reward minus the value model’s expectation.' },
        ] },
        { type: 'check', question: 'Look at the row ratio 1.5, A = −2. Why does PPO use −3.00 (unclipped) instead of −2.40 (clipped)?', answer: 'A bad action became 50% more likely, which is a mistake. The min picks the more pessimistic value, −3.00, so the full penalty and a non-zero gradient remain, pushing the probability back down. Clipping never hides a mistake; it only caps rewards for moving in the right direction.' },
      ],
    },
    {
      id: 'step-by-step',
      title: 'How PPO works step by step',
      blocks: [
        { type: 'steps', title: 'One PPO iteration', items: [
          { title: 'Collect rollouts', text: 'Run the current policy (now called π_old) to gather a batch of experience: states, actions, rewards, and log-probabilities under π_old.' },
          { title: 'Estimate advantages', text: 'Use the value model V(s) to compute advantages, typically with GAE (generalised advantage estimation), which blends short- and long-range estimates to reduce noise.' },
          { title: 'Freeze π_old', text: 'Keep the old log-probabilities fixed; they are the denominator of every ratio this round.' },
          { title: 'Optimise for a few epochs', text: 'Split the batch into minibatches and take several gradient steps on the clipped objective, plus a value-function loss and often a small entropy bonus to keep exploring.' },
          { title: 'Repeat', text: 'Discard the batch, set π_old ← π_new, and collect fresh rollouts.' },
        ] },
        { type: 'flow', title: 'The PPO loop', loop: true, nodes: [
          { label: 'Rollout', detail: 'The policy acts and we record what happened, including log π_old(a|s).' },
          { label: 'Advantages', detail: 'A = how much better than the value model expected (often via GAE).' },
          { label: 'Clipped updates', detail: 'Several minibatch epochs on L^CLIP plus value loss; ratios held within about [0.8, 1.2].' },
          { label: 'New policy', detail: 'Becomes π_old for the next round of data collection.' },
        ] },
        { type: 'deeper', title: 'The full loss used in practice', blocks: [
          { type: 'formula', expr: 'L(θ) = E[ L^CLIP(θ) − c₁ · (V_θ(s) − V_target)² + c₂ · H(π_θ(· | s)) ]', where: [
            ['c₁', 'weight of the value-function (critic) error'],
            ['c₂', 'weight of the entropy bonus H, which rewards keeping some randomness'],
          ] },
          { type: 'p', text: 'The PPO paper also described a variant that uses an adaptive KL penalty instead of clipping; the clipped version became the popular default. Many implementations add extra safeguards such as early stopping when the measured KL between old and new policy grows too large.' },
        ] },
      ],
    },
    {
      id: 'ppo-in-llms',
      title: 'PPO in large language models (RLHF)',
      blocks: [
        { type: 'p', text: 'In RLHF (for example InstructGPT), PPO is applied to text. The mapping is:' },
        { type: 'table', caption: 'RL terms in an LLM setting', head: ['RL concept', 'In an LLM'], rows: [
          ['State', 'The prompt plus tokens generated so far'],
          ['Action', 'The next token'],
          ['Policy', 'The language model being trained'],
          ['Reward', 'Reward-model score at the end of the response, minus a per-token KL penalty against the reference model'],
          ['Value model', 'A separate network (often initialised from the reward model or policy) predicting expected reward from each position'],
          ['Episode', 'One complete response'],
        ] },
        { type: 'p', text: 'This setup needs four large models at once: the policy, the reference model, the reward model and the value model. That memory cost, plus PPO’s many hyperparameters, is the motivation for DPO and GRPO in the next lessons.' },
        { type: 'check', question: 'In LLM PPO, the reward model only scores the full response. How does each individual token get credit?', answer: 'Through the advantage. The value model predicts the expected final reward at every position; GAE combines these predictions with the final reward (and per-token KL penalties) to give each token its own advantage.' },
      ],
    },
    {
      id: 'pros-cons',
      title: 'Advantages and disadvantages of PPO',
      blocks: [
        { type: 'compare', title: 'Policy-gradient methods compared', options: [
          { name: 'Vanilla policy gradient', summary: 'Step along ∇ log π · A once per batch.', pros: ['Simplest to write'], cons: ['Unstable step sizes', 'Each batch used once'], bestFor: 'Teaching and tiny problems' },
          { name: 'TRPO', summary: 'Maximise improvement subject to a KL limit.', pros: ['Stable, principled updates'], cons: ['Second-order math', 'Hard to scale and combine with other losses'], bestFor: 'Research where exact trust regions matter' },
          { name: 'PPO', summary: 'Clip the ratio in a first-order loss.', pros: ['Stable and simple', 'Reuses each batch for several epochs', 'Works across games, robotics and LLMs'], cons: ['Needs a value model', 'Many hyperparameters', 'Sensitive to implementation details'], bestFor: 'General-purpose RL and classic RLHF' },
        ], rows: [
          ['Step-size control', 'Learning rate only', 'Hard KL constraint', 'Ratio clipping'],
          ['Optimiser', 'First-order', 'Second-order approx.', 'First-order (Adam)'],
          ['Data reuse', 'One step', 'One update', 'Several epochs'],
        ], verdict: 'PPO became the default because it gets most of TRPO’s stability with ordinary gradient descent.' },
        { type: 'list', items: [
          '**Advantages:** stable training, easy to implement with standard optimisers, sample-efficient enough to reuse data, and widely tested (from game-playing agents such as OpenAI Five to InstructGPT).',
          '**Disadvantages:** a separate value model doubles memory in LLM settings; results depend on many settings (ε, learning rate, epochs, GAE λ, KL coefficient, batch size); and well-known studies have shown that small implementation details can change results a lot.',
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Running too many epochs on one batch so the policy drifts far beyond the clip range anyway; forgetting to normalise advantages; computing ratios from probabilities instead of log-probabilities (numerical issues); and using stale log π_old values. In LLMs, also watch KL to the reference model and response length for signs of reward hacking.' },
        { type: 'p', text: '**When not to use PPO:** if we only have a fixed set of preference pairs, DPO is simpler; if rewards are verifiable and memory is tight, GRPO avoids the value model; and if good demonstrations exist, plain supervised fine-tuning may be enough.' },
      ],
    },
    {
      id: 'worked-example-mini-batch',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: 'Let us run the PPO objective by hand on a mini-batch of **three replies** from our support assistant. The reward model scored them 9, 7 and 8. We use `ε = 0.2`, so the safe band for the ratio is `[0.8, 1.2]`. All numbers are illustrative.' },
        { type: 'steps', title: 'From rewards to one objective value', items: [
          { title: 'Advantages', text: 'The value model expected 8 for each prompt. Advantages: `9 − 8 = +1`, `7 − 8 = −1`, `8 − 8 = 0`. One good reply, one bad, one as expected.' },
          { title: 'Ratios after a few gradient steps', text: 'We have already updated the policy a little on this batch. The new policy makes the three replies 1.3, 0.9 and 1.1 times as likely as the old one did.' },
          { title: 'Reply 1 (A = +1, ratio 1.3)', text: 'Unclipped: `1.3 × 1 = 1.3`. Clipped: `1.2 × 1 = 1.2`. The minimum is **1.2**. We have already passed the band, so there is no extra credit for going further.' },
          { title: 'Reply 2 (A = −1, ratio 0.9)', text: 'Unclipped: `0.9 × −1 = −0.9`. The ratio is inside the band, so the clipped value is the same. The term is **−0.9**, and lowering the ratio further still helps.' },
          { title: 'Reply 3 (A = 0, ratio 1.1)', text: '`1.1 × 0 = 0`. A reply that was exactly as good as expected gives no signal in either direction.' },
          { title: 'Average', text: '`(1.2 − 0.9 + 0) / 3 = 0.1`. That is the value of L^CLIP for this batch. The next gradient step only comes from reply 2, the one still inside the band.' },
        ] },
        { type: 'p', text: 'While training we cannot inspect every sample like this, so we log a few summary numbers per update. They tell us whether the updates are too timid or too aggressive:' },
        { type: 'table', caption: 'Three health checks for a PPO run', head: ['Number to log', 'What it is', 'How to read it'], rows: [
          ['Clip fraction', 'Share of samples whose ratio is outside [1 − ε, 1 + ε]. In our batch: 1 of 3.', 'Near zero for many updates: steps are tiny, learning is slow. Most samples clipped: the policy is leaving the trusted region; use fewer epochs or a lower learning rate.'],
          ['Approximate KL', 'Average distance between old and new policy on the batch', 'A sudden jump means one update moved too far. Many implementations stop the epochs early when it passes a limit.'],
          ['Entropy', 'How spread out the policy’s choices are', 'A fast fall toward zero means the policy has stopped exploring and may be stuck on one behaviour.'],
        ] },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will train a three-action policy on **one fixed batch for 60 epochs**, once with the plain ratio objective and once with PPO’s clipped objective. Reusing a batch is exactly where clipping earns its place. To keep the code short, the gradient is computed numerically by nudging each logit.' },
        { type: 'code', lang: 'python', title: 'practice_ppo_clip.py', code: `import numpy as np

pi_old = np.array([0.5, 0.3, 0.2])     # old policy over 3 actions (one state)
adv = np.array([-1.0, 0.5, 2.0])       # advantage of each action
eps = 0.2

def softmax(z):
    e = np.exp(z - z.max())
    return e / e.sum()

def objective(logits, clip):
    ratio = softmax(logits) / pi_old               # r = pi_new / pi_old
    term = ratio * adv
    if clip:                                       # PPO: pessimistic minimum
        term = np.minimum(term, np.clip(ratio, 1 - eps, 1 + eps) * adv)
    return float(np.sum(pi_old * term))            # expectation under pi_old

def train(clip, epochs=60, lr=0.05, h=1e-5):
    logits = np.log(pi_old)                        # start at the old policy
    for _ in range(epochs):                        # reuse the same batch
        grad = np.zeros(3)
        for k in range(3):                         # numeric gradient per logit
            step = np.zeros(3)
            step[k] = h
            grad[k] = (objective(logits + step, clip) - objective(logits - step, clip)) / (2 * h)
        logits += lr * grad
    return softmax(logits)

for clip in (False, True):
    pi_new = train(clip)
    name = "clipped (PPO)" if clip else "unclipped    "
    print(name, "new policy", pi_new.round(3), "ratios", (pi_new / pi_old).round(2))`, output: `unclipped     new policy [0.112 0.203 0.685] ratios [0.22 0.68 3.42]
clipped (PPO) new policy [0.394 0.361 0.245] ratios [0.79 1.2  1.23]`,
          walkthrough: [
            { lines: [3, 5], note: 'The old policy, one advantage per action, and the clip range.' },
            { lines: [11, 16], note: 'The objective: ratio × advantage, optionally replaced by the pessimistic minimum with the clipped version, averaged under the old policy.' },
            { lines: [18, 27], note: 'Gradient ascent on the logits for 60 epochs, always on the same batch.' },
            { lines: [29, 32], note: 'Run both versions and print the new policy and its ratios to the old one.' },
          ] },
        { type: 'p', text: 'Without clipping, the best action goes from 0.2 to 0.685, a ratio of 3.42. With clipping, every ratio stops close to the edge of `[0.8, 1.2]`. The small overshoot (0.79, 1.23) is real: clipping removes the *reason* to go further, it is not a wall.' },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Tighten the band: set `eps = 0.05` on line 5. Predict the clipped ratios before running. Does the unclipped row change?',
          'Reuse the batch less: change `epochs=60` on line 18 to `epochs=5`. Predict: will the two rows differ at all? What does that say about when clipping matters?',
          'Give every action the same advantage: set `adv` on line 4 to `[1.0, 1.0, 1.0]`. Predict the new policy. Why does a reward that is “good for everything” teach nothing?',
        ] },
        { type: 'check', question: 'In the unclipped row, action 1 has a *positive* advantage (+0.5), yet its ratio fell to 0.68. Why did a better-than-average action become less likely?', answer: 'Probabilities must sum to 1. Action 2 has a much larger advantage (+2.0), so raising it pays more, and that probability has to come from somewhere. Once the policy has shifted, +0.5 is below the new policy’s average, so action 1 loses out too. Clipping prevents this runaway: in the clipped row action 1 keeps its gain (ratio 1.2).' },
        { type: 'check', question: 'The advantages were estimated from replies sampled by the *old* policy. Why does that make the unclipped result (a ratio of 3.42 for one action) risky rather than impressive?', answer: 'The numbers −1, +0.5 and +2 describe how actions performed near the old policy, from a limited sample. The further the new policy moves, the less those estimates apply, and any noise in them is amplified by every extra epoch. PPO’s clip keeps the update inside the region where the batch is still trustworthy, then collects fresh data and re-estimates.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does the probability ratio rₜ(θ) measure in PPO?', options: ['The new policy’s probability of an action divided by the old policy’s', 'The action’s reward divided by the critic’s value estimate for that state', 'The fraction of actions in the current batch whose updates were clipped', 'How far the learning rate has decayed from its starting value so far'], answer: 0, explain: 'r = π_new(a|s) / π_old(a|s). A ratio of 1.5 means the action became 50% more likely. Rewards and values enter through the advantage, not the ratio.' },
    { q: 'With ε = 0.2, a good action (A = +2) has ratio 1.5. What value does the PPO term use?', options: ['+3.00', '+2.00', '+2.40', '+1.60'], answer: 2, explain: 'min(1.5·2, clip(1.5, 0.8, 1.2)·2) = min(3.0, 2.4) = 2.4. The gain is capped once the ratio passes 1.2, so there is no incentive to push further.' },
    { q: 'A bad action (A < 0) became much more likely after an update (ratio 1.5). How does PPO treat it?', options: ['It clips the ratio to 1.2, which shrinks the penalty for that action', 'It drops the sample entirely because the ratio is outside the clip range', 'It keeps the full penalty, since the min picks the more pessimistic term', 'It flips the sign of the advantage so the action is pushed back down'], answer: 2, explain: 'For A < 0 and r > 1+ε, r·A is the smaller value, so the min keeps the full penalty and its gradient. Clipping removes incentives to over-improve, not to fix mistakes.' },
    { q: 'How does PPO differ from TRPO?', options: ['PPO learns a value function only and does not keep an explicit policy at all', 'TRPO enforces a hard KL constraint (second-order); PPO approximates it with a clipped loss', 'PPO requires a separately trained reward model, while TRPO works directly from environment rewards', 'TRPO clips the probability ratio, while PPO enforces a hard KL constraint'], answer: 1, explain: 'Both keep updates near the old policy. TRPO does it with a constrained, second-order optimisation; PPO uses clipping inside an ordinary loss. The last option swaps them.' },
    { q: 'A team running PPO for LLM RLHF hits GPU memory limits. Which part of the standard setup is the main extra cost that later methods like GRPO remove?', options: ['The tokenizer, which is loaded separately for each of the models', 'The clipping function, which stores every ratio for the whole batch', 'The value (critic) model, a second large network trained with the policy', 'The KL penalty formula, which needs its own copy of the gradients'], answer: 2, explain: 'LLM PPO keeps policy, reference, reward and value models in memory. The value model is a full extra network; GRPO replaces it with group-averaged rewards. Clipping and the KL formula cost almost nothing.' },
  ],
  takeaways: [
    'A policy gives action probabilities; policy gradients raise the probability of actions with positive advantage.',
    'The advantage is reward minus expected reward (from a value model), so only better-than-usual actions are reinforced.',
    'PPO’s ratio r = π_new / π_old is clipped to [1−ε, 1+ε] (often ε = 0.2), and the min keeps the pessimistic term.',
    'Clipping makes updates small and stable and lets PPO reuse each batch for several epochs.',
    'In RLHF, PPO needs policy, reference, reward and value models, which motivates DPO and GRPO.',
  ],
  terms: [
    { term: 'Policy', def: 'A function giving the probability of each action in a state; in LLMs, the model itself.' },
    { term: 'Advantage', def: 'How much better an action did than expected: return minus the value estimate.' },
    { term: 'Value function', def: 'A model V(s) predicting the expected future reward from a state.' },
    { term: 'Probability ratio', def: 'π_new(a|s) / π_old(a|s), how much an action’s probability changed.' },
    { term: 'Clipping', def: 'Limiting the ratio to [1−ε, 1+ε] so updates stay small.' },
    { term: 'TRPO', def: 'Trust Region Policy Optimization: PPO’s predecessor with a hard KL constraint.' },
    { term: 'GAE', def: 'Generalised advantage estimation: a lower-noise way to compute advantages.' },
  ],
};
