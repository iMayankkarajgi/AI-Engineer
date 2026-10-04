export default {
  id: 'reinforcement-learning',
  minutes: 22,
  hook: 'Nobody gave AlphaGo a labelled list of "correct moves", and nobody hands a robot the right motor command for every millisecond. How do machines learn when the only feedback is "that went well" or "that went badly"?',
  summary: 'In reinforcement learning (RL), an agent learns by trial and error: it observes a state, takes an action, receives a reward, and adjusts its behaviour (its policy) to maximise the total reward it collects over time. Rewards can be delayed, so the agent must work out which earlier actions deserved credit, and it must balance exploring new actions against exploiting what already works. RL powers game-playing systems, robotics, and the RLHF and reasoning-model training behind modern LLMs.',
  sections: [
    {
      id: 'big-picture',
      title: 'The big picture: learning from consequences',
      blocks: [
        { type: 'p', text: 'So far in this module we have met two ways of learning. **Supervised learning** learns from examples with correct answers. **Unsupervised learning** finds structure in data without answers. But many problems fit neither. When a robot learns to walk, nobody can label the "correct" torque for each joint at each moment. When a program learns to play chess, the only clear feedback arrives at the end: win, lose or draw.' },
        { type: 'p', text: '**Reinforcement learning (RL)** is the third major family of machine learning. An **agent** learns by interacting with an **environment**: it tries actions, sees what happens, and receives numeric **rewards**. Its goal is to learn a strategy that collects as much total reward as possible over time. There is no teacher giving the right answer, only a score that says how good the outcome was.' },
        { type: 'callout', tone: 'analogy', title: 'A simple real-world analogy: training a dog', text: 'We cannot explain "sit" to a dog in words. Instead, when the dog happens to sit after we say "sit", it gets a treat (a reward). Over many tries, the dog learns that sitting after that sound leads to treats. The dog is the agent, the room and the owner are the environment, sitting is an action, and the treat is the reward. Notice the dog is never shown what to do; it discovers which behaviour pays off.' },
        { type: 'p', text: 'Our running example: a small **cleaning robot** in a corridor of six cells that must find its way to the charging dock at the far end. Each move drains a little battery (a small negative reward); reaching the dock gives a big positive reward.' },
      ],
    },
    {
      id: 'building-blocks',
      title: 'The building blocks of RL',
      blocks: [
        { type: 'table', head: ['Term', 'Meaning', 'In the robot example'], rows: [
          ['Agent', 'The learner and decision-maker', 'The cleaning robot\'s controller'],
          ['Environment', 'Everything the agent interacts with', 'The corridor and the dock'],
          ['State (s)', 'A description of the current situation', 'Which cell the robot is in (0 to 5)'],
          ['Action (a)', 'A choice the agent can make', 'Move left or move right'],
          ['Reward (r)', 'A number the environment returns after each action', '−1 per move, +10 on reaching the dock'],
          ['Policy (π)', 'The agent\'s strategy: which action to take in each state', '"In every cell, move right"'],
          ['Value function V(s)', 'Expected total future reward starting from state s', 'Cell 4 (next to the dock) is worth more than cell 0'],
          ['Q-function Q(s, a)', 'Expected total future reward after taking action a in state s, then acting well', 'Q(cell 3, right) is high; Q(cell 3, left) is lower'],
          ['Model (optional)', 'The agent\'s own prediction of how the environment responds', 'A map of which move leads to which cell'],
        ] },
        { type: 'p', text: 'The **policy** is what we are ultimately trying to learn. The value and Q-functions are tools that help: if we know how good each action is, the best policy is simply "pick the action with the highest Q-value".' },
        { type: 'p', text: 'Formally, RL problems are usually described as a **Markov Decision Process (MDP)**: a set of states, a set of actions, rules for how actions change the state (possibly randomly), a reward for each transition, and a discount factor. "Markov" means the current state contains everything needed to decide; the past does not matter beyond what the state captures.' },
      ],
    },
    {
      id: 'rl-loop',
      title: 'The reinforcement learning loop',
      blocks: [
        { type: 'flow', title: 'Agent and environment, step after step', loop: true, nodes: [
          { label: 'Observe state', detail: 'The agent sees the current state sₜ, for example "I am in cell 2".' },
          { label: 'Choose action', detail: 'The policy picks an action aₜ, for example "move right".' },
          { label: 'Environment responds', detail: 'The world changes to a new state sₜ₊₁ (cell 3) and returns a reward rₜ₊₁ (−1).' },
          { label: 'Learn', detail: 'The agent updates its policy or value estimates using (state, action, reward, next state).' },
        ] },
        { type: 'steps', title: 'One pass around the loop for the robot', items: [
          { title: 'State', text: 'The robot is in cell 3.' },
          { title: 'Action', text: 'It currently believes "right" is better, so it moves right.' },
          { title: 'Reward and next state', text: 'It arrives in cell 4 and receives −1 for using battery.' },
          { title: 'Update', text: 'It adjusts its estimate of how good "right from cell 3" is, using the reward it just got plus how good it thinks cell 4 is.' },
          { title: 'Repeat', text: 'From cell 4 it moves right again, reaches the dock, gets +10, and the episode ends.' },
        ] },
        { type: 'p', text: 'This loop is the same shape as the AI agent loop we will meet in Module 11 (observe, think, act, repeat), which is no coincidence: RL is the mathematical study of agents.' },
      ],
    },
    {
      id: 'rl-vs-others',
      title: 'Reinforcement learning vs supervised vs unsupervised learning',
      blocks: [
        { type: 'compare', title: 'Three ways a machine can learn', options: [
          { name: 'Supervised', summary: 'Learn from examples with correct answers.', pros: ['Direct, precise feedback', 'Stable training'], cons: ['Needs labelled data'], bestFor: 'Classification and regression' },
          { name: 'Unsupervised', summary: 'Find structure in unlabelled data.', pros: ['No labels needed'], cons: ['No clear target; results need interpretation'], bestFor: 'Clustering, compression, anomaly detection' },
          { name: 'Reinforcement', summary: 'Learn by acting and receiving rewards.', pros: ['Learns sequences of decisions', 'Can discover strategies no human showed it'], cons: ['Feedback is delayed and noisy', 'Needs many interactions'], bestFor: 'Games, control, robotics, aligning LLMs' },
        ], rows: [
          ['Feedback', 'The correct answer', 'None', 'A reward score, often delayed'],
          ['Data', 'A fixed labelled dataset', 'A fixed unlabelled dataset', 'Generated by the agent\'s own actions'],
          ['Decisions affect future data?', 'No', 'No', 'Yes'],
          ['Goal', 'Minimise prediction error', 'Discover patterns', 'Maximise total future reward'],
        ], verdict: 'The defining features of RL are evaluative (not instructive) feedback, delayed consequences, and data that depends on the agent\'s own choices.' },
        { type: 'check', question: 'A model is trained on 1 million chess positions, each labelled with the move a grandmaster played. Is that reinforcement learning?', answer: 'No, that is supervised learning (imitating labelled moves). It becomes RL when the program plays games itself and learns from the outcome (win or loss) rather than from labelled correct moves. Real systems often combine both: imitation first, then RL.' },
      ],
    },
    {
      id: 'return-discount',
      title: 'Episode, return, and discount factor',
      blocks: [
        { type: 'p', text: 'An **episode** is one complete run from a start state to a terminal state: one game of chess, one trip of the robot from cell 0 to the dock. Some tasks have no natural end (a thermostat runs forever); these are called **continuing tasks**.' },
        { type: 'p', text: 'The agent does not try to maximise the next reward; it maximises the **return**, the total reward collected from now on. Future rewards are usually multiplied by a **discount factor** γ (gamma), a number between 0 and 1:' },
        { type: 'formula', expr: 'Gₜ = rₜ₊₁ + γ·rₜ₊₂ + γ²·rₜ₊₃ + … = ∑ₖ γᵏ · rₜ₊ₖ₊₁', where: [
          ['Gₜ', 'the return from time t'],
          ['γ', 'discount factor: how much a reward one step later is worth compared with one now'],
          ['rₜ₊₁', 'the reward received after the action at time t'],
        ] },
        { type: 'p', text: 'Why discount? A reward now is more certain than one far in the future, it keeps the sum finite for never-ending tasks, and it encourages reaching goals sooner. With γ = 0.9, a reward of 10 that is 3 steps away is worth 10 × 0.9³ ≈ 7.29 today. With γ = 0 the agent is completely short-sighted; with γ close to 1 it is far-sighted.' },
        { type: 'p', text: 'Return also explains the **credit assignment problem**: if the robot gets +10 at the end, which of its earlier moves deserve the credit? Value functions solve this by passing value backwards, step by step. The key relationship is the **Bellman equation**: the value of an action equals the immediate reward plus the discounted value of where it leads.' },
        { type: 'formula', expr: 'Q(s, a) = r + γ · maxₐ′ Q(s′, a′)', caption: 'For the robot with γ = 0.9: Q(cell 4, right) = 10. Q(cell 3, right) = −1 + 0.9 × 10 = 8. Q(cell 2, right) = −1 + 0.9 × 8 = 6.2. Value flows backwards from the goal.' },
      ],
    },
    {
      id: 'explore-exploit',
      title: 'Exploration vs exploitation',
      blocks: [
        { type: 'p', text: 'Every RL agent faces a dilemma. **Exploitation** means choosing the action that currently looks best. **Exploration** means trying something else to learn whether it might be even better. Only exploiting can lock the agent into a mediocre habit; only exploring means it never uses what it learned.' },
        { type: 'callout', tone: 'analogy', title: 'Choosing a restaurant', text: 'Going back to your favourite restaurant is exploiting: a reliably good meal. Trying a new one is exploring: it might be worse, or it might become your new favourite. A sensible person mostly exploits but occasionally explores.' },
        { type: 'p', text: 'The simplest strategy is **ε-greedy** (epsilon-greedy): with probability ε (say 0.1) take a random action, otherwise take the best-known action. Often ε starts high and decays over training, so the agent explores early and exploits later. Other strategies include sampling actions in proportion to their estimated value (softmax), and adding a bonus for actions that have rarely been tried.' },
        { type: 'viz', name: 'rl-gridworld', caption: 'Watch a Q-learning agent learn a path through a grid. Lower epsilon to exploit more, raise it to explore more, and watch the reward-per-episode chart.' },
      ],
    },
    {
      id: 'algorithm-families',
      title: 'Common families of RL algorithms',
      blocks: [
        { type: 'table', head: ['Family', 'Core idea', 'Examples'], rows: [
          ['Value-based', 'Learn Q(s, a); act by picking the highest-valued action', 'Q-learning, SARSA, DQN (Deep Q-Network)'],
          ['Policy-based (policy gradient)', 'Directly adjust the policy\'s parameters to make high-return actions more likely', 'REINFORCE'],
          ['Actor-critic', 'An actor (policy) chooses actions; a critic (value function) judges them to reduce noise', 'A2C/A3C, PPO, SAC'],
          ['Model-based', 'Learn or use a model of the environment and plan with it', 'Dyna, MuZero; AlphaZero plans with known game rules'],
        ] },
        { type: 'p', text: 'Two more distinctions you will hear: **on-policy** methods learn about the policy they are currently following (SARSA, PPO), while **off-policy** methods can learn about the best policy from data generated by a different, more exploratory behaviour (Q-learning, DQN). And **tabular** methods keep a table of values, which only works for small state spaces; **deep RL** replaces the table with a neural network so it can handle huge spaces like images or text.' },
        { type: 'p', text: 'For LLM engineering, the family that matters most is policy gradient and actor-critic: **PPO** (Proximal Policy Optimization) was used in the original RLHF pipelines, and newer methods such as **GRPO** remove the separate critic. Module 8 covers RLHF, PPO, DPO and GRPO in depth.' },
      ],
    },
    {
      id: 'code',
      title: 'Code: Q-learning for the corridor robot',
      blocks: [
        { type: 'p', text: 'Here is tabular **Q-learning**, a classic value-based algorithm (Watkins, 1989), running on our six-cell corridor. The robot starts knowing nothing (all Q-values are zero), explores with ε-greedy, and updates its table with the Bellman target after every move.' },
        { type: 'code', lang: 'python', title: 'q_learning_corridor.py', code: `import numpy as np

# A corridor of 6 cells: start in cell 0, the charger (goal) is cell 5.
# Actions: 0 = left, 1 = right. Each move costs -1; reaching the goal gives +10.
N, GOAL = 6, 5
rng = np.random.default_rng(0)
Q = np.zeros((N, 2))                    # Q[state, action]: expected future return
alpha, gamma, epsilon = 0.5, 0.9, 0.2   # learning rate, discount, exploration

def step(s, a):
    s2 = max(0, s - 1) if a == 0 else min(N - 1, s + 1)
    return s2, (10 if s2 == GOAL else -1), s2 == GOAL

for episode in range(1, 51):
    s, total, done, moves = 0, 0, False, 0
    while not done and moves < 100:
        # Explore with probability epsilon (or on ties), otherwise exploit
        if rng.random() < epsilon or Q[s, 0] == Q[s, 1]:
            a = int(rng.integers(2))
        else:
            a = int(Q[s].argmax())
        s2, r, done = step(s, a)
        target = r if done else r + gamma * Q[s2].max()   # Bellman target
        Q[s, a] += alpha * (target - Q[s, a])             # Q-learning update
        s, total, moves = s2, total + r, moves + 1
    if episode in (1, 2, 5, 10, 50):
        print(f"episode {episode:2d}: {moves:3d} moves, return {total}")

print("learned policy:", " ".join("R" if Q[s].argmax() else "L" for s in range(GOAL)))
print("Q(state, right):", np.round(Q[:GOAL, 1], 2).tolist())`, output: `episode  1:   8 moves, return 3
episode  2:  15 moves, return -4
episode  5:   8 moves, return 3
episode 10:   5 moves, return 6
episode 50:   5 moves, return 6
learned policy: R R R R R
Q(state, right): [3.12, 4.58, 6.2, 8.0, 10.0]`, walkthrough: [
          { lines: [3, 8], note: 'The environment and the agent\'s empty Q-table: 6 states × 2 actions. α is how far each update moves, γ = 0.9 is the discount, ε = 0.2 means 20% random moves.' },
          { lines: [10, 12], note: 'The environment\'s rules: move one cell (walls at both ends), −1 per move, +10 and episode over on reaching cell 5.' },
          { lines: [14, 21], note: 'Each episode starts at cell 0. ε-greedy action choice: random with probability ε (and when both actions look equal, which is always true at the start), otherwise the best-known action.' },
          { lines: [22, 25], note: 'The heart of Q-learning: target = reward + γ × best Q of the next state. Move Q(s, a) a fraction α of the way towards it.' },
          { lines: [26, 27], note: 'Early episodes wander (15 moves, return −4). By episode 10 the robot takes the shortest path: 5 moves, return 4 × (−1) + 10 = 6. Later episodes can still be longer because of the 20% exploration.' },
          { lines: [29, 30], note: 'The learned policy is "always right". The Q-values exactly match the Bellman calculation we did by hand: 10, 8, 6.2, 4.58, 3.12.' },
        ] },
        { type: 'chart', kind: 'line', title: 'Return per episode (first 20 episodes)', xLabel: 'Episode', yLabel: 'Return', series: [
          { name: 'Return', points: [[1, 3], [2, -4], [3, 3], [4, 5], [5, 3], [6, 6], [7, 4], [8, 5], [9, 6], [10, 6], [11, 6], [12, 4], [13, 6], [14, 6], [15, 6], [16, 4], [17, 6], [18, 4], [19, 6], [20, 6]] },
        ], caption: 'Measured from the same run. The maximum possible return is 6; occasional dips to 4 are exploration moves.' },
        { type: 'check', question: 'If we set γ = 0.5 instead of 0.9, what would Q(cell 3, right) converge to?', answer: 'Q(cell 4, right) is still 10 (terminal reward). Q(cell 3, right) = −1 + 0.5 × 10 = 4. A smaller γ makes distant rewards count for less.' },
      ],
    },
    {
      id: 'where-used',
      title: 'Where is reinforcement learning used?',
      blocks: [
        { type: 'timeline', title: 'Selected RL milestones', items: [
          { when: '1989', title: 'Q-learning', text: 'Chris Watkins introduces Q-learning, the algorithm in our code.' },
          { when: '1992', title: 'TD-Gammon', text: 'Gerald Tesauro\'s backgammon program learns through self-play to play near the level of top humans.' },
          { when: '2013–2015', title: 'DQN plays Atari', text: 'DeepMind\'s Deep Q-Network learns many Atari games from raw pixels and the score.' },
          { when: '2016', title: 'AlphaGo', text: 'Combining deep networks, tree search and RL, AlphaGo defeats Go champion Lee Sedol.' },
          { when: '2022', title: 'RLHF goes mainstream', text: 'InstructGPT and then ChatGPT use reinforcement learning from human feedback to make LLMs follow instructions helpfully.' },
          { when: '2024–2025', title: 'RL for reasoning', text: 'Reasoning models are trained with RL on tasks with checkable answers (maths, code); for example, DeepSeek-R1 used GRPO.' },
        ] },
        { type: 'callout', tone: 'example', title: 'Applications today', text: 'Game playing; robot locomotion and manipulation (often trained in simulation first); recommendation and ad systems that optimise long-term engagement; resource scheduling and data-centre cooling control; and, most relevant to this course, **aligning and improving LLMs**: RLHF trains a model with rewards from a learned model of human preferences, and RL with verifiable rewards trains reasoning on maths and code.' },
      ],
    },
    {
      id: 'why-hard',
      title: 'Why reinforcement learning is hard, and a quick summary',
      blocks: [
        { type: 'list', items: [
          '**Sample inefficiency.** Agents often need millions of interactions. That is fine in a fast simulator, expensive or dangerous in the real world.',
          '**Delayed rewards and credit assignment.** When the reward comes at the end, figuring out which of hundreds of actions mattered is difficult.',
          '**Reward design and reward hacking.** The agent optimises exactly what we reward, not what we meant. A boat-racing agent might learn to spin in circles collecting bonus points instead of finishing the race. LLMs trained against a reward model can learn to please the reward model (for example, by being verbose) rather than truly improving.',
          '**Exploration is hard.** In large worlds, random exploration rarely stumbles on rewards.',
          '**Instability.** Because the data depends on the changing policy, training can oscillate or collapse; deep RL is famously sensitive to hyperparameters.',
          '**Sim-to-real gap.** Policies trained in simulation may fail on real hardware where physics differs slightly.',
        ] },
        { type: 'callout', tone: 'warn', title: 'When not to use RL', text: 'If you have labelled examples of the right answer, supervised learning is far simpler and more stable. If a decision is one-shot with no effect on future states, simpler methods (or bandit algorithms) usually suffice. Reach for RL when decisions are sequential, feedback is a score rather than an answer, and you can afford lots of trial and error, ideally in simulation.' },
        { type: 'p', text: '**Quick summary:** an agent observes a state, acts, gets a reward and a new state, and learns a policy that maximises discounted return. Value functions and the Bellman equation pass credit backwards from rewards. ε-greedy and similar strategies balance exploration with exploitation. Value-based, policy-gradient, actor-critic and model-based methods are the main families, and RL is now a core tool for training LLMs.' },
      ],
    },
  ],
  quiz: [
    {
      q: 'What does a reinforcement learning agent try to maximise?',
      options: ["The accuracy of its predictions on a fixed labelled dataset", "The expected total discounted reward over time (the return)", "The reward of the very next action, ignoring everything after", "The number of different states it manages to visit overall"],
      answer: 1,
      explain: 'RL maximises return: the sum of future rewards, usually discounted by γ. Optimising only the next reward ignores delayed consequences.',
    },
    {
      q: 'Our RL agent quickly found a route that earns a small reward and now repeats it forever, never discovering a much better route. What should we adjust?',
      options: ["Lower the discount factor to 0 so it focuses on now", "Remove all rewards so that it stops preferring that route", "Increase exploration, e.g. a higher or slower-decaying ε", "Switch to unsupervised clustering of the visited states"],
      answer: 2,
      explain: 'The agent is over-exploiting. More exploration lets it try other actions and discover the better route.',
    },
    {
      q: 'With γ = 0.9, the agent gets −1 for a move and then reaches a state whose best Q-value is 10. Using the Bellman target, what is the target for that move?',
      options: ['9', '10', '−1', '8'],
      answer: 3,
      explain: 'Target = r + γ × max Q(next) = −1 + 0.9 × 10 = 8. That matches Q(cell 3, right) = 8 in the code output.',
    },
    {
      q: 'Which statement best contrasts reinforcement learning with supervised learning?',
      options: ["RL learns from delayed rewards for its own actions, not answers", "RL needs a labelled correct action for every single state", "Supervised learning is only ever used for playing games", "They are the same, except that RL uses neural networks"],
      answer: 0,
      explain: 'RL gets a score, not the right answer, and its actions change what data it sees next. Supervised learning has a fixed dataset of correct answers.',
    },
    {
      q: 'A team rewards a summarisation model based on a reward model that loves long, confident-sounding text. Summaries get longer and less accurate while the reward keeps rising. What is happening?',
      options: ["The discount factor is set too high, so it overvalues length", "Reward hacking: it optimises the reward, not what we wanted", "The model is underfitting because ε has been set to zero", "This is expected: a rising reward means the model is improving"],
      answer: 1,
      explain: 'Agents exploit whatever the reward measures. If the reward is an imperfect proxy, rising reward can coexist with worse real quality. Better reward design and constraints are needed.',
    },
  ],
  takeaways: [
    'RL: an agent learns a policy by acting in an environment and receiving rewards, without being told the right answer.',
    'Core pieces: state, action, reward, policy, value function and Q-function, usually framed as an MDP.',
    'The goal is the discounted return; γ sets how much the future counts, and the Bellman equation passes value backwards.',
    'Agents must balance exploration and exploitation, for example with ε-greedy.',
    'Main families: value-based (Q-learning, DQN), policy gradient, actor-critic (PPO), model-based.',
    'RL is powerful but sample-hungry, unstable and prone to reward hacking; it now powers RLHF and reasoning-model training.',
  ],
  terms: [
    { term: 'Agent', def: 'The learner that observes states and chooses actions in reinforcement learning.' },
    { term: 'Reward', def: 'A number the environment returns after an action, signalling how good the outcome was.' },
    { term: 'Policy', def: 'The agent\'s strategy: a mapping from states to actions (or action probabilities).' },
    { term: 'Return', def: 'The total discounted reward collected from a point in time onwards.' },
    { term: 'Discount factor (γ)', def: 'A number between 0 and 1 that reduces the weight of rewards further in the future.' },
    { term: 'Q-value', def: 'The expected return after taking a given action in a given state and then acting well.' },
    { term: 'Exploration vs exploitation', def: 'The trade-off between trying new actions to learn and using the best-known action to earn reward.' },
  ],
};
