export default {
  id: "multimodal-ai",
  minutes: 18,
  hook: "A customer sends our support bot a photo of a cracked blender jar and a voice note saying 'it leaks here' — how can one model understand both at once?",
  summary: "Multimodal AI is AI that takes in or produces more than one kind of data, such as text, images, audio and video. It works by turning each kind of data into vectors with its own encoder, mapping those vectors into a shared space, and letting one model reason over all of them together. It is what powers photo-aware chatbots, text-to-image tools, image search by description and video understanding.",
  sections: [
    {
      id: "big-picture",
      title: "The big picture",
      blocks: [
        { type: "p", text: "Humans never experience the world through one channel. When a friend shows us a photo and says 'look at this crack', we combine what we *see* with what we *hear* without thinking. For years, most AI systems could only do one of these things. A language model read text. An image classifier looked at pixels. A speech recognizer listened to audio. Each one lived in its own world." },
        { type: "p", text: "**Multimodal AI** breaks down those walls. A multimodal model can accept a mix of inputs — say a photo plus a question — and answer in text, or take a sentence and draw a picture. Throughout this lesson we will follow one running example: a **support chatbot for a kitchen-appliance shop**. Customers send photos of broken products, screenshots of error codes, and voice notes. A text-only bot would be stuck; a multimodal bot can look at the photo and answer." },
        { type: "callout", tone: "analogy", title: "Think of it like a doctor's visit", text: "A good doctor does not diagnose from one clue. They listen to what we say (text/audio), look at the rash (image), and read the X-ray (another image type). Each clue alone is weak; together they point to one answer. Multimodal AI tries to do the same: combine several weak or partial signals into one strong understanding." },
      ],
    },
    {
      id: "what-is-a-modality",
      title: "What is a modality?",
      blocks: [
        { type: "p", text: "A **modality** is a *type* of data, defined by how the information is captured and structured. The word comes from 'mode' — a mode of perceiving. The common modalities in AI are:" },
        { type: "list", items: [
          "**Text** — a sequence of characters, split into tokens (word pieces).",
          "**Images** — a grid of pixels, each pixel a few numbers (red, green, blue).",
          "**Audio** — a long list of air-pressure samples over time, often turned into a spectrogram (a picture of which frequencies are loud at each moment).",
          "**Video** — a sequence of images (frames), usually with an audio track.",
          "**Others** — sensor readings, depth maps, tables, code, molecules, robot joint angles. Anything with its own structure can be a modality.",
        ] },
        { type: "p", text: "Modalities differ in *shape* and *meaning*. A sentence is a short 1-D sequence of discrete symbols. A photo is a dense 2-D grid of continuous values; a 1024×1024 colour image holds over three million numbers. Ten seconds of 16 kHz audio is 160,000 samples. No single raw format fits them all, and that is the core engineering problem multimodal AI has to solve." },
        { type: "check", question: "Is a screenshot of an error message 'text' or 'image' as a modality?", answer: "It is an image: the model receives pixels, not characters. A multimodal model has to *read* the text out of the pixels (like OCR does). That is why a model may misread a blurry screenshot that it would have understood perfectly as typed text." },
      ],
    },
    {
      id: "unimodal-vs-multimodal",
      title: "Unimodal AI vs multimodal AI",
      blocks: [
        { type: "p", text: "A **unimodal** model handles exactly one modality in and usually one out: a text classifier, an image classifier, a speech-to-text system. A **multimodal** model handles two or more, either on the input side, the output side, or both." },
        { type: "compare", title: "Unimodal vs multimodal for our support bot",
          options: [
            { name: "Unimodal (text-only)", summary: "Reads and writes text only.", pros: ["Simpler, cheaper, faster", "Mature tooling and evaluation", "Easy to debug: everything is readable"], cons: ["Cannot look at photos or listen to voice notes", "Customer must describe the problem in words"], bestFor: "FAQ bots, document Q&A, chat where inputs are already text" },
            { name: "Multimodal", summary: "Reads (and maybe writes) text, images, audio and more.", pros: ["Uses evidence the user already has (a photo)", "Fewer back-and-forth questions", "Can ground answers in what it sees"], cons: ["Heavier models and more tokens per request", "New failure modes: misreading images, hallucinating details", "Harder to evaluate"], bestFor: "Visual troubleshooting, document scans, accessibility, media search" },
          ],
          rows: [
            ["Inputs", "Text", "Text + images + audio (+ video)"],
            ["Typical cost per request", "Lower", "Higher (an image can cost hundreds to thousands of tokens)"],
            ["Example task", "'How do I reset my blender?'", "'What is wrong with this jar?' + photo"],
          ],
          verdict: "Use multimodal only where the extra modality carries information the text cannot. For pure text tasks, a unimodal model is cheaper and just as good." },
      ],
    },
    {
      id: "why-multimodal",
      title: "Why multimodal AI?",
      blocks: [
        { type: "p", text: "There are four strong reasons to combine modalities:" },
        { type: "list", ordered: true, items: [
          "**Richer context.** A photo of a cracked jar says in one shot what would take a paragraph to describe — and customers are bad at describing. 'It is broken near the bottom' is vague; the picture is exact.",
          "**Disambiguation.** One modality can resolve ambiguity in another. The word 'bank' is ambiguous; a photo of a river is not. In video, lip movement helps speech recognition in a noisy room.",
          "**Robustness.** If one signal is missing or noisy (blurry photo, background noise), the others can still carry the answer.",
          "**New abilities.** Some tasks are multimodal by definition: describing an image for a blind user, generating an image from a prompt, searching photos with a sentence, answering questions about a chart.",
        ] },
        { type: "p", text: "There is also a training reason. The internet holds billions of images with nearby text (captions, alt text, surrounding articles). That pairing is free supervision: the text tells the model what the picture shows, without anyone labelling it by hand. Much of modern multimodal AI was built by learning from such pairs." },
      ],
    },
    {
      id: "how-it-works",
      title: "How multimodal AI works",
      blocks: [
        { type: "p", text: "Almost every modern multimodal system follows the same recipe. The key insight: neural networks only understand vectors (lists of numbers). So the job is to turn every modality into vectors that live in **one shared space**, where 'a photo of a dog' and the words 'a dog' end up close together." },
        { type: "flow", title: "From mixed inputs to one answer", nodes: [
          { label: "Raw inputs", detail: "A photo of the cracked jar (pixels) and the question 'Is this covered by warranty?' (characters)." },
          { label: "Modality encoders", detail: "Each modality gets its own encoder. Images usually go through a Vision Transformer that outputs one vector per image patch. Text goes through a tokenizer and embedding table. Audio often goes through a spectrogram plus an audio encoder." },
          { label: "Projection", detail: "A small learned layer (often a linear layer or a tiny MLP) maps each encoder's vectors into the same size and space the language model uses. This is the 'adapter' or 'connector'." },
          { label: "Fusion", detail: "The vectors are combined. In many chat models, the image vectors are simply placed in the token sequence next to the text tokens, and self-attention lets every word look at every image patch." },
          { label: "Reasoning model", detail: "A transformer (usually a large language model) processes the combined sequence, exactly as it would process text." },
          { label: "Output", detail: "A decoder produces the answer: text tokens for a chat reply, or image/audio tokens if the model can generate those." },
        ] },
        { type: "p", text: "The combining step is called **fusion**, and there are three classic ways to do it:" },
        { type: "steps", title: "Three ways to fuse modalities", items: [
          { title: "Early fusion", text: "Combine the raw or lightly processed inputs first, then run one model over everything. Example: turn image patches and text into tokens and feed them all into one transformer from the first layer. Lets modalities interact deeply, but needs lots of paired training data." },
          { title: "Late fusion", text: "Run a separate model per modality all the way to a prediction or embedding, then combine only at the end (average the scores, or compare the two embeddings). Simple and modular, but the modalities never 'talk' in detail. CLIP-style image-text matching is a form of this." },
          { title: "Intermediate (hybrid) fusion", text: "Encode each modality separately, then mix them in the middle with cross-attention layers or by inserting projected image tokens into a language model. This is how most vision-language chat models are built today: a pre-trained vision encoder, a projector, and a pre-trained LLM." },
          { title: "Train the pieces to agree", text: "Whatever the fusion style, training must teach the model that matching inputs belong together. Contrastive training pulls matching image-text pairs close and pushes mismatched pairs apart; instruction tuning then teaches the model to answer questions about images." },
        ] },
        { type: "matrix", title: "A shared space: image vs caption similarity", rows: ["photo: dog", "photo: blender", "photo: pizza"], cols: ["'a dog'", "'a blender'", "'a pizza'"], values: [[0.82, 0.11, 0.07], [0.09, 0.85, 0.12], [0.06, 0.10, 0.79]], format: "num", caption: "Illustrative cosine similarities after contrastive training. The bright diagonal means each photo sits closest to its own caption in the shared space." },
        { type: "callout", tone: "note", title: "Images cost tokens", text: "When an image is inserted into a language model, it becomes many vectors — one per patch. A single image can become hundreds to a few thousand tokens depending on the model and the image resolution. This is why multimodal requests cost more and why many APIs resize or tile large images." },
      ],
    },
    {
      id: "three-types",
      title: "Three common types of multimodal AI",
      blocks: [
        { type: "p", text: "Most systems we meet in practice fall into one of three families. They differ in which direction information flows." },
        { type: "table", caption: "The three families, using our support-bot scenario", head: ["Type", "Direction", "Example task", "Typical models"], rows: [
          ["Multimodal understanding", "Many modalities in → text out", "Photo of the jar + question → 'The crack is on the base; that part is covered for 2 years.'", "Vision-language chat models (GPT-4o, Gemini, Claude, LLaVA)"],
          ["Cross-modal generation", "One modality in → a different one out", "'Draw a diagram showing how to seat the jar' → image; text → speech", "Text-to-image diffusion models, text-to-speech, text-to-video"],
          ["Cross-modal retrieval / matching", "Compare modalities in a shared embedding space", "Customer types 'jar with a cracked base' → find matching photos from past tickets", "CLIP-style dual encoders, multimodal embedding models"],
        ] },
        { type: "p", text: "Some recent models are called **any-to-any** or **natively multimodal**: one network both reads and writes several modalities (for example, it can listen to speech and reply with speech directly). Exactly which inputs and outputs a given product supports changes often, so always check the current documentation of the model we plan to use." },
        { type: "check", question: "Our shop wants a search box where staff type 'scratched stainless steel kettle' and get matching photos from 50,000 old tickets. Which family is that, and does it need a chat model?", answer: "Cross-modal retrieval. We embed every photo once with an image encoder, embed the query with the matching text encoder, and find the nearest vectors. No chat model is needed, which makes it much cheaper and faster than asking a vision-language model to look at 50,000 images." },
      ],
    },
    {
      id: "code",
      title: "Code: teaching two modalities to share a space",
      blocks: [
        { type: "p", text: "Let us build the heart of cross-modal matching from scratch. We pretend we already have an image encoder (it outputs 6 numbers per image) and a text encoder (5 numbers per caption). Their outputs live in *different* spaces with different sizes, so we cannot compare them directly. We learn two small **projection heads** that map both into one 3-d shared space, using a **contrastive loss**: for each image, the matching caption should score highest among all captions in the batch." },
        { type: "code", lang: "python", title: "shared_space.py", code: `import numpy as np
rng = np.random.default_rng(0)

# 4 concepts. Each "image" is a 6-d feature vector, each "caption" a 5-d one.
# The two modalities have different sizes and different meanings per dimension.
concepts = ["dog", "cat", "car", "pizza"]
img = rng.normal(size=(4, 6))          # pretend output of an image encoder
txt = rng.normal(size=(4, 5))          # pretend output of a text encoder

# Two projection heads map both modalities into one shared 3-d space.
W_img = rng.normal(scale=0.1, size=(6, 3))
W_txt = rng.normal(scale=0.1, size=(5, 3))

def match_accuracy():
    sims = (img @ W_img) @ (txt @ W_txt).T     # 4x4 image-text scores
    return (sims.argmax(axis=1) == np.arange(4)).mean(), sims

print("before training: accuracy =", match_accuracy()[0])

lr = 0.1
for step in range(300):
    I, T = img @ W_img, txt @ W_txt
    logits = I @ T.T                          # row i: image i vs every caption
    p = np.exp(logits - logits.max(1, keepdims=True))
    p /= p.sum(1, keepdims=True)              # softmax over captions
    loss = -np.log(p[np.arange(4), np.arange(4)]).mean()
    g = (p - np.eye(4)) / 4                   # d loss / d logits
    W_img -= lr * img.T @ (g @ T)             # chain rule into each head
    W_txt -= lr * txt.T @ (g.T @ I)
    if step in (0, 299):
        print(f"step {step:3d}: contrastive loss = {loss:.3f}")

acc, sims = match_accuracy()
print("after training: accuracy =", acc)
for i, c in enumerate(concepts):
    print(f"image of {c:5s} -> best caption: '{concepts[sims[i].argmax()]}'")`, output: `before training: accuracy = 0.25
step   0: contrastive loss = 1.379
step 299: contrastive loss = 0.007
after training: accuracy = 1.0
image of dog   -> best caption: 'dog'
image of cat   -> best caption: 'cat'
image of car   -> best caption: 'car'
image of pizza -> best caption: 'pizza'`,
          walkthrough: [
            { lines: [6, 8], note: "Four image vectors (6-d) and four caption vectors (5-d). Row i of each describes the same concept. They are random here, which is the hardest case: there is no built-in similarity to exploit." },
            { lines: [11, 12], note: "The two projection heads. They are the only things we train — just like many real systems keep big pre-trained encoders and train a small connector." },
            { lines: [14, 18], note: "Matching = dot product in the shared space, then pick the highest-scoring caption for each image. Before training, accuracy is 0.25: chance level for 4 options." },
            { lines: [22, 26], note: "The contrastive loss: a softmax over every caption for each image, and we want the probability on the diagonal (the true pair) to be high. This is the image-to-text half of the loss used by CLIP-style models." },
            { lines: [27, 29], note: "The gradient of softmax cross-entropy with respect to the scores is (p − one-hot). We push it back through each projection with the chain rule and take a gradient step." },
            { lines: [33, 36], note: "After training, every image finds its own caption: the two modalities now share a space." },
          ] },
        { type: "p", text: "Real systems do the same thing at enormous scale: hundreds of millions of image-text pairs, large batches (so each image must beat many wrong captions), normalised vectors, a learned temperature, and the loss computed in both directions (image→text and text→image)." },
      ],
    },
    {
      id: "real-examples",
      title: "Real examples of multimodal AI",
      blocks: [
        { type: "timeline", title: "Milestones in multimodal AI", items: [
          { when: "2021", title: "CLIP (OpenAI)", text: "Trained an image encoder and a text encoder together on image-text pairs from the web with a contrastive loss. Enabled zero-shot image classification by comparing an image to captions like 'a photo of a cat'." },
          { when: "2021", title: "DALL·E (OpenAI)", text: "Generated images from text prompts, bringing text-to-image generation to wide attention." },
          { when: "2022", title: "Flamingo (DeepMind)", text: "Connected a frozen vision encoder to a frozen language model with new cross-attention layers, so the LLM could answer questions about images with few examples." },
          { when: "2022", title: "Stable Diffusion and Whisper", text: "An open text-to-image diffusion model, and an open speech-recognition model trained on a large multilingual audio-text corpus." },
          { when: "2023", title: "Vision-language chat models", text: "GPT-4 with vision, open models like LLaVA (vision encoder + projector + LLM), and Google's Gemini, which was designed to be multimodal from the start." },
          { when: "2024 →", title: "Native audio and any-to-any", text: "Models such as GPT-4o handle text, images and audio in one network, enabling real-time voice conversations. Video understanding and generation have improved rapidly since." },
        ] },
        { type: "callout", tone: "example", title: "What this looks like day to day", text: "Taking a photo of a restaurant menu in another language and asking for a translation; uploading a chart and asking what trend it shows; asking a phone assistant 'what am I looking at?' through the camera; generating a product mock-up from a sentence; automatic captions on videos. Each of these combines at least two modalities." },
      ],
    },
    {
      id: "use-cases",
      title: "Use cases of multimodal AI",
      blocks: [
        { type: "table", caption: "Where multimodal AI earns its keep", head: ["Domain", "Modalities", "What it does"], rows: [
          ["Customer support", "Photo + text (+ voice)", "Diagnose damage, read error screens, check receipts, route tickets"],
          ["Documents", "Scanned pages + text", "Read invoices, forms and charts that are images rather than clean text"],
          ["Accessibility", "Image/video → text/speech", "Describe surroundings or photos to blind and low-vision users"],
          ["Healthcare (research and assistive)", "Medical images + notes", "Help draft radiology reports or flag findings, always with expert review"],
          ["E-commerce", "Image ↔ text", "Search by photo, 'find similar', auto-generate product descriptions"],
          ["Robotics and driving", "Camera + lidar + language", "Understand scenes and follow spoken instructions"],
          ["Content and media", "Text → image/audio/video", "Draft illustrations, voice-overs and video clips; moderate uploaded media"],
        ] },
      ],
    },
    {
      id: "common-mistakes",
      title: "Common mistakes to avoid",
      blocks: [
        { type: "callout", tone: "warn", title: "Mistake 1: trusting fine details in images", text: "Vision-language models can confidently misread small text, count objects wrongly, confuse left and right, or 'see' details that are not there (visual hallucination). For anything that matters — a serial number, a dosage, a price — verify with a dedicated tool (OCR, a barcode reader) or ask the user to confirm." },
        { type: "list", items: [
          "**Using a multimodal model when text is enough.** If the input is already text, sending it as a screenshot wastes tokens and adds reading errors.",
          "**Ignoring image resolution.** Images are often resized before the model sees them; tiny text may become unreadable. Crop to the relevant region or send a higher-detail version if the API allows it.",
          "**Assuming the modalities are balanced.** Models often lean on the text and ignore the image (or vice versa). Test cases where the image contradicts the text to see which one wins.",
          "**Forgetting privacy.** Photos and voice notes leak far more than intended: faces, addresses on envelopes, other people in the background. Strip metadata and get consent.",
          "**Evaluating only on clean data.** Real user photos are blurry, dark and rotated. Build the test set from real traffic.",
        ] },
        { type: "p", text: "When should we *not* use multimodal AI? When the extra modality adds no information, when latency and cost budgets are tight, or when a simple, specialised tool (a barcode scanner, a classic OCR engine, a speech-to-text API followed by a text model) solves the problem more reliably." },
      ],
    },
    {
      id: "quick-summary",
      title: "Quick summary",
      blocks: [
        { type: "list", items: [
          "A modality is a type of data: text, image, audio, video, sensors and more.",
          "Multimodal AI accepts and/or produces several modalities; unimodal AI handles one.",
          "The recipe: one encoder per modality → projection into a shared space → fusion → a reasoning model → an output decoder.",
          "Fusion can be early, late or intermediate; most chat models insert projected image tokens into an LLM.",
          "Three families: understanding (many in, text out), generation (text to image/audio/video), and retrieval (shared embedding space).",
          "Watch out for visual hallucinations, token cost and privacy; use it only when the extra modality carries real information.",
        ] },
      ],
    },
  ],
  quiz: [
    { q: "What is a 'modality' in AI?", options: ["The total number of layers in a neural network", "A type of data, such as text, images or audio", "A training technique used only for transformers", "The output layer that turns scores into labels"], answer: 1, explain: "A modality is a kind of data with its own structure (text tokens, pixel grids, audio waveforms). It is not about model size, a training technique or a layer." },
    { q: "Our support bot must find, among 50,000 old ticket photos, the ones that match a typed description. Which approach fits best?", options: ["Send all 50,000 photos to a vision-language chat model per query", "Train a separate image classifier for every possible description", "Embed photos and query in a shared space and search nearest neighbours", "Run OCR on every photo and use keyword search over the extracted text"], answer: 2, explain: "This is cross-modal retrieval. Photos are embedded once; each query is one text embedding plus a fast vector search. Calling a chat model 50,000 times is far too slow and costly, and OCR only finds written text, not what the object looks like." },
    { q: "In the lesson's code, accuracy before training was 0.25 with 4 image-caption pairs. Why that number?", options: ["Chance level: one correct caption out of four by luck", "The projection heads were initialised to output only zeros", "The contrastive loss value at step 0 was exactly 0.25", "Only one of the four images had a caption in the dataset"], answer: 0, explain: "With random projections the best-scoring caption is essentially random, so we expect about 1 correct match in 4. The loss started at 1.379, close to ln 4 ≈ 1.386, which says the same thing." },
    { q: "How does late fusion differ from intermediate fusion?", options: ["Late fusion mixes raw pixels and text before any encoder runs", "Late fusion combines only at the end; intermediate fusion mixes inside the network", "They are the same method; the two names are used interchangeably", "Intermediate fusion keeps modalities fully separate until the final prediction step"], answer: 1, explain: "Late fusion keeps separate pipelines until the very end (scores or embeddings). Intermediate fusion lets the modalities interact in middle layers, e.g. with cross-attention, which is how most vision-language chat models work. Mixing raw inputs first is early fusion." },
    { q: "Which statement about multimodal chat models is a misconception?", options: ["Images become many vectors, so they cost extra tokens", "They can misread small text in a blurry photo", "Their descriptions of image details are always reliable", "They often use a vision encoder plus a projection into the LLM"], answer: 2, explain: "Vision-language models can hallucinate visual details, miscount objects and misread text, so important details should be verified. The other three statements are true." },
  ],
  takeaways: [
    "A modality is a type of data; multimodal AI handles two or more of them.",
    "Every modality is encoded into vectors and projected into one shared space so a single model can reason over all of them.",
    "Fusion can happen early, late or in the middle; most chat models insert projected image tokens into an LLM.",
    "Three families: multimodal understanding, cross-modal generation, and cross-modal retrieval.",
    "Use it when the extra modality carries real information, and verify fine visual details.",
  ],
  terms: [
    { term: "Modality", def: "A type of data with its own structure, such as text, images, audio or video." },
    { term: "Multimodal model", def: "A model that takes in and/or produces more than one modality." },
    { term: "Encoder", def: "A network that turns raw data of one modality into vectors." },
    { term: "Projection (connector)", def: "A small learned layer that maps one encoder's vectors into another model's embedding space." },
    { term: "Fusion", def: "The step where information from different modalities is combined: early, late or intermediate." },
    { term: "Contrastive learning", def: "Training that pulls matching pairs (an image and its caption) together and pushes mismatched pairs apart." },
    { term: "Visual hallucination", def: "When a model describes image content that is not actually there." },
  ],
};
