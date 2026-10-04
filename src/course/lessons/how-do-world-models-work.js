export default {
  id: "how-do-world-models-work",
  minutes: 23,
  hook: "Before reaching for a hot pan, you already “see” what would happen if you grabbed it bare-handed. What would it take for an AI to imagine consequences before acting?",
  summary: "A world model is a learned simulator: given the current state and an action, it predicts the next state (and often the reward). It is trained from recorded experience, usually in a compressed latent state rather than raw pixels. Once learned, an agent can roll out imagined futures inside the model to plan or to train its policy, needing far fewer real-world trials. Dreamer-style agents, MuZero, video world models such as Genie, and driving and robotics simulators all build on this idea, with compounding prediction error as the main limit.",
  sections: [
    {
      id: "environment-state-action",
      title: "Environment, state and action",
      blocks: [
        { type: "p", text: "We need three words from reinforcement learning (RL). The **environment** is the world the agent lives in: a video game, a robot's room, a road. The **state** is a description of the environment at one moment: a car's position and speed, or the pixels on the game screen. An **action** is what the agent can do: press left, turn the wheel, push with some force. After each action the environment moves to a new state and may give a **reward**, a number saying how good that was." },
        { type: "formula", expr: "sₜ₊₁ = f(sₜ, aₜ),   rₜ = R(sₜ, aₜ)", where: [["sₜ", "state at time t"], ["aₜ", "action at time t"], ["f", "the environment's dynamics, usually unknown to the agent"], ["R", "the reward function"]], caption: "The environment as a function. The agent can try actions, but cannot see inside f." },
        { type: "viz", name: "rl-gridworld", caption: "A model-free agent learning by trial and error in the real environment. Notice how many episodes it needs. World models aim to replace many of these real trials with imagined ones." },
        { type: "p", text: "Running example: a small **cart on a track** that must reach position 5. Its state is (position, velocity); its action is a push between −1 and +1; friction slows it down. The agent does not know the physics in advance." }
      ]
    },
    {
      id: "what-is-a-world-model",
      title: "What is a world model? The human analogy",
      blocks: [
        { type: "p", text: "A **world model** is the agent's own learned approximation of the environment's dynamics: a function f̂ that, given a state and an action, predicts the next state (and often the reward). It is an internal simulator of how the world responds." },
        { type: "callout", tone: "analogy", title: "Imagining a move before making it", text: "A chess player thinks “if I move my knight there, they will take it with the pawn”. A driver thinks “if I brake now, the car behind might hit me”. We run little simulations in our heads, choose the best imagined outcome, and only then act. We learned the simulator from years of experience; nobody gave us the equations." },
        { type: "p", text: "Two ways an agent can use a world model: **planning** (search through imagined action sequences at decision time and pick the best first action) and **learning in imagination** (train a policy on imagined experience instead of, or in addition to, real experience). Agents that use a model are called **model-based**; agents that learn directly from real trials without one are **model-free**." }
      ]
    },
    {
      id: "why-world-models",
      title: "Why we need a world model",
      blocks: [
        { type: "list", items: [
          "**Sample efficiency:** real trials are slow, expensive or dangerous (a robot arm, a car). Imagined trials are cheap: thousands per second on a GPU.",
          "**Safety:** we can test risky actions in imagination first. Crashing a simulated car costs nothing.",
          "**Planning and foresight:** looking several steps ahead helps in tasks where a good move only pays off later.",
          "**Generalisation:** a model of how the world works can be reused for new goals; a model-free policy is tied to the reward it was trained on.",
          "**Understanding:** predicting the future forces the system to learn objects, motion and cause and effect."
        ] },
        { type: "chart", kind: "bar", title: "Real environment steps used in this lesson's cart example", yLabel: "Steps", labels: ["Real steps (data + acting)", "Imagined steps (planning)"], series: [ { name: "Steps", values: [212, 28800] } ], caption: "From the code below: 200 real transitions to learn the model plus 12 real actions, versus 28,800 imagined steps used for planning. Imagination does the heavy lifting." }
      ]
    },
    {
      id: "learning-the-next-state",
      title: "How a world model learns: predicting the next state",
      blocks: [
        { type: "p", text: "Learning a world model is **supervised learning** on recorded experience. We collect transitions (s, a, s′, r) by acting in the environment (even randomly at first). Then we train a model to map (s, a) to s′ and r, minimising the prediction error. The data labels itself: the next state is simply what happened." },
        { type: "steps", title: "The basic recipe", items: [
          { title: "Collect", text: "Act in the real environment and store many transitions: state, action, next state, reward." },
          { title: "Fit", text: "Train f̂(s, a) ≈ s′ (and R̂(s, a) ≈ r) by minimising squared error or a likelihood, like any regression model." },
          { title: "Use", text: "Plan or train a policy using f̂ instead of the real environment." },
          { title: "Act and refresh", text: "Act in the real world with the plan, record the new transitions, and refit the model, so it improves where the agent actually goes." }
        ] },
        { type: "p", text: "Real environments are often **stochastic** (the same action can lead to different outcomes), so good world models predict a distribution over next states, not just one guess. For our cart, a simple linear model is enough; for video games and robots, deep neural networks are used." }
      ]
    },
    {
      id: "latent-state",
      title: "The latent state: compressing what we see",
      blocks: [
        { type: "p", text: "When the observation is an image, predicting the next image pixel by pixel is expensive and mostly wasted on irrelevant detail (as we saw in the JEPA lesson). So most modern world models first **compress** each observation into a small **latent state** z, a vector of, say, a few hundred numbers, and learn dynamics in that latent space." },
        { type: "p", text: "The influential 2018 paper *World Models* by David Ha and Jürgen Schmidhuber made this concrete with three parts: **V** (vision), a variational autoencoder that compresses each game frame into a small z; **M** (memory), a recurrent network that predicts the next z given the current z and action; and **C** (controller), a tiny policy that acts from z and M's hidden state. They even trained the controller entirely inside M's “dream” for a VizDoom task and then ran it in the real game." },
        { type: "flow", title: "A latent world model", loop: true, nodes: [
          { label: "Observe", detail: "A camera frame or game screen arrives (thousands of pixel values)." },
          { label: "Encode", detail: "An encoder compresses it into a latent state z (a short vector)." },
          { label: "Predict", detail: "The dynamics model predicts the next latent z′ (and reward) from z and the chosen action." },
          { label: "Decode (optional)", detail: "A decoder can turn z′ back into an image, for training or for humans to look at. Planning itself can stay in latent space." },
          { label: "Act", detail: "The controller chooses an action using the latent state; the loop continues." }
        ] }
      ]
    },
    {
      id: "imagining-the-future",
      title: "Imagining the future: rollouts without touching the real world",
      blocks: [
        { type: "p", text: "A **rollout** is a simulated trajectory: start from the current state, pick an action, ask the model for the next state, pick another action, and so on for H steps (the **horizon**). By scoring many rollouts we can pick good actions. A simple planning method, **random shooting with model predictive control (MPC)**, tries many random action sequences in the model, executes only the first action of the best one, observes the real result, and plans again." },
        { type: "code", lang: "python", title: "world_model_cart.py", code: `import numpy as np
rng = np.random.default_rng(1)

def real_env(s, a):                   # hidden physics: s = [position, velocity]
    pos, vel = s
    vel = 0.9 * vel + 0.5 * a         # friction + push
    return np.array([pos + vel, vel])

# 1) Collect 200 random transitions (s, a, s') from the real world
S, A, S2 = [], [], []
s = np.zeros(2)
for _ in range(200):
    a = rng.uniform(-1, 1)
    s2 = real_env(s, a) + rng.normal(0, 0.01, 2)   # small sensor noise
    S.append(s); A.append(a); S2.append(s2)
    s = s2 if abs(s2[0]) < 10 else np.zeros(2)
X = np.column_stack([np.array(S), np.array(A)])     # inputs [pos, vel, a]
W, *_ = np.linalg.lstsq(X, np.array(S2), rcond=None)  # 2) learn s' ≈ [s, a] @ W
model = lambda s, a: np.array([*s, a]) @ W
print("learned vel' =", np.round(W[:, 1], 2), "(true 0, 0.9, 0.5)")

# 3) Plan by imagination: try 300 random 8-step action plans inside the model
def plan(s, goal=5.0, n=300, horizon=8):
    best, best_cost = None, np.inf
    for _ in range(n):
        acts, x, cost = rng.uniform(-1, 1, horizon), s.copy(), 0.0
        for a in acts:
            x = model(x, a); cost += (x[0] - goal) ** 2   # imagined, no real step
        if cost < best_cost: best, best_cost = acts, cost
    return best[0]                    # do only the first action, then re-plan

s = np.zeros(2)
for t in range(12):                   # 4) act in the real world, re-planning each step
    s = real_env(s, plan(s))
print(f"position after 12 real steps: {s[0]:.2f} (goal 5.0)")
print("imagined steps used:", 12 * 300 * 8, "| real steps used:", 200 + 12)`, output: `learned vel' = [0.  0.9 0.5] (true 0, 0.9, 0.5)
position after 12 real steps: 4.85 (goal 5.0)
imagined steps used: 28800 | real steps used: 212`, walkthrough: [
          { lines: [4, 7], note: "The real environment. The agent can call it but does not know these equations." },
          { lines: [9, 16], note: "Collect 200 transitions with random pushes, adding a little sensor noise, resetting if the cart drifts too far." },
          { lines: [17, 20], note: "Learn the world model by least squares: next state as a linear function of (position, velocity, action). The learned velocity rule matches the hidden physics." },
          { lines: [22, 30], note: "Planning in imagination: 300 random 8-step plans are simulated entirely inside the model and scored by distance to the goal. Only the first action of the best plan is returned." },
          { lines: [32, 36], note: "Model predictive control: take that one real action, observe, re-plan. After 12 real steps the cart is near position 5, using 212 real steps versus 28,800 imagined ones." }
        ] },
        { type: "p", text: "The danger of imagination is **compounding error**. A small one-step mistake feeds into the next prediction, which adds its own mistake, and so on. Over long horizons, imagined trajectories can drift far from reality, and a planner may even exploit model errors (finding “shortcuts” that only exist in the flawed model)." },
        { type: "chart", kind: "line", title: "Compounding error over the rollout horizon", xLabel: "Steps imagined ahead", yLabel: "Typical prediction error", series: [
          { name: "Small one-step error", points: [[1, 0.01], [5, 0.06], [10, 0.15], [20, 0.4], [30, 0.8]] },
          { name: "Larger one-step error", points: [[1, 0.05], [5, 0.3], [10, 0.8], [20, 2.2], [30, 4.5]] }
        ], caption: "Illustrative shapes, not measurements. Error grows faster than linearly when each step builds on the last; this is why planners use short horizons and re-plan often." },
        { type: "check", question: "Why does the cart code execute only the first action of the best plan and then plan again?", answer: "Because the model is imperfect and errors compound along the horizon. Re-planning from the real observed state after every step corrects drift and keeps the agent grounded in reality, which is the core idea of model predictive control." }
      ]
    },
    {
      id: "dreamer",
      title: "Dreamer-style agents that plan inside the model",
      blocks: [
        { type: "p", text: "The **Dreamer** family by Danijar Hafner and colleagues (Dreamer in 2019, DreamerV2 in 2020, DreamerV3 in 2023) is the best-known line of agents that learn behaviour inside a latent world model. Instead of searching at decision time like our cart planner, Dreamer **trains an actor (policy) and a critic (value estimator) on imagined trajectories**." },
        { type: "steps", title: "Dreamer's three interleaved loops", items: [
          { title: "Learn the world model", text: "From replayed real experience, learn a recurrent latent model (the recurrent state-space model, RSSM, introduced in the earlier PlaNet work) that encodes observations, predicts next latent states, rewards and episode ends, and can reconstruct observations as a training signal." },
          { title: "Learn behaviour in imagination", text: "Start from latent states seen in real data, roll out the actor for a short horizon (around 15 steps) inside the model, and train the actor to maximise the critic's predicted returns; train the critic to predict those returns." },
          { title: "Act in the real environment", text: "Use the actor to collect new real experience, add it to the replay buffer, and repeat." }
        ] },
        { type: "p", text: "DreamerV3 was notable for working across many different domains with one fixed set of hyper-parameters, and for being reported as the first algorithm to collect diamonds in Minecraft from scratch, without human demonstrations or a hand-made curriculum. A related landmark, DeepMind's **MuZero** (2019–2020), learned a model that predicts only what planning needs (reward, value and policy) rather than observations, and used it with tree search to master Go, chess, shogi and Atari without being told the rules." },
        { type: "compare", title: "Model-free vs model-based RL", options: [
          { name: "Model-free (e.g. Q-learning, PPO)", summary: "Learn a policy or value directly from real trials.", pros: ["Simple, no model errors to worry about", "Strong final performance with enough data"], cons: ["Needs many real interactions", "Must relearn for a new goal"], bestFor: "Cheap, fast simulators where data is unlimited" },
          { name: "Model-based (world model)", summary: "Learn the dynamics, then plan or learn in imagination.", pros: ["Far fewer real interactions", "Safer exploration, reusable model"], cons: ["Model errors can mislead the policy", "More components to train"], bestFor: "Robots, driving, anything where real trials are costly" }
        ], rows: [
          ["Learns from", "Real experience only", "Real experience + imagined rollouts"],
          ["Main risk", "Sample cost", "Compounding model error"]
        ], verdict: "When real experience is expensive, a world model usually pays for itself; when simulation is free, model-free methods remain simpler." }
      ]
    },
    {
      id: "predicting-the-future",
      title: "World models and predicting the future",
      blocks: [
        { type: "p", text: "Since 2024 the term “world model” has also been used for large **video world models**: generative models trained on huge amounts of video that predict future frames, sometimes conditioned on actions. OpenAI described its Sora video model as a step toward “world simulators”. Google DeepMind's **Genie** models learn interactive environments from video, with Genie 3 (2025) generating explorable worlds in real time from a text prompt. NVIDIA's **Cosmos** platform offers world foundation models aimed at robotics and autonomous driving. Meta's V-JEPA 2 (previous lesson) takes the non-generative route, predicting in embedding space." },
        { type: "timeline", title: "Milestones in world models", items: [
          { when: "2018", title: "World Models (Ha & Schmidhuber)", text: "VAE + recurrent model + small controller; a policy trained inside the model's dream." },
          { when: "2019", title: "PlaNet and Dreamer", text: "Recurrent latent state-space models; planning and then actor-critic learning in imagination." },
          { when: "2019–2020", title: "MuZero", text: "A learned model of value, policy and reward used with tree search to master board games and Atari without the rules." },
          { when: "2023", title: "DreamerV3", text: "One configuration across many domains; Minecraft diamonds from scratch." },
          { when: "2024–2025", title: "Video world models", text: "Large generative and predictive video models (Sora, Genie 2 and 3, Cosmos, V-JEPA 2) used as simulators and for planning." }
        ] },
        { type: "p", text: "Whether a video generator really “understands” physics is debated: such models can produce plausible-looking clips that break physical laws, and looking right is not the same as predicting correctly under new actions. For control, what matters is accuracy on the consequences of actions, not visual quality." }
      ]
    },
    {
      id: "world-models-in-the-real-world",
      title: "World models in the real world",
      blocks: [
        { type: "callout", tone: "example", title: "Where they are used", text: "Robotics: learning manipulation with fewer physical trials, and planning toward goal images. Autonomous driving: generating rare or dangerous scenarios (a child running into the road) to train and test driving systems; Wayve's GAIA models are an example. Games and simulation: generating interactive environments for training agents. Industry: model predictive control with learned dynamics for processes such as heating and cooling systems." },
        { type: "callout", tone: "warn", title: "Limits and common mistakes", text: "Compounding error over long horizons; policies that exploit model flaws; models that are accurate only where data was collected and fail on new situations (distribution shift); and confusing pretty video with correct dynamics. Mitigations: short horizons with frequent re-planning, uncertainty estimates (for example ensembles of models), continual data collection, and always validating in the real world before trusting a plan." },
        { type: "p", text: "**When not to use one:** if a fast, accurate simulator already exists (many board games, some physics tasks), we can use it directly; and if real data is cheap and plentiful, a model-free method may be simpler and reach higher final performance." }
      ]
    }
  ],
  quiz: [
    { q: "What does a world model learn to predict?", options: ["Which human-written label belongs to each training image", "Only the next word in a sentence, like a language model", "The next state (and reward) given a state and an action", "The best hyper-parameters to use when training a policy"], answer: 2, explain: "A world model approximates the environment's dynamics: (state, action) → next state, reward." },
    { q: "A robot team can only afford a few hundred real trials per day. Which approach fits best?", options: ["Pure model-free RL that needs millions of real trials", "Learn a world model and plan in imagination, then check", "Skip learning entirely and hard-code a single action", "Keep training only on random actions, forever"], answer: 1, explain: "World models shine when real experience is expensive; the lesson's cart used 212 real steps and 28,800 imagined ones." },
    { q: "In the cart code, planning uses n = 300 plans, horizon = 8, over 12 real steps. How many imagined steps is that?", options: ["28,800", "2,400", "3,600", "212"], answer: 0, explain: "12 × 300 × 8 = 28,800 imagined steps; 212 is the number of real steps." },
    { q: "How do Dreamer-style agents differ from the random-shooting planner in the lesson?", options: ["Dreamer never uses a world model and learns only from real trials", "Dreamer predicts raw pixels and searches over them at every step", "Dreamer was designed for board games and does not work elsewhere", "Dreamer trains an actor-critic on imagined latent rollouts"], answer: 3, explain: "Dreamer learns behaviour inside its latent world model; our planner searched over random action sequences each step." },
    { q: "Which statement is a misconception?", options: ["Errors in a learned model can compound over long rollouts", "Realistic-looking video means action predictions are right", "Most modern world models predict in a compressed latent space", "Re-planning after each real step reduces model-error impact"], answer: 1, explain: "Visual realism is not the same as correct dynamics; models can generate plausible clips that violate physics or respond wrongly to actions." }
  ],
  takeaways: [
    "A world model is a learned simulator: (state, action) → next state and reward.",
    "It is trained by supervised learning on recorded transitions, usually in a compressed latent state.",
    "Agents use it to plan (search imagined futures) or to learn a policy in imagination, saving real trials.",
    "Compounding error is the main limit; short horizons, re-planning and uncertainty estimates help.",
    "Dreamer and MuZero are landmark model-based agents; video world models extend the idea to rich visual worlds.",
    "Use world models when real experience is costly; use model-free methods when simulation is free."
  ],
  terms: [
    { term: "Environment", def: "The world an agent acts in, which returns new states and rewards after actions." },
    { term: "State", def: "A description of the environment at one moment." },
    { term: "World model", def: "A learned model that predicts the next state (and often reward) from the current state and an action." },
    { term: "Latent state", def: "A compressed vector representation of an observation in which dynamics are learned." },
    { term: "Rollout", def: "A simulated trajectory produced by repeatedly applying a model to chosen actions." },
    { term: "Model predictive control (MPC)", def: "Planning a sequence of actions with a model, executing only the first, then re-planning from the new real state." }
  ]
};
