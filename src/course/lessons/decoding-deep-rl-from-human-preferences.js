export default {
  id: 'decoding-deep-rl-from-human-preferences',
  minutes: 21,
  hook: 'How do you reward a robot for doing a graceful backflip when nobody can write down, in code, what “graceful backflip” means?',
  summary: 'The 2017 paper “Deep Reinforcement Learning from Human Preferences” showed that an agent can learn complex behaviour without a hand-written reward. Humans watch pairs of short clips and pick the better one; a reward model learns to predict those choices; and a reinforcement learning agent maximises the learned reward. With feedback on under 1% of the agent’s interactions it learned Atari games, robot locomotion and even a backflip. This loop is the foundation of RLHF.',
  sections: [
    {
      id: 'building-blocks',
      title: 'The building blocks we must know first',
      blocks: [
        { type: 'p', text: '**Reinforcement learning (RL)** is learning by trial and error. An **agent** (the learner) acts in an **environment** (a game, a simulator, the world). At each step it sees a **state** (or observation), picks an **action**, and receives a **reward**, a number saying how good that was. The agent’s **policy** is its rule for choosing actions. The goal is a policy that collects as much total reward as possible over time.' },
        { type: 'p', text: 'A **trajectory** is the sequence of states and actions the agent goes through. A **reward function** maps each state and action to a reward. In games the reward is easy: the score. In most real tasks it is not.' },
        { type: 'viz', name: 'rl-gridworld', caption: 'An agent learning by trial and error with a hand-written reward (goal = +1). The paper asks: what if nobody can write that reward?' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like training a dog with a clicker', text: 'The dog does not understand words. It tries things and the trainer clicks when it does something good. Over time it learns what earns clicks. Classic RL needs a pre-programmed clicker. This paper replaces the pre-programmed clicker with a model that learned *when a human would click* by watching the human compare attempts.' },
      ],
    },
    {
      id: 'reward-problem',
      title: 'Why it was needed: the reward problem',
      blocks: [
        { type: 'p', text: 'Writing a good reward function by hand is surprisingly hard. Rewards that look sensible often lead to strange behaviour, because the agent optimises exactly what we wrote, not what we meant. This is called **reward misspecification** or **reward hacking**. A famous kind of example: an agent rewarded for points in a boat-racing game learned to circle and collect bonus items forever instead of finishing the race.' },
        { type: 'p', text: 'Two obvious alternatives also have problems:' },
        { type: 'list', items: [
          '**Imitation learning** (copying human demonstrations) needs someone who can *perform* the task. Nobody can demonstrate a backflip by controlling a simulated robot’s joints.',
          '**A human giving a reward at every step** is far too slow: RL agents need millions of steps.',
        ] },
        { type: 'p', text: 'The insight of Paul Christiano, Jan Leike, Tom Brown, Miljan Martic, Shane Legg and Dario Amodei (OpenAI and DeepMind, [2017](https://arxiv.org/abs/1706.03741)) was that humans are good at **judging** behaviour even when they cannot specify or demonstrate it, and that comparing two options is easier and more consistent than giving an absolute score.' },
      ],
    },
    {
      id: 'big-picture',
      title: 'The big picture: what the paper does',
      blocks: [
        { type: 'p', text: 'The method runs three processes at the same time, feeding each other:' },
        { type: 'flow', title: 'Three processes running in a loop', loop: true, nodes: [
          { label: 'Agent acts', detail: 'The policy interacts with the environment, producing trajectories. It is trained by RL to maximise the reward model’s predicted reward.' },
          { label: 'Pick clip pairs', detail: 'Short segments are cut from trajectories; pairs where the reward model is most uncertain are chosen.' },
          { label: 'Human compares', detail: 'A person watches both clips and says which is better (or equal, or cannot tell).' },
          { label: 'Fit reward model', detail: 'The reward model is trained so that its predictions agree with the human’s choices.' },
        ] },
        { type: 'p', text: 'Nothing waits for anything else: the agent keeps learning from the current reward model, the human keeps answering queries, and the reward model keeps updating. The environment’s true reward (like a game score) is **hidden** from the agent; it is only used by the researchers to measure how well things worked.' },
      ],
    },
    {
      id: 'clips-and-comparisons',
      title: 'Trajectory segments and the human comparison',
      blocks: [
        { type: 'p', text: 'A **trajectory segment** (or **clip**) is a short piece of a trajectory, in the paper typically about **1 to 2 seconds** of video. Short clips are fast to watch, and judging a short piece is easier than judging a whole episode.' },
        { type: 'p', text: 'The human sees two clips side by side and answers one of four ways: the **left** is better, the **right** is better, they are **equally good**, or they **cannot be compared**. Incomparable pairs are dropped. Each judgement is stored as a triple: clip 1, clip 2, and a distribution μ over which one won (for example μ = 1 for clip 1, or μ = 0.5 for each when equal).' },
        { type: 'check', question: 'Why ask “which of these two is better?” instead of “rate this clip from 1 to 10”?', answer: 'Relative judgements are easier and more consistent. Different people (and the same person on different days) use rating scales differently, but they agree much more often on which of two things is better. Comparisons also need no shared calibration.' },
      ],
    },
    {
      id: 'reward-math',
      title: 'The reward model and the preference math',
      blocks: [
        { type: 'p', text: 'The **reward model** r̂ is a neural network that takes an observation and action and outputs a number. To compare two clips, we add up r̂ over every step of each clip, then turn the two totals into a probability with the **Bradley–Terry model** (a classic model for pairwise comparisons, also used for chess-style ratings):' },
        { type: 'formula', expr: 'P̂[σ¹ ≻ σ²] = exp(∑ₜ r̂(o¹ₜ, a¹ₜ)) / ( exp(∑ₜ r̂(o¹ₜ, a¹ₜ)) + exp(∑ₜ r̂(o²ₜ, a²ₜ)) )', where: [
          ['σ¹, σ²', 'the two clips (segments)'],
          ['σ¹ ≻ σ²', 'clip 1 is preferred to clip 2'],
          ['r̂(o, a)', 'predicted reward for observation o and action a'],
          ['∑ₜ', 'sum over the time steps of a clip'],
        ], caption: 'Equivalent to σ(R₁ − R₂), the sigmoid of the difference in total predicted reward.' },
        { type: 'p', text: 'Small numbers: if clip 1 has total predicted reward R₁ = 2.0 and clip 2 has R₂ = 0.5, then P̂ = σ(1.5) ≈ 0.82. The model is 82% sure the human prefers clip 1. If the totals are equal, P̂ = 0.5.' },
        { type: 'p', text: 'Training uses **cross-entropy** between the predicted probability and the human label μ: `loss = −∑ [ μ(1)·log P̂[σ¹ ≻ σ²] + μ(2)·log P̂[σ² ≻ σ¹] ]`. When the human preferred clip 1 and the model gave it 0.82, the loss is −log 0.82 ≈ 0.20; if the model had given it 0.2, the loss would be about 1.61.' },
        { type: 'p', text: 'The code below simulates the whole reward-learning part: a hidden “true” preference (stay high, move forward, do not fall), a noisy simulated human who answers wrongly 10% of the time, and a linear reward model trained with the Bradley–Terry loss.' },
        { type: 'code', lang: 'python', title: 'reward_from_preferences.py', code: `import numpy as np
rng = np.random.default_rng(3)

# Each step of a clip has 3 features: [height, forward speed, falling]
true_w = np.array([1.0, 0.5, -2.0])        # hidden "what the human wants"
clips = rng.normal(size=(300, 25, 3))       # 300 clips, 25 steps each

def human_prefers_1(c1, c2):               # simulated human with 10% noise
    better = (c1 @ true_w).sum() > (c2 @ true_w).sum()
    return better if rng.random() > 0.1 else not better

pairs = [(rng.integers(300), rng.integers(300)) for _ in range(500)]
labels = np.array([human_prefers_1(clips[i], clips[j]) for i, j in pairs], float)

w = np.zeros(3)                             # reward model r(s) = w . s
for step in range(400):
    g = np.zeros(3)
    for (i, j), mu in zip(pairs, labels):
        R1, R2 = (clips[i] @ w).sum(), (clips[j] @ w).sum()  # sum reward over clip
        p1 = 1 / (1 + np.exp(-(R1 - R2)))  # Bradley-Terry: P(clip1 preferred)
        g += (p1 - mu) * (clips[i].sum(0) - clips[j].sum(0))
    w -= 0.002 * g / len(pairs)
    if step in (0, 399):
        acc = np.mean([((clips[i] @ w).sum() > (clips[j] @ w).sum()) == bool(mu)
                       for (i, j), mu in zip(pairs, labels)])
        print(f"step {step:3d}  agreement with human labels {acc:.0%}")

print("learned direction:", np.round(w / np.linalg.norm(w), 2))
print("true direction:   ", np.round(true_w / np.linalg.norm(true_w), 2))`, output: `step   0  agreement with human labels 87%
step 399  agreement with human labels 89%
learned direction: [ 0.42  0.26 -0.87]
true direction:    [ 0.44  0.22 -0.87]`, walkthrough: [
          { lines: [4, 6], note: 'A hidden true reward that the learner never sees, and 300 random clips of 25 steps.' },
          { lines: [8, 13], note: 'A simulated human compares 500 pairs. Like the paper’s assumption, they answer randomly some of the time; here 10%.' },
          { lines: [15, 22], note: 'Bradley–Terry training. Sum predicted reward over each clip, turn the difference into a probability, and follow the cross-entropy gradient (p₁ − μ)·(feature difference).' },
          { lines: [23, 26], note: 'Agreement starts high because even one step points roughly the right way, and tops out near 90%: with 10% label noise, no model can agree with every label.' },
          { lines: [28, 29], note: 'The learned reward points in almost exactly the same direction as the hidden one. Only the direction matters: scaling a reward does not change which clip is better.' },
        ] },
      ],
    },
    {
      id: 'training-details',
      title: 'Training the reward model and the agent',
      blocks: [
        { type: 'steps', title: 'Making it work in practice', items: [
          { title: 'Use an ensemble', text: 'Train several reward models on resampled data and average their (normalised) outputs. This makes the reward steadier.' },
          { title: 'Hold out data and regularise', text: 'Keep part of the comparisons for validation and use L2 regularisation (and dropout in some setups) so the reward model does not overfit a small dataset.' },
          { title: 'Allow for human error', text: 'Assume a fixed chance (10% in the paper) that the human answered at random, so a few careless labels do not dominate.' },
          { title: 'Normalise the reward', text: 'Rescale r̂ to a consistent mean and spread before handing it to the RL algorithm.' },
          { title: 'Train the agent with standard RL', text: 'Use policy-gradient methods: A2C for Atari games and TRPO for the MuJoCo robots. These tolerate a reward that keeps changing as r̂ improves.' },
        ] },
        { type: 'p', text: '**Smart query selection.** Human time is the scarce resource, so not every pair is worth asking about. The paper samples many candidate pairs and asks about the ones where the ensemble members **disagree most** (highest variance in predicted preference). This is a simple form of **active learning**: ask the question whose answer will teach the model the most. The authors noted this helped on some tasks but not all.' },
        { type: 'p', text: '**Online feedback matters.** The reward model must keep being updated as the agent changes. The authors found that training the reward model only once, before RL, let the agent find and exploit gaps in it, producing behaviour that scored high on r̂ but was not what humans wanted. Fresh comparisons on the agent’s *current* behaviour close those gaps.' },
        { type: 'callout', tone: 'warn', title: 'Common misconception', text: 'The agent does not see human feedback directly. It only ever sees r̂. Humans train r̂, and r̂ trains the agent. If r̂ is wrong in some region the agent visits, the agent will happily exploit the mistake, which is why the loop must keep asking humans about new behaviour.' },
      ],
    },
    {
      id: 'results',
      title: 'The results: the backflip and beyond',
      blocks: [
        { type: 'p', text: 'The method was tested on simulated robot tasks in **MuJoCo** (a physics simulator) and on **Atari** games. In both, the agent was never shown the true reward.' },
        { type: 'list', items: [
          '**Feedback efficiency:** humans gave feedback on less than 1% of the agent’s interactions with the environment.',
          '**Standard tasks:** with a few hundred to a few thousand comparisons, agents learned most of the tested tasks, in some cases approaching or even beating agents trained on the true reward, and in others falling short.',
          '**The backflip:** a simulated one-legged “Hopper” robot learned to do backflips from about 900 human comparisons, which took under an hour of human time. No one could have easily written a reward for that.',
        ] },
        { type: 'check', question: 'Why could learning from preferences sometimes beat learning from the game’s own score?', answer: 'A learned reward can be denser and better shaped than a sparse game score: it may reward progress toward good outcomes that the raw score only rewards much later. Humans also reward the behaviour they mean, not just the number the game counts.' },
      ],
    },
    {
      id: 'legacy',
      title: 'The legacy: this is RLHF',
      blocks: [
        { type: 'p', text: 'Swap “robot clips” for “model answers”, and you have **RLHF** (reinforcement learning from human feedback) for language models: humans compare two responses, a reward model learns those preferences with the same Bradley–Terry loss, and the language model is trained with RL to maximise that reward.' },
        { type: 'timeline', title: 'From backflips to chat assistants', items: [
          { when: '2017', title: 'Deep RL from Human Preferences', text: 'Learned rewards from clip comparisons for Atari and MuJoCo.' },
          { when: '2019', title: 'Fine-tuning LMs from human preferences', text: 'Ziegler et al. applied the idea to GPT-2 for stylistic continuation and summarisation.' },
          { when: '2020', title: 'Learning to summarise', text: 'Stiennon et al. showed RLHF summaries were preferred over those from much larger supervised models.' },
          { when: '2022', title: 'InstructGPT', text: 'Ouyang et al. used SFT + reward model + PPO to make GPT-3 follow instructions; the recipe behind early ChatGPT.' },
          { when: '2023 onward', title: 'Simpler preference methods', text: 'DPO and related methods learn from the same comparison data without a separate RL loop; GRPO and verifiable rewards spread for reasoning models.' },
        ] },
        { type: 'compare', title: 'Then and now', options: [
          { name: '2017 paper', summary: 'Robots and games learn from clip comparisons.', pros: ['Proved learned rewards can replace hand-written ones'], cons: ['Small-scale environments'], bestFor: 'Behaviours that are easy to judge but hard to specify' },
          { name: 'Modern LLM RLHF', summary: 'Language models learn from response comparisons.', pros: ['Makes models helpful and better aligned with what people want'], cons: ['Expensive labelling; reward hacking still a risk'], bestFor: 'Assistant behaviour, style, safety' },
        ], rows: [
          ['What is compared', '1–2 s video clips', 'Two (or more) text responses'],
          ['Reward model input', 'Observation + action per step', 'Prompt + full response'],
          ['RL algorithm', 'A2C, TRPO', 'Typically PPO; also GRPO and others'],
          ['Preference model', 'Bradley–Terry', 'Bradley–Terry'],
        ], verdict: 'Same core recipe, different scale. Today the comparison data is also used without RL (DPO), and AI judges sometimes replace humans (RLAIF).' },
      ],
    },
    {
      id: 'quick-summary',
      title: 'What this looks like today, and a quick summary',
      blocks: [
        { type: 'p', text: 'Modern pipelines keep the paper’s core ideas: comparisons instead of scores, a learned reward model, and an RL step. They add pieces the paper did not need: supervised fine-tuning first, a KL penalty to keep the model close to its starting point, and AI feedback to scale labelling. Reward hacking, which the paper already observed with offline reward models, remains one of the main practical problems.' },
        { type: 'p', text: '**Quick summary:** when a goal is easy to judge but hard to write down, ask humans to compare short clips, fit a reward model with the Bradley–Terry loss, and train an agent with RL on that learned reward, while continually collecting new comparisons on the agent’s latest behaviour. That loop, introduced in 2017, became RLHF.' },
      ],
    },
  ],
  quiz: [
    { q: 'In the paper, what does the human actually provide?', options: ['A numeric reward score for the agent at every time step', 'Full demonstrations of how to perform each task', 'Choices of which of two short video clips looks better', 'The code for a reward function that scores behaviour'], answer: 2, explain: 'Humans compared pairs of 1–2 second clips. Per-step rewards would be far too slow, and demonstrations or hand-written rewards are exactly what the method avoids.' },
    { q: 'Clip 1 has total predicted reward 2.0 and clip 2 has 0.5. Under the Bradley–Terry model, about how likely is clip 1 to be preferred?', options: ['0.18', '0.50', '0.67', '0.82'], answer: 3, explain: 'P = exp(2.0) / (exp(2.0) + exp(0.5)) = σ(2.0 − 0.5) = σ(1.5) ≈ 0.82. 0.18 is the chance clip 2 wins; 0.50 would mean equal totals.' },
    { q: 'Why did the authors ask humans about pairs where the reward-model ensemble disagreed most?', options: ['To get the most useful information per unit of scarce human time', 'Because those pairs are the easiest for humans to judge quickly', 'To hide the true reward from the agent so it cannot exploit it', 'Because the RL algorithm needs uncertain pairs to compute its update'], answer: 0, explain: 'Disagreement signals uncertainty, so those answers teach the reward model most. It is active learning to save human effort, not about easiness or RL requirements.' },
    { q: 'A team trains a reward model once from comparisons, then runs RL for a long time without new feedback. The agent’s predicted reward soars but humans dislike its behaviour. What went wrong?', options: ['The learning rate was too low, so the policy never reached genuinely good behaviour', 'The agent exploited flaws in a reward model never updated on its new behaviour', 'The Bradley–Terry model cannot represent human preferences between clips', 'The clips were too short for humans to judge what the agent was doing'], answer: 1, explain: 'The paper found offline reward models get exploited. Online feedback on the agent’s current behaviour is needed to fix the reward model where the agent goes.' },
    { q: 'Which statement best connects this 2017 paper to modern LLM training?', options: ['It introduced the Transformer architecture that modern LLMs are built on', 'Its compare → reward model → RL loop became the core of RLHF for language models', 'It showed that human feedback is unnecessary once a reward model exists', 'It trained the first chat assistant using comparisons from human raters'], answer: 1, explain: 'The comparison → reward model → RL loop carried over almost directly to LLM RLHF (2019–2022). The paper worked on games and robots, not Transformers or chat.' },
  ],
  takeaways: [
    'When a goal is easy to judge but hard to specify, learn the reward from human comparisons.',
    'Humans compare short clips; a reward model learns preferences via the Bradley–Terry model, σ(R₁ − R₂).',
    'The agent optimises the learned reward with standard RL and never sees human labels directly.',
    'Asking about uncertain pairs and collecting feedback online keep the reward model accurate where the agent goes.',
    'This compare → reward model → RL loop became RLHF for language models.',
  ],
  terms: [
    { term: 'Reinforcement learning', def: 'Learning a policy by trial and error to maximise total reward.' },
    { term: 'Policy', def: 'The agent’s rule for choosing an action in each state.' },
    { term: 'Trajectory segment (clip)', def: 'A short piece of the agent’s behaviour, shown to humans for comparison.' },
    { term: 'Reward model', def: 'A network trained to predict rewards that agree with human preferences.' },
    { term: 'Bradley–Terry model', def: 'A model where the chance one item beats another is the sigmoid of their score difference.' },
    { term: 'Reward hacking', def: 'An agent scoring high on a flawed reward without doing what was intended.' },
    { term: 'Active learning', def: 'Choosing which examples to label so each label teaches the model the most.' },
  ],
};
