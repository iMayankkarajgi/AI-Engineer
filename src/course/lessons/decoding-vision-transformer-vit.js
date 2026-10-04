export default {
  id: "decoding-vision-transformer-vit",
  minutes: 25,
  hook: "Transformers were built to read sentences — so how can the very same architecture look at a photo and say 'that is a cracked blender jar'?",
  summary: "A Vision Transformer (ViT) treats an image like a sentence: it cuts the image into small square patches, turns each patch into a vector (a 'visual word'), adds a special [CLS] token and position information, and runs the sequence through a standard Transformer encoder. The final [CLS] vector summarises the whole image and a small head turns it into class scores. ViTs need more data than CNNs to learn well, but they scale very well and are now the default image encoder inside most multimodal models.",
  sections: [
    {
      id: "big-picture",
      title: "The big picture",
      blocks: [
        { type: "p", text: "In earlier lessons we saw the Transformer: a stack of self-attention and feed-forward layers that reads a *sequence of token vectors* and lets every token look at every other token. It took over language processing. In 2020, a Google team asked a simple question: what if we feed an image to an almost unchanged Transformer? Their paper, 'An Image is Worth 16x16 Words', introduced the **Vision Transformer (ViT)**." },
        { type: "p", text: "The trick is all in the input. A Transformer needs a sequence of vectors. An image is a grid of pixels. So ViT *turns the grid into a sequence*: chop the picture into small squares called **patches**, flatten each one, and project it to a vector. From there on, the model is the same encoder we already know." },
        { type: "callout", tone: "analogy", title: "Think of it like a jigsaw puzzle", text: "Imagine cutting a photo into 196 puzzle pieces and laying them in a row. Each piece alone shows only a tiny bit — a patch of white, an edge of glass. To recognise the picture, we must look at the pieces *together* and remember where each came from. Self-attention is how the pieces 'look at' each other, and position embeddings are the numbers on the back telling us where each piece belongs." },
        { type: "p", text: "We will decode ViT in six steps, using a concrete example: the standard **ViT-Base/16** model classifying a 224×224 photo from our appliance shop. 'Base' is the model size; '/16' means 16×16-pixel patches." },
        { type: "flow", title: "ViT at a glance", nodes: [
          { label: "Image 224×224×3", detail: "A colour photo: 224 rows × 224 columns × 3 colour channels = 150,528 numbers." },
          { label: "196 patches", detail: "Cut into a 14×14 grid of 16×16 patches. Each patch is flattened to 16·16·3 = 768 numbers." },
          { label: "Patch embedding", detail: "One shared linear layer maps every flattened patch to a D-dimensional vector (D = 768 for ViT-Base)." },
          { label: "+ [CLS] + positions", detail: "A learnable [CLS] vector is put at the front (197 tokens), and a learned position vector is added to each token." },
          { label: "Transformer encoder", detail: "12 layers of multi-head self-attention and MLP blocks, with LayerNorm and residual connections." },
          { label: "Head", detail: "The final [CLS] vector goes through a small classification head to produce one score per class." },
        ] },
      ],
    },
    {
      id: "step-1-patches",
      title: "Decoding step 1: splitting the image into patches",
      blocks: [
        { type: "p", text: "Why not just treat each *pixel* as a token? Because self-attention compares every token with every other token, so its cost grows with the **square** of the sequence length. A 224×224 image has 50,176 pixels; attention over all of them would mean about 2.5 billion pairs per head per layer. That is far too expensive." },
        { type: "p", text: "Patches fix this. With patch size P = 16, the image becomes (224/16) × (224/16) = 14 × 14 = **196 patches**. Each patch is a small 16×16×3 block that we **flatten** (lay out as one long list) into 16 × 16 × 3 = **768 numbers**. The patches do not overlap, and we read them in row order, left to right, top to bottom, like words on a page." },
        { type: "formula", expr: "N = (H / P) × (W / P)        patch length = P · P · C", where: [["H, W", "image height and width in pixels (224, 224)"], ["P", "patch size in pixels (16)"], ["C", "colour channels (3 for RGB)"], ["N", "number of patches = sequence length before [CLS] (196)"]] },
        { type: "chart", kind: "bar", title: "Patch size vs number of tokens (224×224 image)", xLabel: "Patch size", yLabel: "Patches", labels: ["32×32", "16×16", "14×14", "8×8"], series: [{ name: "Patches", values: [49, 196, 256, 784] }], caption: "Exact counts from N = (224/P)². Halving the patch size gives 4× more tokens and roughly 16× more attention pairs: more detail, much more compute." },
        { type: "check", question: "A ViT uses 14×14 patches on a 224×224 image. How many patches, and how many numbers per flattened RGB patch?", answer: "224/14 = 16, so 16 × 16 = 256 patches. Each patch holds 14 × 14 × 3 = 588 numbers." },
      ],
    },
    {
      id: "step-2-patch-embedding",
      title: "Decoding step 2: patch embedding",
      blocks: [
        { type: "p", text: "A flattened patch is just raw pixel values. We need it to be a vector of the model's width **D** (the hidden size, 768 in ViT-Base) so the Transformer can work with it. ViT multiplies every flattened patch by the **same** learned matrix E of size 768 × D, plus a bias. The result is called a **patch embedding** — the visual equivalent of a word embedding." },
        { type: "formula", expr: "zᵢ = xᵢ · E + b        (xᵢ: 1 × P²C,   E: P²C × D,   zᵢ: 1 × D)", caption: "The same E and b are shared by all patches, exactly like one word-embedding table is shared by all words." },
        { type: "p", text: "Sharing the matrix matters: a vertical edge looks the same whether it appears in the top-left or bottom-right corner, so the same weights should detect it everywhere. During training, the rows of E learn to respond to useful local patterns such as edges, colour blobs and textures." },
        { type: "callout", tone: "tip", title: "In real code it is a convolution", text: "Implementations usually write the 'split + flatten + linear' steps as a single convolution with kernel size 16 and stride 16. Because the kernel and stride are equal, each output position sees exactly one non-overlapping patch, which is mathematically the same as the linear projection." },
      ],
    },
    {
      id: "step-3-cls",
      title: "Decoding step 3: the [CLS] token",
      blocks: [
        { type: "p", text: "After step 2 we have 196 vectors, one per patch. But to classify the image we want *one* vector that describes the whole picture. ViT borrows a trick from BERT: it puts an extra, **learnable** vector at the start of the sequence called the **[CLS] token** (short for 'classification'). The sequence is now 197 tokens long." },
        { type: "p", text: "The [CLS] token holds no pixels. It starts as the same learned vector for every image. As it passes through the encoder layers, self-attention lets it gather information from all 196 patches. By the last layer, its vector has become a summary of the image, and that is the only vector the classifier reads." },
        { type: "callout", tone: "note", title: "An alternative: average pooling", text: "Instead of a [CLS] token, we can average the 196 output patch vectors (global average pooling). The original paper reported both can work well with tuned settings, and many later vision models use pooling. Either way, the goal is one vector for the whole image." },
      ],
    },
    {
      id: "step-4-positions",
      title: "Decoding step 4: position embeddings",
      blocks: [
        { type: "p", text: "Self-attention has a blind spot: it treats its input as a *set*. If we shuffled the 196 patches, the attention math would give the same outputs, just shuffled. But in an image, location matters: sky usually sits above ground, and a crack 'at the base' must be at the bottom. So ViT adds a **position embedding** to every token: a learned vector, one per position (0 for [CLS], 1 to 196 for the patches)." },
        { type: "formula", expr: "z₀ = [x_cls ; x₁E ; x₂E ; … ; x₁₉₆E] + E_pos        (E_pos: 197 × D)" },
        { type: "p", text: "Interestingly, these are plain **1-D** positions (just 'patch number 37'), not row and column. The original paper tried 2-D-aware versions and found no significant gain: after training, the learned position vectors of patches in the same row or column became similar on their own. The model *discovered* the 2-D grid." },
        { type: "callout", tone: "warn", title: "Changing the image size", text: "The position table has a fixed number of rows. If we fine-tune at a higher resolution (say 384×384 → 576 patches), there are no learned vectors for the new positions. The standard fix is to arrange the old vectors on their 2-D grid and interpolate them to the new grid size." },
      ],
    },
    {
      id: "step-5-encoder",
      title: "Decoding step 5: the Transformer encoder",
      blocks: [
        { type: "p", text: "Now the 197 vectors enter a standard Transformer **encoder**: a stack of L identical layers (L = 12 in ViT-Base). Each layer has two sub-blocks, each wrapped in a residual connection and preceded by LayerNorm (the 'pre-norm' layout):" },
        { type: "steps", title: "Inside one encoder layer", items: [
          { title: "LayerNorm", text: "Normalise each token vector so its numbers have a stable scale. This keeps training of deep stacks stable." },
          { title: "Multi-head self-attention", text: "Every token makes a query, key and value. Each token's output is a weighted mix of all values, weighted by how well its query matches each key. There is **no causal mask**: a patch can look at patches before *and* after it. ViT-Base uses 12 heads, so it can track 12 kinds of relationships at once." },
          { title: "Add (residual)", text: "Add the attention output back to the input. The token keeps its own information and adds context from other patches." },
          { title: "LayerNorm + MLP", text: "A two-layer feed-forward network with a GELU activation, applied to each token independently (768 → 3072 → 768 in ViT-Base). This is where much of the per-token processing happens." },
          { title: "Add (residual) again", text: "Add the MLP output back. The result has the same shape, 197 × 768, and becomes the input of the next layer." },
        ] },
        { type: "matrix", title: "Where the [CLS] token looks (one head, last layer)", rows: ["row 1", "row 2", "row 3", "row 4"], cols: ["col 1", "col 2", "col 3", "col 4"], values: [[0.01, 0.02, 0.02, 0.01], [0.02, 0.12, 0.15, 0.03], [0.03, 0.18, 0.22, 0.04], [0.02, 0.06, 0.07, 0.02]], format: "pct", caption: "Illustrative attention from [CLS] to a 4×4 grid of patches of a blender photo. Trained ViTs often focus on the object and largely ignore the background, which is why attention maps are popular for visual explanations (though they are not a perfect explanation)." },
        { type: "p", text: "Because every patch can attend to every other patch from the very first layer, ViT has a **global receptive field** everywhere. A CNN, by contrast, only sees a small neighbourhood per layer and grows its view slowly with depth. Studies of trained ViTs found that some heads in early layers still attend locally — the model learns local processing when it is useful — while others look far across the image." },
      ],
    },
    {
      id: "step-6-head",
      title: "Decoding step 6: the classification head",
      blocks: [
        { type: "p", text: "After the last layer (and a final LayerNorm), we take only the output at position 0 — the [CLS] vector, 768 numbers — and feed it to a **classification head**. In pre-training the paper used a small MLP with one hidden layer; for fine-tuning on a new task, it is usually a single linear layer of size 768 × K, where K is the number of classes. A softmax turns the K scores into probabilities." },
        { type: "formula", expr: "y = softmax(LN(z_L⁰) · W_head + b)", where: [["z_L⁰", "the [CLS] output of the last layer L"], ["LN", "LayerNorm"], ["W_head", "D × K matrix, one column per class"]] },
        { type: "p", text: "For our shop, K might be 5: 'intact jar', 'cracked jar', 'broken blade', 'burnt motor', 'other'. We would take a ViT pre-trained on a large dataset, replace its head with a new 768 × 5 layer, and fine-tune on a few thousand labelled support photos." },
      ],
    },
    {
      id: "putting-it-together",
      title: "Putting it all together (with code)",
      blocks: [
        { type: "p", text: "Here is the whole pipeline on a tiny 8×8 image with 4×4 patches, a width of 16 and a single attention head, written in plain numpy so every step is visible. The weights are random (untrained), so the attention and the class probabilities are close to uniform — what matters is the flow of shapes." },
        { type: "code", lang: "python", title: "tiny_vit.py", code: `import numpy as np
rng = np.random.default_rng(0)

H = W = 8; C = 3; P = 4; D = 16           # tiny image, 4x4 patches, width 16
img = rng.random((H, W, C))                # an 8x8 RGB image

# Step 1: cut into non-overlapping P x P patches and flatten each one
patches = img.reshape(H // P, P, W // P, P, C).transpose(0, 2, 1, 3, 4)
patches = patches.reshape(-1, P * P * C)   # (N, P*P*C)
N = patches.shape[0]
print("patches:", patches.shape)           # 4 patches of 48 numbers

# Step 2: one shared linear layer turns each patch into a D-dim token
W_patch = rng.normal(scale=0.1, size=(P * P * C, D))
tokens = patches @ W_patch                  # (N, D)

# Steps 3-4: prepend a learnable [CLS] token, add position embeddings
cls = rng.normal(scale=0.1, size=(1, D))
pos = rng.normal(scale=0.1, size=(N + 1, D))
x = np.vstack([cls, tokens]) + pos          # (N+1, D)
print("sequence into encoder:", x.shape)

# Step 5: one self-attention head (no mask: every patch sees every patch)
Wq, Wk, Wv = (rng.normal(scale=0.3, size=(D, D)) for _ in range(3))
q, k, v = x @ Wq, x @ Wk, x @ Wv
s = q @ k.T / np.sqrt(D)
a = np.exp(s - s.max(1, keepdims=True)); a /= a.sum(1, keepdims=True)
x = x + a @ v                                # residual connection
print("CLS attends to [CLS, p1..p4]:", np.round(a[0], 2))

# Step 6: classification head reads ONLY the CLS output
W_head = rng.normal(scale=0.1, size=(D, 3))  # 3 classes
logits = x[0] @ W_head
probs = np.exp(logits) / np.exp(logits).sum()
print("class probabilities:", np.round(probs, 3))

# Real ViT-Base sizes: 224x224 image, 16x16 patches
n = (224 // 16) ** 2
print("ViT-B/16 patches:", n, "-> sequence length", n + 1,
      "| values per patch:", 16 * 16 * 3)`, output: `patches: (4, 48)
sequence into encoder: (5, 16)
CLS attends to [CLS, p1..p4]: [0.2  0.2  0.19 0.2  0.21]
class probabilities: [0.332 0.347 0.321]
ViT-B/16 patches: 196 -> sequence length 197 | values per patch: 768`,
          walkthrough: [
            { lines: [4, 5], note: "Our image: 8×8 pixels, 3 channels. Patch size 4 gives a 2×2 grid of patches; model width D = 16." },
            { lines: [7, 11], note: "Step 1. The reshape + transpose groups pixels so each patch's 4×4×3 values are contiguous, then flattens each patch to 48 numbers. Result: 4 patches × 48 values." },
            { lines: [13, 15], note: "Step 2. One shared matrix projects every 48-number patch to a 16-number token." },
            { lines: [17, 21], note: "Steps 3 and 4. A [CLS] vector goes in front, then a position vector is added to each of the 5 tokens. In a real model cls and pos are trained parameters." },
            { lines: [23, 29], note: "Step 5. One self-attention head without a mask, plus a residual connection. Row 0 of the attention matrix shows how much [CLS] reads from itself and each patch." },
            { lines: [31, 35], note: "Step 6. Only x[0] — the [CLS] output — goes into the head. Softmax gives class probabilities (near 1/3 each because nothing is trained)." },
            { lines: [37, 40], note: "The same arithmetic at real scale: ViT-B/16 on 224×224 has 196 patches, a 197-token sequence, and 768 numbers per patch." },
          ] },
        { type: "table", caption: "Standard ViT sizes from the original paper", head: ["Model", "Layers", "Hidden size D", "MLP size", "Heads", "Parameters"], rows: [
          ["ViT-Base", "12", "768", "3072", "12", "≈ 86M"],
          ["ViT-Large", "24", "1024", "4096", "16", "≈ 307M"],
          ["ViT-Huge", "32", "1280", "5120", "16", "≈ 632M"],
        ] },
      ],
    },
    {
      id: "vit-vs-cnn",
      title: "ViT vs CNN",
      blocks: [
        { type: "p", text: "Before ViT, image models were **convolutional neural networks (CNNs)** such as ResNet. A CNN slides small filters (say 3×3) across the image, so each layer only combines nearby pixels. This bakes in two assumptions, called **inductive biases**: *locality* (nearby pixels are related) and *translation equivariance* (a cat shifted right should produce shifted features). These are good assumptions for images, so CNNs learn well from modest data." },
        { type: "p", text: "ViT drops most of these assumptions. It must *learn* from data that nearby patches matter. The original paper found that trained on ImageNet alone (about 1.3M images), ViT did worse than comparable ResNets; pre-trained on much larger datasets (14M to 300M images), it matched or beat them while using less compute to pre-train. Later work such as DeiT showed that strong data augmentation, regularisation and distillation let ViTs train well on ImageNet alone." },
        { type: "compare", title: "ViT vs CNN",
          options: [
            { name: "Vision Transformer", summary: "Image as a sequence of patches; global self-attention from layer 1.", pros: ["Global context in every layer", "Scales very well with data and model size", "Same architecture as language models, so it plugs neatly into multimodal systems"], cons: ["Needs lots of data or heavy augmentation", "Attention cost grows with the square of the patch count", "Fixed patch grid; dense tasks need extra design"], bestFor: "Large-scale pre-training, image encoders for multimodal LLMs, CLIP-style models" },
            { name: "CNN (e.g. ResNet)", summary: "Small sliding filters build features from local to global.", pros: ["Strong built-in biases: learns well from small data", "Cost grows linearly with image size", "Very efficient on edge devices"], cons: ["Global context only in deep layers", "Gains from scale tend to level off sooner"], bestFor: "Small datasets, mobile/real-time vision, high-resolution dense prediction" },
          ],
          rows: [
            ["Basic unit", "16×16 patch token", "3×3 (or similar) filter"],
            ["Receptive field in layer 1", "Whole image", "A few pixels"],
            ["Built-in assumptions", "Few (learns them)", "Locality, translation equivariance"],
            ["Data hunger", "High", "Lower"],
          ],
          verdict: "With small data or tight compute, a CNN (or a hybrid) is a safe choice. With large pre-training data — or when the vision features must feed a language model — ViT-style encoders are the modern default. Hybrids such as Swin (windowed attention) and ConvNeXt (a modernised CNN) blur the line." },
        { type: "check", question: "We have only 2,000 labelled support photos. Should we train a ViT from scratch?", answer: "No. With so little data a ViT from scratch will likely underperform because it lacks the CNN's built-in assumptions. Instead, fine-tune a ViT (or CNN) that was pre-trained on a large dataset — that brings the learned visual knowledge with it." },
        { type: "callout", tone: "example", title: "Where ViTs are used today", text: "ViT-style encoders are the image backbone in CLIP and in most vision-language chat models, which feed the patch vectors (after a projection) into an LLM. They are also used in image classification, as the encoder in segmentation and detection systems, in medical imaging research, and as the 'eyes' of robotics models." },
      ],
    },
    {
      id: "worked-parameter-count",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "A good way to check that we understand ViT is to count its parameters by hand and see whether we land near the ≈ 86M listed for ViT-Base. We only need the sizes already given: P = 16, C = 3, D = 768, MLP size 3,072, 12 layers, 197 tokens." },
        { type: "steps", title: "Counting ViT-Base", items: [
          { title: "Patch embedding", text: "E maps 768 flattened pixel values to D = 768, plus a bias: 768 × 768 + 768 = **590,592** parameters. It is shared by all 196 patches." },
          { title: "[CLS] and positions", text: "[CLS] is one vector: 768. The position table has 197 rows: 197 × 768 = **151,296**. The whole input stage is 590,592 + 768 + 151,296 = 742,656." },
          { title: "Attention in one layer", text: "Query, key, value and output projections are each 768 × 768 + 768 = 590,592. Four of them: **2,362,368**. The 12 heads split these matrices; they do not add parameters." },
          { title: "MLP in one layer", text: "768 → 3,072 costs 768 × 3,072 + 3,072 = 2,362,368. 3,072 → 768 costs 3,072 × 768 + 768 = 2,360,064. Together: **4,722,432**." },
          { title: "One whole layer", text: "Add two LayerNorms (2 × 768 numbers each = 3,072): 2,362,368 + 4,722,432 + 3,072 = **7,087,872**." },
          { title: "Twelve layers plus the input stage", text: "12 × 7,087,872 = 85,054,464. Add the input stage and the final LayerNorm (1,536): about **85.8M** before the classification head. That matches the ≈ 86M in the table." },
        ] },
        { type: "table", caption: "Where ViT-Base's parameters live (computed above)", head: ["Part", "Parameters", "Share"], rows: [
          ["Patch embedding + [CLS] + positions", "742,656", "under 1%"],
          ["12 × attention", "28,348,416", "about 33%"],
          ["12 × MLP", "56,669,184", "about 66%"],
          ["LayerNorms", "38,400", "tiny"],
        ] },
        { type: "p", text: "Two things stand out. The part that is special to images, the input stage, is under 1% of the model; everything else is an ordinary Transformer encoder. And the MLP blocks hold about twice as many parameters as attention. Notice also what does **not** depend on image size: only the position table does. That is why fine-tuning at a higher resolution needs no new weights except interpolated positions, yet still costs far more compute, because the number of token pairs grows." },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will cut a tiny numbered image into patches so we can see exactly which pixels land in which patch. Then we test the 'blind spot' from step 4: we shuffle the patches and check whether a one-head model notices, with and without position embeddings." },
        { type: "code", lang: "python", title: "practice_patch_shuffle.py", code: `import numpy as np
rng = np.random.default_rng(3)

# A 4x4 one-channel "image" whose pixels are numbered 0..15, patch size 2.
img = np.arange(16).reshape(4, 4)
P = 2
patches = img.reshape(2, P, 2, P).transpose(0, 2, 1, 3).reshape(-1, P * P)
for i, p in enumerate(patches):
    print(f"patch {i}: pixels {p}")

D = 8
E = rng.normal(scale=0.5, size=(P * P, D))       # shared patch embedding
pos = rng.normal(scale=0.5, size=(4, D))         # one vector per position
Wq, Wk, Wv = (rng.normal(scale=0.3, size=(D, D)) for _ in range(3))

def image_vector(patch_rows, use_pos):
    """Embed patches, run one attention head, average into one vector."""
    x = (patch_rows / 15.0) @ E                  # scale pixels to 0..1
    if use_pos:
        x = x + pos                              # slot i always gets pos[i]
    s = (x @ Wq) @ (x @ Wk).T / np.sqrt(D)
    a = np.exp(s - s.max(1, keepdims=True)); a /= a.sum(1, keepdims=True)
    return (x + a @ x @ Wv).mean(axis=0)         # mean-pool the tokens

order = [3, 1, 0, 2]                             # scramble the patch order
shuffled = patches[order]
for use_pos in (False, True):
    a = image_vector(patches, use_pos)
    b = image_vector(shuffled, use_pos)
    label = "with positions   " if use_pos else "without positions"
    print(f"{label}: largest change after shuffling = {np.abs(a - b).max():.3f}")

for size in (224, 384):
    n = (size // 16) ** 2 + 1
    print(f"{size}x{size} image -> {n} tokens -> {n * n:,} attention pairs")`, output: `patch 0: pixels [0 1 4 5]
patch 1: pixels [2 3 6 7]
patch 2: pixels [ 8  9 12 13]
patch 3: pixels [10 11 14 15]
without positions: largest change after shuffling = 0.000
with positions   : largest change after shuffling = 0.042
224x224 image -> 197 tokens -> 38,809 attention pairs
384x384 image -> 577 tokens -> 332,929 attention pairs`,
          walkthrough: [
            { lines: [5, 9], note: "Pixels are numbered 0 to 15 in reading order. The reshape and transpose group them into four 2×2 patches. Patch 0 holds pixels 0, 1, 4, 5: the top-left corner." },
            { lines: [16, 23], note: "A mini ViT: embed each patch, optionally add the position vector of its slot, run one unmasked attention head with a residual, then average the tokens into one image vector." },
            { lines: [25, 31], note: "We reorder the patches and compare image vectors. Without positions the change is exactly 0: the model cannot tell the scrambled image from the original. With positions the vector changes." },
            { lines: [33, 35], note: "Token and pair counts for two real input sizes. 384×384 has about 3× the tokens of 224×224 but about 8.6× the attention pairs." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Change `order` to `[0, 1, 2, 3]`. Predict both printed changes before running.",
          "Multiply `pos` by 4 (use `scale=2.0`). Predict whether the 'with positions' change gets larger or smaller, and whether the 'without positions' line moves at all.",
          "In the last loop, use `size // 8` instead of `size // 16`. Predict the token count for 224×224 first, then how many times the pair count grows.",
        ] },
        { type: "check", question: "The code pools by averaging all tokens. If we read a [CLS] token instead, and still used no position embeddings, would shuffling the patches change the [CLS] output?", answer: "No. [CLS] gathers information through attention, and attention treats the patches as a set: each patch contributes the same value with the same weight wherever it sits in the sequence. The readout method does not fix the blind spot; only position information does." },
        { type: "check", question: "We switch ViT-Base from 16×16 to 8×8 patches on 224×224 images. Does the model get many more parameters? What does change?", answer: "Hardly. The patch embedding actually shrinks (8·8·3 = 192 inputs instead of 768), and the position table grows from 197 to 785 rows, which is small. The encoder layers are untouched. What explodes is compute and memory: 785 tokens means about 16× more attention pairs per layer." },
      ],
    },
    {
      id: "quick-summary",
      title: "Quick summary",
      blocks: [
        { type: "list", ordered: true, items: [
          "Split the image into non-overlapping P×P patches: N = (H/P)·(W/P), each flattened to P²·C numbers.",
          "Project each patch with one shared linear layer to a D-dimensional patch embedding.",
          "Prepend a learnable [CLS] token.",
          "Add learned position embeddings so the model knows where each patch came from.",
          "Run a standard Transformer encoder (no causal mask) over the sequence.",
          "Feed the final [CLS] vector to a classification head.",
        ] },
        { type: "callout", tone: "warn", title: "Common mistakes", text: "Forgetting that attention cost grows quadratically with the number of patches (small patches on big images get expensive fast); training a ViT from scratch on a small dataset; feeding images at a different resolution without interpolating the position embeddings; and assuming attention maps are a faithful explanation of the decision." },
      ],
    },
  ],
  quiz: [
    { q: "Why does ViT split an image into patches instead of using individual pixels as tokens?", options: ["Pixels cannot be represented as vectors inside a neural network", "Attention cost grows with the square of the token count, so 50,176 pixel tokens is too costly", "Transformers can only ever accept exactly 196 input tokens per sequence", "Patches remove the need for any position information in the model"], answer: 1, explain: "Self-attention compares every pair of tokens, so cost scales with N². Patching shrinks a 224×224 image from 50,176 pixels to 196 tokens. Transformers have no fixed 196 limit, and patches still need position embeddings." },
    { q: "A ViT uses 16×16 patches on a 384×384 RGB image. How many tokens does the encoder see, including [CLS]?", options: ["577", "576", "197", "1,025"], answer: 0, explain: "384/16 = 24, so 24 × 24 = 576 patches, plus 1 [CLS] token = 577. 197 is the count for 224×224 images." },
    { q: "What is the role of the [CLS] token?", options: ["It stores the raw pixels of the most important patch in the image", "It marks the end of the patch sequence so attention knows where to stop", "A learned token that gathers a whole-image summary via attention", "It replaces the position embeddings for the first row of patches"], answer: 2, explain: "[CLS] holds no pixels. It starts as a learned vector and, through self-attention across the layers, collects a summary of the image that the classification head reads." },
    { q: "Our team has 2,000 labelled appliance photos and wants a damage classifier. What is the main risk of training a ViT from scratch instead of a CNN?", options: ["A ViT cannot output more than two classes at its classification head", "Few built-in image assumptions, so it needs far more data to learn well", "A ViT cannot process colour images, only single-channel grayscale ones", "A ViT is always slower at inference than every possible CNN design"], answer: 1, explain: "ViT must learn locality and other image regularities from data, so on small datasets it tends to lose to CNNs. The usual fix is to fine-tune a ViT pre-trained on a large dataset." },
    { q: "Which statement about ViT position embeddings is a misconception?", options: ["Without them, shuffling the patches would just shuffle the outputs", "Learned 1-D positions worked about as well as 2-D ones in the paper", "They must be interpolated when fine-tuning at a higher resolution", "They are unnecessary because attention already knows patch order"], answer: 3, explain: "Self-attention is order-blind: it treats the input as a set. Position embeddings are what tell the model where each patch came from. The other statements are true." },
  ],
  takeaways: [
    "ViT turns an image into a sequence of patch tokens and processes it with a standard Transformer encoder.",
    "Sequence length is (H/P)·(W/P) + 1; smaller patches mean more detail but quadratically more attention cost.",
    "A learnable [CLS] token gathers a whole-image summary; position embeddings restore where each patch was.",
    "ViT has weaker built-in image assumptions than a CNN, so it needs more data, but it scales very well.",
    "ViT-style encoders are the standard 'eyes' of modern multimodal models.",
  ],
  terms: [
    { term: "Patch", def: "A small non-overlapping square of the image (e.g. 16×16 pixels) that becomes one token." },
    { term: "Patch embedding", def: "The vector produced by projecting a flattened patch with a shared learned matrix." },
    { term: "[CLS] token", def: "An extra learnable token placed first in the sequence whose final output summarises the image." },
    { term: "Position embedding", def: "A learned vector added to each token so the model knows which position it came from." },
    { term: "Inductive bias", def: "An assumption built into a model's design, such as locality in CNNs." },
    { term: "Receptive field", def: "The region of the input that can influence a given feature." },
  ],
};
