export default {
  id: 'how-does-hyde-work',
  minutes: 23,
  hook: 'What if the best way to search for an answer is to first make one up, even a slightly wrong one, and then search for documents that look like it?',
  summary: 'HyDE (Hypothetical Document Embeddings) improves RAG retrieval by asking an LLM to write a fake answer to the question, embedding that fake answer instead of (or together with) the question, and searching for real documents near it. Answers look like other answers, so the fake one lands closer to the real passage than a short question does. It costs an extra LLM call per query and can mislead search when the LLM has no idea about the topic.',
  sections: [
    {
      id: 'rag-and-search-problem',
      title: 'RAG in simple words, and the search problem inside it',
      blocks: [
        { type: 'p', text: '**RAG (Retrieval-Augmented Generation)** lets an LLM answer from our documents. Step 1: **retrieve** the passages most relevant to the question, usually by embedding the question and finding the nearest passage vectors in a vector database. Step 2: **generate** an answer with an LLM that reads those passages. If step 1 fetches the wrong passages, step 2 cannot save us: the LLM either guesses or says it does not know.' },
        { type: 'p', text: 'Our running example is a baking help site. A user asks: *"why is my loaf so heavy"*. The site has a great article: *"Dense bread usually means the dough did not rise enough: add more yeast or let the dough proof longer in a warm place."* Will search find it?' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like describing a lost item', text: 'At a lost-property office, saying "I lost something important" will not help the clerk. Describing what it looks like, "a blue umbrella with a wooden handle", lets them match it against what is on the shelf, even if your description is a bit off. HyDE turns a vague question into a description of what the answer looks like.' },
      ],
    },
    {
      id: 'why-question-is-weak',
      title: 'Why searching with the question is weak',
      blocks: [
        { type: 'p', text: 'Questions and answers are different kinds of text. A question is short, uses the user\'s words ("loaf", "heavy") and often contains words like "why" and "how". An answer is longer, uses the expert\'s words ("dense", "dough", "yeast", "proof") and states facts. Even a good embedding model places a 6-word question and a 25-word explanation in somewhat different regions of the vector space. This is sometimes called the **query-document asymmetry** or vocabulary mismatch.' },
        { type: 'p', text: 'In our example the question shares *no* content word with the right article, but it does share "heavy" with an unrelated article about cast iron pans. A weak or keyword-like retriever will happily return the pan article.' },
        { type: 'p', text: 'Retrievers trained on lots of question-answer pairs learn to bridge this gap. HyDE was designed for the case where we **lack** such training data (a "zero-shot" setting): a general-purpose or unsupervised encoder, or a new domain with unusual jargon.' },
      ],
    },
    {
      id: 'what-is-hyde',
      title: 'What is HyDE, and why a fake answer works better',
      blocks: [
        { type: 'p', text: '**HyDE** stands for **Hy**pothetical **D**ocument **E**mbeddings. It was introduced by Luyu Gao, Xueguang Ma, Jimmy Lin and Jamie Callan in *"Precise Zero-Shot Dense Retrieval without Relevance Labels"* (2022). The idea: before searching, ask an LLM to **write a hypothetical document** that answers the question. Embed that hypothetical document and use its vector to search the real collection.' },
        { type: 'p', text: 'For our question, an LLM might write: *"A heavy loaf usually happens when the dough does not rise enough. Use fresh yeast and let the dough proof longer."* This text uses the vocabulary and shape of a real answer: "dough", "rise", "yeast", "proof". Its vector therefore sits much closer to the real article than the question\'s vector does. We search **answer-to-answer** instead of **question-to-answer**.' },
        { type: 'p', text: 'Crucially, the fake answer does **not** need to be correct. It might get details wrong. The encoder acts like a filter: it captures the general topic and pattern ("bread didn\'t rise; yeast; proofing") and the search then finds the *real* document, whose facts are what the final answer uses. The hypothetical document is thrown away after retrieval; it is never shown to the user as a source.' },
        { type: 'check', question: 'The LLM\'s hypothetical answer says "use 3 teaspoons of yeast", but the real article says 2. Does HyDE then give the user the wrong amount?', answer: 'Not by itself. The fake answer is used only to find documents. The final answer is generated from the retrieved real article, which says 2. Wrong details in the fake text usually do little harm as long as the topic and vocabulary are right.' },
      ],
    },
    {
      id: 'step-by-step',
      title: 'How HyDE works step by step',
      blocks: [
        { type: 'steps', title: 'The HyDE pipeline', items: [
          { title: 'Receive the question', text: '"why is my loaf so heavy"' },
          { title: 'Generate a hypothetical answer', text: 'Prompt an LLM: "Write a short passage that answers this question." Optionally generate several (e.g. 3–5) with some randomness.' },
          { title: 'Embed', text: 'Embed each hypothetical passage with the same embedding model used for the document collection. The original paper also included the question\'s own embedding and averaged them.' },
          { title: 'Search', text: 'Use the (averaged) vector to find the nearest real passages in the vector database.' },
          { title: 'Generate the real answer', text: 'Give the LLM the original question plus the retrieved real passages, and answer from them.' },
        ] },
        { type: 'flow', title: 'Data flow in HyDE', nodes: [
          { label: 'Question', detail: 'Short, in the user\'s words.' },
          { label: 'LLM writes fake answer', detail: 'An answer-shaped passage in expert vocabulary. May contain errors.' },
          { label: 'Embed fake answer', detail: 'Same encoder as the documents; optionally average with the question vector and other fake answers.' },
          { label: 'Vector search', detail: 'Nearest real passages to the fake-answer vector.' },
          { label: 'LLM answers from real docs', detail: 'The final answer is grounded in retrieved text, not in the fake answer.' },
        ] },
        { type: 'formula', expr: 'v = (1 / (N + 1)) · ( E(q) + ∑ᵢ E(hᵢ) )', where: [['E(·)', 'the embedding model (encoder)'], ['q', 'the original question'], ['hᵢ', 'the i-th hypothetical document, i = 1…N'], ['v', 'the vector used for search']], caption: 'Averaging several hypothetical answers smooths out the quirks of any single one; including the question keeps the user\'s own wording in play.' },
      ],
    },
    {
      id: 'worked-example-and-code',
      title: 'A worked example in code',
      blocks: [
        { type: 'p', text: 'We have no LLM or neural encoder here, so the script uses two honest stand-ins: the "LLM output" is a fixed string, and the "encoder" is a simple bag-of-words vector (word counts, scaled to length 1). A real encoder understands synonyms too, so it would help the question somewhat, but the mechanism is identical: compare the question vector and the fake-answer vector against the same three documents.' },
        { type: 'code', lang: 'python', title: 'hyde_toy.py', code: `import re
import numpy as np
from collections import Counter

docs = ["Dense bread usually means the dough did not rise enough: add more "
        "yeast or let the dough proof longer in a warm place.",
        "Why is my sourdough starter smelling like acetone? Feed it more often.",
        "A heavy cast iron pan keeps heat well for searing steak."]
question = "why is my loaf so heavy"
# In real HyDE an LLM writes this; it may be partly wrong, and that is fine.
fake_answer = ("A heavy loaf usually happens when the dough does not rise enough. "
               "Use fresh yeast and let the dough proof longer.")

STOP = {"a", "the", "is", "my", "so", "why", "or", "it", "in", "for", "when",
        "and", "not", "does", "did", "let", "use", "more", "like"}

def tokens(text):
    return [w for w in re.findall(r"[a-z]+", text.lower()) if w not in STOP]

vocab = sorted({w for t in docs + [question, fake_answer] for w in tokens(t)})

def embed(text):          # stand-in encoder: unit-length bag-of-words vector
    words = tokens(text)
    v = np.array([Counter(words)[w] for w in vocab], dtype=float)
    return v / np.linalg.norm(v)

D = np.array([embed(d) for d in docs])
q, h = embed(question), embed(fake_answer)
both = (q + h) / np.linalg.norm(q + h)     # HyDE paper also mixes in the query
for name, v in [("question", q), ("fake answer", h), ("average", both)]:
    s = D @ v
    print(f"{name:12} scores={np.round(s, 2)}  best=doc{int(np.argmax(s))}")`, output: `question     scores=[0.   0.   0.24]  best=doc2
fake answer  scores=[0.67 0.   0.09]  best=doc0
average      scores=[0.4 0.  0.2]  best=doc0`,
          walkthrough: [
            { lines: [5, 9], note: 'Three documents: the right baking article (doc0), a sourdough-starter article (doc1) and a cast-iron pan article (doc2). And the user\'s short question.' },
            { lines: [10, 12], note: 'The hypothetical answer. In real HyDE an LLM writes this from the question.' },
            { lines: [14, 25], note: 'A stand-in encoder: lowercase words minus stop words, counted over a shared vocabulary, scaled to length 1.' },
            { lines: [27, 29], note: 'Embed the documents, the question and the fake answer, plus the normalised average of question and fake answer (as in the paper).' },
            { lines: [30, 32], note: 'Cosine scores (dot products of unit vectors) against each document, and which document wins.' },
          ] },
        { type: 'p', text: 'With the question alone, the only overlapping word is "heavy", so the **cast-iron pan** article (doc2) wins with 0.24 while the right article scores 0. With the fake answer, the right article (doc0) jumps to **0.67** because they share "dough", "rise", "enough", "yeast", "proof", "longer" and "usually". The averaged vector still picks doc0. Same corpus, same encoder; only the search vector changed.' },
        { type: 'matrix', title: 'Cosine scores from the run above', rows: ['Question', 'Fake answer', 'Average'], cols: ['doc0 baking', 'doc1 starter', 'doc2 pan'], values: [[0, 0, 0.24], [0.67, 0, 0.09], [0.4, 0, 0.2]], format: 'num', caption: 'Rows are search vectors, columns are documents. HyDE moves the strongest match to the right article.' },
      ],
    },
    {
      id: 'pros-and-cons',
      title: 'Advantages and disadvantages of HyDE',
      blocks: [
        { type: 'compare', title: 'Plain query embedding vs HyDE',
          options: [
            { name: 'Embed the question', summary: 'Search with the user\'s question vector.', pros: ['One cheap embedding call', 'Lowest latency', 'Nothing can be hallucinated into the search'], cons: ['Question/answer mismatch', 'Weak for short or vague queries with general encoders'], bestFor: 'Retrievers trained on Q&A pairs; latency-critical apps' },
            { name: 'HyDE', summary: 'Search with an LLM-written fake answer\'s vector.', pros: ['Answer-to-answer matching', 'No training data or fine-tuning needed', 'Works with any embedding model'], cons: ['Extra LLM call: more latency and cost', 'Misleads search if the LLM is clueless or biased'], bestFor: 'Zero-shot retrieval, new domains, short questions' },
          ],
          rows: [
            ['Extra calls per query', 'None', '1 LLM generation (or several)'],
            ['Added latency (typical)', '~0', 'Hundreds of ms to seconds, model-dependent'],
            ['Needs training data', 'For best results, yes', 'No'],
          ],
          verdict: 'HyDE is a cheap-to-build, query-time upgrade when we cannot fine-tune a retriever. Measure: with strong, Q&A-trained embedding models the gain can be small or negative.' },
        { type: 'p', text: '**Advantages.** No labelled data or fine-tuning; it is pure prompting at query time. It works with any embedding model and vector database. It shines for short, vague or oddly worded questions and in specialised domains where the user\'s words differ from the documents\' words. The paper reported large improvements over the same unsupervised encoder used without HyDE across several benchmarks.' },
        { type: 'p', text: '**Disadvantages.** Each query needs an LLM generation, adding latency (often the largest cost) and money. If the LLM does not know the topic (private product names, internal codes, very recent events), it may write a confident fake answer about the wrong thing, dragging search toward wrong documents. The fake answer can carry the LLM\'s biases. Exact identifiers in the question can be paraphrased away. And modern retrievers trained on question-answer data already handle much of the mismatch, so the benefit shrinks.' },
        { type: 'callout', tone: 'warn', title: 'The classic failure', text: 'A user asks "What does error ZX-77 on the K9 controller mean?" The LLM has never heard of ZX-77 and writes a generic text about network errors. HyDE then retrieves network-error articles instead of the one page that mentions ZX-77. Fix: combine HyDE with keyword search (hybrid), keep the original query in the average, or skip HyDE for queries containing codes.' },
      ],
    },
    {
      id: 'common-mistakes-in-practice',
      title: 'Common mistakes and how to spot them',
      blocks: [
        { type: 'p', text: 'HyDE fails quietly. Search still returns passages; they are just the wrong ones. The way to catch this is simple: **log the hypothetical text** next to the passages it retrieved, and read a sample. Most problems are visible in the fake answer itself.' },
        { type: 'table', caption: 'What the logs show, and what to do about it.', head: ['What we see in the log', 'What happened', 'Fix'], rows: [
          ['The fake answer never repeats the code or name from the question', 'The LLM paraphrased an exact identifier away', 'Keep the question in the average; add keyword search'],
          ['The fake answer is fluent but about another topic', 'The LLM does not know this domain', 'Skip HyDE for such queries, or average several hypotheses'],
          ['The fake answer is a long essay; our documents are short FAQ entries', 'Length and style differ from the corpus, which pulls the vector away', 'Ask for one short passage written like our documents'],
          ['The same question retrieves different passages on different days', 'Randomness in generation', 'Lower the temperature, or cache the hypothetical text'],
        ] },
        { type: 'p', text: 'Latency is the other thing to measure. With illustrative numbers: plain search is one embedding (20 ms) plus one vector lookup (10 ms), so 30 ms. HyDE adds a generation of about 80 tokens. At 100 tokens per second that is 800 ms, for a total of 830 ms before the real answer even starts. Capping the fake answer at 40 tokens halves the added time, and a short passage is often enough to carry the topic.' },
        { type: 'steps', title: 'A small A/B test', items: [
          { title: 'Collect questions', text: 'Take about 30 real questions for which we know the passage that answers each.' },
          { title: 'Run plain search', text: 'Note the rank of the right passage for every question.' },
          { title: 'Run HyDE', text: 'Note the rank again, and save the fake answer.' },
          { title: 'Count', text: 'For example: 12 questions better, 15 the same, 3 worse (illustrative).' },
          { title: 'Read the losses', text: 'If the 3 worse cases share a pattern, such as all containing product codes, send that kind of query around HyDE.' },
        ] },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We will code the averaging formula from this lesson, v = (E(q) + ∑ E(hᵢ)) / (N + 1), and test how it copes when one of the fake answers is **off-topic**. The embeddings are pretend 3-number vectors with readable axes (baking, cookware, fitness), so we can see where each text points.' },
        { type: 'code', lang: 'python', title: 'practice_hyde_average.py', code: `import numpy as np

def unit(v):
    v = np.array(v, dtype=float)
    return v / np.linalg.norm(v)

# Pretend embeddings over 3 axes: [baking, cookware, fitness]. Illustrative.
docs = {"dense bread article":    unit([0.95, 0.10, 0.05]),
        "cast iron pan article":  unit([0.20, 0.95, 0.05]),
        "weight lifting article": unit([0.05, 0.10, 0.95])}

question = unit([0.40, 0.50, 0.30])          # "why is my loaf so heavy" (vague)
hypotheses = {                               # three LLM-written fake answers
    "h1 (dough did not rise)": unit([0.90, 0.20, 0.10]),
    "h2 (old yeast)":          unit([0.85, 0.10, 0.20]),
    "h3 (misread: lifting)":   unit([0.10, 0.20, 0.95]),
}

def best_doc(v):
    scores = {name: float(d @ v) for name, d in docs.items()}
    top = max(scores, key=scores.get)
    return f"{top:22} (cos = {scores[top]:.2f})"

print(f"{'question only':24} ->", best_doc(question))
for name, h in hypotheses.items():
    print(f"{name:24} ->", best_doc(h))

# HyDE vector: v = (E(q) + sum of E(h_i)) / (N + 1), then scale to length 1
stack = [question] + list(hypotheses.values())
v = unit(np.mean(stack, axis=0))
print(f"{'average of q + 3 fakes':24} ->", best_doc(v))`, output: `question only            -> cast iron pan article  (cos = 0.83)
h1 (dough did not rise)  -> dense bread article    (cos = 0.99)
h2 (old yeast)           -> dense bread article    (cos = 0.98)
h3 (misread: lifting)    -> weight lifting article (cos = 0.99)
average of q + 3 fakes   -> dense bread article    (cos = 0.83)`,
          walkthrough: [
            { lines: [7, 17], note: 'Three documents, a vague question vector that leans towards cookware, and three hypothetical answers. Two are about baking; the third misread "heavy" as weight lifting.' },
            { lines: [19, 22], note: 'Find the document with the highest cosine similarity to a search vector.' },
            { lines: [24, 26], note: 'Search with the question alone, then with each fake answer alone.' },
            { lines: [28, 31], note: 'The HyDE vector: the mean of the question and all three hypotheses, scaled back to length 1, then one search.' },
          ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Replace h2 with a second misread, `unit([0.10, 0.10, 0.90])`. Now two of three hypotheses are wrong. Predict which article the average finds.',
          'Leave the question out of the average: `stack = list(hypotheses.values())`. Predict whether the winner changes and whether its cosine goes up or down.',
          'Keep only the bad hypothesis: `stack = [question, hypotheses["h3 (misread: lifting)"]]`. Predict the winner, and say what that means for running HyDE with a single hypothesis.',
        ] },
        { type: 'check', question: 'On its own, h3 finds the weight lifting article with a cosine of 0.99. In the average, the bread article still wins. Why did the bad hypothesis not drag the search away?', answer: 'Two of the three hypotheses point towards baking, and their directions add up. The single odd one is outvoted. Averaging only protects us while most hypotheses are on topic; if the LLM misreads the question most of the time, the average is wrong too.' },
        { type: 'check', question: 'The averaged vector finds the bread article with a cosine of 0.83, lower than the 0.99 that h1 reaches alone. Is the lower number a problem?', answer: 'Not for the ranking, which is what search uses: the bread article is still first. But it is a warning. The question and the bad hypothesis pulled the vector towards cookware and fitness, so the lead over the other articles got smaller. Bad hypotheses always cost some safety margin, even when the right document still wins.' },
      ],
    },
    {
      id: 'when-to-use-and-summary',
      title: 'When to use HyDE, and summary',
      blocks: [
        { type: 'list', items: [
          '**Use it** when retrieval misses because questions are short or phrased very differently from documents, when you cannot fine-tune the retriever, and when a few hundred extra milliseconds per query are acceptable.',
          '**Use it carefully** in domains the LLM does not know: include the original question in the averaged vector, generate several hypotheses, or run it alongside normal query search and fuse results (for example with Reciprocal Rank Fusion).',
          '**Skip it** for latency-critical paths, for queries that are mostly exact identifiers, and when evaluation shows your embedding model already matches questions to answers well.',
        ] },
        { type: 'callout', tone: 'example', title: 'Where it shows up', text: 'Frameworks such as LlamaIndex and LangChain include HyDE-style query transforms. It belongs to a wider family of **query rewriting** techniques: multi-query expansion (generate several rephrasings), step-back prompting (ask a more general question first) and query decomposition (split a complex question into parts).' },
        { type: 'check', question: 'Our medical RAG bot uses a strong embedding model trained on millions of question-passage pairs. A teammate wants to add HyDE to every query. What should we do first?', answer: 'Measure. Run a set of real questions with known relevant passages with and without HyDE and compare recall and answer quality, plus latency. With a Q&A-trained retriever the gain may be small, and a fabricated medical answer could pull in wrong passages, so HyDE should earn its extra LLM call.' },
        { type: 'p', text: 'Summary: HyDE replaces "search with the question" by "search with what an answer would look like". An LLM writes a hypothetical answer, the encoder turns it into a vector, and nearest-neighbour search finds real documents that resemble it. It narrows the gap between questions and answers without training data, at the cost of an extra LLM call and some risk when the LLM is out of its depth.' },
      ],
    },
  ],
  quiz: [
    { q: 'In HyDE, what is embedded and used as the search vector?', options: ['Only the final answer text that the user later sees on screen', 'An LLM-written hypothetical answer (often with the question)', 'The top document returned by an earlier keyword search', 'A randomly chosen document from the whole collection'], answer: 1, explain: 'HyDE embeds an LLM-generated hypothetical document. The original paper also averaged in the question embedding.' },
    { q: 'Why can a partly wrong hypothetical answer still lead to the right document?', options: ['The vector database quietly corrects any factual errors it finds', 'The LLM is always right about facts in every domain', 'Its vector carries the topic; facts come from real documents', 'The hypothetical answer is cited to the user as the source'], answer: 2, explain: 'The fake answer only steers retrieval. Its vector reflects the topic and answer-like wording; facts come from the real retrieved passages.' },
    { q: 'In the code output, the question alone scored [0, 0, 0.24] and the fake answer scored [0.67, 0, 0.09] against docs 0–2. Which document does each search vector rank first?', options: ['Question: doc2; fake answer: doc0', 'Question: doc0; fake answer: doc0', 'Question: doc1; fake answer: doc2', 'Both rank doc2 first'], answer: 0, explain: 'The highest score wins: 0.24 is doc2 (the pan article) for the question; 0.67 is doc0 (the baking article) for the fake answer.' },
    { q: 'Our support bot handles questions about internal error codes like "ZX-77" that no public LLM has seen. After adding HyDE, retrieval got worse. What is the most likely reason?', options: ['HyDE needs a much larger vector database to work', 'HyDE only works for questions written in English', 'The embedding model was silently replaced by HyDE', 'The LLM wrote generic fake answers on the wrong topic'], answer: 3, explain: 'HyDE depends on the LLM knowing roughly what an answer looks like. For unknown codes it hallucinates generic text; hybrid keyword search or skipping HyDE for such queries helps.' },
    { q: 'Compared with plain query embedding, what is HyDE\'s main cost?', options: ['It needs labelled question-document pairs for training', 'An extra LLM generation per query: latency and money', 'Re-embedding the entire document collection each day', 'It cannot be combined with any vector database'], answer: 1, explain: 'HyDE needs no training and no re-indexing; its price is one (or more) LLM calls at query time.' },
  ],
  takeaways: [
    'Questions and answers look different, so a question vector can land far from the passage that answers it.',
    'HyDE asks an LLM for a hypothetical answer, embeds it, and searches for real documents near that vector.',
    'The fake answer only steers retrieval; the final answer is grounded in the retrieved real passages.',
    'It needs no training data but adds an LLM call per query and can mislead search when the LLM lacks domain knowledge.',
    'Measure it against plain query search; combine with the original query or keyword search for safety.',
  ],
  terms: [
    { term: 'HyDE', def: 'Hypothetical Document Embeddings: searching with the embedding of an LLM-written fake answer.' },
    { term: 'Hypothetical document', def: 'An answer-shaped passage generated by an LLM only to guide retrieval.' },
    { term: 'Zero-shot retrieval', def: 'Retrieval in a domain without any labelled query-document training pairs.' },
    { term: 'Query-document asymmetry', def: 'The difference in length, wording and style between questions and the passages that answer them.' },
    { term: 'Query rewriting', def: 'Transforming the user\'s query before search, e.g. HyDE, multi-query or decomposition.' },
  ],
};
