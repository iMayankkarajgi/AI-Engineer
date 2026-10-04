export default {
  id: "how-do-image-embeddings-work",
  minutes: 18,
  hook: "Two photos of the same red mug can differ in almost every pixel — so how does a computer still know they show the same thing?",
  summary: "An image embedding is a short list of numbers (a vector) that captures what an image shows, produced by a trained neural network called an encoder. Similar-looking or similar-meaning images get vectors that point in similar directions, so we can compare images with simple math such as cosine similarity. Embeddings power image search, duplicate detection, recommendations, clustering and text-to-image search.",
  sections: [
    {
      id: "what-is-an-embedding",
      title: "What is an embedding?",
      blocks: [
        { type: "p", text: "An **embedding** is a way to represent a thing — a word, a sentence, a product, an image — as a **vector**: an ordered list of numbers such as `[0.12, -0.80, 0.33, ...]`. The list has a fixed length called the **dimension** (often 256 to 1,024 numbers for images in practice). The key property is that *things with similar meaning get vectors that are close together*, and unrelated things get vectors that are far apart." },
        { type: "p", text: "We met text embeddings earlier in the course: 'refund' and 'money back' land near each other. The idea is the same for images. Each image becomes a point in a high-dimensional space, and 'how similar are these two images?' becomes 'how close are these two points?'" },
        { type: "callout", tone: "analogy", title: "Think of it like a library's map", text: "Imagine a giant library where a clever librarian places every photo on a map so that similar photos sit near each other: all beaches in one corner, all mugs in another, red mugs slightly apart from blue mugs. An embedding is a photo's *coordinates* on that map. The map just happens to have hundreds of directions instead of two." },
      ],
    },
    {
      id: "what-is-an-image-embedding",
      title: "What is an image embedding?",
      blocks: [
        { type: "p", text: "An **image embedding** is a fixed-length vector produced by feeding an image through a trained neural network (an **image encoder**) and reading out one of its internal representations. Our running example is the photo archive of an appliance shop's support team: 80,000 photos of products customers have sent in. Each photo, whatever its size, becomes a vector of, say, 512 numbers." },
        { type: "p", text: "Individual numbers in an embedding usually have no human-readable meaning — there is no 'redness' slot. Meaning lives in the *pattern* across all the numbers and in the *relations* between vectors. What matters is that two photos of cracked blender jars produce vectors that are close, and a photo of a toaster produces a vector further away." },
        { type: "check", question: "One customer photo is 4000×3000 pixels and another is 640×480. Do their embeddings have different lengths?", answer: "No. The encoder resizes or crops each image to its expected input size, and the output embedding always has the same dimension (for example 512). That fixed length is what makes comparing any two images easy." },
      ],
    },
    {
      id: "why-we-need-them",
      title: "Why do we need image embeddings?",
      blocks: [
        { type: "p", text: "Our support team wants to ask questions like 'have we seen this kind of damage before?' or 'find all tickets showing this model of kettle'. To answer, the computer must compare images. The naive way is to compare raw pixels, and that fails badly:" },
        { type: "list", items: [
          "**Pixels are fragile.** Move the camera one centimetre, change the lighting, or zoom slightly, and almost every pixel value changes — even though the photo shows the same mug.",
          "**Pixels are huge.** A 1024×1024 colour photo is over 3 million numbers. Comparing millions of such photos number by number is slow and storage-hungry.",
          "**Pixels carry no meaning.** Two very different objects in the same colours can be closer, pixel-wise, than two photos of the same object on different backgrounds.",
        ] },
        { type: "p", text: "Embeddings fix all three: they are compact (hundreds of numbers instead of millions), and a good encoder is trained so that the vector stays nearly the same when irrelevant details change (position, lighting, background) but changes when the *content* changes. Once images are vectors, we can reuse all the vector tools from the RAG lessons: nearest-neighbour search, vector databases, clustering." },
      ],
    },
    {
      id: "how-a-computer-sees",
      title: "How does a computer see an image?",
      blocks: [
        { type: "p", text: "To a computer, a colour image is a 3-D array of numbers: **height × width × 3 channels** (red, green, blue). Each value is a brightness, typically an integer from 0 to 255, usually rescaled to 0–1 before entering a network. A tiny 2×2 image might look like this:" },
        { type: "table", caption: "A 2×2 colour image as numbers (R, G, B per pixel, 0–255)", head: ["", "Column 1", "Column 2"], rows: [
          ["Row 1", "(255, 0, 0) — pure red", "(250, 10, 5) — red"],
          ["Row 2", "(0, 0, 255) — pure blue", "(255, 255, 255) — white"],
        ] },
        { type: "p", text: "That is all the encoder gets: a grid of brightness numbers. Concepts like 'mug', 'crack' or 'kitchen' do not exist in the input. A neural network has to build them up layer by layer: early layers respond to edges and colour changes, middle layers to textures and simple shapes (a curve, a handle), and deep layers to whole objects and scenes. The embedding is read from the deep end, where the representation is about *what* is in the picture, not *which pixels* are bright." },
      ],
    },
    {
      id: "how-they-are-created",
      title: "How are image embeddings created?",
      blocks: [
        { type: "steps", title: "From photo to vector", items: [
          { title: "Pre-process", text: "Resize (and usually centre-crop) the image to the encoder's input size, for example 224×224, and normalise the pixel values the same way as during training." },
          { title: "Run the encoder", text: "Pass the image through a trained network. Common choices: a CNN such as ResNet, or a Vision Transformer (ViT) that splits the image into patches and processes them with self-attention." },
          { title: "Take a summary vector", text: "Read out one vector for the whole image: the ViT's [CLS] output, or the average of the last feature map (global average pooling) for a CNN. We drop any final classification layer — we want the features, not class labels." },
          { title: "Project (optional)", text: "Some models add a learned linear layer that maps the features into a specific space, such as the joint image-text space of CLIP." },
          { title: "Normalise", text: "Divide the vector by its length so it has length 1 (L2 normalisation). Then cosine similarity is just a dot product, which vector databases compute very fast." },
        ] },
        { type: "p", text: "The quality of the embedding depends entirely on **how the encoder was trained**. There are three main recipes:" },
        { type: "compare", title: "Three ways to train an image encoder",
          options: [
            { name: "Supervised classifier", summary: "Train to predict labels (e.g. 1,000 ImageNet classes), then use the layer before the classifier.", pros: ["Simple, well understood", "Strong features for the labelled categories"], cons: ["Needs many labelled images", "Features focus on the training classes; can miss other details"], bestFor: "Domains with good labels" },
            { name: "Contrastive image-text (CLIP-style)", summary: "Train an image encoder and a text encoder so matching image-caption pairs score high and mismatched pairs score low.", pros: ["Learns from web image-caption pairs, no manual labels", "Images and text share one space: search photos with words"], cons: ["Needs huge datasets", "Inherits web biases; weaker at fine-grained details like counting or text"], bestFor: "Text-to-image search, zero-shot classification" },
            { name: "Self-supervised (image only)", summary: "Learn from images alone, e.g. two augmented crops of the same photo should get similar vectors (as in SimCLR or DINO-style methods).", pros: ["No labels or captions needed", "Often strong for visual similarity and dense details"], cons: ["No built-in link to text", "Training recipes are delicate"], bestFor: "Image-to-image similarity, domain-specific photos" },
          ],
          verdict: "For 'search photos with a sentence', use a CLIP-style model. For 'find visually similar photos' in a specialised domain, a self-supervised or fine-tuned encoder is often better. In practice, start with a strong pre-trained model and only fine-tune if evaluation shows it misses what matters." },
        { type: "viz", name: "contrastive", caption: "Step the training: the anchor image moves toward its positive (another view of the same object) and away from the negative. Contrastive training shapes the embedding space this way." },
      ],
    },
    {
      id: "numeric-walkthrough",
      title: "A simple numeric walkthrough",
      blocks: [
        { type: "p", text: "Real embeddings have hundreds of dimensions, but the math is identical with 4. Suppose our encoder produced these vectors for three support photos:" },
        { type: "table", caption: "Illustrative 4-d embeddings", head: ["Photo", "Embedding"], rows: [
          ["A: red mug, kitchen counter", "[0.90, 0.10, 0.30, 0.20]"],
          ["B: red mug, held in hand", "[0.80, 0.20, 0.35, 0.10]"],
          ["C: blue kettle", "[0.10, 0.90, 0.20, 0.70]"],
        ] },
        { type: "steps", title: "Cosine similarity of A and B by hand", items: [
          { title: "Dot product", text: "Multiply matching positions and add: 0.90·0.80 + 0.10·0.20 + 0.30·0.35 + 0.20·0.10 = 0.72 + 0.02 + 0.105 + 0.02 = **0.865**." },
          { title: "Length of A", text: "‖A‖ = √(0.81 + 0.01 + 0.09 + 0.04) = √0.95 ≈ **0.975**." },
          { title: "Length of B", text: "‖B‖ = √(0.64 + 0.04 + 0.1225 + 0.01) = √0.8125 ≈ **0.901**." },
          { title: "Divide", text: "cos(A, B) = 0.865 / (0.975 × 0.901) ≈ 0.865 / 0.879 ≈ **0.985**. Almost 1: very similar." },
          { title: "Compare with C", text: "A·C = 0.09 + 0.09 + 0.06 + 0.14 = 0.38, ‖C‖ ≈ 1.162, so cos(A, C) ≈ 0.38 / (0.975 × 1.162) ≈ **0.336**. Much less similar." },
        ] },
        { type: "matrix", title: "Cosine similarity between the three photos", rows: ["A red mug", "B red mug", "C blue kettle"], cols: ["A", "B", "C"], values: [[1, 0.985, 0.336], [0.985, 1, 0.382], [0.336, 0.382, 1]], format: "num", caption: "Computed from the illustrative vectors above. The two mugs form a tight pair; the kettle is far from both." },
      ],
    },
    {
      id: "measuring-similarity",
      title: "How do we measure similarity between two embeddings?",
      blocks: [
        { type: "formula", expr: "cos(a, b) = (a · b) / (‖a‖ ‖b‖)        dist(a, b) = ‖a − b‖₂ = √∑(aᵢ − bᵢ)²", where: [["a · b", "dot product: ∑ aᵢ bᵢ"], ["‖a‖", "length (L2 norm) of a: √∑ aᵢ²"]] },
        { type: "list", items: [
          "**Cosine similarity** measures the *angle* between vectors, ignoring length. It ranges from −1 (opposite) through 0 (unrelated) to 1 (same direction). It is the most common choice for embeddings.",
          "**Dot product** is cosine times both lengths. If all vectors are normalised to length 1, dot product *equals* cosine, which is why systems normalise first.",
          "**Euclidean (L2) distance** is the straight-line distance; smaller means more similar. For unit-length vectors it ranks results in exactly the same order as cosine, because ‖a − b‖² = 2 − 2·cos(a, b).",
        ] },
        { type: "viz", name: "vector-similarity", caption: "Drag the two vectors. Notice that cosine similarity only cares about the angle, while the dot product and Euclidean distance also change with length." },
        { type: "callout", tone: "warn", title: "Similarity scores are not probabilities", text: "A cosine of 0.8 does not mean '80% the same'. Typical score ranges differ between models: one model's 'very similar' may be 0.9, another's 0.3. Always pick thresholds by looking at real examples from *our* model and data." },
      ],
    },
    {
      id: "code-example",
      title: "A code example",
      blocks: [
        { type: "p", text: "A real encoder needs a deep-learning library and downloaded weights. To see the *principle* with only numpy, we write a tiny hand-made 'encoder' that summarises an image by its average colour, colour spread and edge strength. It is far weaker than a neural network, but it shows the two key ideas: an embedding is small and fixed-size, and it can ignore changes that should not matter (here, shifting the image)." },
        { type: "code", lang: "python", title: "tiny_image_embeddings.py", code: `import numpy as np
rng = np.random.default_rng(0)

def make(base_rgb, stripes=False):
    """A 6x6 RGB image: a base colour, small noise, optional dark stripes."""
    im = np.clip(np.array(base_rgb) + rng.normal(0, 0.05, (6, 6, 3)), 0, 1)
    if stripes:
        im[:, ::2] *= 0.3                     # darken every other column
    return im

imgs = {
    "beach":        make([0.9, 0.8, 0.5]),
    "ocean":        make([0.1, 0.3, 0.9]),
    "ocean_2":      make([0.15, 0.35, 0.85]),
    "zebra":        make([0.9, 0.9, 0.9], stripes=True),
}
# Same zebra, shifted one pixel to the right (np.roll wraps the edge)
imgs["zebra_moved"] = np.roll(imgs["zebra"], 1, axis=1)

def embed(im):
    """A hand-made 'encoder': mean colour + colour spread + edge strength."""
    mean = im.mean(axis=(0, 1))                       # 3 numbers
    spread = im.std(axis=(0, 1))                      # 3 numbers
    edges = np.abs(np.diff(im, axis=1)).mean(keepdims=True)  # 1 number
    return np.concatenate([mean, spread, edges[0, 0]])

def cos(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

names = list(imgs)
E = {n: embed(imgs[n]) for n in names}
print("raw pixels per image:", imgs["beach"].size, "| embedding size:", E["beach"].size)
print("ocean embedding:", np.round(E["ocean"], 2))

q = "zebra"
print(f"\\nquery = {q}")
print("  pixel cosine  zebra vs zebra_moved:", round(cos(imgs[q].ravel(), imgs['zebra_moved'].ravel()), 3))
print("  embed cosine  zebra vs zebra_moved:", round(cos(E[q], E['zebra_moved']), 3))

q = "ocean"
ranked = sorted((n for n in names if n != q), key=lambda n: -cos(E[q], E[n]))
print(f"\\nnearest neighbours of {q}:")
for n in ranked:
    print(f"  {n:12s} cosine = {cos(E[q], E[n]):.3f}")`, output: `raw pixels per image: 108 | embedding size: 7
ocean embedding: [0.1  0.3  0.9  0.05 0.05 0.05 0.05]

query = zebra
  pixel cosine  zebra vs zebra_moved: 0.552
  embed cosine  zebra vs zebra_moved: 1.0

nearest neighbours of ocean:
  ocean_2      cosine = 0.996
  zebra_moved  cosine = 0.664
  zebra        cosine = 0.664
  beach        cosine = 0.639`,
          walkthrough: [
            { lines: [4, 9], note: "We create small 6×6 colour images: a base colour plus a little noise, and optionally dark vertical stripes (our 'zebra')." },
            { lines: [11, 18], note: "Five images: a beach, two oceans with slightly different blues, a striped image, and the same striped image shifted one pixel to the right." },
            { lines: [20, 25], note: "Our 'encoder' turns 108 pixel values into 7 numbers. A real CNN or ViT learns thousands of such features instead of us hand-picking 7." },
            { lines: [35, 38], note: "Shifting the zebra by one pixel makes the raw pixel vectors only 0.552 similar (dark columns now sit where bright ones were), but the embeddings are identical: 1.0. That is the robustness we want." },
            { lines: [40, 44], note: "Nearest-neighbour search: rank every other image by cosine similarity to the ocean. The other ocean wins by a wide margin." },
          ] },
        { type: "p", text: "With a real model the code shape is the same: load a pre-trained encoder, run each image through it, L2-normalise the outputs, store them in a vector index, and search with cosine similarity. Only the `embed` function changes." },
        { type: "check", question: "Why did the zebra and the beach both score only about 0.64–0.66 against the ocean, even though they look nothing alike?", answer: "Our 7 hand-made features are crude: all values are positive, so every vector points into the same 'positive' region and cosines rarely drop near 0. A trained encoder spreads images across many more dimensions, giving clearer separation. It is a reminder that scores are only meaningful relative to other scores from the same model." },
      ],
    },
    {
      id: "where-used",
      title: "Where are image embeddings used?",
      blocks: [
        { type: "table", caption: "Common applications", head: ["Application", "How embeddings help", "Support-team example"], rows: [
          ["Reverse image search", "Embed the query image, return nearest neighbours", "Find past tickets with the same damage"],
          ["Text-to-image search", "Embed a sentence with a CLIP-style text encoder, search image vectors", "'cracked jar base' → matching photos"],
          ["Duplicate / near-duplicate detection", "Very high similarity flags copies", "Spot the same photo submitted for two claims"],
          ["Recommendations", "Suggest items whose images are close", "'Customers also viewed' similar kettles"],
          ["Clustering and labelling", "Group vectors, label each cluster once", "Discover the most common failure types"],
          ["Classification with few labels", "Train a small classifier on top of frozen embeddings", "Damage vs no damage with 500 labelled photos"],
          ["Multimodal RAG", "Retrieve relevant images (or pages as images) as context for an LLM", "Pull the right manual diagram into the answer"],
        ] },
        { type: "callout", tone: "warn", title: "Common pitfalls", text: "Mixing embeddings from two different models (their spaces are unrelated, so comparisons are meaningless); forgetting to apply the same pre-processing at query time as at indexing time; trusting a generic encoder on a very specialised domain (X-rays, circuit boards) without evaluation; and re-embedding only part of the archive after switching models." },
        { type: "p", text: "When not to use them: if we need *exact* matches (same file), a cryptographic hash is cheaper and certain; if we need to read text or numbers from an image, use OCR; and if decisions are high-stakes, embedding similarity should only shortlist candidates for a human or a stronger model to check." },
      ],
    },
    {
      id: "summary",
      title: "Summary",
      blocks: [
        { type: "list", items: [
          "An embedding is a fixed-length vector where similar things are close together.",
          "An image embedding comes from running a picture through a trained encoder (CNN or ViT) and taking a summary vector.",
          "Raw pixels are huge, fragile and meaningless; embeddings are compact and robust to irrelevant changes.",
          "Encoders are trained with labels, with image-caption pairs (CLIP-style) or self-supervised; the training decides what 'similar' means.",
          "Compare embeddings with cosine similarity (or dot product on normalised vectors).",
          "Uses: image search, text-to-image search, deduplication, recommendations, clustering and multimodal RAG.",
        ] },
      ],
    },
  ],
  quiz: [
    { q: "What is an image embedding?", options: ["A compressed JPEG copy of the image, stored for fast loading", "A fixed-length vector from a trained encoder that captures content", "The full list of the image's raw pixel values, in reading order", "A text caption that a person wrote to describe what is shown"], answer: 1, explain: "An embedding is a vector read from a trained network, so similar images get nearby vectors. Raw pixels are not an embedding, a JPEG is a compression format, and a caption is text." },
    { q: "A = [1, 0] and B = [1, 1]. What is the cosine similarity of A and B?", options: ["1.0", "0.5", "≈ 0.707", "0"], answer: 2, explain: "A·B = 1, ‖A‖ = 1, ‖B‖ = √2 ≈ 1.414, so cos = 1 / 1.414 ≈ 0.707 (a 45° angle)." },
    { q: "Our team wants staff to type 'kettle with a burnt base' and get matching customer photos. Which encoder setup fits?", options: ["A CLIP-style model with images and text in one space", "A self-supervised encoder trained only on product images", "Comparing raw pixel values directly with the typed query", "An OCR engine run on every photo, then keyword matching"], answer: 0, explain: "Searching images with a sentence needs text and images in the same space, which contrastive image-text training provides. An image-only encoder has no text side; OCR only reads written text in images." },
    { q: "In the lesson's code, shifting the striped image by one pixel gave pixel cosine 0.552 but embedding cosine 1.0. What does this show?", options: ["The embedding is broken because it fails to notice the shift at all", "Pixel comparison is better, because it detects every small change in position", "Cosine similarity cannot be applied to vectors made of raw pixels", "Good embeddings stay stable when content is unchanged; pixels do not"], answer: 3, explain: "The content did not change, only its position. Robustness to such irrelevant changes is the whole point of embeddings, while raw pixels react strongly to a one-pixel shift." },
    { q: "Which statement is a misconception?", options: ["Embeddings from two different encoders can be compared directly", "On normalised vectors, dot product equals cosine similarity", "A cosine score of 0.8 does not mean the images are '80% the same'", "Indexing and querying must use the same image pre-processing"], answer: 0, explain: "Each encoder builds its own space; a vector from model X and one from model Y are not comparable even if they have the same length. The other statements are correct." },
  ],
  takeaways: [
    "An image embedding is a compact, fixed-length vector that captures what an image shows.",
    "It comes from a trained encoder; how that encoder was trained defines what 'similar' means.",
    "Embeddings are robust to irrelevant changes (shift, lighting) where raw pixels are not.",
    "Cosine similarity (a dot product on normalised vectors) is the standard comparison.",
    "Never compare embeddings from different models, and tune thresholds on real examples.",
  ],
  terms: [
    { term: "Embedding", def: "A fixed-length vector representing an item so that similar items are close together." },
    { term: "Image encoder", def: "A trained network (CNN or ViT) that turns an image into features or an embedding." },
    { term: "Cosine similarity", def: "The cosine of the angle between two vectors: dot product divided by both lengths." },
    { term: "L2 normalisation", def: "Dividing a vector by its length so it has length 1." },
    { term: "Contrastive learning", def: "Training that pulls matching pairs together and pushes non-matching pairs apart." },
    { term: "Nearest-neighbour search", def: "Finding the stored vectors most similar to a query vector." },
  ],
};
