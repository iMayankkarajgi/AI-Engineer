export default {
  id: 'direct-preference-optimization-dpo',
  minutes: 20,
  hook: 'What if the whole reward-model-plus-PPO machinery of RLHF could be replaced by one loss function you train like ordinary fine-tuning?',
  summary: 'DPO (Direct Preference Optimization) trains a language model straight from preference pairs (a prompt, a chosen answer and a rejected answer) with a simple classification-style loss. It uses a frozen reference model and a math result showing that the RLHF objective’s optimal policy defines an implicit reward, so no separate reward model and no reinforcement learning loop are needed. It is cheaper and more stable than PPO-based RLHF, but it learns only from fixed data and does not explore.',
  sections: [
    {
      id: 'rlhf-recap',
      title: 'What is RLHF and why do we need it?',
      blocks: [
        { type: 'p', text: 'A model after **supervised fine-tuning (SFT)** can answer questions, but we want it to give the answers people *prefer*: helpful, honest, safe and in the right tone. **RLHF** (reinforcement learning from human feedback) does this in two extra steps: train a **reward model** on human comparisons (“answer A is better than answer B”), then use **PPO**, a reinforcement learning algorithm, to make the model produce answers the reward model scores highly, with a **KL penalty** that keeps it close to the SFT model.' },
        { type: 'p', text: 'Running example: our bike-rental support assistant. We have collected thousands of comparisons where a support lead picked the better of two replies to a customer message. We want the model to learn from them.' },
      ],
    },
    {
      id: 'rlhf-problem',
      title: 'The problem with RLHF',
      blocks: [
        { type: 'list', items: [
          '**Many moving parts:** a policy, a reference model, a reward model and a value model must live in memory at the same time.',
          '**Sampling during training:** PPO must generate fresh text in every iteration, which is slow.',
          '**Instability:** results depend on many hyperparameters (learning rates, clip range, KL coefficient, GAE settings) and small implementation details.',
          '**Reward hacking:** the policy can exploit flaws in the separately trained reward model.',
        ] },
        { type: 'p', text: 'Many teams with good preference data simply could not afford or stabilise this pipeline. That was the motivation for DPO.' },
      ],
    },
    {
      id: 'what-is-dpo',
      title: 'What is Direct Preference Optimization?',
      blocks: [
        { type: 'p', text: '**DPO** was introduced by Rafael Rafailov, Archit Sharma, Eric Mitchell and colleagues at Stanford in 2023, in a paper titled “Direct Preference Optimization: Your Language Model is Secretly a Reward Model” ([paper](https://arxiv.org/abs/2305.18290)). It optimises the *same goal* as KL-regularised RLHF but does it **directly** on preference pairs, using one supervised-style loss. No reward model is trained, and no text is sampled during training.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like learning from marked exam pairs', text: 'RLHF is like training a separate examiner, then having the student write new essays for the examiner to grade, over and over. DPO skips the examiner: the student looks at pairs of essays where a teacher already marked which was better and adjusts directly, making the better one feel more “like me” and the worse one less, compared with how they wrote before the course.' },
      ],
    },
    {
      id: 'preference-data',
      title: 'What is preference data?',
      blocks: [
        { type: 'p', text: 'A **preference dataset** is a list of triples `(x, y_w, y_l)`: a **prompt** x, a **chosen** (winning) response y_w, and a **rejected** (losing) response y_l. The pair is usually two responses to the same prompt, judged by humans or by a strong AI model.' },
        { type: 'table', caption: 'One preference example for our support bot', head: ['Field', 'Content'], rows: [
          ['Prompt x', '“My e-bike battery died halfway through my rental. What now?”'],
          ['Chosen y_w', '“Sorry about that! Use the app’s Help → Battery issue to get a free swap at the nearest station, and we’ll credit the lost time.”'],
          ['Rejected y_l', '“Batteries can die for many reasons, including temperature, age and usage patterns. Lithium-ion cells…” (long and does not help)'],
        ] },
        { type: 'p', text: 'This is exactly the kind of data RLHF’s reward model is trained on, so the same datasets work for both. Public examples include Anthropic’s HH-RLHF and UltraFeedback.' },
      ],
    },
    {
      id: 'key-idea',
      title: 'The key idea behind DPO',
      blocks: [
        { type: 'p', text: 'RLHF wants the policy that maximises reward minus a KL penalty. That problem has a known exact solution: `π*(y | x) = π_ref(y | x) · exp(r(x, y) / β) / Z(x)`, where Z(x) is a normalising constant. In words, the best policy reweights the reference model toward higher-reward answers.' },
        { type: 'p', text: 'DPO’s insight is to run this equation **backwards**. Rearranging gives the reward in terms of the policy:' },
        { type: 'formula', expr: 'r(x, y) = β · log( π(y | x) / π_ref(y | x) ) + β · log Z(x)', where: [
          ['π', 'the policy (our model)'],
          ['π_ref', 'the frozen reference model, usually the SFT model'],
          ['β', 'how strongly we stay close to the reference'],
          ['Z(x)', 'a normaliser that depends only on the prompt'],
        ], caption: 'Every policy implies a reward. This is the “implicit reward”.' },
        { type: 'p', text: 'Now plug this into the Bradley–Terry preference model, which only looks at the *difference* in reward between two answers to the same prompt. The awkward `β · log Z(x)` term is identical for both answers, so it **cancels**. What remains depends only on the policy and the reference, both of which we can compute. So we can train the policy directly on preferences: the language model is, in the paper’s phrase, secretly a reward model.' },
        { type: 'check', question: 'Why is it essential that the Z(x) term cancels?', answer: 'Z(x) sums over every possible response, which is impossible to compute for a language model. Because both answers in a pair share the same prompt x, Z(x) appears in both rewards and disappears in their difference, leaving only quantities we can compute: log-probabilities under the policy and the reference.' },
      ],
    },
    {
      id: 'loss',
      title: 'The DPO loss function in simple words',
      blocks: [
        { type: 'formula', expr: 'L_DPO = −log σ( β · [ log(π_θ(y_w|x) / π_ref(y_w|x)) − log(π_θ(y_l|x) / π_ref(y_l|x)) ] )', where: [
          ['y_w, y_l', 'chosen and rejected responses'],
          ['log π(y|x)', 'sum of token log-probabilities of the whole response'],
          ['σ', 'sigmoid'],
          ['β', 'typically around 0.1 (values from about 0.01 to 0.5 are used)'],
        ] },
        { type: 'p', text: 'Read it in three parts:' },
        { type: 'list', ordered: true, items: [
          '**Implicit reward of each answer:** β times how much more (or less) likely the policy makes the answer than the reference does.',
          '**Margin:** chosen reward minus rejected reward. We want this positive and large.',
          '**Loss:** −log σ(margin), the same logistic loss used to train RLHF reward models. It is about 0.69 at margin 0 and falls toward 0 as the margin grows.',
        ] },
        { type: 'chart', kind: 'line', title: 'DPO loss and gradient weight vs margin', xLabel: 'Margin (implicit reward chosen − rejected)', yLabel: 'Value', series: [ { name: 'Loss −log σ(m)', points: [[-3, 3.049], [-2, 2.127], [-1, 1.313], [0, 0.693], [1, 0.313], [2, 0.127], [3, 0.049]] }, { name: 'Gradient weight σ(−m)', points: [[-3, 0.953], [-2, 0.881], [-1, 0.731], [0, 0.5], [1, 0.269], [2, 0.119], [3, 0.047]] } ], caption: 'Computed values. Pairs the model already ranks correctly (large margin) get little gradient; pairs it gets wrong get a lot.' },
        { type: 'p', text: 'The gradient has a helpful built-in weighting: each pair’s update is scaled by `σ(−margin)`, so the model works hardest on pairs it currently ranks wrongly and barely touches pairs it already gets right. The reference model matters too: without it, the easiest way to lower the loss would be to shift probabilities wildly; the ratio against π_ref plays the role of the KL penalty.' },
        { type: 'code', lang: 'python', title: 'dpo_loss_steps.py', code: `import numpy as np

beta = 0.1
# Log-probabilities (summed over tokens) of the chosen and rejected answers
ref_chosen, ref_rejected = -42.0, -40.0     # frozen reference (SFT) model
pol_chosen, pol_rejected = -42.0, -40.0     # policy starts as a copy of ref

def sigmoid(x): return 1 / (1 + np.exp(-x))

for step in range(4):
    # implicit rewards: how much more the policy likes each answer than ref does
    r_c = beta * (pol_chosen - ref_chosen)
    r_r = beta * (pol_rejected - ref_rejected)
    margin = r_c - r_r
    loss = -np.log(sigmoid(margin))
    weight = sigmoid(-margin)               # big when the model is still wrong
    print(f"step {step}: logp chosen {pol_chosen:6.1f}  rejected {pol_rejected:6.1f}"
          f"  margin {margin:+.2f}  loss {loss:.3f}  grad weight {weight:.2f}")
    # gradient of the loss pushes chosen up and rejected down (toy step of size 20)
    pol_chosen += 20 * beta * weight
    pol_rejected -= 20 * beta * weight`, output: `step 0: logp chosen  -42.0  rejected  -40.0  margin +0.00  loss 0.693  grad weight 0.50
step 1: logp chosen  -41.0  rejected  -41.0  margin +0.20  loss 0.598  grad weight 0.45
step 2: logp chosen  -40.1  rejected  -41.9  margin +0.38  loss 0.521  grad weight 0.41
step 3: logp chosen  -39.3  rejected  -42.7  margin +0.54  loss 0.458  grad weight 0.37`, walkthrough: [
          { lines: [3, 6], note: 'Whole-response log-probabilities. The reference actually prefers the rejected answer (−40 > −42); the policy starts as an exact copy.' },
          { lines: [10, 14], note: 'Implicit rewards are β × log-ratio to the reference. At step 0 both are 0, so the margin is 0 and the loss is log 2 ≈ 0.693.' },
          { lines: [15, 16], note: 'Loss and the per-pair gradient weight σ(−margin).' },
          { lines: [19, 21], note: 'The gradient of the DPO loss raises log π(chosen) and lowers log π(rejected), each scaled by β·σ(−margin). As the margin grows, steps shrink.' },
        ] },
        { type: 'check', question: 'At step 0 the reference model already likes the rejected answer more (−40 vs −42), yet the margin is 0. Why?', answer: 'DPO’s margin uses log-ratios to the reference, not raw log-probabilities. The policy equals the reference at step 0, so both log-ratios are 0. DPO measures how the policy has changed relative to the reference, not absolute likelihoods.' },
      ],
    },
    {
      id: 'step-by-step',
      title: 'How DPO works step by step',
      blocks: [
        { type: 'steps', title: 'A DPO training run', items: [
          { title: 'Start from an SFT model', text: 'Fine-tune on good demonstrations first. This model becomes both the starting policy and the frozen reference.' },
          { title: 'Collect preference pairs', text: 'Prompt, chosen, rejected. Ideally the responses come from the SFT model itself, so the data matches the policy.' },
          { title: 'Precompute reference log-probs', text: 'Run the frozen reference once over every chosen and rejected answer and store log π_ref. This can be cached.' },
          { title: 'Compute policy log-probs', text: 'For each batch, run the policy on chosen and rejected answers (a normal forward pass, no sampling).' },
          { title: 'Apply the DPO loss and update', text: 'Compute the margin, the loss −log σ(β·margin), backpropagate, and step the optimiser. Usually 1–3 epochs.' },
          { title: 'Evaluate', text: 'Check win rates against the SFT model with humans or a judge model, plus safety and general-skill tests.' },
        ] },
        { type: 'flow', title: 'Data flow in DPO', nodes: [
          { label: 'Preference pair', detail: 'Prompt x, chosen y_w, rejected y_l.' },
          { label: 'Policy log-probs', detail: 'log π_θ(y_w|x) and log π_θ(y_l|x), with gradients.' },
          { label: 'Reference log-probs', detail: 'log π_ref(y_w|x) and log π_ref(y_l|x), frozen (often precomputed).' },
          { label: 'Margin', detail: 'β·[(policy − ref) for chosen − (policy − ref) for rejected].' },
          { label: 'Loss and update', detail: '−log σ(margin); update the policy only.' },
        ] },
      ],
    },
    {
      id: 'dpo-vs-rlhf',
      title: 'DPO vs RLHF (PPO)',
      blocks: [
        { type: 'compare', title: 'Two ways to learn from preferences', options: [
          { name: 'RLHF with PPO', summary: 'Train a reward model, then optimise it with online RL.', pros: ['Explores: learns from its own fresh samples', 'Reward model can score new prompts and be reused', 'Strong results at the largest labs'], cons: ['Four models in memory', 'Slow sampling during training', 'Many sensitive hyperparameters'], bestFor: 'Large teams with infrastructure and a need for online improvement' },
          { name: 'DPO', summary: 'One supervised-style loss directly on preference pairs.', pros: ['Two models (policy + frozen reference)', 'No sampling, no reward model', 'Stable and easy to run with standard training code'], cons: ['Offline: no exploration beyond the dataset', 'Sensitive to how well the data matches the policy', 'Can overfit preferences'], bestFor: 'Most teams with a fixed preference dataset' },
        ], rows: [
          ['Models in memory', 'Policy, reference, reward, value', 'Policy, reference'],
          ['Generates text while training', 'Yes', 'No'],
          ['Explicit reward model', 'Yes', 'No (implicit)'],
          ['Objective', 'KL-regularised reward maximisation', 'Same objective, solved in closed form'],
        ], verdict: 'Start with DPO for offline preference data; consider online methods (PPO, online/iterative DPO, GRPO) when you need the model to improve on its own fresh outputs.' },
        { type: 'p', text: 'In the original paper, DPO matched or exceeded PPO-based RLHF on the tasks tested (sentiment control, summarisation and single-turn dialogue). Later studies found that well-tuned online methods can still beat DPO in some settings, so the comparison depends on data, scale and tuning.' },
      ],
    },
    {
      id: 'pros-cons',
      title: 'Advantages and disadvantages of DPO',
      blocks: [
        { type: 'list', items: [
          '**Simple:** a few lines of loss code on top of normal fine-tuning.',
          '**Cheap:** no reward model to train, no value model, no generation during training.',
          '**Stable:** behaves like supervised learning, with mainly β and the learning rate to tune.',
          '**Widely adopted:** used in open models such as Zephyr and Tülu 2, and Meta reported using DPO in Llama 3’s post-training.',
        ] },
        { type: 'list', items: [
          '**Offline only:** it cannot discover better answers than those in the dataset. Iterative or online DPO (regenerate pairs with the current model, relabel, repeat) partly fixes this.',
          '**Distribution mismatch:** if pairs were written by a very different model, the log-ratios can behave poorly.',
          '**Likelihood can fall for both answers:** DPO only cares about the *gap*, so the chosen answer’s probability can drop too, as long as the rejected one drops more.',
          '**Overfitting and verbosity:** it can overfit small datasets and inherit biases in the data, such as preferring longer answers.',
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Skipping SFT and running DPO on a base model; using a reference model different from the starting policy; setting β too small so the policy drifts far from the reference; training many epochs on a small dataset; and judging success by training loss instead of win rate on held-out prompts. Variants such as IPO, KTO, ORPO and SimPO each target some of these issues.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does DPO need during training?', options: ['A policy, a frozen reference model and preference pairs', 'A reward model, a value model and online sampling', 'Only a pretrained model and a large set of unlabelled text', 'A policy and a trained reward model, but no reference model'], answer: 0, explain: 'DPO uses the policy and a frozen reference with (prompt, chosen, rejected) pairs. It has no explicit reward model, no value model and no sampling.' },
    { q: 'In DPO’s derivation, why does the normalising term β·log Z(x) disappear?', options: ['Because β is set to zero during training, removing the term entirely', 'Because the frozen reference model absorbs it into its own log-probabilities', 'Both responses share the prompt x, so it cancels in the reward difference', 'Because the sigmoid ignores any additive constant in its input'], answer: 2, explain: 'Bradley–Terry uses r(x, y_w) − r(x, y_l). Z depends only on x, so it is the same for both and cancels. β is not zero, and the sigmoid alone does not remove an additive term.' },
    { q: 'With β = 0.1, the policy raised log π(chosen) by 2 and lowered log π(rejected) by 3, relative to the reference. What is the DPO margin?', options: ['0.1', '0.5', '−0.1', '5.0'], answer: 1, explain: 'Margin = β·[(+2) − (−3)] = 0.1·5 = 0.5. Forgetting β gives 5.0; subtracting the changes the wrong way gives −0.1.' },
    { q: 'Our team has a fixed dataset of 20,000 preference pairs, one GPU node, and no RL infrastructure. Which approach fits best?', options: ['PPO-based RLHF with separately trained reward and value models', 'Continued pretraining on the chosen responses only, ignoring rejections', 'DPO starting from our SFT model, with the SFT model as the reference', 'Prompt tuning a soft prompt on the chosen responses as targets'], answer: 2, explain: 'DPO is designed for exactly this: offline preference pairs, standard training code, two models. PPO needs much more memory and infrastructure; training only on chosen responses ignores what makes them better.' },
    { q: 'A teammate says: "DPO always increases the probability of the chosen answer." What is wrong?', options: ['It only optimises the gap; both can fall as long as the rejected one falls more', 'Nothing; the loss guarantees that the chosen answer’s probability goes up', 'DPO never changes the chosen answer’s probability, only the rejected one’s', 'DPO pushes up the rejected answer’s probability to keep the policy diverse'], answer: 0, explain: 'The loss depends on the difference of log-ratios. Training can lower both likelihoods while widening the gap, a known DPO behaviour.' },
  ],
  takeaways: [
    'DPO learns from (prompt, chosen, rejected) pairs with one supervised-style loss.',
    'It solves the same KL-regularised objective as RLHF: the policy’s log-ratio to the reference is an implicit reward.',
    'Loss = −log σ(β·[log-ratio chosen − log-ratio rejected]); wrongly ranked pairs get the biggest updates.',
    'Only two models, no sampling, no reward model: cheaper and more stable than PPO.',
    'It is offline: no exploration, sensitive to data match, and can lower both likelihoods.',
  ],
  terms: [
    { term: 'DPO', def: 'Direct Preference Optimization: training a policy directly on preference pairs without RL.' },
    { term: 'Preference pair', def: 'A prompt with a chosen (better) and a rejected (worse) response.' },
    { term: 'Reference model', def: 'A frozen copy of the starting (SFT) model used to measure how the policy has changed.' },
    { term: 'Implicit reward', def: 'β · log(π(y|x) / π_ref(y|x)), the reward a policy implicitly assigns to an answer.' },
    { term: 'Margin', def: 'Implicit reward of the chosen answer minus that of the rejected answer.' },
    { term: 'β (beta)', def: 'Controls how far the policy may move from the reference; larger means more conservative.' },
  ],
};
