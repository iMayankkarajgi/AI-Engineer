export default {
  id: 'contrastive-learning',
  minutes: 27,
  hook: 'How can a model learn that two photos show the same dog, or that a caption describes an image, when nobody has labelled a single example?',
  summary: 'Contrastive learning trains an encoder to map inputs to embeddings so that related pairs (positives) end up close together and unrelated pairs (negatives) end up far apart. Positive pairs usually come for free, from two augmented views of the same image or from an image and its caption, so huge unlabelled datasets can be used. Losses such as InfoNCE turn this into a "pick the true partner out of the batch" task, and methods like SimCLR, MoCo and CLIP use it to build the embeddings behind semantic search, RAG and multimodal AI.',
  sections: [
    {
      id: 'what-is-it',
      title: 'What is contrastive learning?',
      blocks: [
        { type: 'p', text: '**Contrastive learning** is a way of training a model to produce useful **embeddings** (lists of numbers that represent an input) by **comparing** examples. We show the model pairs of things and tell it only one fact about each pair: are these two related, or not? The model learns to place related things close together in embedding space and unrelated things far apart.' },
        { type: 'p', text: 'The model being trained is called an **encoder**: a network that turns an input (an image, a sentence, an audio clip) into a vector. After training, we usually throw away the training task and keep the encoder, because its embeddings capture meaning: similar inputs get similar vectors.' },
        { type: 'callout', tone: 'analogy', title: 'Spot the same person', text: 'Show a child two photos of their aunt, one in sunlight and one at night with a hat, and a photo of a stranger. The child learns that lighting and hats do not matter, while face shape does. Nobody explains "face shape" in words; the child learns it by contrasting same-person pairs with different-person pairs. Contrastive learning teaches an encoder the same way: what stays the same across positives is what matters.' },
        { type: 'p', text: 'Contrastive learning is usually a form of **self-supervised learning** (Lesson 2.2): the training signal comes from the structure of the data itself, not from human labels. It can also be supervised, when we use labels to decide which pairs are positive.' },
      ],
    },
    {
      id: 'why-needed',
      title: 'Why do we need contrastive learning?',
      blocks: [
        { type: 'p', text: 'Supervised learning needs labels, and labels are expensive. Meanwhile the world is full of unlabelled data: billions of images, web pages, and image-caption pairs. We want a way to learn good representations from all of it.' },
        { type: 'p', text: 'We also need representations that capture **meaning**. Early approaches described data with hand-made features (Lesson 2.4) or with **one-hot encoding**, where each word or category gets its own 0/1 column. One-hot vectors treat every pair of items as equally different: "cat" is as far from "kitten" as it is from "carburettor". Learned embeddings fix this by placing similar things nearby, and contrastive learning is one of the most effective ways to learn them.' },
        { type: 'list', items: [
          '**Uses unlabelled data:** positives can be created automatically.',
          '**Produces general-purpose embeddings:** one encoder can serve search, clustering, classification and recommendation.',
          '**Needs few labels downstream:** a small classifier on top of good embeddings (a "linear probe") can work well with little labelled data.',
          '**Connects different modalities:** it can put images and text in the same space, so a sentence can find a photo.',
        ] },
        { type: 'callout', tone: 'note', title: 'Background', text: 'For the background ideas mentioned here, feature engineering and one-hot encoding, see Lesson 2.4.' },
      ],
    },
    {
      id: 'key-idea',
      title: 'The key idea: pull together, push apart',
      blocks: [
        { type: 'p', text: 'Every contrastive method follows one principle: **similar pairs should have similar embeddings; dissimilar pairs should have dissimilar embeddings.** We measure similarity between two embeddings, usually with **cosine similarity** (the cosine of the angle between the vectors, from −1 to 1), after normalising each embedding to length 1.' },
        { type: 'viz', name: 'contrastive', caption: 'An anchor, a positive and negatives. Step the training and watch the positive pulled closer while negatives are pushed away.' },
        { type: 'p', text: 'Why do we need the "push apart" half? Without it, the encoder can cheat: map **every** input to the same vector. Then every positive pair is perfectly similar and the loss looks great, but the embeddings are useless. This failure is called **representation collapse**. Negatives prevent it by requiring different things to stay different.' },
        { type: 'p', text: 'There is also a deeper effect: by deciding what counts as a positive, we decide what the model should **ignore**. If two crops of the same photo with different colours are positives, the model learns that crop position and colour shifts do not change meaning. These are called **invariances**.' },
      ],
    },
    {
      id: 'pairs',
      title: 'Positive pairs and negative pairs',
      blocks: [
        { type: 'p', text: 'A **positive pair** is two inputs that should be close in embedding space. A **negative pair** is two inputs that should be far apart. In a typical setup we pick an **anchor** example, one positive for it, and many negatives.' },
        { type: 'table', head: ['Setting', 'Positive pair', 'Negatives'], rows: [
          ['Images, self-supervised (e.g. SimCLR)', 'Two random augmentations (crop, flip, colour jitter, blur) of the same photo', 'Augmentations of other photos in the batch'],
          ['Image and text (e.g. CLIP)', 'An image and its own caption', 'The other captions in the batch'],
          ['Text search embeddings', 'A question and a passage that answers it', 'Other passages in the batch, plus "hard" passages that look similar but do not answer'],
          ['Sentences (e.g. SimCSE)', 'The same sentence encoded twice with different dropout noise', 'Other sentences in the batch'],
          ['Face recognition', 'Two photos of the same person', 'Photos of other people'],
          ['Supervised contrastive', 'Two examples with the same class label', 'Examples with different labels'],
        ] },
        { type: 'p', text: 'A very common trick is **in-batch negatives**: with a batch of N positive pairs, each anchor uses its own partner as the positive and the other N − 1 partners as negatives. Negatives come for free, which is why bigger batches often help.' },
        { type: 'p', text: '**Hard negatives** are negatives that look similar to the anchor but are not related, such as a passage about Python the snake for a question about Python the language. They teach fine distinctions. Random negatives are often too easy to teach much.' },
        { type: 'callout', tone: 'warn', title: 'False negatives', text: 'With in-batch negatives, two different examples might actually be related, for example two different photos of golden retrievers in the same batch. The loss then pushes apart things that should be close. This is usually tolerable in large, diverse datasets, but it hurts with small or repetitive ones, and some methods try to detect and remove such false negatives.' },
        { type: 'check', question: 'Our batch has 64 image-caption pairs and we use in-batch negatives. How many negatives does each image get?', answer: '63: every caption in the batch except its own. With a batch of 32,768 (the size used for CLIP), each image would get 32,767 negatives.' },
      ],
    },
    {
      id: 'step-by-step',
      title: 'How contrastive learning works, step by step',
      blocks: [
        { type: 'steps', title: 'One training step (SimCLR-style, for images)', items: [
          { title: 'Sample a batch', text: 'Take N unlabelled images, for example N = 256.' },
          { title: 'Create two views', text: 'Apply two random augmentations to each image (random crop + colour change, etc.). Now we have 2N images; the two views of the same photo form a positive pair.' },
          { title: 'Encode', text: 'Pass every view through the encoder (e.g. a ResNet or Vision Transformer) to get a representation, then through a small projection head to get an embedding.' },
          { title: 'Normalise and compare', text: 'Normalise each embedding to length 1 and compute cosine similarities between all pairs: a big similarity matrix.' },
          { title: 'Compute the loss', text: 'For each view, apply a softmax over its similarities (divided by a temperature) and ask the model to give high probability to its true partner. This is the InfoNCE loss.' },
          { title: 'Update', text: 'Backpropagate and update the encoder so positive similarities rise and negative similarities fall. Repeat for many batches.' },
          { title: 'Keep the encoder', text: 'After training, discard the projection head and use the encoder\'s representations for downstream tasks.' },
        ] },
        { type: 'flow', title: 'The contrastive training pipeline', nodes: [
          { label: 'Unlabelled data', detail: 'Images, text, or image-caption pairs. No labels needed.' },
          { label: 'Make pairs', detail: 'Augment twice, or pair an image with its caption. Pairs are positives; everything else in the batch is a negative.' },
          { label: 'Encoder', detail: 'A neural network maps each input to an embedding vector, normalised to length 1.' },
          { label: 'Similarity matrix', detail: 'Cosine similarity for every anchor-candidate pair. The diagonal holds the positives.' },
          { label: 'InfoNCE loss', detail: 'Softmax over each row; maximise the probability of the true partner.' },
          { label: 'Useful embeddings', detail: 'The trained encoder powers search, clustering, classification and more.' },
        ] },
        { type: 'matrix', title: 'Similarity matrix after training (4 image-caption pairs)', rows: ['img: dog', 'img: car', 'img: pizza', 'img: beach'], cols: ['"a dog"', '"a car"', '"a pizza"', '"a beach"'], values: [[0.91, 0.08, 0.12, 0.21], [0.05, 0.88, 0.02, 0.10], [0.14, 0.03, 0.86, 0.09], [0.22, 0.11, 0.07, 0.84]], format: 'num', caption: 'Illustrative values. Training pushes the diagonal (positives) high and everything else (negatives) low. Each row is one softmax "classification" over the candidates.' },
      ],
    },
    {
      id: 'losses',
      title: 'Loss functions used in contrastive learning',
      blocks: [
        { type: 'p', text: 'Three loss families dominate. Let `d` be a distance between embeddings and `sim` a similarity.' },
        { type: 'tabs', items: [
          { label: 'Contrastive (pairwise) loss', blocks: [
            { type: 'p', text: 'The original formulation (Hadsell, Chopra and LeCun, 2006) looks at one pair at a time. For a positive pair, it penalises distance; for a negative pair, it penalises only if they are closer than a **margin** m.' },
            { type: 'formula', expr: 'L = y · d² + (1 − y) · max(0, m − d)²', where: [ ['y', '1 for a positive pair, 0 for a negative pair'], ['d', 'distance between the two embeddings'], ['m', 'margin: how far apart negatives must be'] ] },
            { type: 'p', text: 'Negatives that are already further apart than m contribute nothing, so the model does not waste effort pushing them infinitely far.' },
          ] },
          { label: 'Triplet loss', blocks: [
            { type: 'p', text: 'Used famously in face recognition (FaceNet, 2015). Take an anchor a, a positive p and a negative n. The positive must be closer than the negative by at least a margin m.' },
            { type: 'formula', expr: 'L = max(0, d(a, p) − d(a, n) + m)', caption: 'With m = 0.2: if d(a, p) = 0.3 and d(a, n) = 0.4, L = max(0, 0.3 − 0.4 + 0.2) = 0.1, so we still push. If d(a, n) = 0.6, L = 0: the triplet is already satisfied.' },
            { type: 'p', text: 'Choosing which triplets to train on (triplet mining) matters a lot; easy triplets give zero loss and teach nothing.' },
          ] },
          { label: 'InfoNCE / NT-Xent', blocks: [
            { type: 'p', text: '**InfoNCE** (popularised by van den Oord and colleagues in 2018) compares one positive against many negatives at once. It is a softmax cross-entropy where the "correct class" is the true partner. SimCLR calls its version **NT-Xent** (normalised temperature-scaled cross-entropy).' },
            { type: 'formula', expr: 'L = −log [ exp(sim(a, p) / τ) / ∑ₖ exp(sim(a, kₖ) / τ) ]', where: [ ['sim', 'cosine similarity of normalised embeddings'], ['τ', 'temperature: small τ sharpens the softmax and focuses on hard negatives'], ['kₖ', 'all candidates: the positive plus every negative'] ] },
            { type: 'p', text: 'Worked example: positive similarity 0.9, two negatives with 0.1 and 0.2. With τ = 1 the softmax gives the positive probability 0.51, loss 0.67. With τ = 0.1 the logits become 9, 1 and 2, the positive gets 0.9988, and the loss is 0.0012. Temperature strongly changes how hard the model is pushed.' },
          ] },
        ] },
        { type: 'deeper', title: 'Why InfoNCE works so well', blocks: [
          { type: 'p', text: 'InfoNCE turns representation learning into an N-way classification problem: "which of these N candidates is my partner?" More negatives make the task harder and the learning signal richer. Theoretically, minimising InfoNCE maximises a lower bound on the **mutual information** between the two views, i.e. it keeps the information the views share and discards what differs (the augmentation noise).' },
          { type: 'p', text: 'A random encoder with N candidates would score about ln(N) loss if it spread probability evenly (ln 8 ≈ 2.08). A random encoder at low temperature can score even worse, because it is confidently wrong, as our code shows at step 0.' },
        ] },
      ],
    },
    {
      id: 'code',
      title: 'Code: training a tiny encoder with InfoNCE',
      blocks: [
        { type: 'p', text: 'Eight items each have 4 "content" numbers that identify them, plus 12 "nuisance" numbers that change wildly between views (think lighting and background). We train a linear encoder from 16 numbers to a 4-D embedding with InfoNCE. Nobody tells it which dimensions matter; it must discover that content is shared across views and nuisance is not.' },
        { type: 'code', lang: 'python', title: 'tiny_infonce.py', code: `import numpy as np

rng = np.random.default_rng(0)
n, tau = 8, 0.2
content = rng.normal(size=(n, 4))                  # what makes each item unique
noise_scale = np.r_[np.full(4, 0.2), np.full(12, 2.0)]  # 12 "nuisance" dims vary a lot

def views():  # two random augmentations of the same 8 items (like crops/colour jitter)
    base = np.hstack([content, np.zeros((n, 12))])
    return [base + rng.normal(size=base.shape) * noise_scale for _ in range(2)]

W = rng.normal(scale=0.1, size=(16, 4))            # the encoder we train: 16 -> 4

def embed(X):                                      # linear encoder + L2-normalise
    U = X @ W
    norm = np.linalg.norm(U, axis=1, keepdims=True)
    return U / norm, norm

def info_nce(Z1, Z2):                              # row i of Z1 should pick row i of Z2
    logits = Z1 @ Z2.T / tau                       # cosine similarity / temperature
    P = np.exp(logits - logits.max(axis=1, keepdims=True))
    P /= P.sum(axis=1, keepdims=True)              # softmax over the 8 candidates
    return -np.log(np.diag(P)).mean(), P

def back_norm(dZ, Z, norm):                        # gradient through U / |U|
    return (dZ - Z * (dZ * Z).sum(axis=1, keepdims=True)) / norm

for step in range(401):
    X1, X2 = views()
    (Z1, n1), (Z2, n2) = embed(X1), embed(X2)
    loss, P = info_nce(Z1, Z2)
    if step % 100 == 0:
        S = Z1 @ Z2.T
        print(f"step {step:3d}  loss {loss:.3f}  correct matches {(P.argmax(1) == np.arange(n)).sum()}/8"
              f"  positive sim {np.diag(S).mean():+.2f}  negative sim {S[~np.eye(n, dtype=bool)].mean():+.2f}")
    dL = (P - np.eye(n)) / (n * tau)               # gradient of the loss w.r.t. Z1 @ Z2.T
    W -= 0.1 * (X1.T @ back_norm(dL @ Z2, Z1, n1) + X2.T @ back_norm(dL.T @ Z1, Z2, n2))

print(f"weight on content dims {np.abs(W[:4]).mean():.3f}, on nuisance dims {np.abs(W[4:]).mean():.3f}")
print(f"random-guess loss with 8 candidates = ln(8) = {np.log(n):.3f}")`, output: `step   0  loss 4.488  correct matches 1/8  positive sim +0.02  negative sim -0.04
step 100  loss 1.111  correct matches 5/8  positive sim +0.82  negative sim -0.10
step 200  loss 0.704  correct matches 7/8  positive sim +0.85  negative sim -0.02
step 300  loss 0.621  correct matches 7/8  positive sim +0.89  negative sim -0.06
step 400  loss 0.535  correct matches 7/8  positive sim +0.87  negative sim -0.09
weight on content dims 1.186, on nuisance dims 0.060
random-guess loss with 8 candidates = ln(8) = 2.079`, walkthrough: [
          { lines: [3, 10], note: 'The data and the augmentation: each call to views() returns two noisy copies of the same 8 items. Content dimensions barely change; nuisance dimensions change a lot.' },
          { lines: [12, 17], note: 'The encoder is a single 16 × 4 matrix W, followed by normalising each embedding to length 1 so dot products are cosine similarities.' },
          { lines: [19, 23], note: 'InfoNCE: an 8 × 8 similarity matrix divided by the temperature, a softmax over each row, and the loss is −log of the probability on the diagonal (the true partner).' },
          { lines: [25, 26], note: 'Helper for backpropagating through the length-normalisation step.' },
          { lines: [28, 35], note: 'Each step draws fresh views (fresh positives and negatives) and logs progress. At step 0 the encoder is random: 1 of 8 matches, loss 4.49 (worse than ln 8 because the low temperature makes random guesses overconfident).' },
          { lines: [36, 37], note: 'The gradient of softmax cross-entropy is (P − I): push up the diagonal, push down the rest. It flows through both views back into W.' },
          { lines: [39, 40], note: 'By step 400, 7 of 8 items are matched, positives have similarity ≈ 0.87 and negatives ≈ −0.09. The encoder learned, without labels, to put about 20× more weight on content than on nuisance dimensions.' },
        ] },
        { type: 'check', question: 'If we removed the negatives and only maximised the similarity of positive pairs, what could the encoder learn instead?', answer: 'It could collapse: map every input to the same vector, making every positive pair perfectly similar while the embeddings carry no information. The negatives (the denominator of InfoNCE) are what force different items apart. Methods without negatives, like BYOL, need other tricks to avoid collapse.' },
      ],
    },
    {
      id: 'methods',
      title: 'Popular contrastive learning methods',
      blocks: [
        { type: 'timeline', title: 'Key methods', items: [
          { when: '2006', title: 'Contrastive loss', text: 'Hadsell, Chopra and LeCun introduce a margin-based pairwise loss for learning embeddings.' },
          { when: '2015', title: 'FaceNet', text: 'Google trains face embeddings with triplet loss; same-person faces cluster together.' },
          { when: '2018', title: 'CPC and InfoNCE', text: 'Contrastive Predictive Coding introduces the InfoNCE loss.' },
          { when: '2019–2020', title: 'MoCo', text: 'Momentum Contrast (Facebook AI) keeps a large queue of negatives encoded by a slowly updated "momentum" encoder, so it does not need huge batches.' },
          { when: '2020', title: 'SimCLR', text: 'A simple framework (Google): strong augmentations, a projection head, NT-Xent loss and large batches.' },
          { when: '2020', title: 'BYOL', text: 'DeepMind shows good representations can be learned without negatives, using an online and a target network.' },
          { when: '2021', title: 'CLIP and SimCSE', text: 'CLIP (OpenAI) aligns images and text from about 400 million pairs. SimCSE uses dropout noise as augmentation for sentence embeddings.' },
        ] },
        { type: 'compare', title: 'Three landmark methods', options: [
          { name: 'SimCLR', summary: 'Two augmented views per image; other images in the batch are negatives.', pros: ['Very simple', 'Strong results'], cons: ['Needs very large batches for many negatives'], bestFor: 'Self-supervised image pre-training' },
          { name: 'MoCo', summary: 'A queue of past embeddings from a momentum encoder supplies many negatives.', pros: ['Many negatives with small batches', 'Memory efficient'], cons: ['Extra encoder and queue to manage'], bestFor: 'Image pre-training on limited hardware' },
          { name: 'CLIP', summary: 'An image encoder and a text encoder trained so matching image-caption pairs are similar.', pros: ['Links vision and language', 'Zero-shot classification by comparing an image with text prompts'], cons: ['Needs huge paired datasets', 'Inherits biases of web data'], bestFor: 'Multimodal search, zero-shot image classification, text-to-image systems' },
        ], rows: [
          ['Positives', 'Two augmentations of one image', 'Two augmentations of one image', 'An image and its caption'],
          ['Negatives', 'Other images in the batch', 'A queue of earlier embeddings', 'Other captions/images in the batch'],
          ['Modalities', 'Images', 'Images', 'Images + text'],
        ], verdict: 'All three use an InfoNCE-style loss; they differ in where positives and negatives come from.' },
      ],
    },
    {
      id: 'use-cases',
      title: 'Real-world use cases, and limits',
      blocks: [
        { type: 'list', items: [
          '**Semantic search and RAG:** text embedding models are commonly trained contrastively on (query, relevant passage) pairs with in-batch and hard negatives. These embeddings power vector databases and retrieval in RAG (Module 10).',
          '**Multimodal search:** CLIP-style models let users search photos with words ("red sneakers on a beach") and are used as components in many text-to-image and vision-language systems (Module 16).',
          '**Face verification:** unlocking a phone or matching ID photos compares face embeddings learned with contrastive or triplet-style losses.',
          '**Recommendation:** users and items are embedded so that a user is near items they engaged with.',
          '**Pre-training with few labels:** in medical imaging or industrial inspection, contrastive pre-training on unlabelled images followed by a small labelled fine-tune can beat training from scratch.',
          '**Duplicate and near-duplicate detection:** finding repeated support tickets, copied images or near-identical documents.',
        ] },
        { type: 'callout', tone: 'warn', title: 'Common pitfalls', text: 'Weak or wrong augmentations teach the wrong invariances (if colour matters for your task, do not use colour jitter as an augmentation). Too few or too easy negatives give weak embeddings. False negatives in small or repetitive datasets push related items apart. Temperature is a sensitive setting. And contrastive embeddings reflect the data they were trained on, including its biases.' },
        { type: 'p', text: '**When not to use it:** if you have plenty of labelled data for one narrow task, plain supervised training is simpler. If an off-the-shelf embedding model already works for your domain, use it rather than training your own; fine-tune it contrastively on your own (query, passage) pairs only when retrieval quality on your data is not good enough.' },
      ],
    },
    {
      id: 'common-mistakes',
      title: 'Common mistakes and how to spot them',
      blocks: [
        { type: 'p', text: 'A contrastive training run can fail quietly. The loss goes down, nothing crashes, and the embeddings are still poor. The good news is that a few cheap numbers reveal most problems. After each evaluation we print three things: the **mean positive similarity**, the **mean negative similarity**, and the loss compared with **ln(N)**, the loss of a blind guess among N candidates.' },
        { type: 'table', caption: 'Reading the three numbers', head: ['What we see', 'Likely cause', 'What to try'], rows: [
          ['Positive and negative similarity are both near 1; loss sits at ln(N)', 'Collapse: every input maps to almost the same vector', 'Check that negatives are really in the loss; check the normalisation step; lower the learning rate'],
          ['Loss falls fast, but search quality on real queries stays poor', 'Negatives are too easy, so the task is solved without learning fine detail', 'Add hard negatives; use a larger batch'],
          ['Loss stalls well above zero; some true pairs never match', 'False negatives: related items are being pushed apart', 'Remove duplicates from each batch; skip negatives that score suspiciously high'],
          ['Good on training pairs, poor on a new kind of input', 'The positives taught the wrong invariances', 'Rethink the augmentations or the way pairs are built'],
          ['Training is unstable, or a few pairs dominate every update', 'Temperature too low', 'Raise τ a little and compare'],
          ['Positives and negatives stay close together for a long time', 'Temperature too high, so the push is weak and spread thin', 'Lower τ a little and compare'],
        ] },
        { type: 'p', text: 'Why does temperature matter so much? In InfoNCE, each negative is pushed away in proportion to the probability the softmax gives it. A low τ puts almost all of that probability on the negatives closest to the anchor. That is useful when those are true hard negatives. It is harmful when one of them is a false negative, because nearly the whole push then lands on an item that should have stayed close. The practice code below shows this with four numbers.' },
        { type: 'steps', title: 'A five-minute sanity check before a long run', items: [
          { title: 'Look at ten pairs by eye', text: 'Print ten positives and a few negatives for each. If we cannot tell why a pair is positive, the model cannot either.' },
          { title: 'Check the starting loss', text: 'With a fresh encoder it should be near ln(N), or above it at a low temperature. A value far below means the pairs leak an easy shortcut.' },
          { title: 'Overfit one small batch', text: 'Train on a single fixed batch. The loss should drop close to zero. If it cannot, there is a bug in the loss or the gradient.' },
          { title: 'Track the two similarities', text: 'Positive similarity should rise while negative similarity stays low. If both rise together, collapse has begun.' },
          { title: 'Test on the real task', text: 'Measure retrieval on held-out queries, not just the loss. The loss depends on batch size and τ, so it is not comparable across runs.' },
        ] },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will compute InfoNCE by hand for one anchor with four candidates: its positive, one hard negative and two easy negatives. No training, just the loss. We try two temperatures and also print how the push on the negatives is shared out. Then we feed in a collapsed encoder, where every similarity is 1.' },
        { type: 'code', lang: 'python', title: 'practice_infonce_temperature.py', code: `import numpy as np

def info_nce(sims, tau):
    """sims[0] is the positive; the rest are negatives. Returns the loss
    and the softmax probability given to every candidate."""
    logits = np.array(sims) / tau
    p = np.exp(logits - logits.max())
    p /= p.sum()
    return -np.log(p[0]), p

cases = {
    "trained encoder": [0.8, 0.7, 0.1, 0.0],   # one negative is almost as close
    "collapsed encoder": [1.0, 1.0, 1.0, 1.0], # every input maps to one vector
}

for label, sims in cases.items():
    print(f"{label}: similarities {sims}")
    for tau in (1.0, 0.1):
        loss, p = info_nce(sims, tau)
        # The gradient pushes each negative away in proportion to its probability
        push = p[1:] / p[1:].sum()
        print(f"  tau={tau:<4} loss={loss:.3f}  P(positive)={p[0]:.3f}"
              f"  share of push on negatives: {np.round(push, 3).tolist()}")

print(f"ln(4) = {np.log(4):.3f}  (loss when all 4 candidates look the same)")`, output: `trained encoder: similarities [0.8, 0.7, 0.1, 0.0]
  tau=1.0  loss=1.048  P(positive)=0.351  share of push on negatives: [0.489, 0.268, 0.243]
  tau=0.1  loss=0.314  P(positive)=0.730  share of push on negatives: [0.997, 0.002, 0.001]
collapsed encoder: similarities [1.0, 1.0, 1.0, 1.0]
  tau=1.0  loss=1.386  P(positive)=0.250  share of push on negatives: [0.333, 0.333, 0.333]
  tau=0.1  loss=1.386  P(positive)=0.250  share of push on negatives: [0.333, 0.333, 0.333]
ln(4) = 1.386  (loss when all 4 candidates look the same)`, walkthrough: [
          { lines: [3, 9], note: 'InfoNCE for one anchor: divide similarities by τ, take a softmax, and the loss is −log of the probability on the positive (index 0).' },
          { lines: [11, 13], note: 'Two situations. A trained encoder with one hard negative at 0.7, close to the positive at 0.8. And a collapsed encoder where everything looks identical.' },
          { lines: [18, 23], note: 'For each temperature, print the loss, the probability of the positive, and each negative\'s share of the total push (its probability divided by the sum over negatives).' },
          { lines: [25, 25], note: 'The blind-guess loss with four candidates, for comparison with the collapsed case.' },
        ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Make the hard negative even harder: change `0.7` to `0.79`. Predict whether the loss at τ = 0.1 goes up or down, and roughly what P(positive) becomes when two candidates are almost tied.',
          'Add `0.05` to the temperatures. Predict what happens to the hard negative\'s share of the push, and to the loss of the collapsed encoder.',
          'Add ten more easy negatives with similarity `0.0` to the trained case. Predict which temperature\'s loss changes more, and what the collapsed loss would be with the same 14 candidates.',
        ] },
        { type: 'check', question: 'At τ = 0.1 the hard negative receives 99.7% of the push, compared with 48.9% at τ = 1.0. Why is this a strength and also a risk?', answer: 'A strength, because the two easy negatives are already far away and teach nothing, so focusing the update on the one confusing candidate is efficient. A risk, because if that "hard negative" is actually a related item (a false negative), almost the entire update goes into pushing apart two things that belong together. Low temperatures need clean negatives.' },
        { type: 'check', question: 'For the collapsed encoder, the loss is 1.386 at both temperatures and the push is shared equally. Why can temperature not help here?', answer: 'All four similarities are equal, so dividing them by any τ still gives four equal logits, and the softmax gives each candidate 0.25. The loss is −ln(0.25) = ln(4) ≈ 1.386 whatever τ is. A loss stuck at ln(N) with similarities near 1 is the fingerprint of collapse; the fix lies in the encoder and training setup, not in the temperature.' },
      ],
    },
  ],
  quiz: [
    {
      q: 'What is the central goal of contrastive learning?',
      options: ["Predict the correct class label for every single training input", "Make related pairs similar and unrelated pairs dissimilar", "Compress images into smaller files for cheaper storage", "Maximise the total reward collected by an acting agent"],
      answer: 1,
      explain: 'Contrastive learning shapes the embedding space by pulling positives together and pushing negatives apart. It does not need class labels, and it is not about rewards.',
    },
    {
      q: 'We trained an encoder using only positive pairs and a loss that rewards high positive similarity. Now every input gets nearly the same embedding. What went wrong, and what is the standard fix?',
      options: ["The learning rate was too low; raising it will fix this", "The batch was too large; shrinking it will fix this", "Representation collapse; add negatives, e.g. InfoNCE", "The embeddings were normalised; remove the normalisation"],
      answer: 2,
      explain: 'Without a force pushing different items apart, mapping everything to one point minimises the loss. Negatives in the loss prevent this collapse.',
    },
    {
      q: 'Triplet loss with margin m = 0.2: d(anchor, positive) = 0.5 and d(anchor, negative) = 0.6. What is the loss?',
      options: ['0', '0.3', '0.1', '1.3'],
      answer: 2,
      explain: 'L = max(0, 0.5 − 0.6 + 0.2) = max(0, 0.1) = 0.1. The negative is further than the positive, but not by the required margin, so there is still a loss.',
    },
    {
      q: 'How do SimCLR and CLIP differ in where their positive pairs come from?',
      options: ["SimCLR uses two augmented views; CLIP pairs images with captions", "SimCLR uses human class labels; CLIP uses image augmentations", "Both use only pairs of sentences, never images, as positives", "CLIP has no positive pairs at all; it uses only negatives"],
      answer: 0,
      explain: 'SimCLR is self-supervised on images via augmentations. CLIP is trained on image-caption pairs, which places images and text in one shared space.',
    },
    {
      q: 'A teammate says: "Contrastive learning always needs human-labelled data to know which pairs are similar." What is the best correction?',
      options: ["Correct: every single pair has to be labelled by a human first", "Usually not: positives come free from augmentations or captions", "Contrastive learning only works for reinforcement learning", "Labels are needed for the negative pairs, but not positives"],
      answer: 1,
      explain: 'The power of contrastive learning is that positive pairs come for free from data structure. A supervised variant exists, but labels are not required.',
    },
  ],
  takeaways: [
    'Contrastive learning trains an encoder so positives are close and negatives are far apart in embedding space.',
    'Positives usually come for free: two augmentations of one input, or naturally paired data like an image and its caption.',
    'Negatives prevent representation collapse; in-batch and hard negatives are common sources.',
    'InfoNCE turns learning into "pick the true partner among N candidates"; temperature τ controls its sharpness.',
    'SimCLR, MoCo and CLIP are landmark methods; contrastive embeddings power semantic search, RAG and multimodal AI.',
  ],
  terms: [
    { term: 'Contrastive learning', def: 'Learning embeddings by pulling related pairs together and pushing unrelated pairs apart.' },
    { term: 'Positive pair', def: 'Two inputs that should have similar embeddings, such as two views of the same image.' },
    { term: 'Negative pair', def: 'Two inputs that should have dissimilar embeddings.' },
    { term: 'InfoNCE', def: 'A softmax-based contrastive loss that asks the model to identify the positive among many negatives.' },
    { term: 'Temperature (τ)', def: 'A scale applied to similarities before the softmax; smaller values make the distribution sharper.' },
    { term: 'Representation collapse', def: 'A failure where the encoder maps all inputs to nearly the same embedding.' },
    { term: 'Hard negative', def: 'A negative example that looks similar to the anchor and is therefore informative to train on.' },
  ],
};
