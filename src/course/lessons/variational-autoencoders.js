export default {
  id: "variational-autoencoders",
  minutes: 21,
  hook: "A normal autoencoder can squeeze a photo into a few numbers and rebuild it — so why can it not invent a new photo when we hand it a few random numbers?",
  summary: "An autoencoder compresses data into a small latent code and reconstructs it, but its latent space has gaps, so random codes decode to garbage. A Variational Autoencoder (VAE) fixes this by making the encoder output a small probability cloud (a mean and a spread) instead of a single point, and by adding a KL penalty that pulls all clouds toward a standard normal distribution. The result is a smooth, well-organised latent space we can sample from to generate new data; the reparameterization trick makes this trainable with backpropagation.",
  sections: [
    {
      id: "what-is-an-autoencoder",
      title: "What is an autoencoder?",
      blocks: [
        { type: "p", text: "An **autoencoder** is a neural network trained to copy its input to its output through a narrow middle. It has two halves:" },
        { type: "list", items: [
          "The **encoder** squeezes the input (say a 64×64 product photo, 12,288 numbers) into a short vector called the **latent code** z (say 16 numbers).",
          "The **decoder** takes z and tries to rebuild the original input, producing a **reconstruction** x̂.",
        ] },
        { type: "p", text: "Training minimises the **reconstruction error**, for example the mean squared difference between x and x̂. Because z is much smaller than x, the network cannot simply copy; it must learn the most important structure of the data. The middle layer is called the **bottleneck**, and the space of all possible z vectors is the **latent space**." },
        { type: "callout", tone: "analogy", title: "Think of it like describing a photo over the phone", text: "We look at a kettle photo and tell a friend: 'steel, tall, black handle, side view, white background'. The friend draws it from that description. The description is the latent code; we are the encoder; the friend is the decoder. A short description forces us to mention only what matters." },
        { type: "p", text: "Running example: our appliance shop has 20,000 product photos. An autoencoder trained on them learns a compact code for each kettle, toaster and blender. Such codes are useful for compression, denoising and anomaly detection (a damaged product reconstructs poorly because the network has never seen damage)." },
      ],
    },
    {
      id: "problem-with-autoencoders",
      title: "The problem with a normal autoencoder",
      blocks: [
        { type: "p", text: "The marketing team now asks: 'Can we generate *new* kettle designs?' A natural idea: pick a random latent code and run the decoder. With a plain autoencoder this usually produces garbage. Why?" },
        { type: "list", items: [
          "**The latent space has holes.** The encoder is only trained to give *each training image* a code that decodes well. Nothing tells it what codes *between* or *around* those points should mean. Large regions of the latent space are never visited, and the decoder has no idea what to do there.",
          "**No known shape.** The codes might cluster in strange, scattered patches far from zero. If we do not know where valid codes live, we cannot sample a good one.",
          "**No smoothness.** Two codes that are close together may decode to completely different images, so interpolating between two kettles can pass through nonsense.",
        ] },
        { type: "check", question: "Our plain autoencoder maps every kettle to codes between 40 and 60 in the first latent dimension. We sample a code with first dimension 0. What do we expect from the decoder?", answer: "Probably garbage. The decoder has never been trained on codes near 0 in that dimension, so its output there is undefined. That is exactly the 'holes in the latent space' problem a VAE is designed to fix." },
      ],
    },
    {
      id: "what-is-a-vae",
      title: "What is a Variational Autoencoder?",
      blocks: [
        { type: "p", text: "The **Variational Autoencoder (VAE)**, introduced by Kingma and Welling (2013) and independently by Rezende, Mohamed and Wierstra (2014), changes two things:" },
        { type: "list", ordered: true, items: [
          "**The encoder outputs a distribution, not a point.** For each input it gives a mean vector μ and a spread σ (standard deviation) for every latent dimension. The code z is then *sampled* from the Gaussian N(μ, σ²). So each image owns a small fuzzy cloud in latent space rather than a single dot.",
          "**A regulariser organises the space.** The loss includes a penalty — the **KL divergence** — that pulls every cloud toward a fixed **prior**, the standard normal N(0, I) (mean 0, spread 1 in every dimension).",
        ] },
        { type: "p", text: "Clouds fill the holes: because each image is decoded from many nearby samples during training, the decoder learns that the whole neighbourhood should look like that image. The KL penalty packs all clouds around the origin with overlapping edges, so the space between two kettles decodes to something kettle-like too. And to generate, we simply sample z ~ N(0, I) — we know exactly where valid codes live." },
        { type: "compare", title: "Autoencoder vs Variational Autoencoder",
          options: [
            { name: "Autoencoder", summary: "Deterministic: one input → one point z.", pros: ["Simple, sharp reconstructions", "Good for compression, denoising, anomaly detection"], cons: ["Latent space has holes and no known shape", "Cannot reliably generate new data"], bestFor: "Compression and representation learning" },
            { name: "VAE", summary: "Probabilistic: one input → a Gaussian cloud N(μ, σ²); KL pulls clouds to N(0, I).", pros: ["Smooth, continuous latent space", "Generate by sampling z ~ N(0, I)", "Meaningful interpolation"], cons: ["Reconstructions and samples are often blurrier", "Balancing the two loss terms takes care"], bestFor: "Generation, smooth latent spaces, compact latents for other models" },
          ],
          rows: [
            ["Encoder output", "z", "μ and σ (then sample z)"],
            ["Loss", "Reconstruction", "Reconstruction + KL"],
            ["Sample new data?", "Not reliably", "Yes: decode z ~ N(0, I)"],
          ],
          verdict: "If we only need compression, a plain autoencoder is simpler and sharper. If we need to generate or move smoothly through the latent space, use a VAE." },
      ],
    },
    {
      id: "encoder-latent-decoder",
      title: "The encoder, the latent space, and the decoder",
      blocks: [
        { type: "flow", title: "One pass through a VAE", nodes: [
          { label: "Input x", detail: "A 64×64 kettle photo, 12,288 numbers." },
          { label: "Encoder", detail: "A CNN (or other network) that outputs two vectors of the latent size, e.g. 16 numbers each: the mean μ and the log-variance log σ²." },
          { label: "Sample z", detail: "Draw ε ~ N(0, I) and compute z = μ + σ ⊙ ε. This is the reparameterization trick (next section)." },
          { label: "Decoder", detail: "A mirrored network that turns z (16 numbers) back into a 64×64 image x̂." },
          { label: "Loss", detail: "Reconstruction error between x and x̂, plus the KL divergence between N(μ, σ²) and N(0, I)." },
        ] },
        { type: "p", text: "Two practical details. First, encoders usually output the **log-variance** log σ² rather than σ, because a network output can be any real number, while σ must be positive; σ = exp(0.5 · log σ²) is always positive. Second, the dimensions are treated as independent (a 'diagonal' Gaussian), which keeps the math cheap." },
        { type: "p", text: "Once trained, the parts are used separately. **To generate**, throw the encoder away: sample z ~ N(0, I) and decode. **To encode** a real image (for search or editing), use only μ — the centre of its cloud. **To edit**, move z in a direction and decode: if one direction happens to correspond to 'handle colour', sliding along it changes just that." },
      ],
    },
    {
      id: "reparameterization-trick",
      title: "The reparameterization trick",
      blocks: [
        { type: "p", text: "Here is a puzzle. Training uses backpropagation, which needs a gradient for every step from the loss back to the encoder's weights. But in the middle we *sample* z from N(μ, σ²). Sampling is random: there is no derivative of 'roll a die' with respect to μ. Gradients cannot pass through a random draw." },
        { type: "p", text: "The trick is to move the randomness *out of the way*. Draw a fixed-distribution noise ε ~ N(0, I) that does not depend on any weights, then build z with ordinary arithmetic:" },
        { type: "formula", expr: "z = μ + σ ⊙ ε,        ε ~ N(0, I)", where: [["μ, σ", "encoder outputs (depend on the weights)"], ["ε", "external random noise (no weights involved)"], ["⊙", "element-wise multiplication"]], caption: "z has exactly the same distribution N(μ, σ²) as before, but now ∂z/∂μ = 1 and ∂z/∂σ = ε, so gradients flow straight through to the encoder." },
        { type: "callout", tone: "analogy", title: "Think of it like a recipe with a dice roll on the side", text: "Instead of 'the chef randomly decides how much salt to add' (impossible to blame or tune), we say 'roll a die first; then add μ grams plus σ grams per pip'. The randomness is still there, but now we can ask exactly how changing μ or σ changes the dish — and that is all backpropagation needs." },
        { type: "check", question: "μ = 0.8, σ = 0.5 and the noise draw is ε = −1.2. What is z, and what is ∂z/∂σ for this draw?", answer: "z = 0.8 + 0.5 × (−1.2) = 0.8 − 0.6 = 0.2. Since z = μ + σε, ∂z/∂σ = ε = −1.2." },
      ],
    },
    {
      id: "loss-function",
      title: "The loss function of a Variational Autoencoder",
      blocks: [
        { type: "p", text: "The VAE loss for one input has two parts that pull in opposite directions:" },
        { type: "formula", expr: "L = ‖x − x̂‖²  +  β · KL( N(μ, σ²) ‖ N(0, I) ),        KL = ½ ∑ⱼ ( μⱼ² + σⱼ² − log σⱼ² − 1 )", where: [["‖x − x̂‖²", "reconstruction loss (squared error; binary cross-entropy is also common for pixel values in [0, 1])"], ["KL", "how far this input's cloud is from the standard normal prior, summed over latent dimensions j"], ["β", "weight on the KL term; β = 1 is the standard VAE"]] },
        { type: "list", items: [
          "**Reconstruction** wants each cloud small and well separated, so the decoder knows exactly which image it came from.",
          "**KL** wants every cloud to look like N(0, 1): centred at 0 (penalising μ² ) with spread 1 (penalising σ² − log σ² − 1, which is 0 only at σ = 1).",
          "The balance gives clouds that are informative yet overlapping, centred near the origin: a smooth, sample-able space.",
        ] },
        { type: "chart", kind: "line", title: "KL penalty for one latent dimension (μ = 0) as σ changes", xLabel: "σ", yLabel: "KL", series: [{ name: "KL = ½(σ² − log σ² − 1)", points: [[0.1, 1.808], [0.25, 0.918], [0.5, 0.318], [0.75, 0.069], [1, 0], [1.5, 0.22], [2, 0.807]] }], caption: "Exact values. The penalty is zero only when σ = 1 and grows fast as the cloud shrinks to a point, which is what stops a VAE from turning back into a plain autoencoder." },
        { type: "deeper", title: "Where the loss comes from: the ELBO", blocks: [
          { type: "p", text: "A VAE is a probabilistic model: draw z from the prior p(z) = N(0, I), then draw x from the decoder's distribution p(x | z). We would like to maximise the likelihood p(x) of our data, but that requires integrating over all z, which is intractable. Variational inference introduces an approximate posterior q(z | x) — our encoder — and proves a lower bound:" },
          { type: "formula", expr: "log p(x) ≥ E_q(z|x)[ log p(x | z) ] − KL( q(z | x) ‖ p(z) )", caption: "The Evidence Lower BOund (ELBO). Maximising it = minimising reconstruction loss + KL. With a Gaussian decoder, −log p(x | z) is a scaled squared error." },
          { type: "p", text: "The 'variational' in the name refers to this variational inference. β-VAE (Higgins et al., 2017) uses β > 1 to push for more independent, interpretable latent factors, at the cost of blurrier reconstructions." },
        ] },
      ],
    },
    {
      id: "walkthrough-and-code",
      title: "A simple example walk-through, in code",
      blocks: [
        { type: "steps", title: "One training example, by the numbers", items: [
          { title: "Encode", text: "The encoder looks at one 4-pixel image and outputs, for a 2-d latent, μ = [0.8, −0.3] and log σ² = [−1, −2], so σ ≈ [0.607, 0.368]." },
          { title: "Sample with the trick", text: "Draw ε ~ N(0, I) and set z = μ + σ ⊙ ε. Every draw gives a slightly different z near μ." },
          { title: "Decode", text: "The decoder turns z into a reconstruction, here x̂ = [0.8, 0.2, 0.4, 0.6] for the input x = [0.9, 0.1, 0.4, 0.7]." },
          { title: "Score", text: "Reconstruction error = 0.01 + 0.01 + 0 + 0.01 = 0.03. KL = ½[(0.64 + 0.368 + 1 − 1) + (0.09 + 0.135 + 2 − 1)] ≈ 1.117. Total ≈ 1.147 with β = 1." },
          { title: "Update", text: "Backpropagate through the decoder, through z = μ + σε, into the encoder, and adjust all weights to lower the total." },
        ] },
        { type: "code", lang: "python", title: "vae_pieces.py", code: `import numpy as np
rng = np.random.default_rng(0)

# Pretend the encoder looked at one image and output these for a 2-d latent:
mu      = np.array([0.8, -0.3])    # centre of the cloud for this image
log_var = np.array([-1.0, -2.0])   # log of the variance (can be any real number)
sigma   = np.exp(0.5 * log_var)
print("mu =", mu, " sigma =", np.round(sigma, 3))

# Reparameterization trick: z = mu + sigma * eps, with eps ~ N(0, I)
eps = rng.normal(size=(3, 2))
z = mu + sigma * eps
print("three sampled z:\\n", np.round(z, 3))

# KL divergence between N(mu, sigma^2) and the prior N(0, 1), closed form
def kl(mu, log_var):
    return 0.5 * np.sum(mu**2 + np.exp(log_var) - log_var - 1)
print("KL to prior          =", round(kl(mu, log_var), 3))
print("KL if mu=0, sigma=1  =", round(kl(np.zeros(2), np.zeros(2)), 3))

# Why the trick matters: the gradient flows through z = mu + sigma*eps.
# Check: estimate d/dmu E[z1^2] by averaging 2*z1 * dz1/dmu1 (=1) over samples
eps = rng.normal(size=100_000)
z1 = mu[0] + sigma[0] * eps
print("reparam gradient estimate:", round(np.mean(2 * z1), 3),
      "| exact 2*mu1 =", 2 * mu[0])

# Full loss for one example = reconstruction error + beta * KL
x     = np.array([0.9, 0.1, 0.4, 0.7])       # the input (4 pixels)
x_hat = np.array([0.8, 0.2, 0.4, 0.6])       # decoder output from a sampled z
recon = np.sum((x - x_hat) ** 2)
for beta in (1.0, 4.0):
    print(f"beta={beta}: recon={recon:.3f} + KL term={beta * kl(mu, log_var):.3f}"
          f" = loss {recon + beta * kl(mu, log_var):.3f}")`, output: `mu = [ 0.8 -0.3]  sigma = [0.607 0.368]
three sampled z:
 [[ 0.876 -0.349]
 [ 1.188 -0.261]
 [ 0.475 -0.167]]
KL to prior          = 1.117
KL if mu=0, sigma=1  = 0.0
reparam gradient estimate: 1.599 | exact 2*mu1 = 1.6
beta=1.0: recon=0.030 + KL term=1.117 = loss 1.147
beta=4.0: recon=0.030 + KL term=4.466 = loss 4.496`,
          walkthrough: [
            { lines: [4, 8], note: "The encoder's two outputs for one input. We convert log-variance to σ with exp(0.5 · log σ²), which is always positive." },
            { lines: [10, 13], note: "The reparameterization trick: three different z samples, all scattered around μ with spread σ." },
            { lines: [15, 19], note: "The closed-form KL to N(0, I). It is 1.117 for our cloud and exactly 0 when μ = 0 and σ = 1." },
            { lines: [21, 26], note: "A check that gradients through z = μ + σε are correct: the average of 2·z over many samples estimates ∂E[z²]/∂μ, and it matches the exact value 2μ = 1.6." },
            { lines: [28, 34], note: "The full loss: reconstruction plus β times KL. With β = 4 (a β-VAE) the KL term dominates, pushing the model to organise its latents more strongly at the expense of reconstruction detail." },
          ] },
        { type: "p", text: "In a full implementation (for example in PyTorch), the encoder and decoder are neural networks, the batch loss is averaged over many images, and an optimiser like Adam updates both networks together. The three key lines are always the same: `z = mu + exp(0.5*log_var) * randn_like(mu)`, the KL formula above, and `loss = recon + beta * kl`." },
      ],
    },
    {
      id: "advantages",
      title: "Advantages of Variational Autoencoders",
      blocks: [
        { type: "list", items: [
          "**Stable, simple training.** One network pair and one loss; no adversarial game as in GANs.",
          "**A smooth, structured latent space.** Interpolations look sensible, and directions in latent space can correspond to meaningful attributes.",
          "**Fast generation.** One decoder pass per sample, unlike the many steps of diffusion.",
          "**An encoder for free.** Unlike a GAN, a VAE can map a real image into the latent space, which enables editing, search and anomaly detection.",
          "**A principled probabilistic model.** The ELBO gives a lower bound on the data likelihood, useful for comparing models and for anomaly scores.",
        ] },
        { type: "callout", tone: "warn", title: "Limits and common mistakes", text: "Samples from a plain VAE are often blurry, partly because a squared-error loss rewards averaging over plausible details. If the decoder is very powerful, the model may ignore z altogether ('posterior collapse': KL drops to 0 and all clouds equal the prior); KL warm-up or annealing helps. Forgetting the KL term turns the model back into a plain autoencoder; setting β too high gives blurry, generic outputs. And for top-quality open-ended image generation, diffusion models usually win." },
      ],
    },
    {
      id: "where-used",
      title: "Where Variational Autoencoders are used",
      blocks: [
        { type: "table", caption: "Common uses", head: ["Use", "How the VAE helps"], rows: [
          ["Latent diffusion (e.g. Stable Diffusion)", "A VAE-style autoencoder compresses images to a small latent grid; diffusion runs there, and the decoder turns the result back into pixels"],
          ["Anomaly detection", "Inputs that reconstruct badly or have low ELBO are flagged (damaged products, faulty sensor readings, fraud)"],
          ["Data generation and augmentation", "Sample new examples, especially for tabular, time-series or molecular data"],
          ["Drug and molecule design", "Search a smooth latent space of molecules for ones with desired properties"],
          ["Representation learning", "Compact, smooth features for clustering and downstream models"],
          ["Discrete tokenizers (VQ-VAE family)", "Vector-quantised autoencoders turn images or audio into discrete tokens that transformers can model"],
        ] },
        { type: "callout", tone: "example", title: "Back to the shop", text: "We could train a VAE on photos of *intact* products only. At inspection time, a photo of a cracked jar reconstructs poorly and gets a high loss, so it is flagged for a human — without ever collecting labelled examples of every kind of damage." },
      ],
    },
  ],
  quiz: [
    { q: "What is the key difference between a VAE encoder and a plain autoencoder encoder?", options: ["It outputs a mean and a spread instead of one point", "It has no bottleneck, so the code is as large as the input", "It outputs class labels instead of a latent code", "It is frozen and never updated during training"], answer: 0, explain: "A VAE maps each input to a Gaussian N(μ, σ²) and samples z from it. Both models have a bottleneck and both encoders are trained." },
    { q: "With μ = 1.0, σ = 0.5 and noise ε = 0.4, what z does the reparameterization trick produce?", options: ["0.6", "1.4", "1.2", "0.9"], answer: 2, explain: "z = μ + σ·ε = 1.0 + 0.5 × 0.4 = 1.0 + 0.2 = 1.2." },
    { q: "Why do VAEs use the reparameterization trick?", options: ["To make the latent space discrete so it can be stored as tokens", "To remove the need for a decoder network during training", "To force the KL term to exactly zero for every input", "So gradients can pass through sampling to reach μ and σ"], answer: 3, explain: "Sampling directly from N(μ, σ²) has no derivative with respect to μ and σ. Writing z = μ + σε moves the randomness into ε, so backpropagation can reach the encoder." },
    { q: "We train a VAE on kettle photos and notice the KL term has dropped to almost 0 and the decoder ignores z: every sample looks the same. What is this, and what is a common fix?", options: ["Mode collapse; add a discriminator to the decoder output", "Posterior collapse; warm up the KL weight gradually", "Overfitting; remove the reconstruction loss entirely", "Vanishing gradients; delete the KL term from the loss"], answer: 1, explain: "When the encoder's clouds all equal the prior, KL is 0 and z carries no information: posterior collapse. KL warm-up (annealing) and weaker decoders are standard remedies. Removing the KL term would make it a plain autoencoder." },
    { q: "Compared with a plain autoencoder, which statement about VAEs is a misconception?", options: ["VAEs can generate new samples by decoding z ~ N(0, I)", "The KL term pulls each input's cloud toward N(0, I)", "VAEs always give sharper reconstructions than autoencoders", "VAE latent spaces are usually smooth enough to interpolate"], answer: 2, explain: "The opposite is typical: the KL regulariser and squared-error loss make VAE reconstructions and samples somewhat blurrier than a plain autoencoder's reconstructions. The other statements are true." },
  ],
  takeaways: [
    "An autoencoder compresses data to a latent code and reconstructs it, but its latent space has holes.",
    "A VAE encodes each input as a Gaussian cloud N(μ, σ²) and pulls all clouds toward N(0, I) with a KL penalty.",
    "The reparameterization trick, z = μ + σ ⊙ ε, lets gradients flow through the sampling step.",
    "Loss = reconstruction + β·KL; β trades reconstruction detail for a more organised latent space.",
    "VAEs give fast generation and an encoder; they power latent diffusion, anomaly detection and more.",
  ],
  terms: [
    { term: "Autoencoder", def: "A network that compresses input to a latent code and reconstructs it." },
    { term: "Latent space", def: "The space of codes z produced by the encoder and consumed by the decoder." },
    { term: "Prior", def: "The distribution we want latent codes to follow, usually the standard normal N(0, I)." },
    { term: "KL divergence", def: "A measure of how different one probability distribution is from another; zero when they are equal." },
    { term: "Reparameterization trick", def: "Writing z = μ + σ ⊙ ε with ε ~ N(0, I) so that sampling becomes differentiable." },
    { term: "ELBO", def: "Evidence Lower Bound: the training objective of a VAE, a lower bound on the log-likelihood." },
    { term: "Posterior collapse", def: "A failure where the decoder ignores z and the encoder's output equals the prior." },
  ],
};
