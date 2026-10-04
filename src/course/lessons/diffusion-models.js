export default {
  id: "diffusion-models",
  minutes: 27,
  hook: "How can a model that only ever learned to remove a little noise end up painting a brand-new picture out of pure static?",
  summary: "A diffusion model learns to generate data by reversing a simple destruction process. During training we gradually add Gaussian noise to real images until nothing is left, and teach a network to predict the noise that was added at each level. To generate, we start from pure noise and repeatedly subtract the predicted noise, step by step, until a clean image appears; text conditioning steers which image we get.",
  sections: [
    {
      id: "what-is-a-diffusion-model",
      title: "What is a diffusion model?",
      blocks: [
        { type: "p", text: "A **diffusion model** is a **generative model**: a model that learns what a set of examples looks like (for instance, millions of photos) so it can create *new* examples that look like they came from the same set. The name comes from physics: a drop of ink *diffuses* in water until the water is evenly grey. Diffusion models copy this idea — they slowly turn data into featureless noise, and learn to run the movie backwards." },
        { type: "p", text: "Our running example: the marketing team of a kitchen-appliance shop wants product scene images — 'a red stand mixer on a marble counter, morning light' — without a photo shoot. Text-to-image tools such as Stable Diffusion, DALL·E 2/3 and Imagen are built on diffusion (or closely related) models, and we will see exactly how they turn that sentence into pixels." },
        { type: "callout", tone: "analogy", title: "Think of it like restoring a sculpture from a block of marble", text: "A sculptor is said to 'remove everything that is not the statue'. A diffusion model starts with a block of random noise and, at each step, chips away a little of what looks like noise. Each chip is small and easy to judge; after many steps, a figure emerges. The model never draws the whole picture in one go." },
      ],
    },
    {
      id: "why-diffusion",
      title: "Why do we need diffusion models?",
      blocks: [
        { type: "p", text: "Generating an image directly is hard. A 512×512 colour image has about 786,000 numbers, and only a vanishingly small fraction of all possible combinations look like real photos. Before diffusion, the main approaches had clear weaknesses:" },
        { type: "list", items: [
          "**GANs** (generative adversarial networks) produce sharp images in one fast pass, but training is a fragile two-player game that can collapse and often covers only part of the data's variety.",
          "**VAEs** (variational autoencoders) train stably but their samples tend to be blurry.",
          "**Autoregressive models** generate an image token by token; they work but are slow for large images.",
        ] },
        { type: "p", text: "Diffusion models, popularised by the DDPM paper (Ho et al., 2020) and building on an idea from Sohl-Dickstein et al. (2015), offered a new deal: **stable training with a simple loss**, very **high sample quality**, and **good diversity**. The price is slower generation, because sampling takes many network calls. By 2022, diffusion had become the dominant approach for text-to-image generation." },
      ],
    },
    {
      id: "two-processes",
      title: "The two processes: forward and reverse",
      blocks: [
        { type: "p", text: "Every diffusion model has two processes that run in opposite directions over a fixed number of steps T (DDPM used T = 1,000):" },
        { type: "compare", title: "Forward vs reverse process",
          options: [
            { name: "Forward process (noising)", summary: "Take a real image and add a little Gaussian noise at each of T steps until only noise remains.", pros: ["Fixed math, nothing to learn", "Can jump straight to any step with one formula"], cons: ["Destroys information on purpose; useless on its own"], bestFor: "Making training examples: (noisy image, step, true noise)" },
            { name: "Reverse process (denoising)", summary: "Start from pure noise and remove a little predicted noise at each step until a clean image remains.", pros: ["This is the generator", "Each step is a small, learnable correction"], cons: ["Needs a trained neural network", "Many steps: slow"], bestFor: "Generating new images" },
          ],
          rows: [
            ["Direction", "Image → noise", "Noise → image"],
            ["Learned?", "No", "Yes (the noise-prediction network)"],
            ["Used during", "Training", "Generation (and training targets)"],
          ],
          verdict: "We define the easy forward process ourselves, then train a network to undo it. Generation only runs the reverse process." },
        { type: "viz", name: "diffusion", caption: "Drag the step slider: forward from a clean image to static, and backwards from static to a clean image." },
      ],
    },
    {
      id: "forward-process",
      title: "The forward process (adding noise)",
      blocks: [
        { type: "p", text: "At each step t we shrink the image slightly and add a small amount of Gaussian noise (random numbers from a bell curve). How much noise is set by a **noise schedule** β₁, β₂, …, β_T — small numbers that grow over time (DDPM used a linear schedule from 0.0001 to 0.02)." },
        { type: "formula", expr: "xₜ = √(1 − βₜ) · xₜ₋₁ + √βₜ · ε,        ε ~ N(0, I)", where: [["xₜ", "the image after t noising steps (x₀ is the clean image)"], ["βₜ", "noise amount at step t"], ["ε", "fresh standard Gaussian noise"]] },
        { type: "p", text: "Applying this T times would be slow, but there is a shortcut. Define αₜ = 1 − βₜ and ᾱₜ = α₁ · α₂ · … · αₜ (the running product). Then we can jump from the clean image straight to any step:" },
        { type: "formula", expr: "xₜ = √ᾱₜ · x₀ + √(1 − ᾱₜ) · ε", caption: "The noisy image is a weighted blend: √ᾱₜ of the original signal plus √(1 − ᾱₜ) of pure noise. As t grows, ᾱₜ falls toward 0." },
        { type: "chart", kind: "line", title: "Signal vs noise weight over the steps", xLabel: "Step t", yLabel: "Weight", series: [
          { name: "Signal √ᾱₜ", points: [[1, 1.0], [5, 0.979], [10, 0.911], [15, 0.803], [20, 0.671], [25, 0.53], [30, 0.396], [35, 0.279], [40, 0.185], [45, 0.116], [50, 0.068]] },
          { name: "Noise √(1−ᾱₜ)", points: [[1, 0.01], [5, 0.202], [10, 0.413], [15, 0.596], [20, 0.742], [25, 0.848], [30, 0.918], [35, 0.96], [40, 0.983], [45, 0.993], [50, 0.998]] },
        ], caption: "Exact values for the 50-step linear schedule (β from 0.0001 to 0.2) used in this lesson's code. By the last step only about 7% of the original signal remains." },
        { type: "check", question: "At a step where ᾱₜ = 0.25, what fraction of the clean image's amplitude is left in xₜ, and what is the noise weight?", answer: "Signal weight √0.25 = 0.5, noise weight √(1 − 0.25) = √0.75 ≈ 0.866. The image is still faintly visible but more noise than signal." },
      ],
    },
    {
      id: "reverse-process",
      title: "The reverse process (removing noise)",
      blocks: [
        { type: "p", text: "Now the hard direction. Given a noisy image xₜ, what did the slightly less noisy xₜ₋₁ look like? We cannot compute this exactly — it depends on what real images look like — so we train a neural network to help. In the most common formulation, the network ε_θ(xₜ, t) looks at the noisy image and the step number and **predicts the noise ε** that is in it." },
        { type: "p", text: "Once we have a noise estimate, one reverse step removes a fraction of it, rescales, and (except at the very last step) adds back a little fresh noise. Adding noise while denoising sounds odd, but it keeps sampling random and diverse, so different starts give different images." },
        { type: "formula", expr: "xₜ₋₁ = (1/√αₜ) · ( xₜ − (βₜ / √(1 − ᾱₜ)) · ε_θ(xₜ, t) ) + σₜ · z,        z ~ N(0, I)", caption: "The DDPM sampling step. σₜ is a small noise scale (σₜ = √βₜ is a common choice); z is set to 0 at the final step." },
        { type: "p", text: "What does the network look like? For images it is usually a **U-Net**: a convolutional network that shrinks the image to capture global layout, then expands it back to full resolution, with skip connections that carry fine details across. The step t is fed in as an embedding so the network knows how noisy its input is. Newer systems often replace the U-Net with a Transformer over image patches, called a **Diffusion Transformer (DiT)**." },
      ],
    },
    {
      id: "walkthrough",
      title: "A step-by-step example walk-through",
      blocks: [
        { type: "p", text: "Let us follow a single number through both processes to make it concrete. Imagine our 'images' are single values that are always either −2 or +2 (two kinds of picture). Take x₀ = +2 and the 50-step schedule above." },
        { type: "steps", title: "One value, forward then backward", items: [
          { title: "Clean start", text: "x₀ = +2.0. The model's training data are just −2s and +2s." },
          { title: "Light noise (t = 10)", text: "Signal weight √ᾱ ≈ 0.911. With one particular noise draw ε ≈ 0.126 we get x₁₀ ≈ 0.911·2 + 0.413·0.126 ≈ 1.87. Still obviously a '+2'." },
          { title: "Heavy noise (t = 25)", text: "Signal weight ≈ 0.53, noise weight ≈ 0.85. Now x₂₅ ≈ 1.17. It leans positive, but a different noise draw could easily have pushed it negative." },
          { title: "Almost pure noise (t = 50)", text: "Signal weight ≈ 0.068: x₅₀ ≈ 0.26. Essentially no trace of the original; this is what generation starts from." },
          { title: "Reverse, early steps", text: "Starting from random values, the denoiser at high t can only say 'probably −2 or +2, not sure which', so each step nudges values only slightly and the added noise keeps them wandering." },
          { title: "Reverse, late steps", text: "As noise drops, the denoiser becomes confident about which value each sample is heading to and pulls it there firmly. At the end every sample sits on −2 or +2 — a valid 'image', chosen by the random start." },
        ] },
        { type: "callout", tone: "note", title: "Coarse to fine", text: "Real images behave the same way. Early reverse steps decide the big picture (composition, layout, main colours); late steps fill in edges, textures and fine detail. This is why stopping a sampler halfway gives a blurry but recognisable scene." },
      ],
    },
    {
      id: "training",
      title: "How the model is trained",
      blocks: [
        { type: "p", text: "Training is surprisingly simple. We never have to run the full chain during training, thanks to the jump-to-any-step formula:" },
        { type: "flow", title: "One training step", loop: true, nodes: [
          { label: "Pick a real image", detail: "Sample a clean image x₀ from the dataset (e.g. a product photo)." },
          { label: "Pick a step t", detail: "Choose t uniformly at random between 1 and T, so the network practises every noise level." },
          { label: "Make it noisy", detail: "Draw noise ε ~ N(0, I) and compute xₜ = √ᾱₜ·x₀ + √(1−ᾱₜ)·ε in one shot." },
          { label: "Predict the noise", detail: "Feed xₜ and t (and the caption, if conditional) to the network to get ε_θ(xₜ, t)." },
          { label: "Score and update", detail: "Loss = ‖ε − ε_θ(xₜ, t)‖², the mean squared error between true and predicted noise. Backpropagate and update the weights. Repeat millions of times." },
        ] },
        { type: "formula", expr: "L = E over x₀, t, ε of ‖ ε − ε_θ( √ᾱₜ·x₀ + √(1−ᾱₜ)·ε, t ) ‖²", caption: "DDPM's 'simple' loss. Ho et al. derived it from a variational bound on the likelihood and found that this unweighted version gave the best samples." },
        { type: "deeper", title: "Why predicting noise is enough", blocks: [
          { type: "p", text: "If we know the noise, we know the clean image: rearranging xₜ = √ᾱₜ·x₀ + √(1−ᾱₜ)·ε gives x̂₀ = (xₜ − √(1−ᾱₜ)·ε̂) / √ᾱₜ. So 'predict the noise', 'predict the clean image' and 'predict a blend of both' (so-called v-prediction) are different parametrisations of the same job; models choose whichever trains most stably." },
          { type: "p", text: "There is also a deep connection to **score matching**: the predicted noise, scaled by −1/√(1−ᾱₜ), estimates the gradient of the log-density of noisy data, ∇ log p(xₜ). Each reverse step is a nudge uphill toward more likely images, plus a bit of randomness. Faster samplers such as DDIM, and newer 'flow matching' models, build on this view to reach good images in tens of steps instead of a thousand." },
        ] },
      ],
    },
    {
      id: "code",
      title: "A simple code example",
      blocks: [
        { type: "p", text: "Training a real image model needs a GPU and a deep-learning library. To see the *mechanics* with only numpy, we use the two-value dataset from the walk-through. For such a tiny dataset we can write down the perfect noise predictor directly, so we use it as a stand-in for the trained network. Everything else — the schedule, the forward jump and the DDPM sampling loop — is exactly what real systems do." },
        { type: "code", lang: "python", title: "tiny_diffusion.py", code: `import numpy as np
rng = np.random.default_rng(0)

# "Dataset": 1-D values that are always -2 or +2 (think: two kinds of image)
data = np.array([-2.0, 2.0])

T = 50
beta = np.linspace(1e-4, 0.2, T)            # noise added at each step
alpha = 1 - beta
abar = np.cumprod(alpha)                     # signal kept after t steps

# Forward process: jump straight to any step t in one formula
x0, eps = 2.0, rng.normal()
for t in (0, 9, 24, 49):
    xt = np.sqrt(abar[t]) * x0 + np.sqrt(1 - abar[t]) * eps
    print(f"t={t+1:2d}  signal weight={np.sqrt(abar[t]):.3f}  x_t={xt:+.3f}")

def predict_noise(xt, t):
    """Stand-in for the trained network: the ideal noise prediction for
    this 2-point dataset (a real model learns this from examples)."""
    d = -(xt - np.sqrt(abar[t]) * data[:, None]) ** 2 / (2 * (1 - abar[t]))
    w = np.exp(d - d.max(0)); w /= w.sum(0)          # which point is likely?
    x0_hat = (w * data[:, None]).sum(0)
    return (xt - np.sqrt(abar[t]) * x0_hat) / np.sqrt(1 - abar[t])

# Reverse process (DDPM sampling): start from pure noise, denoise 50 times
x = rng.normal(size=8)
print("\\nstart (pure noise):", np.round(x, 2))
for t in reversed(range(T)):
    eps_hat = predict_noise(x, t)
    x = (x - beta[t] / np.sqrt(1 - abar[t]) * eps_hat) / np.sqrt(alpha[t])
    if t > 0:
        x += np.sqrt(beta[t]) * rng.normal(size=x.shape)
    if t in (25, 0):
        print(f"after step t={t+1:2d}:", np.round(x, 2))`, output: `t= 1  signal weight=1.000  x_t=+2.001
t=10  signal weight=0.911  x_t=+1.873
t=25  signal weight=0.530  x_t=+1.167
t=50  signal weight=0.068  x_t=+0.261

start (pure noise): [-0.13  0.64  0.1  -0.54  0.36  1.3   0.95 -0.7 ]
after step t=26: [ 0.83 -2.52 -0.02 -0.5   0.48 -0.43  0.43  1.01]
after step t= 1: [ 2. -2.  2. -2. -2. -2.  2.  2.]`,
          walkthrough: [
            { lines: [4, 5], note: "The 'dataset' contains only two possible values. Think of them as two kinds of image the model should be able to produce." },
            { lines: [7, 10], note: "A 50-step linear noise schedule and its running product ᾱ. We use 50 steps (instead of DDPM's 1,000) with larger β values to keep the demo short." },
            { lines: [12, 16], note: "The forward process jumps straight to any step. The printed signal weight falls from 1.0 to 0.068, and x drifts from +2 toward pure noise." },
            { lines: [18, 24], note: "The noise predictor. It works out how likely each data point is given the noisy value, forms the best guess of x₀, and converts that into a noise estimate. A real model is a neural network trained with the loss ‖ε − ε_θ‖² to approximate exactly this function." },
            { lines: [27, 33], note: "The DDPM reverse loop: subtract the scaled predicted noise, rescale by 1/√α, and add a little fresh noise except at the last step." },
            { lines: [34, 35], note: "Halfway through, values are still scattered. At the end every sample sits exactly on −2 or +2: brand-new samples from the data distribution, with a mix of both kinds." },
          ] },
      ],
    },
    {
      id: "conditional-diffusion",
      title: "Conditional diffusion (text to image)",
      blocks: [
        { type: "p", text: "So far the model generates *some* image from the data. For our marketing team we need *the* image described by a prompt. **Conditional diffusion** gives the noise predictor an extra input c — the caption — so it becomes ε_θ(xₜ, t, c)." },
        { type: "steps", title: "How a text-to-image system uses the prompt", items: [
          { title: "Encode the text", text: "A text encoder (Stable Diffusion v1 used CLIP's text encoder; Imagen used a T5 language model) turns 'a red stand mixer on a marble counter' into a sequence of vectors." },
          { title: "Inject with cross-attention", text: "Inside the denoising network, cross-attention layers let image features (queries) attend to the text vectors (keys and values), so each region of the image can 'read' the relevant words." },
          { title: "Work in a latent space", text: "Latent diffusion (the basis of Stable Diffusion) first compresses images with a VAE into a much smaller latent grid, runs diffusion there, and decodes the final latent to pixels. This makes training and sampling far cheaper." },
          { title: "Apply classifier-free guidance", text: "At each step, predict noise twice: with the prompt and with an empty prompt. Combine them as ε̂ = ε_uncond + w·(ε_cond − ε_uncond). A guidance scale w above 1 pushes the image to follow the prompt more strongly, at some cost to diversity and naturalness." },
          { title: "Decode", text: "After the last step, the VAE decoder turns the clean latent into the final image." },
        ] },
        { type: "callout", tone: "tip", title: "The same trick works for other conditions", text: "Instead of text, the condition can be a class label, a sketch, a depth map, a pose skeleton (as in ControlNet-style add-ons), or a masked image for inpainting (filling a missing region). Diffusion is very flexible about what it is conditioned on." },
      ],
    },
    {
      id: "advantages-and-uses",
      title: "Advantages and where diffusion models are used",
      blocks: [
        { type: "list", items: [
          "**Stable training.** A plain regression loss (predict the noise) instead of an adversarial game; no mode collapse in the GAN sense.",
          "**High quality and diversity.** Samples are detailed and cover the variety of the training data well.",
          "**Flexible conditioning and editing.** Text, images, masks and sketches can all steer generation; inpainting and image-to-image editing come almost for free.",
          "**A principled foundation.** The method has a clear probabilistic derivation, which helps researchers improve it.",
        ] },
        { type: "table", caption: "Where diffusion (and closely related) models are used", head: ["Area", "Examples"], rows: [
          ["Text-to-image", "Stable Diffusion, DALL·E 2 and 3, Imagen"],
          ["Image editing", "Inpainting, outpainting, style transfer, super-resolution"],
          ["Video", "Text-to-video systems; OpenAI described Sora as a diffusion transformer"],
          ["Audio", "Speech and music generation, audio super-resolution"],
          ["Science", "Protein and molecule design (e.g. RFdiffusion for protein structures)"],
        ] },
        { type: "callout", tone: "warn", title: "Limits and common mistakes", text: "Generation is slow because it needs many network calls (fast samplers and distillation help). Very high guidance scales give over-saturated, unnatural images. Models can reproduce memorised training images, raising copyright and privacy concerns, and they inherit biases from web data. Text rendering, counting and exact spatial layouts are still common failure points. And a diffusion model is the wrong tool when we need a *deterministic, exact* output, such as a technical drawing with precise dimensions." },
      ],
    },
    {
      id: "why-many-steps",
      title: "Going one level deeper",
      blocks: [
        { type: "p", text: "A fair question: if the network predicts the noise, and knowing the noise gives us the clean image, why not denoise in **one jump** from pure static? The one-jump estimate is x̂₀ = (xₜ − √(1−ᾱₜ)·ε̂) / √ᾱₜ. Look at what happens when the noise guess ε̂ is slightly wrong by some amount e. The image estimate is then wrong by e · √(1−ᾱₜ) / √ᾱₜ. That last ratio is an **amplification factor**, and it depends only on the step." },
        { type: "chart", kind: "line", title: "How much a noise-prediction error is amplified in a one-jump estimate", xLabel: "Step t", yLabel: "√(1−ᾱₜ) / √ᾱₜ", series: [
          { name: "Amplification", points: [[1, 0.01], [5, 0.21], [10, 0.45], [15, 0.74], [20, 1.11], [25, 1.6], [30, 2.32], [35, 3.44], [40, 5.31], [45, 8.58], [50, 14.68]] },
        ], caption: "Exact values for this lesson's 50-step schedule. Near the end of the forward process, a small mistake in the predicted noise becomes a mistake almost 15 times larger in the image." },
        { type: "steps", title: "The same idea with small numbers", items: [
          { title: "Light noise, t = 5", text: "The factor is 0.21. A noise guess that is off by 0.1 moves the image estimate by only 0.021. One jump would be fine here." },
          { title: "Medium noise, t = 25", text: "The factor is 1.6. The same 0.1 mistake now moves the image by 0.16." },
          { title: "Almost pure noise, t = 50", text: "The factor is 14.68. A 0.1 mistake becomes 1.47. For pixel values of about ±1, that is larger than the picture itself." },
          { title: "What the sampler does instead", text: "It never trusts the one-jump estimate from heavy noise. It moves a small part of the way, lands on a slightly cleaner xₜ₋₁, and asks the network again. Each new call sees a cleaner input and corrects the earlier guess." },
          { title: "Why this costs time", text: "Every correction is one more network call. Fewer steps means bigger jumps and less chance to fix mistakes, which is why cutting the step count too far gives blurry or broken images." },
        ] },
        { type: "p", text: "This also explains coarse-to-fine. At high noise the network cannot know the details, so its honest answer is close to an *average* of many possible images, which looks blurry. Only as the noise falls does one sharp image win. A blurry one-jump preview at an early step is not a bug; it is the best estimate available there." },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will noise a tiny 6-pixel 'image' to three different levels and try to recover it in one jump with a slightly imperfect noise guess. Then we will do classifier-free guidance by hand on two numbers to see what the guidance scale w really does." },
        { type: "code", lang: "python", title: "practice_one_jump.py", code: `import numpy as np
rng = np.random.default_rng(1)

# A tiny striped "image" of 6 pixels, and the lesson's 50-step schedule.
x0 = np.array([1.0, -1.0, 1.0, -1.0, 1.0, -1.0])
T = 50
beta = np.linspace(1e-4, 0.2, T)
abar = np.cumprod(1 - beta)
eps = rng.normal(size=x0.shape)                  # the true noise we add

print("Part 1: noise the image, then denoise it in ONE jump")
for t in (4, 24, 49):
    s, n = np.sqrt(abar[t]), np.sqrt(1 - abar[t])
    xt = s * x0 + n * eps                        # forward jump to step t+1
    eps_hat = eps + 0.1                          # a network that is slightly off
    loss = np.mean((eps - eps_hat) ** 2)         # the training loss it would get
    x0_hat = (xt - n * eps_hat) / s              # one-jump estimate of the image
    err = np.abs(x0_hat - x0).max()
    print(f"  t={t+1:2d}  noise loss={loss:.3f}  error in image={err:.3f}"
          f"  (amplified x{n / s:.1f})")

print("Part 2: classifier-free guidance on two numbers")
eps_uncond = np.array([0.20, -0.10])             # prediction with empty prompt
eps_cond = np.array([0.50, 0.30])                # prediction with our prompt
for w in (0.0, 1.0, 3.0, 7.5):
    guided = eps_uncond + w * (eps_cond - eps_uncond)
    step = np.linalg.norm(guided - eps_uncond)   # how far the prompt pushes us
    print(f"  w={w:3.1f}  guided={np.round(guided, 2)}  push={step:.2f}")`, output: `Part 1: noise the image, then denoise it in ONE jump
  t= 5  noise loss=0.010  error in image=0.021  (amplified x0.2)
  t=25  noise loss=0.010  error in image=0.160  (amplified x1.6)
  t=50  noise loss=0.010  error in image=1.468  (amplified x14.7)
Part 2: classifier-free guidance on two numbers
  w=0.0  guided=[ 0.2 -0.1]  push=0.00
  w=1.0  guided=[0.5 0.3]  push=0.50
  w=3.0  guided=[1.1 1.1]  push=1.50
  w=7.5  guided=[2.45 2.9 ]  push=3.75`,
          walkthrough: [
            { lines: [5, 9], note: "A striped image with values ±1, the same 50-step schedule as the lesson, and one fixed noise draw used at every level." },
            { lines: [12, 20], note: "For each step we jump forward, pretend the network's noise guess is off by 0.1, and rebuild the image in one jump. The noise loss is 0.010 every time, but the image error grows from 0.021 to 1.468." },
            { lines: [23, 28], note: "Guidance is a straight line through two predictions. w = 0 gives the unconditional one, w = 1 the conditional one, and larger w keeps going in the same direction, far past both." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Change `eps + 0.1` to `eps + 0.01` (a ten times better network). Predict the image error at t = 50 before running.",
          "Change the schedule's last value from `0.2` to `0.02`. Predict whether the amplification at t = 50 goes up or down. Then ask: is x₅₀ still close to pure noise, and why would that hurt generation?",
          "Add `-1.0` to the list of guidance scales. Predict the guided vector by hand first, and say in words which way it moves.",
        ] },
        { type: "check", question: "In the run above the noise loss was 0.010 at every step, but the image error ranged from 0.021 to 1.468. What does this say about judging a diffusion model only by its training loss?", answer: "The loss treats an error in the noise the same at every step, but the effect on the image is very different: small at low noise, huge at high noise. One average number hides where the mistakes are and how much they matter. That is why we also look at generated samples, and why samplers take many small steps rather than trust a single estimate from heavy noise." },
        { type: "check", question: "With w = 7.5 the guided prediction was [2.45, 2.9], far larger than either the unconditional [0.2, −0.1] or the conditional [0.5, 0.3]. Why can that harm the image?", answer: "Guidance extrapolates. It takes the difference between the two predictions and multiplies it, so the result lies outside anything the network actually predicted. Each step then removes too much 'noise' in the prompt direction, pushing values toward extremes. That matches the over-saturated, unnatural look of very high guidance scales." },
      ],
    },
  ],
  quiz: [
    { q: "What does the neural network in a standard DDPM-style diffusion model learn to predict?", options: ["The class label of the clean image", "The noise contained in the noisy image", "The next pixel value in reading order", "Whether an image is real or generated"], answer: 1, explain: "The network ε_θ(xₜ, t) predicts the noise ε. Predicting a label is classification, next-pixel prediction is autoregressive generation, and real-vs-fake is a GAN discriminator." },
    { q: "With the shortcut xₜ = √ᾱₜ·x₀ + √(1−ᾱₜ)·ε, suppose ᾱₜ = 0.64, x₀ = 2 and ε = 1. What is xₜ?", options: ["2.2", "1.88", "1.6", "2.0"], answer: 0, explain: "√0.64 = 0.8 and √0.36 = 0.6, so xₜ = 0.8·2 + 0.6·1 = 1.6 + 0.6 = 2.2." },
    { q: "Our generated product images ignore parts of the prompt. Which knob most directly makes them follow the text more strongly?", options: ["Train on fewer images so the model memorises captions", "Raise the classifier-free guidance scale w", "Remove the noise schedule and denoise in a single step", "Delete some of the cross-attention layers in the network"], answer: 1, explain: "Classifier-free guidance pushes the noise prediction toward the text-conditioned direction; a larger w means stronger prompt adherence (with less diversity if pushed too far). The other options would hurt quality or weaken the conditioning." },
    { q: "Compared with GANs, which is a genuine trade-off of diffusion models?", options: ["Diffusion trains less stably than GANs but samples much faster", "Diffusion models cannot be conditioned on text prompts at all", "Stable training, but many network calls per generated sample", "Diffusion samples are reliably blurrier than VAE samples are"], answer: 2, explain: "Diffusion's simple regression loss trains stably and gives diverse, sharp samples, but sampling is iterative and slow. GANs generate in one pass but train unstably." },
    { q: "Which statement is a misconception?", options: ["The forward process has no learned parameters", "Latent diffusion runs diffusion on a compressed VAE latent", "Late reverse steps mainly refine fine details", "Training must run all T noising steps one by one per image"], answer: 3, explain: "The closed-form shortcut lets training jump directly to any step t with one formula, so we never simulate the full chain during training. The other statements are true." },
  ],
  takeaways: [
    "Diffusion models learn to reverse a fixed process that gradually turns data into Gaussian noise.",
    "The forward process has a closed form: xₜ = √ᾱₜ·x₀ + √(1−ᾱₜ)·ε.",
    "Training is simple regression: predict the added noise with loss ‖ε − ε_θ(xₜ, t)‖².",
    "Generation starts from pure noise and denoises step by step, coarse to fine.",
    "Text-to-image adds a text encoder, cross-attention, often a VAE latent space, and classifier-free guidance.",
  ],
  terms: [
    { term: "Generative model", def: "A model that learns a data distribution so it can create new samples from it." },
    { term: "Forward process", def: "The fixed procedure that adds Gaussian noise to data over T steps." },
    { term: "Reverse process", def: "The learned procedure that removes noise step by step to generate data." },
    { term: "Noise schedule", def: "The sequence β₁…β_T controlling how much noise is added at each step." },
    { term: "U-Net", def: "A convolutional encoder-decoder with skip connections, the classic denoising network in diffusion models." },
    { term: "Latent diffusion", def: "Running diffusion in a compressed latent space produced by a VAE, then decoding to pixels." },
    { term: "Classifier-free guidance", def: "Mixing conditional and unconditional noise predictions to make samples follow the prompt more strongly." },
  ],
};
