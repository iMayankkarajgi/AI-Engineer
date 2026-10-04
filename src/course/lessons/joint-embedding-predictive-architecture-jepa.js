export default {
  id: "joint-embedding-predictive-architecture-jepa",
  minutes: 29,
  hook: "If you see half of a dog behind a fence, you instantly “know” the rest is there, without imagining every hair. Can a machine learn to predict like that?",
  summary: "JEPA (Joint Embedding Predictive Architecture) is a self-supervised learning design proposed by Yann LeCun. Instead of predicting the missing part of an input pixel by pixel, it encodes both the visible part and the hidden part into embeddings and trains a predictor to guess the hidden part's embedding from the visible part's. This lets the model ignore unpredictable detail and focus on meaning, avoids the need for negative examples, and is a key building block in LeCun's vision of world models. I-JEPA applies it to images and V-JEPA to video.",
  sections: [
    {
      id: "learning-by-observing",
      title: "Learning by observing the world",
      blocks: [
        { type: "p", text: "Babies learn an astonishing amount before anyone teaches them words: that objects keep existing when hidden, that unsupported things fall, that a rolling ball continues rolling. They learn mostly by **watching** and by **predicting** what happens next. Animals do the same. Nobody labels these experiences; the world itself is the teacher." },
        { type: "p", text: "Machine learning has a name for learning without human labels: **self-supervised learning**. We hide part of the data and train the model to predict it from the rest. Large language models do this with text (predict the next token). The open question for images and video is: *what exactly* should the model predict?" },
        { type: "callout", tone: "analogy", title: "Everyday intuition: the car behind a truck", text: "When a car disappears behind a truck on the highway, we predict that it will reappear on the other side, at about the right time, still a car. We do not predict the exact reflections on its windscreen or the pattern of dust on its doors. We predict the *important, predictable* things and ignore the rest. JEPA is designed to learn this kind of prediction." },
        { type: "p", text: "In 2022 Yann LeCun (then Meta's chief AI scientist) published a position paper, *A Path Towards Autonomous Machine Intelligence*, describing an architecture for machines that learn models of the world by observation and use them to plan. Its proposed modules include perception, a **world model**, a cost module, short-term memory, an actor and a configurator. JEPA was proposed as the way to train the world-model part: learn to predict, but in an abstract representation space rather than in raw sensory detail." }
      ]
    },
    {
      id: "what-jepa-means",
      title: "What does JEPA mean? Embeddings and representation space",
      blocks: [
        { type: "p", text: "Read the name in pieces. **Joint Embedding:** both inputs, the visible part *x* and the hidden part *y*, are turned into embeddings by encoders. **Predictive:** a predictor tries to guess *y*'s embedding from *x*'s embedding. **Architecture:** it is a design pattern, not one specific model." },
        { type: "p", text: "An **embedding** (or **representation**) is a list of numbers that summarises an input. A good image encoder might turn a 224×224 photo (about 150,000 pixel values) into, say, a few hundred numbers per image patch, where similar content gives similar numbers. The space of all such vectors is the **representation space** or **latent space**. Predicting in that space means predicting summaries, not pixels." },
        { type: "viz", name: "embedding-space", caption: "In a good representation space, related things sit close together. JEPA trains encoders so that the hidden part's embedding is predictable from the visible part's embedding." }
      ]
    },
    {
      id: "problems-with-alternatives",
      title: "The problems with predicting pixels and with contrastive methods",
      blocks: [
        { type: "p", text: "**Problem 1: predicting raw pixels.** Generative self-supervised methods, such as masked autoencoders (MAE), hide image patches and reconstruct them pixel by pixel. The trouble is that much of a picture is unpredictable detail: the exact leaves on a tree, grain in a carpet, noise. A pixel loss forces the model to spend capacity on those details, and when it cannot know them it predicts a blurry average. The representations still turn out useful, but a lot of effort goes into things that do not matter for understanding." },
        { type: "p", text: "**Problem 2: contrastive methods.** Joint-embedding methods like SimCLR avoid pixels: they make embeddings of two augmented views of the same image close (positives) and embeddings of different images far apart (negatives). Without the negatives, the encoders could cheat by outputting the same vector for everything, a failure called **collapse**. But negatives bring costs: many are needed (large batches or memory banks), and the method relies on **hand-crafted augmentations** (crops, colour jitter) that encode human assumptions about what should not matter." },
        { type: "viz", name: "contrastive", caption: "Contrastive learning pulls the positive toward the anchor and pushes negatives away. JEPA keeps the “predict in embedding space” part but drops the need for negatives." },
        { type: "check", question: "Why would a pixel-prediction model produce blurry images when the hidden region contains random texture?", answer: "With a squared-error pixel loss, the best guess under uncertainty is the average of all possible textures, which looks like a smooth blur. The model is penalised for not knowing details that were never predictable from the visible part." }
      ]
    },
    {
      id: "core-idea-and-building-blocks",
      title: "The core idea and building blocks of JEPA",
      blocks: [
        { type: "p", text: "The core idea in one sentence: **predict the representation of the missing part, not the missing part itself.** Because the target encoder may drop unpredictable details from its embedding, the predictor is only asked to predict what is predictable." },
        { type: "flow", title: "The JEPA training step", loop: false, nodes: [
          { label: "Split input", detail: "Take one image (or video clip). Choose a visible context region x and one or more hidden target regions y." },
          { label: "Context encoder", detail: "A neural network (in I-JEPA, a Vision Transformer) encodes only the visible patches into embeddings sₓ." },
          { label: "Target encoder", detail: "A second encoder encodes the image to give the embeddings s_y of the target patches. Its weights are a slow moving average of the context encoder's and get no gradient." },
          { label: "Predictor", detail: "A smaller network takes sₓ plus position information about where the target is (and optionally a latent variable z) and outputs a guess ŝ_y." },
          { label: "Loss + update", detail: "Loss = distance between ŝ_y and s_y in embedding space. Gradients update the context encoder and predictor; the target encoder is updated by moving average." }
        ] },
        { type: "table", caption: "The building blocks and why each exists.", head: ["Block", "Job", "Why it matters"], rows: [
          ["Context encoder", "Embed the visible part", "This is the network we keep and reuse after training"],
          ["Target encoder", "Embed the hidden part to make the target", "Defines what is worth predicting; can ignore noise"],
          ["Predictor", "Map context embedding (+ target position) to target embedding", "Holds the “world knowledge” of how parts relate"],
          ["Latent variable z", "Represent which of several possible outcomes happened", "Handles uncertainty without blurring (optional in practice)"],
          ["EMA + stop-gradient", "Keep the target encoder slowly changing", "Main defence against collapse without negatives"]
        ] },
        { type: "formula", expr: "θ_target ← m · θ_target + (1 − m) · θ_context,   m ≈ 0.996 → 1", where: [["θ_target", "target encoder weights (no gradients flow into them)"], ["θ_context", "context encoder weights (trained by gradient descent)"], ["m", "momentum; close to 1, so the target changes slowly"]], caption: "Exponential moving average (EMA) update, as used in I-JEPA and earlier in BYOL." }
      ]
    },
    {
      id: "energy-based-view",
      title: "The energy-based view in simple words",
      blocks: [
        { type: "p", text: "LeCun often describes JEPA using **energy-based models (EBMs)**. An energy function E(x, y) gives a single number for a pair: **low energy** when y is a compatible continuation of x, **high energy** when it is not. There are no probabilities that must sum to 1, just a score of compatibility." },
        { type: "formula", expr: "E(x, y) = ‖ Pred(Enc(x), z) − Enc(y) ‖²", where: [["Enc", "the encoders mapping inputs to embeddings"], ["Pred", "the predictor"], ["z", "latent variable choosing among plausible outcomes"]], caption: "JEPA's energy: how far the predicted embedding is from the actual embedding." },
        { type: "p", text: "Training must do two things: make energy **low** on real (x, y) pairs and make sure it is **not low everywhere**. The second part is the collapse problem in different clothes. If the encoders output a constant vector, energy is zero for every pair, which is useless. There are two families of fixes: **contrastive** methods push energy *up* on wrong pairs (negatives), while **regularised or architectural** methods limit how much of the space can have low energy, for example by keeping embeddings' variance high (as in VICReg) or by the EMA target with stop-gradient used in I-JEPA. JEPA favours the non-contrastive route." },
        { type: "callout", tone: "note", title: "Why the latent variable z", text: "If the car behind the truck might exit in the left or right lane, one deterministic prediction would average the two. A latent variable z lets the predictor represent “which of several valid futures”, so each can have low energy without blurring them together." }
      ]
    },
    {
      id: "code-latent-vs-pixel",
      title: "Seeing the idea in numbers",
      blocks: [
        { type: "p", text: "Here is a small numpy experiment. Each “scene” has 2 hidden facts. The visible view shows those facts clearly; the hidden view shows the same facts plus lots of unpredictable detail. We compare predicting the hidden view's pixels with predicting its 2-number embedding, then show collapse and the EMA update." },
        { type: "code", lang: "python", title: "jepa_toy.py", code: `import numpy as np
rng = np.random.default_rng(0)
N, P = 2000, 50                       # 2000 samples, 50 "pixels" per view
z = rng.normal(size=(N, 2))           # the hidden facts of each scene (2 numbers)
M_ctx, M_tgt = rng.normal(size=(2, P)), rng.normal(size=(2, P))
x_ctx = z @ M_ctx + 0.1 * rng.normal(size=(N, P))   # visible part (context)
x_tgt = z @ M_tgt + 2.0 * rng.normal(size=(N, P))   # hidden part: same facts + lots of
                                                    # unpredictable detail (leaves, noise)
def fit(X, Y):                        # least-squares linear predictor
    W, *_ = np.linalg.lstsq(X, Y, rcond=None); return W

# (a) Generative: predict every target pixel from the context pixels
err_pix = np.mean((x_ctx @ fit(x_ctx, x_tgt) - x_tgt) ** 2)
var_pix = x_tgt.var()

# (b) JEPA-style: encode both views to 2-D, predict the target *embedding*
U, S, Vt = np.linalg.svd(x_tgt - x_tgt.mean(0), full_matrices=False)
enc_tgt = Vt[:2].T                    # target encoder keeps the 2 main directions
s_tgt = x_tgt @ enc_tgt
s_ctx = x_ctx @ fit(x_ctx, z)         # context encoder (2-D)
err_lat = np.mean((s_ctx @ fit(s_ctx, s_tgt) - s_tgt) ** 2)
print(f"pixel space : error {err_pix:.2f} of variance {var_pix:.2f} -> {err_pix/var_pix:.0%} unexplained")
print(f"latent space: error {err_lat:.2f} of variance {s_tgt.var():.2f} -> {err_lat/s_tgt.var():.0%} unexplained")

# (c) Collapse: an encoder that outputs a constant gets a perfect zero loss
collapsed = np.zeros((N, 2))
print("collapsed encoder loss:", np.mean((collapsed - collapsed) ** 2), "| embedding variance:", collapsed.var())

# (d) EMA target encoder update used by I-JEPA-style training
theta_ctx, theta_tgt, m = 1.0, 0.0, 0.996
for _ in range(1000): theta_tgt = m * theta_tgt + (1 - m) * theta_ctx
print(f"target weights after 1000 EMA steps: {theta_tgt:.3f} (slowly follows 1.0)")`, output: `pixel space : error 3.92 of variance 5.94 -> 66% unexplained
latent space: error 4.11 of variance 52.22 -> 8% unexplained
collapsed encoder loss: 0.0 | embedding variance: 0.0
target weights after 1000 EMA steps: 0.982 (slowly follows 1.0)`, walkthrough: [
          { lines: [3, 8], note: "Synthetic scenes: 2 true facts per scene. The context view is a clean mix of them; the target view mixes them too but adds strong random detail that the context cannot reveal." },
          { lines: [9, 10], note: "A least-squares fit stands in for training a predictor." },
          { lines: [12, 14], note: "Generative approach: predict all 50 target pixels. About two-thirds of the pixel variance is pure unpredictable detail, so the error stays large no matter what." },
          { lines: [16, 21], note: "JEPA-style approach: the target encoder keeps the 2 strongest directions of the target view (here via SVD, a stand-in for a learned encoder), and the predictor maps the context embedding to it. Only 8% stays unexplained: the predictable part is predicted well." },
          { lines: [22, 23], note: "Print both, as fractions of each space's variance so they are comparable." },
          { lines: [25, 27], note: "Collapse: if both encoders output zeros, prediction is perfect and loss is 0, yet the embedding carries no information (variance 0). This is why JEPA needs EMA, stop-gradient or variance regularisation." },
          { lines: [29, 32], note: "The EMA update: the target weights creep toward the context weights at 0.4% per step, giving a slowly moving, stable target." }
        ] },
        { type: "p", text: "In this toy the encoders are hand-made, so it shows the *why* (predictable vs unpredictable content, and collapse) rather than real JEPA training, where both encoders and the predictor are deep networks learned together." },
        { type: "check", question: "In output line 3, the collapsed encoder has a perfect loss of 0.0. Why is that a bad sign rather than a good one?", answer: "Because the embedding variance is also 0: every input maps to the same vector, so the representation carries no information. A loss that only measures prediction agreement can be minimised trivially, which is why JEPA adds anti-collapse mechanisms." }
      ]
    },
    {
      id: "i-jepa",
      title: "How I-JEPA works (for images)",
      blocks: [
        { type: "p", text: "**I-JEPA** (Image-JEPA) was published by Meta researchers (Assran et al.) in 2023. It applies the recipe to images using Vision Transformers, which split an image into a grid of patches and produce one embedding per patch." },
        { type: "steps", title: "One I-JEPA training step", items: [
          { title: "Pick targets", text: "Sample several (four in the paper) rectangular target blocks, each covering a modest fraction of the image. These are what we will predict." },
          { title: "Pick the context", text: "Sample one large context block covering most of the image, then remove any patches that overlap the targets, so the answer is not visible." },
          { title: "Encode", text: "The context encoder embeds only the context patches. The target encoder (EMA weights) embeds the full image, and we take the embeddings at the target patch positions." },
          { title: "Predict", text: "For each target block, the predictor receives the context embeddings plus mask tokens carrying the target's positions, and outputs predicted embeddings for those patches." },
          { title: "Learn", text: "The loss is the average squared distance between predicted and target patch embeddings. Backprop updates the context encoder and predictor; the target encoder follows by EMA." }
        ] },
        { type: "p", text: "Two design choices matter. Targets are **large, semantic blocks** (not single tiny patches), so predicting them requires understanding object parts and layout rather than copying neighbouring texture. And there are **no hand-crafted augmentations**: the masking itself provides the learning signal. The paper reported strong results on image classification and lower-level tasks with good compute efficiency compared with earlier methods." }
      ]
    },
    {
      id: "v-jepa-and-world-models",
      title: "V-JEPA and the world-model vision",
      blocks: [
        { type: "p", text: "Video adds time. **V-JEPA** (2024) masks regions across space *and* time in video clips and predicts their representations, learning about motion and how scenes evolve purely from unlabelled video. **V-JEPA 2** (2025) scaled this up to over a million hours of video and then added an **action-conditioned** version trained on a comparatively small amount of robot data, so the predictor learns “what will the scene look like, in embedding space, if the robot does this action?”. Meta showed it being used to plan simple robot manipulation by searching for actions whose predicted outcome is close to a goal image's embedding." },
        { type: "timeline", title: "From position paper to video world models", items: [
          { when: "2022", title: "A Path Towards Autonomous Machine Intelligence", text: "LeCun's position paper lays out the modular architecture and proposes JEPA for learning world models." },
          { when: "2023", title: "I-JEPA", text: "Image JEPA: predicts embeddings of masked image blocks with ViTs and an EMA target encoder." },
          { when: "2024", title: "V-JEPA", text: "Extends feature prediction to video, masking regions in space and time." },
          { when: "2025", title: "V-JEPA 2", text: "Much larger video pre-training plus an action-conditioned predictor used for robot planning." }
        ] },
        { type: "p", text: "This is the bridge to the next lesson. A **world model** predicts how the world will change, especially in response to actions. JEPA supplies a way to learn such a predictor in an abstract space, where planning is cheaper and not distracted by pixel detail." }
      ]
    },
    {
      id: "when-jepa-matters",
      title: "Comparison, and when and why JEPA matters",
      blocks: [
        { type: "compare", title: "Three families of self-supervised learning for vision", options: [
          { name: "Generative (e.g. MAE)", summary: "Hide patches and reconstruct the pixels.", pros: ["Simple, no collapse problem", "Can generate images"], cons: ["Wastes capacity on unpredictable detail", "Blurry predictions under uncertainty"], bestFor: "When we need reconstructions, or as a strong simple baseline" },
          { name: "Contrastive (e.g. SimCLR)", summary: "Pull embeddings of two views together, push other images apart.", pros: ["Strong semantic features"], cons: ["Needs many negatives", "Relies on hand-crafted augmentations"], bestFor: "Classification-style features with good augmentations" },
          { name: "JEPA (e.g. I-JEPA)", summary: "Predict the embedding of hidden parts from visible parts.", pros: ["Focuses on predictable, semantic content", "No negatives, no hand-crafted augmentations"], cons: ["Must prevent collapse carefully", "Cannot directly output images"], bestFor: "Learning representations and world models for prediction and planning" }
        ], rows: [
          ["Predicts in", "Pixel space", "Embedding space (matching)", "Embedding space (prediction)"],
          ["Needs negatives", "No", "Yes", "No"],
          ["Anti-collapse tool", "Not needed", "Negatives", "EMA target + stop-gradient or regularisers"]
        ], verdict: "JEPA keeps the semantic focus of joint embeddings and the simplicity of masking, at the price of careful collapse prevention." },
        { type: "p", text: "**Why it matters:** if future AI systems need to understand and plan in the physical world (robots, video understanding, autonomous agents), they need to predict consequences efficiently. Predicting everything at the pixel level is expensive and unnecessary; predicting abstract states is closer to how we seem to reason. JEPA is one leading proposal for learning those abstract predictive models from observation." },
        { type: "callout", tone: "warn", title: "Common misunderstandings", text: "JEPA is not a generative model: it does not produce images or video by itself (a separate decoder would be needed). It is not yet a replacement for LLMs on language tasks. And “no negatives” does not mean “no collapse risk”: the EMA target, stop-gradient or variance regularisation are essential. Whether JEPA-style world models will be the path to more general intelligence is an open research debate, not a settled fact." }
      ]
    },
    {
      id: "going-deeper-collapse",
      title: "Going one level deeper",
      blocks: [
        { type: "p", text: "We said collapse means every input gets the same embedding. In practice the more common failure is quieter. The embedding keeps a few useful dimensions and the rest go flat. This is called **dimensional collapse** (or partial collapse). The prediction loss looks healthy, because a flat dimension is trivially easy to predict. So we cannot find it by watching the loss. We have to look at the embeddings themselves." },
        { type: "p", text: "A simple check: take a batch of embeddings and compute the **standard deviation of each dimension** across the batch. A healthy dimension varies from input to input. A dead one barely moves. Methods such as VICReg turn this check into a training penalty: for each dimension, add max(0, 1 − std) to the loss. Here is that penalty worked by hand for a made-up 3-dimension embedding." },
        { type: "table", caption: "Illustrative batch statistics for a 3-dimension embedding", head: ["Dimension", "Std across the batch", "Penalty max(0, 1 − std)", "Reading"], rows: [
          ["1", "1.10", "0", "Healthy: varies more than the target of 1"],
          ["2", "0.90", "0.10", "Slightly low: a gentle nudge"],
          ["3", "0.02", "0.98", "Collapsed: almost the same for every input"]
        ] },
        { type: "p", text: "The average penalty is (0 + 0.10 + 0.98) / 3 = 0.36, and nearly all of it comes from dimension 3. The gradient of this term pushes the encoder to spread that dimension out again. I-JEPA does not use this penalty; it relies on the EMA target and stop-gradient instead. But the per-dimension std is still the right thing to *monitor* in any JEPA-style run." },
        { type: "p", text: "The EMA momentum `m` is the other dial worth understanding in numbers. After k steps, the target encoder has absorbed a share 1 − mᵏ of a change in the context encoder. A handy rule: the target averages over roughly 1 / (1 − m) recent steps." },
        { type: "table", caption: "How fast the target encoder follows, computed from 1 − mᵏ", head: ["Momentum m", "Averages over about", "Share absorbed after 100 steps", "Share absorbed after 1,000 steps"], rows: [
          ["0.9", "10 steps", "≈ 100%", "≈ 100%"],
          ["0.99", "100 steps", "63%", "≈ 100%"],
          ["0.996", "250 steps", "33%", "98%"],
          ["0.999", "1,000 steps", "10%", "63%"]
        ] },
        { type: "steps", title: "Reading the momentum dial", items: [
          { title: "Too low", text: "With m = 0.9 the target is almost a copy of the context encoder. Both sides can drift together towards a constant output, so the protection against collapse is weak." },
          { title: "Too high", text: "With m very close to 1 the target hardly moves. It is stable, but it keeps offering stale targets, so learning is slow." },
          { title: "In between", text: "Values near 0.996, often raised towards 1 as training goes on, give a target that is steady from one step to the next but still improves over thousands of steps." },
          { title: "What to watch", text: "Whatever m we choose, we log the per-dimension std of the target embeddings. If it sinks towards zero, the run is collapsing, however good the loss looks." }
        ] }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build a small **collapse monitor**. Three hand-made encoders embed the same scenes: a healthy one, one that silently drops a dimension, and one that outputs a constant. For each we print the JEPA prediction loss, the std of each embedding dimension, the variance penalty, and how much of the true scene facts a linear readout can recover. Watch which number tells the truth." },
        { type: "code", lang: "python", title: "practice_collapse_monitor.py", code: `import numpy as np

rng = np.random.default_rng(0)
N = 500
facts = rng.normal(size=(N, 2))                  # 2 true facts per scene
ctx = facts + 0.1 * rng.normal(size=(N, 2))      # visible view (a little noise)
tgt = facts + 0.1 * rng.normal(size=(N, 2))      # hidden view (different noise)

encoders = {                                     # three candidate 2 -> 2 encoders
    "healthy":   np.array([[1.0, 0.0], [0.0, 1.0]]),   # keeps both facts
    "one dim":   np.array([[1.0, 0.0], [0.0, 0.0]]),   # silently drops fact 2
    "collapsed": np.zeros((2, 2)),                     # outputs a constant
}

def fit(X, Y):                                   # least-squares linear map X -> Y
    return np.linalg.lstsq(X, Y, rcond=None)[0]

print("encoder    pred loss  std per dim   var penalty  facts recovered")
for name, E in encoders.items():
    s_ctx, s_tgt = ctx @ E, tgt @ E              # embeddings of both views
    pred = s_ctx @ fit(s_ctx, s_tgt)             # predictor: context -> target
    loss = ((pred - s_tgt) ** 2).mean()          # the JEPA prediction loss
    std = s_tgt.std(axis=0)
    penalty = np.maximum(0, 1 - std).mean()      # hinge: wants std >= 1 per dim
    # Probe: how much of the true facts can a linear readout get back?
    resid = facts - s_tgt @ fit(s_tgt, facts)
    r2 = 1 - resid.var() / facts.var()
    print(f"{name:9s}  {loss:9.4f}  [{std[0]:.2f}, {std[1]:.2f}]  {penalty:11.2f}  {r2:14.0%}")`, output: `encoder    pred loss  std per dim   var penalty  facts recovered
healthy       0.0195  [0.98, 0.97]         0.02             99%
one dim       0.0099  [0.98, 0.00]         0.51             50%
collapsed     0.0000  [0.00, 0.00]         1.00              0%`, walkthrough: [
          { lines: [5, 7], note: "Each scene has 2 true facts. The context view and the target view both show them, each with its own small noise." },
          { lines: [9, 12], note: "Three encoders as 2 × 2 matrices: keep both facts, keep only the first, or output zeros for everything." },
          { lines: [20, 24], note: "Embed both views, fit a predictor from context embedding to target embedding, and compute the prediction loss, the per-dimension std and the variance penalty." },
          { lines: [25, 28], note: "The honest test: a linear probe tries to rebuild the true facts from the embedding. We report the share of their variance it recovers." }
        ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Raise the view noise from `0.1` to `0.5` in both views. Predict which encoder's prediction loss rises the most, and whether the std and penalty columns change much.",
          "Add an encoder that shrinks instead of dropping: `\"tiny dim\": np.array([[1.0, 0.0], [0.0, 0.01]])`. Predict its penalty and its “facts recovered”. Is a tiny dimension the same as a dead one for a linear probe?",
          "Change the penalty target from `1` to `0.5` in the `penalty` line. Predict which rows change, and what a lower target means for how spread out the embeddings must be."
        ] },
        { type: "check", question: "Rank the three encoders by prediction loss, then by “facts recovered”. What do the two rankings tell us?", answer: "By loss, collapsed is best (0.0000), then one dim (0.0099), then healthy (0.0195). By facts recovered the order is exactly reversed: 99%, 50%, 0%. The prediction loss rewards having less to predict, so on its own it prefers the least informative encoder. That is why a JEPA needs an anti-collapse mechanism, and why we monitor variance and not only the loss." },
        { type: "check", question: "The “one dim” encoder has about half the prediction loss of the healthy one. Where did the other half go?", answer: "Each embedding dimension carries the view noise of its own fact, and that noise cannot be predicted from the other view. The healthy encoder pays this unpredictable cost on two dimensions. The one-dim encoder outputs a constant 0 on the second dimension, which is predicted perfectly, so it pays the cost only once. It lowered its loss by throwing information away, and the std column [0.98, 0.00] is what gives it away." }
      ]
    },
  ],
  quiz: [
    { q: "What does a JEPA predictor try to predict?", options: ["The raw pixel values of the hidden region of the image", "The target encoder's embedding of the hidden region", "Whether two augmented images show the same object", "The next word of a caption written about the image"], answer: 1, explain: "JEPA predicts in representation space: the target encoder's embedding of the hidden part." },
    { q: "A team trains a JEPA-style model and the loss quickly drops to almost zero, but downstream accuracy is near chance. What most likely happened?", options: ["The encoder network is far too small for the dataset", "The input images are too large for the patch size", "The learning rate is too low for training to progress", "Collapse: the encoders output the same vector for all"], answer: 3, explain: "A near-zero loss with useless features is the signature of collapse. Check the EMA target, stop-gradient or variance regularisation." },
    { q: "In the lesson's numpy toy, why was 66% of the pixel-space error unexplained but only 8% in latent space?", options: ["Target pixels held lots of unpredictable noise; the embedding kept the signal", "The latent predictor was trained on many more samples than the pixel one", "The pixel-space predictor had a bug in its least-squares fitting code", "The latent space had more dimensions than the 50-pixel target view"], answer: 0, explain: "Most target pixel variance was unpredictable noise. The target embedding focused on the predictable signal, so it could be predicted well." },
    { q: "How does JEPA differ from contrastive methods such as SimCLR?", options: ["JEPA needs even more negative pairs and much larger batches", "JEPA predicts pixels, while contrastive methods never do", "JEPA predicts target embeddings and needs no negatives", "There is no real difference; they are the same method"], answer: 2, explain: "Both work in embedding space, but JEPA uses prediction with an EMA target instead of pushing negatives apart." },
    { q: "Which statement about JEPA is a misconception?", options: ["I-JEPA's target encoder is a moving average of the context encoder", "JEPA is mainly a model for generating realistic images", "V-JEPA applies the same prediction idea to video clips", "JEPA was proposed by LeCun as a way to learn world models"], answer: 1, explain: "JEPA learns representations and predictions in embedding space; it does not generate images on its own." }
  ],
  takeaways: [
    "Self-supervised learning learns from unlabelled data by hiding part of it and predicting it.",
    "JEPA predicts the embedding of the hidden part, not its pixels, so it can ignore unpredictable detail.",
    "Building blocks: context encoder, EMA target encoder, predictor, and optional latent variable.",
    "Collapse (constant embeddings) is the central risk; EMA, stop-gradient or variance regularisers prevent it.",
    "I-JEPA works on image blocks; V-JEPA on video; V-JEPA 2 adds action conditioning for planning.",
    "JEPA is a leading proposal for learning world models from observation, still an active research area."
  ],
  terms: [
    { term: "Self-supervised learning", def: "Learning from unlabelled data by predicting hidden parts of the data from other parts." },
    { term: "Representation (embedding)", def: "A vector of numbers summarising an input so that similar content gives similar vectors." },
    { term: "JEPA", def: "Joint Embedding Predictive Architecture: predicts the embedding of a hidden part of the input from the embedding of the visible part." },
    { term: "Representation collapse", def: "A failure where encoders map every input to (nearly) the same vector, making the loss trivially small." },
    { term: "EMA target encoder", def: "An encoder whose weights are an exponential moving average of the trained encoder's weights, giving stable targets." },
    { term: "Energy-based model", def: "A model that scores compatibility of input pairs with an energy: low for compatible, high for incompatible." }
  ]
};
