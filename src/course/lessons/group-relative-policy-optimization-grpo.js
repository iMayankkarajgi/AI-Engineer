export default {
  id: 'group-relative-policy-optimization-grpo',
  minutes: 20,
  hook: 'Instead of training a whole second network to guess how good an answer “should” be, what if we just asked the model the same question eight times and compared the answers with each other?',
  summary: 'GRPO (Group Relative Policy Optimization) is a reinforcement learning method for language models that removes PPO’s value model. For each prompt it samples a group of answers, scores them, and uses each answer’s reward relative to the group’s mean (divided by the group’s standard deviation) as its advantage. It keeps PPO’s clipped update and a KL penalty to a reference model. Introduced with DeepSeekMath and used for DeepSeek-R1, it is a popular choice for training reasoning models with verifiable rewards.',
  sections: [
    {
      id: 'what-is-grpo',
      title: 'What is GRPO?',
      blocks: [
        { type: 'p', text: '**GRPO**, short for **Group Relative Policy Optimization**, was introduced by Zhihong Shao and colleagues at DeepSeek in the 2024 DeepSeekMath paper. It became widely known in 2025 when DeepSeek-R1, a model with strong step-by-step reasoning, was trained with large-scale reinforcement learning using GRPO.' },
        { type: 'p', text: 'GRPO is a variant of **PPO** (Proximal Policy Optimization). It keeps PPO’s core, the clipped probability-ratio update, but changes how the **advantage** (how much better an answer was than expected) is computed: instead of a learned value model, it compares answers within a **group** sampled for the same prompt.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like grading on a curve', text: 'A teacher without an answer key for “how hard was this exam?” can still grade fairly by comparing students who took the same exam: above the class average is good, below is bad. GRPO grades each answer against its classmates, the other answers to the same prompt, instead of against a separately trained predictor of expected score.' },
      ],
    },
    {
      id: 'why-grpo',
      title: 'Why do we need GRPO? The problem with PPO',
      blocks: [
        { type: 'p', text: 'In PPO for language models we need an **advantage** for every token: `A = actual reward − expected reward`. The expected part comes from a **value model** (or critic), a neural network usually as large as the policy, trained alongside it.' },
        { type: 'list', items: [
          '**Memory and compute:** the value model is a second large network to store, run and train. Together with the policy, reference and reward model, that is four big models.',
          '**Hard to train well:** the reward usually arrives only at the end of the answer, but the value model must predict it at every token. That is a difficult regression problem, and a poor value model gives noisy advantages.',
          '**Extra hyperparameters:** value loss weight, GAE settings and more, each a source of instability.',
        ] },
        { type: 'p', text: 'Running example for this lesson: we train a model for our bike-rental shop that answers pricing questions requiring arithmetic, such as “3 days of e-bike at 18 per day with a 10% weekly-pass discount: what is the total?” A program can check the final number, so the reward is simply 1 if correct and 0 if not.' },
        { type: 'check', question: 'If the reward is 1 or 0 only at the end of an answer, why is a value model’s job hard?', answer: 'It must estimate, from a half-written answer, the probability that the final number will be right. Early tokens give little evidence, and the target is noisy (0 or 1). Errors in this estimate become errors in every token’s advantage.' },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How does GRPO work?',
      blocks: [
        { type: 'steps', title: 'One GRPO step for one prompt', items: [
          { title: 'Sample a group', text: 'Generate G answers (for example 8) to the same prompt from the current policy, with some randomness (temperature above 0).' },
          { title: 'Score each answer', text: 'Use a reward function: a rule-based checker (correct final answer, valid format, passing unit tests) or a reward model.' },
          { title: 'Compute group-relative advantages', text: 'Aᵢ = (rᵢ − mean(r)) / std(r). Answers above the group average get positive advantages; below average get negative.' },
          { title: 'Share it across tokens', text: 'Every token of answer i gets the same advantage Aᵢ (with outcome rewards).' },
          { title: 'Clipped update plus KL', text: 'Apply PPO’s clipped ratio objective with these advantages, and subtract a KL penalty that keeps the policy close to a frozen reference model.' },
        ] },
        { type: 'flow', title: 'GRPO data flow', loop: true, nodes: [
          { label: 'Prompt', detail: 'One question, e.g. a pricing calculation.' },
          { label: 'Group of G answers', detail: 'Sampled from the current policy; they differ because sampling is random.' },
          { label: 'Rewards', detail: 'A checker or reward model scores each answer.' },
          { label: 'Normalise in group', detail: 'Subtract the group mean, divide by the group std: the advantages.' },
          { label: 'Clipped update', detail: 'PPO-style ratio clipping plus a KL term to the reference model; no value model anywhere.' },
        ] },
        { type: 'formula', expr: 'Âᵢ = ( rᵢ − mean(r₁, …, r_G) ) / std(r₁, …, r_G)', where: [
          ['rᵢ', 'reward of answer i in the group'],
          ['G', 'group size (number of answers per prompt)'],
          ['Âᵢ', 'advantage given to every token of answer i'],
        ], caption: 'The group mean replaces the value model as the baseline.' },
      ],
    },
    {
      id: 'worked-example',
      title: 'Step-by-step example',
      blocks: [
        { type: 'p', text: 'We ask the pricing question 8 times. A checker finds 3 correct answers (reward 1) and 5 wrong ones (reward 0). The group mean is 3/8 = 0.375 and the standard deviation is about 0.484. So each correct answer gets `(1 − 0.375) / 0.484 ≈ +1.29` and each wrong one gets `(0 − 0.375) / 0.484 ≈ −0.77`. The code computes this, then applies the PPO-style clipped term and a KL estimate.' },
        { type: 'code', lang: 'python', title: 'grpo_advantages.py', code: `import numpy as np

# One math prompt, a group of G = 8 sampled answers, checked by a rule:
# reward 1 if the final answer is correct, else 0
rewards = np.array([1, 0, 0, 1, 0, 0, 0, 1], dtype=float)

mean, std = rewards.mean(), rewards.std()
adv = (rewards - mean) / (std + 1e-8)       # group-relative advantage
print(f"group mean {mean:.3f}, std {std:.3f}")
for i, (r, a) in enumerate(zip(rewards, adv)):
    print(f"answer {i}: reward {r:.0f} -> advantage {a:+.2f}")

# Every token of answer i shares advantage adv[i]; PPO-style clipped term
eps = 0.2
ratio = np.array([1.05, 0.97, 1.30, 1.10, 0.92, 1.00, 0.70, 1.25])  # new/old prob
surrogate = np.minimum(ratio * adv, np.clip(ratio, 1 - eps, 1 + eps) * adv)
print("clipped terms:", np.round(surrogate, 2))

# KL estimate to the reference model, used by GRPO (always >= 0)
logp, logp_ref = -1.20, -1.50               # one token's log-probs
x = np.exp(logp_ref - logp)
print(f"k3 KL estimate = {x - np.log(x) - 1:.4f}")

all_same = np.ones(8)                       # every answer correct
print("all-correct group advantages:", (all_same - all_same.mean()) / (all_same.std() + 1e-8))`, output: `group mean 0.375, std 0.484
answer 0: reward 1 -> advantage +1.29
answer 1: reward 0 -> advantage -0.77
answer 2: reward 0 -> advantage -0.77
answer 3: reward 1 -> advantage +1.29
answer 4: reward 0 -> advantage -0.77
answer 5: reward 0 -> advantage -0.77
answer 6: reward 0 -> advantage -0.77
answer 7: reward 1 -> advantage +1.29
clipped terms: [ 1.36 -0.75 -1.01  1.42 -0.71 -0.77 -0.62  1.55]
k3 KL estimate = 0.0408
all-correct group advantages: [0. 0. 0. 0. 0. 0. 0. 0.]`, walkthrough: [
          { lines: [3, 5], note: 'Eight answers to one prompt, scored by a rule-based checker. No reward model needed for verifiable tasks.' },
          { lines: [7, 11], note: 'The heart of GRPO: normalise rewards within the group. The tiny 1e-8 avoids dividing by zero.' },
          { lines: [13, 17], note: 'Exactly PPO’s clipped term, but with group advantages. Answer 2 (wrong, ratio 1.30) keeps its full penalty −1.01; answer 7 (right, ratio 1.25) is capped at 1.2 × 1.29 = 1.55.' },
          { lines: [19, 22], note: 'GRPO adds a KL penalty directly to the loss, using the estimator π_ref/π − log(π_ref/π) − 1, which is never negative.' },
          { lines: [24, 25], note: 'If every answer gets the same reward, all advantages are 0: the prompt teaches nothing this step.' },
        ] },
        { type: 'chart', kind: 'bar', title: 'Group-relative advantages for our 8 answers', yLabel: 'Advantage', labels: ['A0 ✓', 'A1 ✗', 'A2 ✗', 'A3 ✓', 'A4 ✗', 'A5 ✗', 'A6 ✗', 'A7 ✓'], series: [ { name: 'Advantage', values: [1.29, -0.77, -0.77, 1.29, -0.77, -0.77, -0.77, 1.29] } ], caption: 'From the code output. Correct answers are pushed up, wrong ones down; the values sum to zero.' },
        { type: 'check', question: 'Suppose only 1 of 8 answers is correct. Will its advantage be larger or smaller than +1.29? Why?', answer: 'Larger. Mean = 0.125 and std ≈ 0.331, so the correct answer gets (1 − 0.125)/0.331 ≈ +2.65 and wrong ones ≈ −0.38. A rare success on a hard prompt is a strong signal, so it gets a big push; the many failures are each pushed down only a little.' },
      ],
    },
    {
      id: 'objective',
      title: 'The GRPO objective in simple words',
      blocks: [
        { type: 'formula', expr: 'J(θ) = (1/G) ∑ᵢ (1/|oᵢ|) ∑ₜ [ min( rᵢ,ₜ · Âᵢ , clip(rᵢ,ₜ, 1 − ε, 1 + ε) · Âᵢ ) − β · D_KL(π_θ ‖ π_ref) ]', where: [
          ['G', 'answers per prompt; oᵢ is answer i and |oᵢ| its length in tokens'],
          ['rᵢ,ₜ', 'probability ratio π_θ / π_θ_old for token t of answer i'],
          ['Âᵢ', 'group-relative advantage of answer i'],
          ['β', 'weight of the KL penalty to the reference model'],
        ], caption: 'As written in the DeepSeekMath paper (outcome-reward version); maximised during training.' },
        { type: 'list', items: [
          '**Average over the group and over tokens:** every answer contributes; inside each answer, every token gets the answer’s advantage.',
          '**PPO clipping:** each token’s probability can only change by about ±ε per round, keeping updates stable.',
          '**KL in the loss, not in the reward:** PPO-style RLHF usually subtracts the KL penalty from the reward; GRPO adds it as a separate term in the loss, so it does not muddy the advantage calculation.',
        ] },
        { type: 'deeper', title: 'Process rewards, and later refinements', blocks: [
          { type: 'p', text: 'DeepSeekMath also described a **process supervision** version, where a reward model scores each reasoning step and a token’s advantage is the sum of normalised step rewards from that point onward. The outcome version above is the one most people use with verifiable rewards.' },
          { type: 'p', text: 'Later work examined GRPO’s details. For example, the “Dr. GRPO” analysis (2025) argued that dividing by answer length and by the group’s standard deviation introduces biases, such as favouring longer wrong answers, and proposed dropping them; other recipes such as DAPO changed clipping and filtered out groups where every answer got the same reward. Which tweaks help depends on the task, so treat the formula above as the original baseline, not the final word.' },
        ] },
      ],
    },
    {
      id: 'ppo-vs-grpo',
      title: 'PPO vs GRPO',
      blocks: [
        { type: 'compare', title: 'Where the baseline comes from', options: [
          { name: 'PPO (RLHF)', summary: 'A learned value model predicts expected reward; advantages via GAE.', pros: ['Per-token credit assignment from the value model', 'Needs only one sample per prompt'], cons: ['Extra large network to train and store', 'Value model is hard to fit with end-of-answer rewards'], bestFor: 'Dense or shaped rewards; settings where one sample per prompt is all we can afford' },
          { name: 'GRPO', summary: 'The group’s mean reward is the baseline; advantages are normalised within the group.', pros: ['No value model: less memory and fewer hyperparameters', 'Matches how reward models compare answers', 'Works naturally with 0/1 verifiable rewards'], cons: ['Needs several samples per prompt', 'No learning signal when the whole group scores the same', 'Same advantage for every token of an answer'], bestFor: 'Reasoning tasks with checkable answers (math, code)' },
        ], rows: [
          ['Models in memory', 'Policy, reference, reward, value', 'Policy, reference (reward model optional)'],
          ['Baseline', 'V(s) from a critic', 'Mean reward of the group'],
          ['KL penalty', 'Usually inside the reward', 'Separate term in the loss'],
          ['Samples per prompt', 'Often 1', 'G (e.g. 4–64)'],
        ], verdict: 'GRPO trades extra sampling for dropping the critic, a good trade when answers can be checked automatically.' },
      ],
    },
    {
      id: 'advantages',
      title: 'Advantages of GRPO',
      blocks: [
        { type: 'list', items: [
          '**Memory savings:** removing the value model frees a large share of training memory, which can go to bigger batches or longer answers.',
          '**Simplicity:** fewer models and fewer hyperparameters than PPO.',
          '**Natural fit for comparisons:** reward models are trained on comparisons between answers to the same prompt, and GRPO also compares answers to the same prompt.',
          '**Strong with verifiable rewards:** with simple rule-based rewards (correct answer, correct format), DeepSeek reported that reasoning behaviours such as long step-by-step thinking and self-checking emerged during RL training of DeepSeek-R1-Zero.',
        ] },
        { type: 'callout', tone: 'example', title: 'Where GRPO is used', text: 'DeepSeekMath and DeepSeek-R1 used GRPO. Since then it has been implemented in open-source training libraries such as Hugging Face TRL, and many open reasoning-model projects use GRPO or close variants for math, coding and other tasks where a program can check the answer.' },
      ],
    },
    {
      id: 'practical',
      title: 'Practical things to keep in mind',
      blocks: [
        { type: 'list', items: [
          '**Group size:** larger groups give steadier baselines but cost more generation. Values from about 4 up to 64 appear in practice.',
          '**Zero-variance groups:** if all answers are right (too easy) or all wrong (too hard), every advantage is 0 and the prompt is wasted. Choose prompts at the right difficulty, or filter such groups.',
          '**Reward design:** rule-based rewards are hard to hack but can still be gamed, for example by guessing formats the checker accepts. Test the checker on tricky cases.',
          '**Sampling temperature:** answers in a group must differ, or there is nothing to compare. Too low a temperature removes diversity.',
          '**Watch length and KL:** reasoning RL often makes answers longer; that can be good (more thinking) or a bias. Track length, KL to the reference, and accuracy on held-out problems.',
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Using a prompt set that is far too easy or too hard (most groups have zero variance); trusting a buggy answer checker; setting the temperature so low that all G answers are identical; and assuming GRPO needs no reference model (most implementations keep one for the KL term, although some recipes drop it).' },
        { type: 'chart', kind: 'bar', title: 'Learning signal vs prompt difficulty (group of 8, 0/1 rewards)', yLabel: 'Std of rewards in group', labels: ['0/8 correct', '1/8', '2/8', '4/8', '6/8', '7/8', '8/8 correct'], series: [ { name: 'Reward std', values: [0, 0.331, 0.433, 0.5, 0.433, 0.331, 0] } ], caption: 'Computed values. Groups with all-same rewards give zero advantages; mixed groups carry the signal. Prompts the model solves about half the time are the most informative.' },
      ],
    },
    {
      id: 'when-and-conclusion',
      title: 'When to use GRPO, and conclusion',
      blocks: [
        { type: 'table', caption: 'Choosing a post-training method', head: ['Situation', 'Good choice', 'Why'], rows: [
          ['Answers can be checked by a program (math, code tests)', 'GRPO', 'Cheap, reliable rewards; group comparison works well'],
          ['Fixed dataset of human preference pairs', 'DPO', 'Offline and simple; no sampling needed'],
          ['Learned reward model, dense rewards, large infrastructure', 'PPO', 'Value model gives per-token credit'],
          ['Good demonstrations, no reward signal', 'SFT', 'Imitation is enough'],
        ] },
        { type: 'p', text: '**When not to use GRPO:** if we cannot afford several generations per prompt, if rewards are nearly always the same for every answer, or if we only have a fixed offline preference dataset (DPO is simpler there).' },
        { type: 'p', text: '**Conclusion:** GRPO is PPO without the critic. For each prompt it samples a group, scores each answer, and uses the group-normalised reward as the advantage, then applies PPO’s clipped update and a separate KL penalty. That makes RL for language models lighter and simpler, and it pairs especially well with verifiable rewards, which is why it became central to training reasoning models.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does GRPO use instead of PPO’s value model to compute advantages?', options: ['The mean and std of rewards across a group of answers to the same prompt', 'A second, smaller reward model trained on token-level correctness labels', 'The reference model’s log-probabilities, used as a per-token baseline', 'A fixed baseline of 0.5 subtracted from every prompt’s reward'], answer: 0, explain: 'GRPO’s baseline is the group mean, and it divides by the group std. The reference model is used for the KL term, not for the advantage.' },
    { q: 'A group of 4 answers gets rewards [1, 0, 0, 0]. Mean = 0.25, std ≈ 0.433. What is the correct answer’s advantage, approximately?', options: ['+0.75', '+1.00', '−0.58', '+1.73'], answer: 3, explain: '(1 − 0.25) / 0.433 ≈ +1.73. +0.75 forgets to divide by the std; −0.58 is the advantage of each wrong answer.' },
    { q: 'All 8 answers to a prompt are correct. What happens in GRPO for that prompt?', options: ['Every answer gets a large positive advantage for being correct', 'All advantages are zero, so the prompt adds no policy-gradient signal', 'The KL penalty is switched off for that prompt’s answers this step', 'The value model takes over and supplies the baseline instead'], answer: 1, explain: 'With identical rewards, reward − mean = 0 for every answer. Only the KL term would act. There is no value model to fall back on in GRPO.' },
    { q: 'How does GRPO handle the KL penalty compared with typical PPO-based RLHF?', options: ['The original GRPO has no reference model, so there is no KL term', 'Both subtract a per-token KL penalty from the reward in exactly the same way', 'GRPO uses the KL divergence itself as the reward to maximise', 'GRPO adds KL as its own loss term instead of folding it into the reward'], answer: 3, explain: 'DeepSeekMath’s GRPO adds β·D_KL directly to the objective (with a non-negative estimator), keeping advantages purely group-relative. Typical PPO RLHF puts a per-token KL penalty inside the reward.' },
    { q: 'We train a code model with GRPO using unit tests as rewards, but most groups are all-fail, and learning stalls. What is the best fix?', options: ['Lower the temperature so the sampled answers agree more often with each other', 'Use easier or mixed-difficulty prompts so groups contain both passes and fails', 'Remove the clipping so each update can move the policy further', 'Reduce the group size to 1 so each answer is judged on its own'], answer: 1, explain: 'All-fail groups have zero variance and zero advantages. Prompts the model sometimes solves give signal. Lower temperature reduces diversity further, and G = 1 makes group comparison impossible.' },
  ],
  takeaways: [
    'GRPO is PPO without a value model: the group of answers to the same prompt provides the baseline.',
    'Advantage = (reward − group mean) / group std, shared by every token of that answer.',
    'It keeps PPO’s clipped ratio update and adds a KL penalty to a reference model in the loss.',
    'Groups where every answer scores the same give no signal; pick prompts of the right difficulty.',
    'It fits verifiable rewards (math, code) and was central to DeepSeek-R1’s reasoning training.',
  ],
  terms: [
    { term: 'GRPO', def: 'Group Relative Policy Optimization: PPO-style RL that uses group-normalised rewards instead of a value model.' },
    { term: 'Group', def: 'Several answers sampled from the policy for the same prompt.' },
    { term: 'Group-relative advantage', def: '(reward − group mean) / group standard deviation.' },
    { term: 'Value model (critic)', def: 'A network PPO uses to predict expected reward; GRPO removes it.' },
    { term: 'Verifiable reward', def: 'A reward computed by a program, such as checking a final answer or running tests.' },
    { term: 'Reference model', def: 'A frozen copy of the starting policy used for the KL penalty.' },
  ],
};
