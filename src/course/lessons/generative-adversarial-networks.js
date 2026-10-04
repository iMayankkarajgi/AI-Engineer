export default {
  id: "generative-adversarial-networks",
  minutes: 27,
  hook: "What happens if we train one network to forge images and a second network to catch the forgeries — and let them compete until the forger wins?",
  summary: "A Generative Adversarial Network (GAN) trains two networks against each other: a generator that turns random noise into fake samples, and a discriminator that tries to tell real samples from fakes. Each improves by exploiting the other's weaknesses, and at the ideal end point the fakes are indistinguishable from real data. GANs generate sharp images in a single fast pass, but training is a delicate balancing act that can oscillate or collapse to a few repeated outputs.",
  sections: [
    {
      id: "what-is-a-gan",
      title: "What is a Generative Adversarial Network (GAN)?",
      blocks: [
        { type: "p", text: "A **generative model** learns what a dataset looks like so it can produce new examples that could plausibly belong to it. In 2014, Ian Goodfellow and colleagues proposed a striking way to train one: instead of writing down a formula for 'how good is this fake image?', let a *second neural network* learn to judge. That pair of networks, trained as opponents, is a **Generative Adversarial Network (GAN)**. 'Adversarial' simply means 'set against each other'." },
        { type: "p", text: "Our running example: an appliance shop wants thousands of realistic product photos of kettles in different colours and settings to train a damage detector, without photographing every combination. A GAN trained on real kettle photos can produce new ones on demand, each from a different random input." },
        { type: "p", text: "For several years (roughly 2014–2021), GANs produced the most photorealistic generated images, including the famous synthetic faces. Diffusion models have since taken over most text-to-image work, but GANs remain important wherever we need *one-pass, real-time* generation, and their adversarial loss lives on inside many modern systems." },
      ],
    },
    {
      id: "two-players",
      title: "The two players: generator vs discriminator",
      blocks: [
        { type: "compare", title: "The two networks in a GAN",
          options: [
            { name: "Generator G", summary: "Turns a random noise vector z into a fake sample G(z).", pros: ["Never sees real data directly", "Learns only from the discriminator's feedback (its gradients)"], cons: ["Can 'cheat' by producing only a few outputs that fool D"], bestFor: "The part we keep after training: it is the image maker" },
            { name: "Discriminator D", summary: "Takes a sample and outputs D(x), the probability that x is real.", pros: ["A normal binary classifier", "Sees both real and fake samples"], cons: ["If it becomes too strong too fast, G stops getting useful feedback"], bestFor: "A training-time critic; usually thrown away afterwards" },
          ],
          rows: [
            ["Input", "Random noise z (e.g. 100 numbers from N(0, 1))", "An image (real or fake)"],
            ["Output", "An image", "One probability"],
            ["Wants", "D(G(z)) → 1", "D(real) → 1 and D(G(z)) → 0"],
          ],
          verdict: "The generator is the product; the discriminator is a learned loss function that keeps getting stricter as the generator improves." },
        { type: "p", text: "The noise vector z lives in the **latent space**. Each point in it maps to one output image, and nearby points usually map to similar images. Sampling a new z gives a new kettle; sliding smoothly between two z's often morphs one kettle smoothly into another." },
      ],
    },
    {
      id: "counterfeiter-police",
      title: "The counterfeiter vs police analogy",
      blocks: [
        { type: "callout", tone: "analogy", title: "Forger and detective", text: "The generator is a counterfeiter printing fake banknotes; the discriminator is a police detective examining notes. At first the fakes are crude, and the detective spots them easily by obvious tells: wrong colour, no watermark. Each time a fake is caught, the counterfeiter learns *which* feature gave it away and fixes it. The detective then has to look for subtler clues. Round after round, both get better. The game ends, in theory, when the fakes are so good that the detective can do no better than guessing: 50/50." },
        { type: "p", text: "There is one twist the analogy hides. Our counterfeiter does not just hear 'caught' or 'not caught'. Because both players are differentiable networks, the generator receives the **gradient** of the detective's judgement: an exact signal saying 'make these pixels a bit brighter and the detective will be more convinced'. That rich feedback is what makes GAN training possible at all." },
        { type: "check", question: "At the ideal end of training, what does the discriminator output for every input, and why?", answer: "About 0.5. If the generator's samples come from exactly the same distribution as the real data, no classifier can tell them apart, so the best possible guess for any input is 50% real." },
      ],
    },
    {
      id: "training-loop",
      title: "The adversarial training loop",
      blocks: [
        { type: "flow", title: "One round of GAN training", loop: true, nodes: [
          { label: "Sample real batch", detail: "Take a mini-batch of real kettle photos from the dataset." },
          { label: "Generate fakes", detail: "Draw random z vectors and run them through G to get a batch of fake photos." },
          { label: "Update D", detail: "Train D as a binary classifier: label real as 1, fake as 0. G's weights are frozen in this step." },
          { label: "Generate fresh fakes", detail: "Draw new z (or reuse the batch) and pass the fakes through the *updated* D." },
          { label: "Update G", detail: "Backpropagate through D into G and change only G's weights so that D scores the fakes closer to 'real'. D is frozen in this step." },
        ] },
        { type: "steps", title: "The same loop in plain words", items: [
          { title: "Fix G, improve D", text: "D sees a mix of real and fake samples and takes one gradient step to classify them better." },
          { title: "Fix D, improve G", text: "G takes one gradient step to make its outputs look more real *to the current D*." },
          { title: "Alternate", text: "Repeat thousands of times. Some recipes give D several steps per G step, or use different learning rates for the two." },
          { title: "Watch samples, not just losses", text: "Unlike normal training, the losses do not steadily fall: when one player improves, the other's loss goes up. Practitioners judge progress by looking at samples and by metrics such as FID (Fréchet Inception Distance), which compares statistics of real and generated images." },
        ] },
      ],
    },
    {
      id: "loss-minimax",
      title: "The loss function and the minimax game in simple words",
      blocks: [
        { type: "p", text: "The original GAN objective is a single value V(D, G) that D tries to make **large** and G tries to make **small**. That is why it is called a **minimax game**:" },
        { type: "formula", expr: "min_G max_D  V(D, G) = E_x~data [ log D(x) ] + E_z~N(0,I) [ log(1 − D(G(z))) ]", where: [["D(x)", "discriminator's probability that x is real (between 0 and 1)"], ["G(z)", "fake sample made from noise z"], ["E[…]", "average over many samples"]] },
        { type: "list", items: [
          "**First term, log D(x):** on real data, D wants D(x) near 1, so log D(x) near 0 (its maximum). If D wrongly says 0.1 on a real image, log 0.1 ≈ −2.3: a big penalty.",
          "**Second term, log(1 − D(G(z))):** on fakes, D wants D(G(z)) near 0, so log(1 − 0) = 0. The generator controls only this term and wants D(G(z)) near 1, which drives it toward log(0) = −∞.",
          "**Together:** D maximising V is exactly ordinary binary cross-entropy training. G minimising V is 'fool D'.",
        ] },
        { type: "callout", tone: "tip", title: "The non-saturating trick used in practice", text: "Early in training, fakes are terrible, D(G(z)) ≈ 0, and log(1 − D(G(z))) is almost flat there, so G gets tiny gradients and learns nothing. The original paper therefore suggested that G instead *maximise* log D(G(z)). It has the same goal (fool D) but gives strong gradients exactly when G is losing. Almost all implementations use this version." },
        { type: "deeper", title: "What the game optimises, mathematically", blocks: [
          { type: "p", text: "For a fixed generator, the best possible discriminator is D*(x) = p_data(x) / (p_data(x) + p_g(x)), where p_g is the generator's distribution. Plugging D* back in, the generator's objective becomes, up to constants, the **Jensen–Shannon divergence** between p_data and p_g — a measure of how different two distributions are. It is minimised exactly when p_g = p_data, where D* = 1/2 everywhere." },
          { type: "p", text: "The catch: when the two distributions barely overlap (common early in training with high-dimensional images), the JS divergence saturates and provides poor gradients. This motivated the **Wasserstein GAN** (2017), which replaces the discriminator with a 'critic' estimating the Wasserstein (earth-mover) distance, giving smoother gradients." },
        ] },
      ],
    },
    {
      id: "code-sketch",
      title: "A tiny PyTorch-style code sketch (and a runnable numpy version)",
      blocks: [
        { type: "p", text: "Here is what a minimal GAN for 28×28 images looks like in PyTorch. It is a sketch to read, not run here (PyTorch is not installed in this course environment, and `loader` stands for a data loader)." },
        { type: "code", lang: "python", title: "gan_sketch.py (PyTorch, for reading)", code: `import torch, torch.nn as nn

G = nn.Sequential(nn.Linear(64, 256), nn.ReLU(), nn.Linear(256, 784), nn.Tanh())
D = nn.Sequential(nn.Linear(784, 256), nn.LeakyReLU(0.2), nn.Linear(256, 1))  # logits
opt_G = torch.optim.Adam(G.parameters(), lr=2e-4, betas=(0.5, 0.999))
opt_D = torch.optim.Adam(D.parameters(), lr=2e-4, betas=(0.5, 0.999))
bce = nn.BCEWithLogitsLoss()

for real in loader:                          # real: (batch, 784) images in [-1, 1]
    n = real.size(0)
    ones, zeros = torch.ones(n, 1), torch.zeros(n, 1)

    # 1) Train D: real -> 1, fake -> 0. detach() so G is not updated here.
    fake = G(torch.randn(n, 64))
    loss_D = bce(D(real), ones) + bce(D(fake.detach()), zeros)
    opt_D.zero_grad(); loss_D.backward(); opt_D.step()

    # 2) Train G: make D output 1 on fakes (non-saturating loss).
    loss_G = bce(D(fake), ones)
    opt_G.zero_grad(); loss_G.backward(); opt_G.step()`,
          walkthrough: [
            { lines: [3, 4], note: "G maps 64 noise numbers to 784 pixels (28×28) with tanh to keep outputs in [−1, 1]. D maps 784 pixels to one logit (a raw score before the sigmoid)." },
            { lines: [5, 7], note: "Two separate optimisers, one per player. Adam with β₁ = 0.5 and lr = 2e-4 is the classic DCGAN-style setting." },
            { lines: [13, 16], note: "Discriminator step. `detach()` cuts the graph so this loss does not change G." },
            { lines: [18, 20], note: "Generator step with the non-saturating loss: label the fakes as 'real' (ones) and let the gradient flow through D into G." },
          ] },
        { type: "p", text: "To see real training dynamics with real output, here is the same loop in numpy on 1-D data. Real data are numbers from a bell curve with mean 4 and standard deviation 0.5. The generator is G(z) = a·z + b, and the discriminator is a logistic classifier on x and x². We run it twice with different learning rates." },
        { type: "code", lang: "python", title: "tiny_gan.py", code: `import numpy as np
rng = np.random.default_rng(0)
sig = lambda u: 1 / (1 + np.exp(-u))
real = lambda n: rng.normal(4.0, 0.5, n)       # real data: mean 4, std 0.5
feat = lambda x: np.stack([x, x * x, np.ones_like(x)])

def train(lr_d, lr_g, steps=6000, n=64):
    a, b = 1.0, 0.0              # generator  G(z) = a*z + b,  z ~ N(0, 1)
    w = np.zeros(3)              # discriminator D(x) = sigmoid(w1*x + w2*x^2 + c)
    for step in range(steps + 1):
        # 1) Discriminator step: push D(real) -> 1 and D(fake) -> 0
        xr, xf = real(n), a * rng.normal(size=n) + b
        dr, df = sig(w @ feat(xr)), sig(w @ feat(xf))
        w += lr_d * (feat(xr) @ (1 - dr) - feat(xf) @ df) / n
        # 2) Generator step: move fakes so D calls them real
        z = rng.normal(size=n)
        xf = a * z + b
        df = sig(w @ feat(xf))
        g = (1 - df) * (w[0] + 2 * w[1] * xf)   # d log D(G(z)) / d x
        a += lr_g * np.mean(g * z)
        b += lr_g * np.mean(g)
        if step % 2000 == 0:
            f = a * rng.normal(size=5000) + b
            print(f"  step {step:4d}: fake mean={f.mean():.2f}  fake std={f.std():.2f}")

print("run A (lr_d=0.1,  lr_g=0.005)")
train(0.1, 0.005)
print("run B (lr_d=0.02, lr_g=0.02)")
train(0.02, 0.02)
print("target: mean=4.00  std=0.50")`, output: `run A (lr_d=0.1,  lr_g=0.005)
  step    0: fake mean=-0.00  fake std=1.00
  step 2000: fake mean=3.95  fake std=0.60
  step 4000: fake mean=4.01  fake std=0.55
  step 6000: fake mean=3.97  fake std=0.55
run B (lr_d=0.02, lr_g=0.02)
  step    0: fake mean=-0.01  fake std=1.01
  step 2000: fake mean=4.02  fake std=0.02
  step 4000: fake mean=4.02  fake std=0.02
  step 6000: fake mean=4.01  fake std=0.01
target: mean=4.00  std=0.50`,
          walkthrough: [
            { lines: [4, 5], note: "The real data distribution and the discriminator's features [x, x², 1]. The x² feature lets D notice when the fakes have the wrong spread, not just the wrong mean." },
            { lines: [8, 9], note: "The generator starts as plain N(0, 1) noise (mean 0, std 1); the discriminator starts with all-zero weights, i.e. D(x) = 0.5 for everything." },
            { lines: [11, 14], note: "Discriminator step: the gradient of log D(real) + log(1 − D(fake)) for a logistic model, used to push its weights uphill." },
            { lines: [15, 21], note: "Generator step: the chain rule through D. `g` is how much log D(G(z)) rises if a fake moves right; multiply by dG/da = z and dG/db = 1 to update the two generator parameters." },
            { lines: [26, 30], note: "Run A learns both the mean (≈ 4) and roughly the spread (≈ 0.55 vs 0.5). Run B, where G learns as fast as D, finds the mean but collapses its spread to almost 0: every z produces nearly the same number. That is mode collapse in miniature." },
          ] },
      ],
    },
    {
      id: "mode-collapse",
      title: "The mode collapse problem",
      blocks: [
        { type: "p", text: "Real data usually has many **modes**: distinct clusters such as kettles that are red, steel, white, or black. **Mode collapse** happens when the generator discovers a few outputs that currently fool the discriminator and produces only those, ignoring the rest of the data. In the worst case it outputs nearly the same image for every z, as run B did." },
        { type: "p", text: "Why does it happen? The generator is rewarded only for fooling the *current* discriminator, not for covering the whole dataset. If D is temporarily weak on 'steel kettles', G can pile everything there. D then learns to reject steel kettles, G jumps to another mode, and the two can chase each other around without ever covering all modes at once." },
        { type: "chart", kind: "bar", title: "Kettle colours: real data vs a collapsed generator", yLabel: "Share of samples", unit: "%", labels: ["Red", "Steel", "White", "Black"], series: [{ name: "Real data", values: [25, 25, 25, 25] }, { name: "Collapsed G", values: [2, 90, 5, 3] }], caption: "Illustrative. Each collapsed sample can look perfectly realistic; the failure only shows when we look at the variety across many samples." },
        { type: "callout", tone: "warn", title: "Why it is easy to miss", text: "A collapsed GAN can produce individually stunning images. If we only inspect a handful of samples, everything looks great. Always look at many samples side by side and measure diversity (FID captures some of this; precision and recall metrics for generative models separate quality from coverage)." },
        { type: "list", items: [
          "**Minibatch discrimination / minibatch statistics:** let D look at a whole batch, so a batch of identical fakes is easy to spot.",
          "**Better objectives:** Wasserstein loss with a gradient penalty, or other losses with smoother gradients.",
          "**Balancing the players:** tune learning rates and update ratios (as our run A vs run B shows).",
          "**Conditioning:** asking for a specific class (e.g. 'red') forces coverage of each class.",
        ] },
      ],
    },
    {
      id: "training-stability",
      title: "Training stability",
      blocks: [
        { type: "p", text: "Normal training minimises one loss downhill. A GAN searches for a **balance point** (an equilibrium) between two players whose goals conflict. Gradient steps on such games can circle around the balance point or fly away from it instead of settling. Typical symptoms:" },
        { type: "list", items: [
          "**Oscillation:** samples cycle between styles; losses swing back and forth.",
          "**Vanishing generator gradients:** D becomes near-perfect, D(G(z)) ≈ 0, and G stops learning.",
          "**Divergence:** outputs degrade into noise or saturated colours after looking promising.",
          "**Hyperparameter sensitivity:** a small change in learning rate can change success into collapse, as our two runs show.",
        ] },
        { type: "table", caption: "Widely used stabilisation techniques", head: ["Technique", "What it does"], rows: [
          ["Non-saturating G loss", "Strong gradients for G even when D is winning"],
          ["DCGAN architecture rules", "Strided convolutions, batch normalisation, ReLU in G and LeakyReLU in D"],
          ["Wasserstein loss + gradient penalty", "A smoother distance between distributions; critic kept 'Lipschitz' (no sharp jumps)"],
          ["Spectral normalisation", "Limits how sharply D can change, preventing it from overpowering G"],
          ["Two time-scale update rule (TTUR)", "Different learning rates for D and G"],
          ["Label smoothing, EMA of G weights", "Softer targets for D; averaging G's weights over time for smoother samples"],
        ] },
      ],
    },
    {
      id: "types-of-gans",
      title: "Types of GANs (DCGAN, Conditional GAN, StyleGAN, CycleGAN)",
      blocks: [
        { type: "timeline", title: "Key GAN variants", items: [
          { when: "2014", title: "Original GAN", text: "Goodfellow et al. introduce the generator-discriminator game, with fully connected networks." },
          { when: "2014", title: "Conditional GAN (cGAN)", text: "Mirza and Osindero feed a label y to both G and D, so we can ask for a specific class: G(z, y). 'Generate a *red* kettle.'" },
          { when: "2015", title: "DCGAN", text: "Radford et al. give architecture rules for convolutional GANs (strided convolutions, batch norm, no pooling) that made image GANs train far more reliably, and show meaningful arithmetic in latent space." },
          { when: "2017", title: "CycleGAN", text: "Zhu et al. translate between two image domains *without paired examples* (horses ↔ zebras, summer ↔ winter) using two generators and a cycle-consistency loss: translating there and back should return the original." },
          { when: "2018–2019", title: "StyleGAN", text: "Karras et al. at NVIDIA map z to an intermediate 'style' vector that controls each resolution level of the generator, giving very high-quality faces and control over coarse (pose) vs fine (hair texture) attributes." },
        ] },
        { type: "p", text: "Other notable members include pix2pix (paired image-to-image translation, such as sketch to photo), Progressive GAN (grow the resolution during training), BigGAN (large-scale class-conditional generation) and SRGAN/ESRGAN (super-resolution)." },
        { type: "check", question: "We have photos of kettles in daylight and, separately, photos of other kettles under warm evening light, but no pairs of the same kettle in both. Which GAN type fits a 'daylight → evening' converter?", answer: "CycleGAN. It is designed for unpaired image-to-image translation, using the cycle-consistency loss in place of matched pairs. pix2pix would need paired examples." },
      ],
    },
    {
      id: "applications",
      title: "Real-world applications of GANs",
      blocks: [
        { type: "table", caption: "Where GANs are used", head: ["Application", "Example"], rows: [
          ["Realistic image synthesis", "Synthetic faces, products and scenes from StyleGAN-like models"],
          ["Image-to-image translation", "Sketch → photo, day → night, maps ↔ satellite images"],
          ["Super-resolution and restoration", "Upscaling old photos and game textures (SRGAN/ESRGAN family)"],
          ["Data augmentation", "Extra synthetic training images when real data is scarce (with care to avoid leaking artefacts)"],
          ["Inside other generators", "Adversarial losses help image tokenizers/autoencoders (such as those used in latent diffusion) produce sharp reconstructions"],
          ["Real-time effects", "One-pass generation suits video filters and interactive tools"],
        ] },
        { type: "compare", title: "GANs vs diffusion models",
          options: [
            { name: "GAN", summary: "One network pass from noise to image; trained adversarially.", pros: ["Very fast sampling", "Sharp images"], cons: ["Unstable training", "Mode collapse; weaker diversity"], bestFor: "Real-time generation, super-resolution, narrow domains" },
            { name: "Diffusion", summary: "Many denoising steps; trained with a simple regression loss.", pros: ["Stable training", "Excellent diversity and text conditioning"], cons: ["Slow sampling (many steps)"], bestFor: "Text-to-image, broad open-domain generation" },
          ],
          verdict: "For open-ended text-to-image work, diffusion is the default today. GANs still win when speed is critical or the domain is narrow." },
        { type: "callout", tone: "warn", title: "Responsible use", text: "GANs made convincing fake faces and 'deepfake' videos easy to produce. Synthetic media can be used for fraud, harassment and misinformation. Label generated content, respect consent and likeness rights, and do not use synthetic people where real identities are expected." },
      ],
    },
    {
      id: "worked-loss-example",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "GAN losses are hard to read because there are two of them and neither simply falls. Let us compute both by hand for one tiny batch, then learn what the numbers mean. Our batch has two real kettle photos and two fakes. The discriminator outputs D = 0.9 and 0.6 on the real ones, and 0.2 and 0.4 on the fakes. We use natural logs and average over each pair, as the PyTorch sketch does." },
        { type: "steps", title: "One batch, both losses", items: [
          { title: "D on real photos", text: "D wants 1. Loss = −(ln 0.9 + ln 0.6) / 2 = (0.105 + 0.511) / 2 = **0.308**." },
          { title: "D on fakes", text: "D wants 0, so we score 1 − D. Loss = −(ln 0.8 + ln 0.6) / 2 = (0.223 + 0.511) / 2 = **0.367**." },
          { title: "Discriminator loss", text: "0.308 + 0.367 = **0.675**." },
          { title: "Generator loss (non-saturating)", text: "G wants D to say 1 on fakes. Loss = −(ln 0.2 + ln 0.4) / 2 = (1.609 + 0.916) / 2 = **1.263**." },
          { title: "The balance point for reference", text: "If D said 0.5 for everything, its loss would be ln 2 + ln 2 = **1.386** and G's would be ln 2 = **0.693**." },
          { title: "Read the result", text: "D's 0.675 is well below 1.386, and G's 1.263 is well above 0.693. So D is ahead right now. That is healthy as long as G keeps getting a useful signal." },
        ] },
        { type: "chart", kind: "line", title: "Size of the generator's learning signal vs D(G(z))", xLabel: "D(G(z)): how real D thinks the fake is", yLabel: "Gradient size at D's raw score", series: [
          { name: "Minimise log(1 − D(G(z)))", points: [[0.01, 0.01], [0.1, 0.1], [0.3, 0.3], [0.5, 0.5], [0.7, 0.7], [0.9, 0.9]] },
          { name: "Maximise log D(G(z))", points: [[0.01, 0.99], [0.1, 0.9], [0.3, 0.7], [0.5, 0.5], [0.7, 0.3], [0.9, 0.1]] },
        ], caption: "Exact derivatives with respect to D's raw score (the logit): D for the original loss, 1 − D for the non-saturating one. When fakes are poor (left side), the original loss gives almost no signal." },
        { type: "table", caption: "Reading the two losses during training", head: ["What we see", "What it usually means", "What to check"], rows: [
          ["D loss ≈ 1.386, G loss ≈ 0.693 at the very start", "D has learned nothing yet and says 0.5 for everything", "Nothing; this is the normal starting point"],
          ["D loss ≈ 1.386, G loss ≈ 0.693 late in training", "Possibly the balance point", "Look at many samples; the numbers alone cannot tell this from the row above"],
          ["D loss near 0, G loss large and rising", "D is overpowering G", "Slow D down: lower its learning rate or give it fewer steps"],
          ["G loss small, D loss large, samples all alike", "G found one output that fools the current D", "Diversity across many samples: likely mode collapse"],
        ] },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will not train anything this time. Instead we freeze four different generators and, for each, compute the **best possible discriminator** and the score of the game. This shows what a perfect critic would say about an untrained, a nearly right, a collapsed and a perfect generator." },
        { type: "code", lang: "python", title: "practice_best_discriminator.py", code: `import numpy as np

# For a FIXED generator, the best possible discriminator is known:
#   D*(x) = p_data(x) / (p_data(x) + p_g(x))
# We compute it on a grid for several generators and score the game.
x = np.linspace(-6, 10, 16001)
dx = x[1] - x[0]

def bell(mean, std):
    """Density of a normal distribution on the grid."""
    return np.exp(-0.5 * ((x - mean) / std) ** 2) / (std * np.sqrt(2 * np.pi))

p_data = bell(4.0, 0.5)                          # real data: mean 4, std 0.5
tiny = 1e-300                                    # avoids log(0) where both are 0

def play(name, mean, std):
    p_g = bell(mean, std)
    d_star = p_data / (p_data + p_g + tiny)      # best D for this generator
    # V = E_data[log D] + E_fake[log(1 - D)], as integrals over the grid
    v = np.sum(p_data * np.log(d_star + tiny)) * dx \\
        + np.sum(p_g * np.log(1 - d_star + tiny)) * dx
    js = max(0.0, (v + np.log(4)) / 2)           # Jensen-Shannon divergence
    at4 = d_star[np.argmin(np.abs(x - 4.0))]     # D*'s verdict at x = 4
    print(f"{name:22s} V={v:+.3f}  JS={js:.3f}  D*(4)={at4:.2f}")

play("untrained  N(0, 1)", 0.0, 1.0)
play("close      N(3.5, 0.5)", 3.5, 0.5)
play("collapsed  N(4, 0.05)", 4.0, 0.05)
play("perfect    N(4, 0.5)", 4.0, 0.5)
print(f"reference: -log 4 = {-np.log(4):.3f},  log 2 = {np.log(2):.3f}")`, output: `untrained  N(0, 1)     V=-0.023  JS=0.682  D*(4)=1.00
close      N(3.5, 0.5) V=-1.163  JS=0.111  D*(4)=0.62
collapsed  N(4, 0.05)  V=-0.520  JS=0.433  D*(4)=0.09
perfect    N(4, 0.5)   V=-1.386  JS=0.000  D*(4)=0.50
reference: -log 4 = -1.386,  log 2 = 0.693`,
          walkthrough: [
            { lines: [6, 13], note: "A fine grid of x values and a helper that returns a bell curve on it. The real data are the same as in the lesson: mean 4, standard deviation 0.5." },
            { lines: [16, 24], note: "For one generator we build D*(x) = p_data / (p_data + p_g), then compute the game value V as two sums over the grid. (V + log 4) / 2 is the Jensen–Shannon divergence from the 'deeper' panel." },
            { lines: [26, 30], note: "Four generators. The untrained one is caught almost perfectly (V near 0, JS near its maximum log 2). The perfect one gives V = −log 4, JS = 0 and D* = 0.5. The collapsed one has the right mean but still scores badly." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Add `play(\"too wide   N(4, 1.0)\", 4.0, 1.0)`. Predict first: is a generator that is too spread out punished more or less than the collapsed one (JS = 0.433)?",
          "Move the 'close' generator's mean from `3.5` to `3.9`. Predict whether D*(4) moves toward 0.5 or away from it, and what happens to JS.",
          "Make the real data two clusters: `p_data = (bell(2.0, 0.5) + bell(6.0, 0.5)) / 2`, and test a generator `N(2, 0.5)` that covers only one of them. Predict whether JS lands near 0, near log 2, or in between.",
        ] },
        { type: "check", question: "The collapsed generator N(4, 0.05) has exactly the right mean, yet the best discriminator gives D*(4) = 0.09. Why would a perfect critic call a sample at x = 4 'probably fake'?", answer: "Because the collapsed generator puts almost all its samples in a tiny range around 4, while the real data spread theirs over a much wider range. At x = 4 there are about ten fake samples for every real one, so 'fake' is the smart guess there. Away from 4 the opposite holds: D* is close to 1, since the generator never produces those values. A good D notices the missing spread, not just the mean." },
        { type: "check", question: "We log D loss ≈ 1.386 and G loss ≈ 0.693 at step 0 and again at step 5,000. Does that prove training has reached the ideal end point?", answer: "No. Those values only say that D outputs about 0.5 on everything. At step 0 that is because D knows nothing. Later it could be the true balance point, or D could have become too weak to tell anything apart. The losses look the same in all three cases, so we have to inspect many samples (and a metric such as FID) to know which one we are in." },
      ],
    },
  ],
  quiz: [
    { q: "In a GAN, what is the discriminator trained to do?", options: ["Turn random noise vectors into new images", "Compress each image into a small latent vector", "Classify samples as real or generated", "Remove noise from an image one step at a time"], answer: 2, explain: "D is a binary classifier between real and generated samples. Turning noise into images is the generator's job; step-by-step denoising describes diffusion; compression describes an autoencoder." },
    { q: "Early in training, D(G(z)) ≈ 0 for all fakes. Why do practitioners have G maximise log D(G(z)) instead of minimising log(1 − D(G(z)))?", options: ["It gives G strong gradients exactly when its fakes are poor", "It makes the discriminator learn faster than the generator", "It removes the need to train a discriminator network at all", "It mathematically guarantees that mode collapse cannot happen"], answer: 0, explain: "log(1 − D(G(z))) is almost flat near D(G(z)) = 0, so G would get tiny gradients. The non-saturating loss has the same goal (fool D) but strong gradients when G is losing. It neither removes D nor prevents mode collapse." },
    { q: "Our kettle GAN produces beautiful images, but out of 1,000 samples almost all are steel kettles at the same angle. What is happening, and what is one sensible fix?", options: ["The images are too sharp; blur the training photos first", "The latent vector is too large; shrink it to a single number", "Mode collapse; e.g. let D see batch statistics or condition on colour", "D is overfitting; give D many more steps and shrink G's rate"], answer: 2, explain: "Good-looking but repetitive outputs are the signature of mode collapse. Minibatch-aware discriminators, Wasserstein-style losses and conditioning on attributes are standard fixes." },
    { q: "In the lesson's numpy run B (lr_d = 0.02, lr_g = 0.02), the fake mean reached 4.02 but the std fell to about 0.01. What does that show?", options: ["Training succeeded perfectly and the fakes matched the real data", "G collapsed to almost one output: right mean, no spread", "The discriminator learned the exact data distribution", "The real data had a standard deviation of about 0.01"], answer: 1, explain: "The target std was 0.5. The generator found a single value that fooled the current D and stopped varying: mode collapse in miniature. Run A, with a faster D and slower G, recovered a spread close to 0.5." },
    { q: "Which statement about CycleGAN is correct?", options: ["It needs pairs of the same scene photographed in both domains", "It generates new images directly from written text prompts", "It is a diffusion model that adds a discriminator at the end", "It translates between domains without pairs, via cycle consistency"], answer: 3, explain: "CycleGAN's key idea is unpaired translation: A → B → A should reconstruct the original. Paired translation is pix2pix; text-to-image is not CycleGAN's job." },
  ],
  takeaways: [
    "A GAN pits a generator (noise → fake) against a discriminator (real or fake?).",
    "The minimax objective trains D as a classifier and G to fool it; in practice G uses the non-saturating loss.",
    "At the ideal equilibrium, fakes match the data and D outputs 0.5 everywhere.",
    "Mode collapse and unstable, oscillating training are the main failure modes; balance and better losses help.",
    "DCGAN, cGAN, CycleGAN and StyleGAN extended GANs to reliable, controllable and unpaired image generation.",
  ],
  terms: [
    { term: "Generator", def: "The network that maps random noise to synthetic samples." },
    { term: "Discriminator", def: "The network that outputs the probability that a sample is real." },
    { term: "Minimax game", def: "A two-player objective that one player maximises and the other minimises." },
    { term: "Non-saturating loss", def: "The generator objective 'maximise log D(G(z))', which avoids vanishing gradients early on." },
    { term: "Mode collapse", def: "When a generator covers only a few modes of the data, producing low-variety outputs." },
    { term: "Latent space", def: "The space of noise vectors z that the generator maps to outputs." },
    { term: "Cycle-consistency loss", def: "A loss requiring that translating A → B → A returns the original input." },
  ],
};
