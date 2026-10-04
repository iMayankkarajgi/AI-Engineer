export default {
  id: "what-is-generative-ai",
  minutes: 22,
  hook: "How can a program that was only ever shown existing text, images and sound produce a sentence, picture or song that never existed before?",
  summary: "Generative AI is AI that creates new content (text, images, audio, video, code) instead of only labelling or scoring existing content. It learns the patterns of a huge amount of example data, stores them as numbers called parameters, and then creates something new by sampling from what it learned, one small piece at a time. It is powerful and useful every day, but it can be confidently wrong, biased and out of date, so we must use it with care.",
  sections: [
    {
      id: "what-is-generative-ai",
      title: "What is Generative AI?",
      blocks: [
        { type: "p", text: "**Generative AI** is a kind of artificial intelligence that *creates new content*. We give it a request, usually written in plain language, and it produces a reply: an email draft, an answer to a question, a picture of a cat in a spacesuit, a short melody, or a working Python function." },
        { type: "p", text: "The name splits neatly into two parts. **Generative** means “able to produce or bring something into being”. **AI** (artificial intelligence) means software that does tasks we normally associate with human thinking, such as understanding language or recognising objects. Put together: *software that produces new things in a way that looks intelligent*." },
        { type: "p", text: "Throughout this lesson we will follow one running example: a **support chatbot** for an online shop. A customer types “Where is my order?” and the bot writes a friendly, fresh reply. Nobody wrote that exact reply in advance. The bot generated it." },
        { type: "callout", tone: "analogy", title: "Think of it like a well-read storyteller", text: "Imagine someone who has read millions of books but memorised none of them word for word. Ask them for a story about a lost umbrella and they can tell a new one, because they absorbed how stories usually go: how sentences flow, what happens next, how they end. Generative AI works the same way. It learns the *patterns* of its examples, not a copy of each one." },
        { type: "p", text: "**What does “generate” mean here?** It does not mean looking up a stored answer or copying and pasting. It means building an output piece by piece, where each piece is chosen because it is *likely* given everything before it. For text, a piece is a **token**: a word or a part of a word. For images, the model may refine a whole picture step by step. The output is new in the sense that it is freshly assembled, even though every pattern inside it came from training data." },
      ],
    },
    {
      id: "old-ai-vs-generative-ai",
      title: "How is Generative AI different from the old AI?",
      blocks: [
        { type: "p", text: "Before generative AI became popular, most AI in products was **discriminative** (also called predictive or analytical AI). A discriminative model looks at an input and gives back a *label* or a *number*: spam or not spam, which digit is in this photo, how likely is this card payment to be fraud, what price will this house sell for. Its output is small and comes from a fixed set of answers." },
        { type: "p", text: "A **generative** model gives back a *whole new piece of content*. Its output is large and open-ended: a paragraph, an image with millions of pixels, a minute of audio. In probability terms, a discriminative model learns “given this input, which label?”, while a generative model learns “what does realistic data look like?” so that it can produce more of it." },
        { type: "compare", title: "Discriminative (classic) AI vs Generative AI",
          options: [
            { name: "Discriminative AI", summary: "Looks at an input and decides: a label, a score or a number.", pros: ["Small, fast and cheap to run", "Easy to measure (accuracy, error)", "Predictable, fixed output format"], cons: ["Cannot write, draw or compose", "Usually needs labelled data for each task"], bestFor: "Spam filters, fraud scores, image classification, price prediction" },
            { name: "Generative AI", summary: "Produces brand-new content that resembles its training data.", pros: ["Creates text, images, audio, video and code", "One model can handle many tasks from a plain-language request", "Learns mostly from unlabelled data"], cons: ["Can be confidently wrong (hallucinate)", "Expensive to train and run", "Output is harder to evaluate"], bestFor: "Chatbots, writing help, coding assistants, image creation, summarisation" },
          ],
          rows: [
            ["Typical output", "“spam” / 0.93 / $412,000", "A paragraph, an image, a song"],
            ["What it learns", "The boundary between classes", "The patterns of the data itself"],
            ["Training data", "Mostly labelled examples", "Mostly raw, unlabelled examples"],
            ["Same input twice", "Same answer", "Often a different answer (sampling)"],
          ],
          verdict: "They are complementary. Our support shop might use a discriminative model to route tickets and a generative model to draft the replies." },
        { type: "check", question: "Our shop wants to flag which incoming emails are angry so a human answers them first. Is that a generative or a discriminative task?", answer: "Discriminative. The output is a label (angry or not angry), chosen from a fixed set. A generative model could do it too if we ask it to answer with one word, but the task itself is classification." },
      ],
    },
    {
      id: "how-it-learns",
      title: "How does Generative AI learn?",
      blocks: [
        { type: "p", text: "A generative model learns by looking at an enormous number of examples and slowly adjusting itself until it can *predict* those examples well. For a text model the main exercise is surprisingly simple: hide the next word and guess it. “The order has ___”. If the model guesses badly, a training algorithm nudges its internal numbers so that next time the right word gets a bit more probability. Repeat this across trillions of words and the model ends up absorbing grammar, facts, styles and reasoning patterns, because all of them help predict the next word." },
        { type: "p", text: "This is called **self-supervised learning**: the labels come from the data itself (the real next word is the label), so nobody has to annotate anything by hand. That is why generative models can learn from so much data." },
        { type: "steps", title: "The usual training recipe for a text model", items: [
          { title: "Collect data", text: "Gather a very large collection of text, such as web pages, books and code, and clean it (remove duplicates, spam and unsafe content)." },
          { title: "Tokenize", text: "Cut the text into tokens (words or word pieces) and turn each token into a number the model can work with." },
          { title: "Pre-train", text: "Show the model billions of snippets and ask it to predict each next token. Measure how wrong it is with a loss function and adjust its parameters with gradient descent." },
          { title: "Fine-tune", text: "Train further on smaller, curated examples of good behaviour, such as helpful question-and-answer pairs, so it follows instructions instead of just continuing text." },
          { title: "Align with feedback", text: "Use human or AI preferences (for example, reinforcement learning from human feedback, RLHF) to make answers more helpful, honest and safe." },
        ] },
        { type: "p", text: "Image generators learn with a different exercise. A popular one is used by **diffusion models**: take a real picture, add random noise, and train the model to remove the noise. After learning to clean up noise at every level, the model can start from pure noise and clean it into a brand-new image. Audio and video models use similar ideas. The common thread is: *learn the patterns of real data well enough to recreate data like it*." },
      ],
    },
    {
      id: "how-it-creates",
      title: "How does Generative AI actually create something new?",
      blocks: [
        { type: "p", text: "After training, a text model works like a very smart autocomplete. Given the text so far, it outputs a **probability distribution**: a list of every possible next token with a chance attached. For “Your order has” it might give `been` 0.55, `shipped` 0.30, `arrived` 0.10 and tiny chances to thousands of other tokens." },
        { type: "p", text: "The program then **samples**: it picks one token at random, weighted by those chances, appends it to the text and asks the model again. Word by word, a new reply appears. Because the pick is random, asking the same question twice can give two different, equally reasonable answers. A setting called **temperature** controls how adventurous the pick is. Low temperature makes the most likely token win almost every time (safe, repetitive). High temperature flattens the chances so rarer tokens get picked more (creative, but riskier)." },
        { type: "viz", name: "temperature", caption: "Drag the temperature slider and watch the next-token probabilities change. Low values sharpen the distribution; high values flatten it." },
        { type: "p", text: "Why is the result *new*? Because the model combines patterns, not stored sentences. It learned that “order” often comes before “has shipped” and that “your order” starts many replies. Chaining these choices can produce a sentence that appears nowhere in its training data. The code later in this lesson shows exactly this happening with a tiny model." },
        { type: "check", question: "We set temperature to 0 (always pick the most likely token) and ask the same question twice. What happens?", answer: "We get the same reply both times (in practice, almost always: tiny numerical differences on some hardware can still cause rare changes). With no randomness in the pick, the model's top choice wins at every step, so the output is effectively deterministic." },
      ],
    },
    {
      id: "what-it-can-create",
      title: "What can Generative AI create?",
      blocks: [
        { type: "p", text: "Anything that can be turned into numbers and has learnable patterns can, in principle, be generated. Today the main families are below. A model that handles several of these at once (for example, it reads an image and writes about it) is called **multimodal**." },
        { type: "table", caption: "Common kinds of generated content", head: ["Content", "Typical model style", "Everyday example"], rows: [
          ["Text", "Large language model (LLM) predicting next tokens", "Chat assistants, email drafts, summaries"],
          ["Code", "LLM trained heavily on source code", "Coding assistants that suggest the next lines"],
          ["Images", "Diffusion model (noise → picture), guided by a text prompt", "Illustrations, product mock-ups, image edits"],
          ["Audio and speech", "Token-based or diffusion audio models", "Text-to-speech voices, short music clips"],
          ["Video", "Diffusion or transformer models over frames", "Short clips from a text description"],
          ["Structured data", "LLM asked for JSON or tables", "Filling forms, extracting fields from documents"],
        ] },
        { type: "timeline", title: "A short history of generative AI", items: [
          { when: "2014", title: "GANs", text: "Generative Adversarial Networks pit a generator against a critic and produce the first convincing synthetic faces." },
          { when: "2017", title: "The Transformer", text: "The paper “Attention Is All You Need” introduces the architecture behind nearly every modern language model." },
          { when: "2018–2020", title: "GPT-1, GPT-2, GPT-3", text: "OpenAI shows that a bigger next-word predictor trained on more text gets steadily more capable; GPT-3 has 175 billion parameters." },
          { when: "2020–2022", title: "Diffusion models", text: "Denoising diffusion becomes the leading way to generate images; Stable Diffusion is released openly in 2022." },
          { when: "Nov 2022", title: "ChatGPT", text: "A chat interface on an instruction-tuned LLM brings generative AI to hundreds of millions of people." },
          { when: "2023 onward", title: "Multimodal and open models", text: "Models that read images and audio, plus strong open-weight families, make generative AI a standard building block." },
        ] },
      ],
    },
    {
      id: "what-is-a-model",
      title: "What is a model in Generative AI?",
      blocks: [
        { type: "p", text: "A **model** is the trained program that does the generating. Under the hood it is a big mathematical function, almost always a **neural network**, whose behaviour is set by millions or billions of numbers called **parameters** (or **weights**). Training is simply the process of finding good values for those numbers." },
        { type: "p", text: "A helpful way to think about it: the model file is a compressed summary of patterns in the training data. It does not contain a searchable copy of the internet. GPT-2 (2019) had 1.5 billion parameters and GPT-3 (2020) had 175 billion; many current models are of similar or larger size, though some vendors do not publish their counts. More parameters usually means more capacity to store patterns, but also more memory and compute to run." },
        { type: "list", items: [
          "**Architecture**: the shape of the network (for modern text models, the Transformer).",
          "**Parameters**: the learned numbers inside that shape.",
          "**Inference**: running the trained model to produce output (as opposed to training it).",
          "**Prompt**: the input we give the model at inference time.",
          "**Foundation model**: a large model pre-trained on broad data that can be adapted to many tasks.",
        ] },
        { type: "callout", tone: "note", title: "Model vs product", text: "A chatbot app is a *product* built around a model. The product adds a user interface, safety filters, memory of the conversation, tools such as web search, and a system prompt. The same model can power many different products." },
      ],
    },
    {
      id: "complete-flow",
      title: "The complete flow of Generative AI",
      blocks: [
        { type: "p", text: "Let us follow our customer's message “Where is my order?” all the way through a text model. Click each node to read what happens there." },
        { type: "flow", title: "From prompt to reply", loop: false, nodes: [
          { label: "Prompt", detail: "The app combines the customer's message with hidden instructions (a system prompt), for example: “You are a polite support assistant for our shop.”" },
          { label: "Tokenize", detail: "The text is split into tokens and each token becomes an integer ID from the model's vocabulary." },
          { label: "Model", detail: "The neural network reads all tokens so far and computes a probability for every possible next token." },
          { label: "Sample", detail: "One token is picked using those probabilities (shaped by temperature and similar settings)." },
          { label: "Repeat", detail: "The new token is appended and the model runs again, until it emits a special end token or hits a length limit." },
          { label: "Reply", detail: "The token IDs are turned back into text and shown to the customer, often streamed word by word as they are generated." },
        ] },
        { type: "p", text: "Image generation follows the same broad shape (prompt in, content out), but the middle is different: the prompt is encoded into vectors that *guide* a diffusion model as it removes noise over many steps." },
      ],
    },
    {
      id: "code-a-tiny-generator",
      title: "Code: a tiny generative model you can run",
      blocks: [
        { type: "p", text: "Real LLMs are huge, but the core idea fits in 40 lines. We train a **bigram model** on five support sentences: it only learns which word tends to follow which. Then we generate by sampling one word at a time. Watch for outputs that were never in the training data." },
        { type: "code", lang: "python", title: "tiny_generator.py", code: `import random
from collections import defaultdict, Counter

# 1. Training data: a tiny "internet" of support-chat sentences
corpus = [
    "the order has shipped today",
    "the order is on the way",
    "the refund has been sent",
    "the refund is on the way",
    "your order has been sent today",
]

# 2. Learning: count which word follows which (a bigram model)
counts = defaultdict(Counter)
for line in corpus:
    words = ["<s>"] + line.split() + ["</s>"]
    for prev, nxt in zip(words, words[1:]):
        counts[prev][nxt] += 1

# The learned "parameters": P(next word | previous word)
def next_probs(word):
    total = sum(counts[word].values())
    return {w: round(c / total, 2) for w, c in counts[word].items()}

print("P(next | 'the')  =", next_probs("the"))
print("P(next | 'has')  =", next_probs("has"))

# 3. Generating: sample one word at a time until the end token
def generate(seed):
    random.seed(seed)
    word, out = "<s>", []
    while True:
        probs = next_probs(word)
        word = random.choices(list(probs), weights=list(probs.values()))[0]
        if word == "</s>":
            return " ".join(out)
        out.append(word)

for s in range(5):
    text = generate(s)
    tag = "(copied)" if text in corpus else "(NEW)"
    print(f"sample {s}: {text:32s} {tag}")`, output: `P(next | 'the')  = {'order': 0.33, 'way': 0.33, 'refund': 0.33}
P(next | 'has')  = {'shipped': 0.33, 'been': 0.67}
sample 0: your order has shipped today     (NEW)
sample 1: the refund is on the way         (copied)
sample 2: your order has shipped today     (NEW)
sample 3: the way                          (NEW)
sample 4: the order has shipped today      (copied)`,
          walkthrough: [
            { lines: [4, 11], note: "Our whole training set: five short support replies. Real models use trillions of tokens." },
            { lines: [13, 18], note: "“Training”: for every pair of neighbouring words, count how often the second follows the first. `<s>` and `</s>` mark the start and end." },
            { lines: [20, 26], note: "Turn counts into probabilities. After “the”, the words order, refund and way are equally likely; after “has”, “been” is twice as likely as “shipped”." },
            { lines: [28, 37], note: "Generation: start at `<s>`, sample the next word using the probabilities, append it, and repeat until the end marker." },
            { lines: [39, 42], note: "Draw five samples and check whether each one is a copy of a training sentence or something new." },
          ] },
        { type: "p", text: "Look at the output. “your order has shipped today” is **new**: the training data only had “your order has *been sent* today” and “the order has shipped today”. The model recombined patterns. But “the way” is also new, and it is nonsense as a reply: every word pair in it was seen in training, yet the whole is useless. This is a tiny version of a real problem. A model can produce something that is *locally fluent* but wrong. Large models are vastly better, because they look at much more context than one word, yet the same risk remains." },
      ],
    },
    {
      id: "everyday-use",
      title: "Where do we use Generative AI every day?",
      blocks: [
        { type: "list", items: [
          "**Chat assistants** that answer questions, explain topics and brainstorm.",
          "**Writing help**: drafting emails, rewriting text in a different tone, translating, summarising long documents.",
          "**Coding assistants** that complete lines, explain errors and write tests.",
          "**Customer support** bots like ours that draft or send replies, often grounded in the company's help pages.",
          "**Search and research** tools that read several sources and write a combined answer with links.",
          "**Creative tools** for images, voice-overs, music sketches and video clips.",
          "**Office features** such as meeting notes, auto-generated slide drafts and spreadsheet formulas from a description.",
        ] },
        { type: "callout", tone: "example", title: "Our support bot in production", text: "A realistic setup: the shop's help articles are searched for the passage most related to the customer's question, that passage is pasted into the prompt, and the model writes a reply based on it. A human agent reviews replies about refunds before they are sent. This mix of generation, retrieved facts and human review is how many companies use generative AI safely." },
      ],
    },
    {
      id: "limitations",
      title: "The limitations we must know",
      blocks: [
        { type: "p", text: "Generative AI produces what is *likely*, not what is *verified*. Almost every limitation comes from that one fact." },
        { type: "list", items: [
          "**Hallucination**: the model can state false facts, fake citations or invented order numbers in a confident tone.",
          "**Knowledge cutoff**: it only knows what was in its training data, which stops at some date, unless we give it fresh information in the prompt.",
          "**Bias**: patterns in the training data, including unfair stereotypes, can show up in the output.",
          "**Inconsistency**: the same prompt can give different answers, which makes testing harder.",
          "**Cost and speed**: large models need powerful hardware; long outputs take time and money.",
          "**Privacy, copyright and misuse**: sensitive data in prompts, ownership questions about training data and outputs, and deepfakes are real concerns that vary by country and are still evolving legally.",
        ] },
        { type: "callout", tone: "warn", title: "The most common mistake", text: "Treating fluent output as proof of truth. Never let a generative model be the only check for facts, numbers, legal or medical advice, or actions with real consequences (refunds, payments, deletions). Ground it in trusted data and keep a human or a rule-based check in the loop." },
        { type: "p", text: "**When not to use it**: if a simple rule or a lookup gives an exact answer (today's order status from the database, a tax calculation), use that instead. Generative AI is best when the output is language or media, when some variation is fine, and when a mistake can be caught." },
      ],
    },
    {
      id: "summary",
      title: "Summary",
      blocks: [
        { type: "p", text: "Generative AI creates new content. It learns the patterns of huge amounts of data by practising prediction (for text: guess the next token), stores those patterns as parameters inside a model, and creates by sampling one piece at a time. It differs from classic discriminative AI, which only labels or scores inputs. We use it daily for writing, coding, support and media, and we keep its limits in view: it can be wrong, biased and out of date, so we ground it and check it." },
      ],
    },
  ],
  quiz: [
    { q: "Which statement best describes how a text-generating model produces a reply?", options: ["It searches a database of stored replies and returns the closest match", "It repeatedly predicts next-token probabilities, picks a token and appends it", "It copies a training sentence and swaps a few words to fit the question", "It maps the question to a fixed label and fills in that label's reply template"], answer: 1, explain: "Text models generate token by token: compute next-token probabilities, pick one, append, repeat. They do not look up stored replies (that would be retrieval) and they do not copy training sentences, as the bigram example showed when it produced a sentence absent from its data." },
    { q: "Our shop's bot told a customer their refund “was approved on 3 March”, but no such refund exists. What is the best fix?", options: ["Raise the temperature so the model explores more possible answers", "Train a bigger model so it memorises every customer's order history", "Put real order data in the prompt and check refund claims before sending", "Switch to a discriminative model, since those write more factual replies"], answer: 2, explain: "This is a hallucination: the model produced a likely-sounding but unverified fact. Grounding the reply in real data plus a check fixes the cause. Higher temperature adds randomness and makes it worse; a model cannot memorise live order data; and discriminative models label inputs, they do not write replies." },
    { q: "In the bigram code, after the word “has” the model gives been 0.67 and shipped 0.33. Why?", options: ["Because the model scores longer words higher after a verb like “has”", "Because the model was told that “been” sounds more polite to shop customers", "Because the temperature was set to 0.67 for the most likely word", "Because “has” was followed by “been” twice and by “shipped” once in training"], answer: 3, explain: "The model's probabilities are just counts turned into fractions: 2 of the 3 times “has” appeared, “been” came next. No rules about politeness or word length are involved, and the code has no temperature setting." },
    { q: "What is the key difference between discriminative and generative AI?", options: ["Discriminative models output a label or score; generative models create new content", "Discriminative models use neural networks; generative models use hand-written rules", "Generative models need labelled data; discriminative models learn from unlabelled data", "Discriminative models are newer, more powerful successors to generative models"], answer: 0, explain: "The difference is the output: a decision versus new content. Both kinds commonly use neural networks. It is generative pre-training that mostly uses unlabelled data, and neither family is simply newer or better." },
    { q: "A colleague says: “The model is a giant searchable copy of the internet, so its answers are always taken from a real page.” What is wrong with that?", options: ["Nothing; it retrieves the closest stored page and quotes it word for word", "It stores patterns, not pages, and builds new text from them, so it can be false", "It stores only part of the internet, but the pages it keeps are copied exactly", "It stores compressed pages, so answers are copied but with small spelling errors"], answer: 1, explain: "Parameters encode patterns, not a database of pages. Output is assembled by sampling, which explains both creativity (new sentences) and hallucination (fluent but false sentences). The other options still assume answers are copied from stored pages." },
  ],
  takeaways: [
    "Generative AI creates new content; discriminative (classic) AI labels or scores existing input.",
    "Models learn by practising prediction on huge data, mostly self-supervised, and store patterns in parameters.",
    "Text models generate one token at a time by sampling from a probability distribution; temperature controls randomness.",
    "New output comes from recombining learned patterns, which is also why it can be fluent but false.",
    "Ground outputs in trusted data and keep checks in place for facts and consequential actions.",
  ],
  terms: [
    { term: "Generative AI", def: "AI that produces new content such as text, images, audio, video or code." },
    { term: "Discriminative model", def: "A model that maps an input to a label or number, such as spam or not spam." },
    { term: "Token", def: "A small piece of text, a word or part of a word, that a language model reads and writes." },
    { term: "Parameters", def: "The learned numbers inside a model that determine its behaviour." },
    { term: "Sampling", def: "Picking the next piece of output at random, weighted by the model's probabilities." },
    { term: "Temperature", def: "A setting that sharpens (low) or flattens (high) the probabilities before sampling." },
    { term: "Hallucination", def: "Fluent, confident output that is false or not supported by any source." },
  ],
};
