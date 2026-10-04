export default {
  id: "what-are-embeddings",
  minutes: 22,
  hook: "How can a computer know that “puppy” is closer to “dog” than to “invoice” when, to it, every word is just a string of characters?",
  summary: "An embedding is a list of numbers (a vector) that represents a piece of data, such as a word, a sentence, an image or a product, so that similar things get similar numbers. We measure how close two embeddings are with cosine similarity or distance, which lets computers compare meaning. Embeddings are learned by neural networks from data, power search, RAG, recommendations and clustering, and come with real pitfalls: bias, model mismatch and domain gaps.",
  sections: [
    {
      id: "the-problem",
      title: "The problem: computers cannot compare meaning",
      blocks: [
        { type: "p", text: "Our running example is a **help-centre search** for an online shop. A customer types “my parcel never arrived”. The best help article is titled “What to do if your delivery is missing”. The two texts share *no* important words. A plain keyword search finds nothing useful, yet any human sees they mean the same thing." },
        { type: "p", text: "To a computer, words are just characters or arbitrary ID numbers. If “parcel” is ID 812 and “delivery” is ID 4410, nothing about those numbers says they are related. One older trick, **one-hot encoding**, gives each word a vector of zeros with a single 1 in its own slot. But every one-hot vector is equally far from every other one, so “parcel” is exactly as similar to “delivery” as it is to “banana”. We need numbers that *carry meaning*." },
        { type: "callout", tone: "analogy", title: "Think of it like map coordinates", text: "Cities on a map have two numbers: latitude and longitude. Cities that are near each other in the real world have similar numbers, so we can compute which cities are close without knowing anything else about them. An embedding gives every word or sentence coordinates on a “map of meaning”, where nearby points mean similar things." },
      ],
    },
    {
      id: "what-are-embeddings",
      title: "What are Embeddings?",
      blocks: [
        { type: "p", text: "An **embedding** is a fixed-length list of numbers, called a **vector**, that represents one item. The key property: **items with similar meaning get vectors that are close together**, and unrelated items get vectors that are far apart. Each number is one **dimension**; the length of the list is the embedding's **dimensionality**." },
        { type: "p", text: "The word comes from mathematics: we *embed* (place) items into a continuous space. Embeddings are also called **dense vectors** because almost every number is non-zero, unlike sparse one-hot vectors." },
        { type: "p", text: "**A simple example with two numbers.** Suppose we describe words by two hand-picked features: “how much is it an animal?” (0 to 1) and “how big is it?” (0 to 1). A cat might be [0.9, 0.2], an elephant [0.9, 0.95], an apple [0.1, 0.2] and a watermelon [0.1, 0.8]. Plot them and animals cluster on one side, fruits on the other, and size spreads them vertically." },
        { type: "chart", kind: "scatter", title: "Words placed by two features", xLabel: "Animal-ness", yLabel: "Size", series: [ { name: "Animals (cat, dog, elephant)", points: [[0.9, 0.2], [0.85, 0.3], [0.9, 0.95]] }, { name: "Fruits (apple, banana, watermelon)", points: [[0.1, 0.2], [0.05, 0.25], [0.1, 0.8]] } ], caption: "Illustrative, hand-picked numbers. Real embeddings are learned, and their dimensions do not have neat human labels." },
        { type: "viz", name: "embedding-space", caption: "Click a word on the 2-D map to highlight its nearest neighbours by cosine similarity." },
      ],
    },
    {
      id: "many-dimensions",
      title: "Why we need many more than two numbers",
      blocks: [
        { type: "p", text: "Two numbers can capture “animal-ness” and “size”, but meaning has far more aspects: is it alive, is it food, is it formal, is it about money, is it positive, is it a verb, which topic does it belong to, and countless subtler ones. With only two dimensions, “bank” (money) and “bank” (river) and “bunk” would be crammed together with unrelated words. More dimensions give room to keep many kinds of similarity apart at the same time." },
        { type: "table", caption: "Typical embedding sizes (publicly documented)", head: ["Model", "Year", "Dimensions"], rows: [
          ["word2vec (Google News vectors)", "2013", "300"],
          ["GloVe (common releases)", "2014", "50–300"],
          ["BERT-base hidden states", "2018", "768"],
          ["OpenAI text-embedding-3-small", "2024", "1,536"],
          ["OpenAI text-embedding-3-large", "2024", "3,072"],
        ] },
        { type: "p", text: "More dimensions is not automatically better. Each extra dimension costs storage and search time: one million 1,536-dimension float32 vectors take about 6 GB (1,000,000 × 1,536 × 4 bytes). Many current models let us shorten vectors with a small quality loss, so the right size depends on the budget and the task." },
        { type: "callout", tone: "note", title: "Dimensions are not human-readable", text: "In our toy examples each dimension has a name. In learned embeddings, a single dimension rarely means one clear thing; meaning is spread across many dimensions at once. We work with the vectors through distances and similarities, not by reading individual numbers." },
      ],
    },
    {
      id: "measuring-closeness",
      title: "How do we measure closeness?",
      blocks: [
        { type: "p", text: "Once items are vectors, “similar meaning” becomes “close vectors”. Three measures are common." },
        { type: "formula", expr: "cos(a, b) = (a · b) / (‖a‖ · ‖b‖)", where: [["a · b", "dot product: multiply matching numbers and add them up"], ["‖a‖", "length (norm) of a: √(a₁² + a₂² + …)"], ["cos(a, b)", "1 = same direction, 0 = unrelated (perpendicular), −1 = opposite"]], caption: "Cosine similarity compares direction and ignores length." },
        { type: "list", items: [
          "**Cosine similarity**: the angle between vectors. The most common choice for text embeddings because it ignores vector length.",
          "**Dot product**: a · b. Equal to cosine similarity when vectors are normalised to length 1, and cheaper to compute. Many embedding APIs return normalised vectors for this reason.",
          "**Euclidean distance**: ‖a − b‖, the straight-line distance. Smaller means more similar.",
        ] },
        { type: "p", text: "**Worked example.** a = [1, 2], b = [2, 3]. Dot product = 1×2 + 2×3 = 8. ‖a‖ = √5 ≈ 2.236, ‖b‖ = √13 ≈ 3.606. Cosine = 8 / (2.236 × 3.606) ≈ **0.99**: almost the same direction. Euclidean distance = √((2−1)² + (3−2)²) = √2 ≈ 1.41." },
        { type: "viz", name: "vector-similarity", caption: "Drag the two vectors: change the angle to move cosine similarity, change a length to see that cosine stays fixed while dot product and distance change." },
        { type: "check", question: "Vector b = 2 × a (same direction, twice as long). What is their cosine similarity, and is their Euclidean distance zero?", answer: "Cosine similarity is exactly 1, because the direction is identical. The Euclidean distance is not zero; it equals ‖a‖. This is why cosine is preferred when only direction (meaning) should matter, not magnitude." },
      ],
    },
    {
      id: "where-from",
      title: "Where do embeddings come from?",
      blocks: [
        { type: "p", text: "Nobody types embedding numbers by hand. They are **learned** by a neural network during training. The guiding idea, called the **distributional hypothesis**, is that words used in similar contexts have similar meanings: “coffee” and “tea” both appear near “cup”, “hot” and “drink”, so a model that predicts context words will push their vectors together." },
        { type: "steps", title: "How a word embedding is learned (word2vec-style)", items: [
          { title: "Start random", text: "Give every word in the vocabulary a random vector, for example 300 small random numbers." },
          { title: "Make a prediction task", text: "From real text, take a word and its neighbours. Ask the model to tell true neighbour pairs (coffee, cup) apart from random pairs (coffee, tractor)." },
          { title: "Measure the error", text: "Score a pair by the dot product of their vectors. True pairs should score high and random pairs low; the loss measures how far off we are." },
          { title: "Nudge the vectors", text: "Gradient descent moves vectors of true pairs slightly closer and random pairs slightly apart." },
          { title: "Repeat billions of times", text: "Over a large corpus, words sharing contexts end up near each other. The final vectors are the embeddings." },
        ] },
        { type: "p", text: "Modern systems go further. Inside every LLM, the first layer is an **embedding table**: a matrix with one row per token, learned along with the rest of the model. Transformers then produce **contextual embeddings**, where the vector for “bank” depends on the surrounding sentence. Dedicated **embedding models** (for example, Sentence-BERT-style models from 2019 onward) are trained with **contrastive learning** to place whole sentences or documents so that a question lands near its answer." },
        { type: "compare", title: "Kinds of vector representation",
          options: [
            { name: "One-hot", summary: "A 1 in the word's own slot, zeros elsewhere.", pros: ["Trivial to build", "No training needed"], cons: ["No notion of similarity", "As long as the vocabulary"], bestFor: "Categorical labels, simple features" },
            { name: "Static embedding", summary: "One learned vector per word (word2vec, GloVe).", pros: ["Captures similarity", "Small and fast"], cons: ["One vector per word, so “bank” mixes both meanings"], bestFor: "Lightweight similarity, older NLP pipelines" },
            { name: "Contextual / sentence embedding", summary: "Vector produced by a Transformer from the whole text.", pros: ["Meaning depends on context", "Works for sentences and documents"], cons: ["Needs a model call per text", "Model-specific vectors"], bestFor: "Semantic search, RAG, clustering" },
          ],
          rows: [
            ["“bank” in two sentences", "Same vector", "Same vector", "Different vectors"],
            ["Typical size", "Vocabulary size (huge, sparse)", "50–300", "384–3,072"],
          ],
          verdict: "For modern search and RAG, use a contextual embedding model; one-hot and static vectors survive mainly as simple features." },
      ],
    },
    {
      id: "word-math",
      title: "The famous word math example",
      blocks: [
        { type: "p", text: "A striking finding from the word2vec work (Mikolov and colleagues, 2013) is that some relationships become *directions* in the space. The vector from “man” to “woman” is roughly parallel to the vector from “king” to “queen”. So king − man + woman lands near queen. We can show this with hand-made 4-dimension vectors whose dimensions we label royalty, male, female and fruit." },
        { type: "code", lang: "python", title: "embedding_math.py", code: `import numpy as np

# Hand-made 4-D embeddings. Dimensions (for teaching only):
#            royalty  male  female  fruit
emb = {
    "king":  np.array([0.9, 0.8, 0.1, 0.0]),
    "queen": np.array([0.9, 0.1, 0.8, 0.0]),
    "man":   np.array([0.1, 0.9, 0.1, 0.0]),
    "woman": np.array([0.1, 0.1, 0.9, 0.0]),
    "apple": np.array([0.0, 0.1, 0.1, 0.9]),
}

def cosine(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

# 1. Closeness: cosine similarity between pairs
for a, b in [("king", "queen"), ("man", "woman"), ("king", "apple")]:
    print(f"cos({a}, {b}) = {cosine(emb[a], emb[b]):.2f}")

# 2. Euclidean distance tells a similar story here
print("dist(king, queen) =", round(np.linalg.norm(emb["king"] - emb["queen"]), 2))
print("dist(king, apple) =", round(np.linalg.norm(emb["king"] - emb["apple"]), 2))

# 3. Word math: king - man + woman = ?
target = emb["king"] - emb["man"] + emb["woman"]
print("king - man + woman =", np.round(target, 2))
ranked = sorted(
    (w for w in emb if w not in ("king", "man", "woman")),
    key=lambda w: -cosine(target, emb[w]),
)
for w in ranked:
    print(f"  nearest: {w:6s} cos = {cosine(target, emb[w]):.2f}")`, output: `cos(king, queen) = 0.66
cos(man, woman) = 0.23
cos(king, apple) = 0.08
dist(king, queen) = 0.99
dist(king, apple) = 1.45
king - man + woman = [0.9 0.  0.9 0. ]
  nearest: queen  cos = 0.99
  nearest: apple  cos = 0.08`,
          walkthrough: [
            { lines: [3, 11], note: "Five hand-made embeddings. Real ones are learned and have hundreds of unlabelled dimensions." },
            { lines: [13, 14], note: "Cosine similarity: dot product divided by the product of the lengths." },
            { lines: [16, 18], note: "king and queen share royalty, so they are fairly close (0.66). king and apple share almost nothing (0.08)." },
            { lines: [20, 22], note: "Euclidean distance agrees here: queen is nearer to king than apple is." },
            { lines: [24, 26], note: "Subtract “male”, add “female”: the result keeps royalty and swaps gender." },
            { lines: [27, 32], note: "Rank remaining words by cosine to the result, excluding the three input words (as standard analogy tests do). queen wins with 0.99." },
          ] },
        { type: "matrix", title: "Cosine similarity between the toy embeddings", rows: ["king", "queen", "man", "woman", "apple"], cols: ["king", "queen", "man", "woman", "apple"], values: [[1, 0.66, 0.74, 0.24, 0.08], [0.66, 1, 0.24, 0.74, 0.08], [0.74, 0.24, 1, 0.23, 0.12], [0.24, 0.74, 0.23, 1, 0.12], [0.08, 0.08, 0.12, 0.12, 1]], format: "num", caption: "Computed from the vectors in the code above. Note the two ~0.74 pairs (king–man, queen–woman): shared gender plus small overlaps." },
        { type: "callout", tone: "warn", title: "Do not over-trust the analogy trick", text: "In real models, analogies work only approximately and for some relations. The result is usually closest to one of the input words (often “king” itself), which is why tests exclude the inputs. It is a nice illustration that structure exists, not a reliable reasoning tool." },
      ],
    },
    {
      id: "beyond-words",
      title: "Embeddings are not only for words",
      blocks: [
        { type: "p", text: "Anything a neural network can read can be embedded. The same rule holds: similar items get nearby vectors." },
        { type: "list", items: [
          "**Sentences and documents**: our help articles and customer questions, embedded by the same model so they can be compared.",
          "**Images**: a vision model maps photos to vectors; similar-looking or similar-content photos are close.",
          "**Text and images together**: models like CLIP (OpenAI, 2021) put captions and pictures in one shared space, so the text “a red sneaker” lands near photos of red sneakers.",
          "**Audio**: speech or music clips, for example to find similar songs.",
          "**Users and products**: recommender systems learn a vector per user and per item; a high dot product means “likely to buy”.",
          "**Code, molecules, graphs**: specialised models embed functions, chemical structures or nodes in a network.",
        ] },
      ],
    },
    {
      id: "uses",
      title: "What we use embeddings for",
      blocks: [
        { type: "table", caption: "Common uses in AI systems", head: ["Use", "How embeddings help", "In our help centre"], rows: [
          ["Semantic search", "Embed the query and all documents; return the nearest documents", "“parcel never arrived” finds “missing delivery”"],
          ["RAG", "Retrieve the nearest passages and give them to an LLM as context", "The bot answers using the right help article"],
          ["Recommendations", "Suggest items whose vectors are near what the user liked", "“Customers also read…” links"],
          ["Clustering", "Group nearby vectors to discover topics", "Find the top themes in this week's tickets"],
          ["Classification", "Train a small classifier on top of embeddings", "Route tickets to billing, shipping or returns"],
          ["Deduplication", "Very high similarity means near-duplicates", "Merge duplicate help articles"],
          ["Anomaly detection", "Items far from every cluster are unusual", "Spot a new kind of complaint early"],
        ] },
        { type: "callout", tone: "example", title: "Our help-centre search, end to end", text: "Offline: embed every help article once and store the vectors in a vector database. Online: embed the customer's question with the *same* model, find the five articles with the highest cosine similarity, and show them (or pass them to an LLM to write an answer). The question “my parcel never arrived” now finds “What to do if your delivery is missing” without a single shared keyword." },
      ],
    },
    {
      id: "careful",
      title: "Things we must be careful about",
      blocks: [
        { type: "list", items: [
          "**Never mix models**: vectors from different embedding models (or different versions of one model) live in different spaces. Comparing them gives meaningless scores. Re-embed everything when we switch.",
          "**Bias**: embeddings absorb stereotypes in their training text. A well-known 2016 study (Bolukbasi et al.) showed word2vec analogies linking “man” to “computer programmer” and “woman” to “homemaker”.",
          "**Domain gap**: a general model may not know that two internal product codes are related. Test on our own data and consider domain-specific or fine-tuned models.",
          "**Similar is not the same as correct**: the nearest document may be on the right topic but answer a different question; negations (“refund allowed” vs “refund not allowed”) can be close in embedding space.",
          "**Length limits**: embedding models have a maximum input length; longer text may be cut off silently, so we split documents into chunks.",
          "**Exact terms**: embeddings can miss exact identifiers like order numbers or error codes, where keyword search is stronger.",
        ] },
        { type: "callout", tone: "warn", title: "The most common mistake", text: "Embedding documents with one model and queries with another (or upgrading the model for new documents only). Results quietly get worse with no error message. Store the model name and version with every vector." },
        { type: "check", question: "Our search returns the right topic but misses queries that contain an exact order number like “ORD-55812”. What should we add?", answer: "Keyword search (for example BM25) alongside the embedding search, a combination called hybrid search. Embeddings capture meaning but are weak at matching exact rare strings such as IDs and codes." },
      ],
    },
    {
      id: "summary",
      title: "Summary",
      blocks: [
        { type: "p", text: "Embeddings turn items into vectors so that closeness in space reflects similarity in meaning. We compare them with cosine similarity, dot product or distance. They are learned from data, from word2vec-style context prediction to contrastively trained Transformer models, and they work for words, sentences, images, audio, users and products. They power semantic search, RAG, recommendations and clustering, as long as we keep one model per index, watch for bias and domain gaps, and pair them with keyword search for exact terms." },
      ],
    },
  ],
  quiz: [
    { q: "What is the defining property of a good embedding?", options: ["Every item gets a vector with a single 1 and zeros everywhere else", "Similar items get nearby vectors, and unrelated items get distant ones", "Each dimension stands for a clear, human-readable property of the item", "The vector has two dimensions so items can be plotted on a chart"], answer: 1, explain: "Closeness reflecting similarity is the point of embeddings. One-hot vectors (the first option) have no similarity structure, learned dimensions are rarely human-readable, and real embeddings have hundreds or thousands of dimensions." },
    { q: "a = [1, 0] and b = [0, 1]. What is their cosine similarity?", options: ["1", "−1", "0.5", "0"], answer: 3, explain: "The dot product is 1×0 + 0×1 = 0, so the cosine is 0: the vectors are perpendicular, meaning unrelated. 1 would mean the same direction and −1 the opposite direction." },
    { q: "After upgrading to a newer embedding model for new help articles only, search quality drops sharply. Most likely cause?", options: ["Old and new vectors come from different models, so they cannot be compared", "The new model's extra dimensions make cosine similarity values unreliable here", "Cosine similarity is designed for word embeddings, not whole articles", "The vector database needs a higher temperature for the new vectors"], answer: 0, explain: "Each model defines its own space. Mixing them breaks comparisons silently. Cosine works for any dimension and any embedding type, and temperature is a text-generation setting." },
    { q: "How do contextual embeddings differ from static word embeddings like word2vec?", options: ["Static embeddings are larger and slower to compute than contextual ones", "Contextual embeddings ignore word order, while static ones encode it", "Contextual models give “bank” a vector per sentence; static ones give it one", "Static embeddings also work for images, while contextual ones only fit plain text"], answer: 2, explain: "Static models store one vector per word, mixing its senses; contextual models (Transformers) compute vectors from the whole sentence. Static vectors are typically smaller and faster, and image embeddings are a separate family." },
    { q: "A colleague says: “king − man + woman = queen proves embeddings understand royalty and gender perfectly.” What is the best response?", options: ["Correct; this kind of vector arithmetic works for any relationship you choose to test", "Wrong; arithmetic on embedding vectors is not a meaningful operation at all", "Correct, as long as we use Euclidean distance instead of cosine similarity", "It shows relations as directions, but only roughly, and input words are excluded"], answer: 3, explain: "Analogies are an approximate illustration of structure, not proof of understanding; the raw nearest neighbour is often an input word itself. Vector arithmetic is perfectly possible, and switching distance measure does not make it exact." },
  ],
  takeaways: [
    "An embedding is a vector where closeness means similarity in meaning.",
    "Cosine similarity compares direction; dot product equals cosine on normalised vectors; Euclidean measures distance.",
    "Embeddings are learned from data, from context prediction (word2vec) to contrastively trained Transformers.",
    "They work for words, sentences, images, audio, users and products, and power search, RAG and recommendations.",
    "Use one model per index, watch bias and domain gaps, and add keyword search for exact terms.",
  ],
  terms: [
    { term: "Embedding", def: "A dense vector of numbers representing an item so that similar items are close together." },
    { term: "Dimension", def: "One number in a vector; the dimensionality is how many numbers the vector has." },
    { term: "One-hot vector", def: "A vector with a single 1 marking a category and 0s elsewhere; it has no notion of similarity." },
    { term: "Cosine similarity", def: "The cosine of the angle between two vectors, from −1 to 1, ignoring their lengths." },
    { term: "Contextual embedding", def: "A vector for a token or text computed from its surrounding context, typically by a Transformer." },
    { term: "Distributional hypothesis", def: "The idea that words appearing in similar contexts have similar meanings." },
  ],
};
