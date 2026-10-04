export default {
  id: "how-does-llm-watermarking-work",
  minutes: 25,
  hook: "Can we hide an invisible signature in AI-written text using nothing but the choice of words, so that only someone with a secret key can find it?",
  summary: "LLM watermarking hides a statistical signal in generated text. At each step, a secret key and the previous token pick a random “preferred” (green) subset of the vocabulary, and the model's scores for those tokens are nudged up slightly. Any single word looks normal, but over hundreds of words the text contains far more green tokens than chance would give, which a detector with the key can measure with a simple z-score. It works well on long, unedited text and weakens with short texts and heavy paraphrasing.",
  sections: [
    {
      id: "what-and-why",
      title: "What is a watermark, and why put one in LLM text?",
      blocks: [
        { type: "p", text: "A **watermark** is a hidden or subtle mark embedded in something to show where it came from, ideally without spoiling it. Banknotes carry watermarks visible against the light; photos can carry invisible digital watermarks in their pixels. An **LLM watermark** is a hidden pattern in the *words* a language model chooses, which a detector can later check." },
        { type: "p", text: "Why would we want that? As AI-written text becomes common and hard to tell apart from human writing, several groups want a reliable way to answer “Did our model write this?”" },
        { type: "list", items: [
          "**Provenance and transparency**: platforms and regulators increasingly expect AI-generated content to be identifiable. The EU AI Act, for example, includes transparency obligations for marking AI-generated content in a machine-readable way.",
          "**Misinformation and spam**: spotting mass-produced AI text in reviews, comments or fake news campaigns.",
          "**Education**: helping (carefully) with questions of AI-assisted homework.",
          "**Training data hygiene**: model builders may want to filter AI-generated text out of future training data."
        ] },
        { type: "callout", tone: "analogy", title: "Think of it like a secret dice-rigged word game", text: "Imagine a writer who, whenever two words fit equally well, flips a secret coin that only they and a friend can predict, and picks the word the coin favours. Readers notice nothing; both words fit. But the friend, who can replay the coin flips, sees that the writer “won” the coin far more often than luck allows. That excess of wins is the watermark." }
      ]
    },
    {
      id: "how-llm-writes",
      title: "How does an LLM write text and choose the next word?",
      blocks: [
        { type: "p", text: "An LLM writes one **token** (a word or word piece) at a time. At each step it outputs a score, called a **logit**, for every token in its **vocabulary** (often 30,000 to over 200,000 tokens). The **softmax** function turns these scores into probabilities that sum to 1, and a **sampler** picks the next token at random according to those probabilities (temperature and top-p settings reshape them). The chosen token is appended, and the process repeats." },
        { type: "formula", expr: "p(token i) = exp(zᵢ) / ∑ⱼ exp(zⱼ)", where: [["zᵢ", "the logit (raw score) of token i"], ["p", "the probability the sampler uses"]], caption: "Softmax: higher logits become exponentially more likely." },
        { type: "viz", name: "temperature", caption: "See how logits become next-token probabilities. Notice how often several tokens have similar probability; that is the room a watermark uses." }
      ]
    },
    {
      id: "hidden-freedom",
      title: "The hidden freedom that makes watermarking possible",
      blocks: [
        { type: "p", text: "Take the sentence “The storm caused ___ damage.” Plausible next words include *severe*, *major*, *extensive*, *significant*, *serious*, *widespread*. Each might get 10–20% probability. Any of them gives a perfectly good sentence. This happens constantly in natural language: at most positions there are several good choices." },
        { type: "p", text: "That freedom is the hiding place. If we gently bias *which* of the good choices gets picked, in a pattern only we can predict, the text stays natural but carries a signal. At positions with no freedom (after “Barack”, the next token is almost surely “Obama”), the watermark simply cannot act, and that is fine." },
        { type: "p", text: "This idea, in the form described below, comes from Kirchenbauer and colleagues' 2023 paper *A Watermark for Large Language Models*, often called the green-list or red/green watermark." }
      ]
    },
    {
      id: "key-and-green-list",
      title: "The secret key, preferred tokens, and nudging the probabilities",
      blocks: [
        { type: "steps", title: "Generating one watermarked token", items: [
          { title: "Seed from key + previous token", text: "Combine a secret key with the previous token (for example, hash them together) to get a random seed. The same key and previous token always give the same seed." },
          { title: "Split the vocabulary", text: "Use the seed to randomly mark a fraction γ (gamma, say 25%) of the vocabulary as **green** (preferred tokens). The rest are **red** (other tokens)." },
          { title: "Nudge green logits", text: "Add a small constant δ (delta, say 2.0) to the logit of every green token. Red tokens are unchanged." },
          { title: "Softmax and sample as usual", text: "Green tokens are now more likely, but red tokens can still be chosen when they are clearly the best fit." },
          { title: "Repeat", text: "The next position uses the newly chosen token as its “previous token”, so it gets a completely different green list." }
        ] },
        { type: "p", text: "**A small worked example.** Four candidate words have equal logits, so each has 25% probability. Two of them happen to be green. After adding δ = 2 to the green ones, each green word's weight becomes e² ≈ 7.39 versus 1 for each red word. Green probability per word = 7.39 / (2 × 7.39 + 2) ≈ 0.44, red ≈ 0.06. The text still uses a fitting word, but very likely a green one." },
        { type: "formula", expr: "z′ᵢ = zᵢ + δ  if token i ∈ G(key, previous token),  else z′ᵢ = zᵢ", where: [["G", "the green list for this position"], ["δ", "watermark strength (bigger = easier to detect, more effect on text)"], ["γ", "share of the vocabulary that is green"]] },
        { type: "check", question: "Pause and predict: why does the green list depend on the previous token instead of being one fixed list of words for the whole text?", answer: "A fixed list would make the text overuse the same set of words (noticeable, and harmful to quality), and an attacker could discover the list just by counting word frequencies across many watermarked texts. Re-randomizing at every position spreads the bias evenly over the vocabulary and keeps the pattern invisible without the key." }
      ]
    },
    {
      id: "detection",
      title: "One token vs thousands of tokens: how detection works",
      blocks: [
        { type: "p", text: "One green token proves nothing: even human text hits the green list about γ = 25% of the time by chance. The evidence comes from **counting over many tokens**. The detector does not need the model at all, only the text, the tokenizer and the key." },
        { type: "steps", title: "Detecting the watermark", items: [
          { title: "Tokenize the text", text: "Split the suspect text into tokens with the same tokenizer." },
          { title: "Recompute each green list", text: "For each position, hash the key with the previous token to rebuild that position's green list." },
          { title: "Count green hits", text: "Count how many tokens fall in their position's green list: |s|_G out of T tokens." },
          { title: "Compute a z-score", text: "Compare the count with what chance predicts (γ·T) in units of standard deviation." },
          { title: "Decide", text: "If z exceeds a threshold (for example 4), flag the text as watermarked. A high threshold keeps false accusations of human text extremely rare." }
        ] },
        { type: "formula", expr: "z = (|s|_G − γ·T) / √(T · γ · (1 − γ))", where: [["|s|_G", "number of green tokens found"], ["T", "number of tokens checked"], ["γ", "green fraction (expected hit rate by chance)"]], caption: "For T = 200, γ = 0.25: chance predicts 50 green tokens with a standard deviation of about 6.1. Finding 134 gives z ≈ 13.7." },
        { type: "code", lang: "python", title: "green_list_watermark.py", code: `import hashlib
import numpy as np

V, GAMMA, DELTA, T = 1000, 0.25, 2.0, 200    # vocab, green share, nudge, length
rng = np.random.default_rng(0)

def green_list(prev_token, key=b"secret"):
    # Hash (secret key, previous token) -> seed -> a fresh 25% "green" subset
    h = hashlib.sha256(key + prev_token.to_bytes(4, "little")).digest()
    seed = int.from_bytes(h[:8], "little")
    return set(np.random.default_rng(seed).permutation(V)[: int(GAMMA * V)])

def generate(watermark):
    tokens = [0]
    for _ in range(T):
        logits = rng.normal(0, 2, V)             # stand-in for the model's scores
        if watermark:
            logits[list(green_list(tokens[-1]))] += DELTA   # nudge green tokens up
        p = np.exp(logits - logits.max())
        p /= p.sum()
        tokens.append(int(rng.choice(V, p=p)))
    return tokens

def z_score(tokens):
    # Count green hits; compare with what chance (GAMMA) would give
    n = len(tokens) - 1
    hits = sum(t in green_list(prev) for prev, t in zip(tokens, tokens[1:]))
    return hits / n, (hits - GAMMA * n) / np.sqrt(n * GAMMA * (1 - GAMMA))

def edit(tokens, frac):
    out = list(tokens)
    for i in rng.choice(np.arange(1, len(out)), int(frac * (len(out) - 1)), replace=False):
        out[i] = int(rng.integers(V))            # swap a word for a random one
    return out

wm, plain = generate(True), generate(False)
for name, toks in [("unwatermarked", plain), ("watermarked", wm),
                   ("wm, 30% edited", edit(wm, 0.3)), ("wm, 60% edited", edit(wm, 0.6)),
                   ("wm, first 16", wm[:17])]:
    frac, z = z_score(toks)
    print(f"{name:15} tokens={len(toks) - 1:3}  green={frac:.2f}  z={z:5.2f}  flagged={z > 4}")`, output: `unwatermarked   tokens=200  green=0.20  z=-1.63  flagged=False
watermarked     tokens=200  green=0.67  z=13.72  flagged=True
wm, 30% edited  tokens=200  green=0.48  z= 7.51  flagged=True
wm, 60% edited  tokens=200  green=0.33  z= 2.45  flagged=False
wm, first 16    tokens= 16  green=0.62  z= 3.46  flagged=False`,
          walkthrough: [
            { lines: [4, 5], note: "Settings: a 1,000-token toy vocabulary, 25% green, nudge δ = 2.0, 200 tokens per text." },
            { lines: [7, 11], note: "The green list: hash the secret key with the previous token, seed a random generator, and take a random 25% of the vocabulary." },
            { lines: [13, 22], note: "Generation: random logits stand in for the model. If watermarking is on, green logits get +δ before softmax and sampling." },
            { lines: [24, 28], note: "Detection: rebuild each green list, count hits, compute the z-score. No model needed, only the key." },
            { lines: [30, 34], note: "An editing attack: replace a fraction of tokens with random ones." },
            { lines: [36, 41], note: "Score unwatermarked text, watermarked text, two edited versions and a short 16-token snippet." }
          ] },
        { type: "chart", kind: "line", title: "Detection strength grows with length", xLabel: "Tokens checked (T)", yLabel: "Expected z-score", series: [
          { name: "67% green (as in our watermarked text)", points: [[10, 3.07], [25, 4.85], [50, 6.86], [100, 9.7], [200, 13.72], [400, 19.4]] },
          { name: "40% green (heavily edited)", points: [[10, 1.1], [25, 1.73], [50, 2.45], [100, 3.46], [200, 4.9], [400, 6.93]] }
        ], caption: "Computed from the z-score formula with γ = 0.25. The signal grows with √T, so short snippets are hard to judge while long texts give overwhelming evidence, even after moderate edits." }
      ]
    },
    {
      id: "vs-detectors",
      title: "How is this different from an AI text detector?",
      blocks: [
        { type: "compare", title: "Three ways to tell if text is AI-made",
          options: [
            { name: "Watermark detection", summary: "The generator deliberately embeds a keyed signal; a detector with the key tests for it.", pros: ["Statistically grounded, with a controllable false-positive rate", "Does not depend on writing style", "Fast; no model needed to detect"], cons: ["Only works for models that apply the watermark", "Needs the key", "Weakened by heavy paraphrasing and short texts"], bestFor: "A provider checking its own model's outputs" },
            { name: "Post-hoc AI-text classifiers", summary: "A model trained to guess whether any text “looks” AI-written.", pros: ["Works on text from any model", "No cooperation from the generator"], cons: ["Unreliable; known to misflag human writing, notably by non-native speakers", "Easily fooled by light editing", "Breaks as models change"], bestFor: "Rough screening only, never as proof" },
            { name: "Metadata / content credentials", summary: "Attach signed provenance information to a file (for example C2PA for media).", pros: ["Explicit and verifiable when present"], cons: ["Lost as soon as text is copied and pasted"], bestFor: "Images, video and documents kept as files" }
          ],
          rows: [
            ["Needs cooperation of the generator?", "Yes", "No", "Yes"],
            ["Survives copy-paste of plain text?", "Yes", "Not applicable", "No"],
            ["Gives a measurable false-positive rate?", "Yes (from the z threshold)", "Not reliably", "Not applicable"]
          ],
          verdict: "Watermarks give real statistical evidence, but only for cooperating models. Classifiers guess; metadata is strong for files but useless for pasted text." }
      ]
    },
    {
      id: "quality",
      title: "Why the quality of the text does not break",
      blocks: [
        { type: "list", items: [
          "**The nudge is small.** δ shifts preferences between good options; it does not force a green token. A red token that is clearly best still wins.",
          "**It only acts where there is freedom.** In low-entropy positions (one obvious next token), the bias changes nothing. In high-entropy positions, any choice was fine anyway.",
          "**The green list changes every step**, so no word gets systematically overused.",
          "**Strength is tunable.** Smaller δ means less effect on text but weaker detection; production systems tune this trade-off.",
          "**Some schemes aim to be distortion-free**, choosing tokens with keyed randomness so that, averaged over keys, the output distribution matches the original model exactly."
        ] },
        { type: "p", text: "Google DeepMind's **SynthID Text**, described in a 2024 *Nature* paper and used in Gemini, uses a related keyed scheme (a “tournament” over candidate tokens). The authors reported a large live experiment in which users did not rate watermarked responses noticeably differently from unwatermarked ones. Exact quality impact still depends on the scheme, the settings and the task; code and very factual text offer less freedom and therefore weaker watermarks." }
      ]
    },
    {
      id: "editing",
      title: "What happens when someone edits the text?",
      blocks: [
        { type: "p", text: "Editing replaces tokens, and each replaced token is green only by chance (25%). Because each green list depends on the previous token, changing one token can also disturb the check for the token after it. So edits pull the green fraction down toward γ and the z-score toward zero." },
        { type: "list", items: [
          "In our run, editing 30% of the tokens dropped z from 13.72 to 7.51: still clearly flagged.",
          "Editing 60% dropped z to 2.45: below the threshold, the watermark is effectively gone.",
          "A 16-token snippet of perfectly watermarked text gave z = 3.46: not enough evidence on its own."
        ] },
        { type: "callout", tone: "warn", title: "Watermarks can be removed", text: "Paraphrasing with another model, translating to another language and back, or tricks like asking the model to insert and later delete filler characters can wash the signal out. Mixing a little AI text into a long human document dilutes it. Watermarks are evidence that is cheap to check when present; their absence does not prove a human wrote the text, and their presence in a short snippet is weak evidence." },
        { type: "check", question: "From the output: unwatermarked text scored z = −1.63 and the 60%-edited text scored z = 2.45. Should we conclude the edited text is human-written?", answer: "No. A z below the threshold only means we lack strong evidence of the watermark. The text may still be AI-generated and edited, generated by a model without a watermark, or simply too short. Watermark detection can support a “yes”, but a “no” is not proof of human authorship." }
      ]
    },
    {
      id: "real-world-pros-cons",
      title: "Where LLM watermarking is used, and its advantages and disadvantages",
      blocks: [
        { type: "callout", tone: "example", title: "Real-world use", text: "Google DeepMind applies SynthID watermarking to Gemini text output and released an open-source implementation of SynthID Text (for example via Hugging Face Transformers) in 2024; the SynthID family also covers images, audio and video. OpenAI publicly said in 2024 that it had built a text watermarking method but had not released it, citing concerns such as easy circumvention and effects on some user groups. Image generators widely combine invisible watermarks with C2PA content credentials. For text, deployment remains limited and differs across providers." },
        { type: "table", head: ["Advantages", "Disadvantages"], rows: [
          ["Invisible to readers; little or no visible quality cost when tuned well", "Only detects text from models that embed it; open-weight models can simply skip it"],
          ["Detection needs only the key and tokenizer, not the model", "Needs enough tokens; short texts give weak evidence"],
          ["Controllable, very low false-positive rate on human text", "Paraphrasing, translation and heavy edits weaken or remove it"],
          ["Robust to light edits, cropping and copy-paste", "Low-entropy text (code, facts, lists) carries a weaker signal"],
          ["Keys can be kept private to resist forgery", "Key management and who may run detection raise trust and privacy questions"]
        ] }
      ]
    },
    {
      id: "choosing-the-threshold",
      title: "Going one level deeper",
      blocks: [
        { type: "p", text: "We used a threshold of z = 4 without saying where it comes from. The threshold is a choice about how often we are willing to accuse text that carries no watermark. For such text, the z-score behaves roughly like a standard bell curve, so each threshold maps to a chance of a false flag (using the normal approximation)." },
        { type: "table", caption: "What a threshold means when many texts are checked (normal approximation)", head: ["Threshold z", "Chance that one unwatermarked text is flagged", "Expected false flags in 1,000,000 texts"], rows: [
          ["2", "about 1 in 44", "about 22,750"],
          ["4", "about 1 in 31,600", "about 32"],
          ["6", "about 1 in 1 billion", "about 0.001"]
        ] },
        { type: "p", text: "A threshold of 2 sounds strict for a single text, but at the scale of a platform it wrongly flags tens of thousands of writers. That is why detectors use high thresholds, and why a high threshold in turn needs longer texts." },
        { type: "steps", title: "Dilution: AI text mixed into human text", items: [
          { title: "Set up", text: "A 1,000-token document. Human-written tokens are green 25% of the time (pure chance); watermarked tokens 67% of the time, as in our run. Chance predicts 250 green tokens with a standard deviation of √(1000 × 0.25 × 0.75) ≈ 13.7." },
          { title: "300 AI tokens, 700 human", text: "Green count ≈ 0.67 × 300 + 0.25 × 700 = 201 + 175 = 376. z = (376 − 250) / 13.7 ≈ 9.2. Still clearly flagged." },
          { title: "100 AI tokens, 900 human", text: "Green count ≈ 67 + 225 = 292. z = (292 − 250) / 13.7 ≈ 3.1. Below the threshold: the watermark is there, but it is drowned out." },
          { title: "What a detector can do", text: "Score sliding sections of the document instead of the whole. The 100 AI tokens alone would give z = (67 − 25) / √(100 × 0.1875) ≈ 9.7." }
        ] },
        { type: "p", text: "So a low score for a whole document does not rule out a watermarked passage inside it, and scoring many sections brings back the first problem: every extra test is another chance of a false flag, so the threshold has to rise with the number of sections checked." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build a small detector calculator using only the z-score formula. It answers three practical questions: how strong is the evidence for a given green count, how often does a threshold accuse unwatermarked text, and how many tokens do we need before a watermark of a given strength can be detected?" },
        { type: "code", lang: "python", title: "practice_watermark_calculator.py", code: `import math

GAMMA = 0.25                      # share of the vocabulary that is green

def z_score(green_hits, total):
    return (green_hits - GAMMA * total) / math.sqrt(total * GAMMA * (1 - GAMMA))

def false_positive_rate(z):
    # chance that unwatermarked text scores above z (normal approximation)
    return 0.5 * math.erfc(z / math.sqrt(2))

def tokens_needed(green_rate, threshold=4.0):
    # smallest T whose expected z-score reaches the threshold
    t = 1
    while z_score(green_rate * t, t) < threshold:
        t += 1
    return t

for hits, total in [(9, 20), (45, 100), (90, 200)]:      # all are 45% green
    print(f"{hits:>3}/{total:<3} green -> z={z_score(hits, total):5.2f}")

for z in [2, 4, 6]:
    print(f"threshold z={z}: about 1 in {1 / false_positive_rate(z):,.0f} "
          f"unwatermarked texts flagged")

for rate in [0.70, 0.50, 0.40, 0.30]:
    print(f"green rate {rate:.2f}: about {tokens_needed(rate)} tokens to reach z=4")`, output: `  9/20  green -> z= 2.07
 45/100 green -> z= 4.62
 90/200 green -> z= 6.53
threshold z=2: about 1 in 44 unwatermarked texts flagged
threshold z=4: about 1 in 31,574 unwatermarked texts flagged
threshold z=6: about 1 in 1,013,594,692 unwatermarked texts flagged
green rate 0.70: about 15 tokens to reach z=4
green rate 0.50: about 48 tokens to reach z=4
green rate 0.40: about 134 tokens to reach z=4
green rate 0.30: about 1200 tokens to reach z=4`,
          walkthrough: [
            { lines: [3, 6], note: "The z-score formula from the detection section, with γ = 0.25." },
            { lines: [8, 10], note: "The chance that text with no watermark scores above z, from the tail of a bell curve. This is what makes the false-positive rate controllable." },
            { lines: [12, 17], note: "Search for the smallest text length at which a given green rate is expected to reach the threshold." },
            { lines: [19, 27], note: "Three experiments: the same 45% green rate at three lengths, the meaning of three thresholds, and the length needed for four watermark strengths." }
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Set `GAMMA = 0.5`. Predict the sign of the z-score for `45/100` before running, and explain it.",
          "Call `tokens_needed(0.40, threshold=5.0)`. Predict whether it needs a few more tokens or many more than the 134 needed for z = 4.",
          "Add the case `(25, 100)` to the first loop. Predict its z-score without computing anything."
        ] },
        { type: "check", question: "At a 70% green rate, 15 tokens are enough to reach z = 4. At 30%, it takes about 1,200. Why does a weaker watermark cost so many more tokens?", answer: "What counts is the excess over chance. At 70% the excess is 45 points; at 30% it is only 5 points, 9 times smaller. The z-score grows with the excess times √T, so the length needed grows with 1 / excess². A 9 times smaller excess needs 81 times more tokens: 15 × 81 ≈ 1,200." },
        { type: "check", question: "A platform scores 1,000,000 human-written posts a day with a threshold of z = 2. Roughly how many are wrongly flagged, and what is the trade-off in fixing it?", answer: "About 1 in 44, so roughly 22,750 posts a day. Raising the threshold to 4 cuts that to about 32. The trade-off is sensitivity: a higher threshold needs more tokens or a stronger watermark to be reached, so short or heavily edited watermarked texts will more often go undetected." }
      ]
    }
  ],
  quiz: [
    { q: "In a green-list watermark, what decides which tokens are green at a given position?", options: ["The most common words in English, fixed for all texts", "A hash of the secret key and previous token, as a seed", "The wording of the user's prompt for that conversation", "Whichever tokens the model gave the lowest probability"], answer: 1, explain: "Each position's green list comes from seeding a random generator with the key and the previous token, so it changes every step and is reproducible only with the key." },
    { q: "A teacher runs a watermark detector on a 15-word answer and gets z = 2. A student's 600-word essay gets z = 11. What is the right reading?", options: ["Both texts are now proven to have been written by an AI", "Both texts are proven to have been written by a human", "Short one inconclusive; the essay is strong evidence", "The short answer is the more suspicious of the two texts"], answer: 2, explain: "Evidence grows with length. A short text rarely provides enough tokens for a confident call, while z = 11 on 600 words is far beyond chance. Low z is never proof of human writing." },
    { q: "T = 200 tokens, γ = 0.25, and the detector counts 134 green tokens. What is z, approximately?", options: ["13.7", "2.2", "6.1", "84"], answer: 0, explain: "Expected 50, standard deviation √(200·0.25·0.75) ≈ 6.12. z = (134 − 50) / 6.12 ≈ 13.7. 84 is the raw excess and 6.1 is the standard deviation." },
    { q: "How does watermark detection differ from a typical AI-text classifier?", options: ["Watermark detection works on text from any model, no cooperation needed", "Classifiers offer a precisely controllable false-positive rate on any text", "They are the same technique, just with different names from different labs", "Watermarks test a keyed signal the generator embedded; classifiers guess"], answer: 3, explain: "Watermarks need the generator to embed them and give statistically grounded evidence; classifiers work on any text but guess from style, are unreliable and can misflag human writing." },
    { q: "Which statement is a misconception?", options: ["Heavy paraphrasing can remove a watermark", "No watermark found means a human wrote it", "Code gives the watermark less room to act", "The green list changes at every position"], answer: 1, explain: "No watermark could mean an unwatermarked model, heavy editing or a text that is too short. Absence of the signal is not proof of human authorship." }
  ],
  takeaways: [
    "LLM watermarks exploit the freedom of choosing among several good next tokens.",
    "A secret key plus the previous token selects a fresh green list; green logits get a small boost δ.",
    "Detection counts green tokens and computes a z-score; evidence grows with the square root of length.",
    "Unlike AI-text classifiers, watermarks give controllable false-positive rates but only for cooperating models.",
    "Short texts, paraphrasing and heavy editing weaken the signal; absence of a watermark proves nothing."
  ],
  terms: [
    { term: "Watermark", def: "A hidden mark embedded in content to indicate its origin." },
    { term: "Logit", def: "The raw score a model assigns to each vocabulary token before softmax." },
    { term: "Green list", def: "The keyed, per-position subset of preferred tokens whose logits are boosted." },
    { term: "γ (gamma)", def: "The fraction of the vocabulary placed on the green list at each step." },
    { term: "δ (delta)", def: "The amount added to green tokens' logits; the watermark strength." },
    { term: "z-score", def: "How many standard deviations the observed green count is above what chance predicts." },
    { term: "SynthID Text", def: "Google DeepMind's text watermarking scheme, used in Gemini and released as open source." }
  ]
};
