export default {
  id: 'chunking-strategies-for-rag',
  minutes: 26,
  hook: 'Your RAG bot has the right document, yet it answers "I don\'t know". Very often the culprit is not the model or the search, but where we cut the text.',
  summary: 'RAG retrieves pieces of documents, called chunks, and hands them to an LLM. How we cut those chunks decides what can be found and whether the retrieved text makes sense on its own. Strategies range from simple fixed-size windows and sentence packing to recursive, structure-aware, semantic, contextual, small-to-big and LLM-driven (agentic) chunking; the right choice depends on the documents, the questions and the budget.',
  sections: [
    {
      id: 'rag-and-chunks',
      title: 'What is RAG, what is a chunk, and why chunk at all?',
      blocks: [
        { type: 'p', text: '**RAG (Retrieval-Augmented Generation)** answers a question in two moves: first **retrieve** the passages most relevant to the question from our own documents, then **generate** an answer with an LLM that reads those passages. It lets an LLM answer from private or fresh data without retraining it.' },
        { type: 'p', text: 'A **chunk** is one piece of a document that we store and retrieve as a unit: a paragraph, a few sentences, a section, or a fixed number of tokens. Our running example is an online shop\'s policy handbook, 80 pages covering refunds, shipping, warranties and accounts.' },
        { type: 'p', text: 'Why not store the whole handbook as one item? Three reasons:' },
        { type: 'list', items: [
          '**Embedding models have input limits** (often 512 to 8,192 tokens) and a single vector for 80 pages would be a blurry average of every topic in it.',
          '**LLM context is limited and costly.** We want to give the model the two paragraphs that matter, not 80 pages. Irrelevant text also distracts the model.',
          '**Precision.** Small, focused chunks let retrieval point at exactly the part that answers the question.',
        ] },
        { type: 'callout', tone: 'analogy', title: 'Think of it like index cards', text: 'Imagine copying a textbook onto index cards for revision. Cards that are too small ("30 days.") are useless alone. Cards that are too big (a whole chapter) are hard to search and full of noise. Cards cut mid-sentence lose meaning. Good chunking is writing good index cards: one clear idea each, readable on its own.' },
      ],
    },
    {
      id: 'how-retrieval-works',
      title: 'How retrieval actually works, and what bad chunking breaks',
      blocks: [
        { type: 'flow', title: 'Where chunking sits in RAG', nodes: [
          { label: 'Documents', detail: 'PDFs, web pages, wikis, tickets.' },
          { label: 'Chunk', detail: 'Split each document into pieces. This lesson is about this step.' },
          { label: 'Embed + store', detail: 'Each chunk becomes a vector in a vector database (and often a keyword index too).' },
          { label: 'Retrieve', detail: 'The question is embedded; the closest chunks are returned (top 3–10).' },
          { label: 'Generate', detail: 'The LLM reads the question plus the retrieved chunks and answers.' },
        ] },
        { type: 'p', text: 'Retrieval compares the **question\'s vector** with **each chunk\'s vector**. The retriever never sees the document as a whole, only chunks. So a chunk has two jobs: its vector must clearly represent one topic (so it can be *found*), and its text must contain enough to answer (so it is *useful* once found).' },
        { type: 'p', text: 'What goes wrong with bad chunks:' },
        { type: 'list', items: [
          '**Split facts**: "Items can be returned within" ends one chunk and "30 days" starts the next. Neither chunk answers "how long is the return window?".',
          '**Lost context**: a chunk says "This fee is waived for members", but the chunk does not say *which* fee. Its vector does not mention shipping at all.',
          '**Mixed topics**: a big chunk covering refunds, shipping and passwords gets a muddy vector that matches nothing strongly.',
          '**Too tiny**: "30 days." matches poorly and gives the LLM no context.',
        ] },
      ],
    },
    {
      id: 'basic-strategies',
      title: 'Fixed-size, sentence and recursive chunking',
      blocks: [
        { type: 'p', text: '**Fixed-size chunking** cuts every N characters or tokens (say 500 tokens), regardless of content. It is simple, fast and predictable, and every chunk fits the embedding model. But it cuts mid-sentence and mid-word, splitting facts across chunks. **Overlap** (repeating the last part of one chunk at the start of the next) softens this.' },
        { type: 'viz', name: 'chunking', caption: 'Move the chunk-size and overlap sliders. See how chunk boundaries move, where sentences get cut, and how overlap increases the chunk count.' },
        { type: 'p', text: '**Chunking by sentence** first splits text into sentences, then packs whole sentences into a chunk until a size limit is reached. No sentence is ever cut. It can still glue the end of one topic to the start of another, because it does not know where paragraphs or sections end.' },
        { type: 'p', text: '**Recursive chunking** tries a list of separators from biggest to smallest: first split on blank lines (paragraphs); any piece still too big is split on sentence ends; any piece still too big on spaces; and so on. Small neighbouring pieces are packed back together up to the limit. The result respects the natural structure as much as the size limit allows. It is the default in popular frameworks (for example LangChain\'s `RecursiveCharacterTextSplitter`) and a strong baseline.' },
        { type: 'code', lang: 'python', title: 'three_chunkers.py', code: `import re

doc = ("Refunds. Items can be returned within 30 days. The refund goes to the "
       "original card.\\n\\nShipping. Orders ship in 2 days. Express costs $9 and "
       "arrives next day.")

def fixed(text, size=60, overlap=15):        # slide a window of characters
    step = size - overlap
    return [text[i:i + size] for i in range(0, len(text) - overlap, step)]

def by_sentence(text, max_chars=80):          # pack whole sentences
    sents = re.split(r"(?<=[.!?])\\s+", text.replace("\\n\\n", " "))
    chunks, cur = [], ""
    for s in sents:
        if cur and len(cur) + len(s) + 1 > max_chars:
            chunks.append(cur); cur = ""
        cur = (cur + " " + s).strip()
    return chunks + [cur]

def recursive(text, max_chars=80, seps=("\\n\\n", ". ", " ")):
    if len(text) <= max_chars or not seps:     # small enough (or give up)
        return [text]
    sep, out, cur = seps[0], [], ""
    for part in text.split(sep):               # biggest separator first
        joined = cur + sep + part if cur else part
        if len(joined) <= max_chars:
            cur = joined                       # keep packing pieces together
            continue
        if cur:
            out.append(cur)
        if len(part) > max_chars:              # piece still too big: recurse
            out += recursive(part, max_chars, seps[1:]); cur = ""
        else:
            cur = part
    return out + ([cur] if cur else [])

for name, fn in [("fixed", fixed), ("sentence", by_sentence), ("recursive", recursive)]:
    print(f"--- {name}")
    for c in fn(doc):
        print(repr(c))`, output: `--- fixed
'Refunds. Items can be returned within 30 days. The refund go'
'. The refund goes to the original card.\\n\\nShipping. Orders sh'
'ping. Orders ship in 2 days. Express costs $9 and arrives ne'
' and arrives next day.'
--- sentence
'Refunds. Items can be returned within 30 days.'
'The refund goes to the original card. Shipping. Orders ship in 2 days.'
'Express costs $9 and arrives next day.'
--- recursive
'Refunds. Items can be returned within 30 days'
'The refund goes to the original card.'
'Shipping. Orders ship in 2 days. Express costs $9 and arrives next day.'`,
          walkthrough: [
            { lines: [3, 5], note: 'A tiny handbook: a Refunds paragraph and a Shipping paragraph separated by a blank line.' },
            { lines: [7, 9], note: 'Fixed-size: a 60-character window that moves 45 characters each time, so neighbouring chunks overlap by 15.' },
            { lines: [11, 18], note: 'Sentence chunking: split after . ! or ?, then pack whole sentences until 80 characters.' },
            { lines: [20, 35], note: 'Recursive: split on the biggest separator, pack pieces up to the limit, and recurse with smaller separators only for pieces that are still too big.' },
            { lines: [37, 40], note: 'Print the chunks each method produces.' },
          ] },
        { type: 'p', text: 'Compare the outputs. Fixed-size produces fragments like `\'. The refund goes to the original card.\\n\\nShipping. Orders sh\'`, mixing two topics and cutting words. Sentence chunking never cuts a sentence, but its middle chunk glues the refund rule to the shipping rule. Recursive chunking keeps the shipping paragraph whole and only splits the refund paragraph (which was slightly too long) at a sentence boundary.' },
      ],
    },
    {
      id: 'structure-and-semantic',
      title: 'Document-structure and semantic chunking',
      blocks: [
        { type: 'p', text: '**Document-structure based chunking** uses the document\'s own layout: Markdown or HTML headings, PDF sections, table boundaries, code functions, slides, FAQ question/answer pairs. Each section (or subsection) becomes a chunk, and the heading path such as "Handbook > Refunds > Damaged items" is usually stored as metadata or prepended to the text. Authors already grouped related content, so this often gives the most coherent chunks. It needs reliable parsing; messy PDFs and scanned documents make it hard.' },
        { type: 'p', text: '**Semantic chunking** looks at meaning. Split the text into sentences, embed each one, and measure the similarity between neighbouring sentences. Where similarity drops sharply, the topic probably changed, so we cut there. For example, if consecutive-sentence similarities are 0.82, 0.79, **0.31**, 0.85, we cut at the 0.31 gap. It adapts to content without needing headings, but it costs an embedding per sentence at indexing time, the cut threshold needs tuning, and results can be uneven in size.' },
        { type: 'chart', kind: 'line', title: 'Semantic chunking: similarity between consecutive sentences', xLabel: 'Sentence gap', yLabel: 'Cosine similarity', series: [ { name: 'Neighbour similarity', points: [[1, 0.82], [2, 0.79], [3, 0.31], [4, 0.85], [5, 0.77], [6, 0.28], [7, 0.8]] }, { name: 'Cut threshold', points: [[1, 0.5], [7, 0.5]] } ], caption: 'Illustrative values. Gaps where similarity falls below the threshold (3 and 6) become chunk boundaries, giving three chunks.' },
        { type: 'check', question: 'A handbook converted from Markdown has clear headings for every policy. Which strategy is likely to give the most coherent chunks with the least effort?', answer: 'Document-structure chunking: split on headings, keep each policy section as a chunk (splitting long ones recursively), and attach the heading path as context. The author already grouped related content.' },
      ],
    },
    {
      id: 'contextual-small-to-big-agentic',
      title: 'Contextual, small-to-big and agentic chunking',
      blocks: [
        { type: 'p', text: '**Contextual chunking** fixes the "lost context" problem. Before embedding a chunk, we add a short note that situates it in the whole document, for example: *"From the Shipping section of the 2026 handbook; describes the express delivery fee."* That note can be the title and heading path, or a sentence an LLM writes after reading the full document and the chunk. Anthropic described the LLM-written version as "Contextual Retrieval" in 2024 and reported substantially fewer retrieval failures, especially when combined with BM25 and reranking. The cost is one LLM call per chunk at indexing time (prompt caching of the shared document makes this cheaper).' },
        { type: 'p', text: '**Small-to-big chunking** (also called parent-document or sentence-window retrieval) separates *what we search* from *what we return*. We embed small units, such as single sentences or 100-token pieces, because small units give sharp, precise vectors. Each small unit points to its bigger **parent** (the full paragraph or section). When a small unit matches, we hand the LLM the parent, so it gets full context. Precision of small chunks, context of big ones; the price is more bookkeeping and more tokens sent to the LLM.' },
        { type: 'p', text: '**Agentic chunking** lets an LLM decide the boundaries. It reads the document and groups content into self-contained ideas, sometimes rewriting text into standalone statements called **propositions** ("The return window for unused items is 30 days."). It can produce excellent chunks for messy text, but it is slow, expensive, harder to reproduce, and the LLM might drop or alter information. It is usually reserved for small, high-value collections.' },
        { type: 'steps', title: 'Small-to-big retrieval, step by step', items: [
          { title: 'Split into parents', text: 'Cut documents into large parent chunks, e.g. sections of ~1,000 tokens.' },
          { title: 'Split parents into children', text: 'Cut each parent into small child chunks, e.g. ~100 tokens or single sentences.' },
          { title: 'Embed children only', text: 'Store child vectors, each with a pointer to its parent ID.' },
          { title: 'Search children', text: 'The question is matched against the precise child vectors.' },
          { title: 'Return parents', text: 'Swap each matching child for its parent (removing duplicates) and give those to the LLM.' },
        ] },
      ],
    },
    {
      id: 'overlap-and-size',
      title: 'Chunk overlap, and how to choose the chunk size',
      blocks: [
        { type: 'p', text: '**Chunk overlap** repeats some text at the boundary: with size 500 and overlap 50 tokens, chunk 2 starts 450 tokens after chunk 1 starts. A fact sitting on a boundary then appears whole in at least one chunk. The cost is duplicated storage and embeddings (about size / (size − overlap) times as many chunks) and sometimes near-duplicate results. Overlap of roughly 10–20% is a common starting point; structure-aware methods need less, because they rarely cut mid-thought.' },
        { type: 'formula', expr: 'number of chunks ≈ ⌈ (L − overlap) / (size − overlap) ⌉', where: [['L', 'document length in tokens'], ['size', 'chunk size'], ['overlap', 'tokens shared between neighbours']], caption: 'Example: L = 10,000, size = 500, overlap = 100 → ⌈9,900 / 400⌉ = 25 chunks, versus 20 with no overlap.' },
        { type: 'p', text: 'Choosing the **chunk size** is a trade-off. Small chunks (100–256 tokens) give precise vectors and suit short factual questions, but may lack context. Large chunks (512–1,024+ tokens) carry context and suit "explain" or summary questions, but their vectors are blurrier and they use more of the LLM\'s context. Things to consider: the embedding model\'s max input length, the typical answer length in your documents, how many chunks you will pass to the LLM, and its context budget. Many teams start around 300–800 tokens with modest overlap, then test.' },
        { type: 'p', text: 'The only reliable way to choose is to **measure**: build 30–100 real questions with the passage that answers each, try two or three chunking settings, and check how often the right passage appears in the top-k (recall@k) and how good the final answers are.' },
      ],
    },
    {
      id: 'comparison',
      title: 'Comparison of all the strategies',
      blocks: [
        { type: 'table', caption: 'Chunking strategies at a glance (general tendencies; results depend on your data).', head: ['Strategy', 'How it cuts', 'Strength', 'Weakness', 'Indexing cost'], rows: [
          ['Fixed-size', 'Every N tokens/characters', 'Simple, predictable', 'Cuts sentences and topics', 'Very low'],
          ['Sentence', 'Pack whole sentences', 'Never cuts a sentence', 'Ignores topic/section ends', 'Low'],
          ['Recursive', 'Paragraph → sentence → word', 'Respects structure, good default', 'Still rule-based', 'Low'],
          ['Document structure', 'Headings, sections, tables', 'Coherent, author-defined units', 'Needs clean parsing', 'Low–medium'],
          ['Semantic', 'Where meaning shifts', 'Adapts to content', 'Embedding per sentence; tuning', 'Medium'],
          ['Contextual', 'Any method + added context', 'Fixes lost context', 'LLM call per chunk', 'Medium–high'],
          ['Small-to-big', 'Search small, return big', 'Precision plus context', 'More bookkeeping and tokens', 'Low–medium'],
          ['Agentic', 'LLM picks units', 'Best for messy text', 'Slow, costly, less reproducible', 'High'],
        ] },
        { type: 'compare', title: 'Three popular starting points',
          options: [
            { name: 'Recursive', summary: 'Rule-based, structure-respecting splits.', pros: ['Cheap', 'Good baseline'], cons: ['No awareness of meaning'], bestFor: 'Most text when you are just starting' },
            { name: 'Structure-based', summary: 'Cut on headings and sections.', pros: ['Coherent chunks', 'Free metadata (heading paths)'], cons: ['Depends on parsing quality'], bestFor: 'Docs, wikis, manuals, Markdown/HTML' },
            { name: 'Small-to-big', summary: 'Embed small, return parent.', pros: ['Precise matching with full context'], cons: ['More tokens to the LLM'], bestFor: 'Precise questions over long documents' },
          ],
          verdict: 'Start with structure-based or recursive chunking at a few hundred tokens, measure, then add contextual headers or small-to-big where evaluation shows lost context.' },
      ],
    },
    {
      id: 'mistakes-and-conclusion',
      title: 'Common mistakes and conclusion',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Choosing a chunk size without testing. Exceeding the embedding model\'s input limit (text gets silently truncated). Splitting tables row by row so headers are lost. Throwing away titles and headings that would give context. Using one strategy for everything (code, tables and prose need different handling). Forgetting metadata such as source, section and date. Re-chunking documents without re-embedding them, or mixing old and new chunks.' },
        { type: 'callout', tone: 'example', title: 'Real-world patterns', text: 'Documentation assistants often split Markdown by headings and prepend the heading path. Legal and policy RAG uses structure (articles, clauses) plus small-to-big. Code assistants chunk by function or class rather than by line count. Support bots chunk FAQs as one question-and-answer pair per chunk.' },
        { type: 'check', question: 'Our bot retrieves the chunk "This fee is waived for Plus members." for the question "Do Plus members pay for express shipping?" but the LLM says it cannot tell which fee is meant. Which strategy fixes this most directly?', answer: 'Contextual chunking (or small-to-big): add the section heading or an LLM-written context such as "Shipping section: express delivery fee" to the chunk, or return the parent paragraph, so the chunk says which fee it is about.' },
        { type: 'p', text: 'Chunking is the quiet foundation of RAG. Retrieval can only find what our chunks express, and the LLM can only answer from what the chunks contain. Choose units that are small enough to be precise, big enough to be meaningful, aligned with the document\'s structure, and carrying enough context to stand alone. Then measure and iterate.' },
      ],
    },
  ],
  quiz: [
    { q: 'Why do RAG systems split documents into chunks instead of embedding whole documents?', options: ['One long-document vector blurs topics and wastes LLM context', 'Vector databases refuse to store any text over one page long', 'LLMs can only read a single sentence of context at a time', 'Chunking makes every embedding exact instead of approximate'], answer: 0, explain: 'Chunks give focused vectors that can be matched precisely and short passages that fit the LLM\'s context. Whole documents produce blurry, averaged vectors and often exceed model limits.' },
    { q: 'A document has 10,000 tokens. With chunk size 500 and overlap 100, about how many chunks do we get?', options: ['20', '25', '100', '50'], answer: 1, explain: 'Each new chunk advances 500 − 100 = 400 tokens: ⌈(10,000 − 100) / 400⌉ = 25 chunks, versus 20 without overlap.' },
    { q: 'Our bot misses short factual answers because each 1,500-token chunk covers many topics, but with 100-token chunks the LLM lacks context. Which strategy addresses both?', options: ['Fixed-size chunks of 1,500 tokens with no overlap', 'Agentic chunking that splits text into single words', 'Small-to-big: match small chunks, return parents', 'Doubling the chunk size to 3,000 tokens per chunk'], answer: 2, explain: 'Small-to-big gives sharp vectors for matching and full parent context for the LLM.' },
    { q: 'How does semantic chunking decide where to cut, compared with recursive chunking?', options: ['Semantic cuts every N tokens; recursive compares sentence embeddings', 'Semantic cuts at meaning shifts; recursive follows a separator hierarchy', 'Both strategies cut only at document headings and section titles', 'Semantic asks an LLM to write propositions; recursive uses headings'], answer: 1, explain: 'Semantic chunking detects topic shifts from drops in neighbouring-sentence embedding similarity. Recursive chunking splits on paragraphs, then sentences, then words, under a size limit.' },
    { q: 'A teammate says: "More overlap is always better, so let\'s use 50% overlap." What is the main problem?', options: ['Overlap forces chunks to be cut in the middle of sentences', 'Vector databases do not support overlapping chunks at all', 'Overlap lowers recall because boundary facts are removed', 'It about doubles the chunks to store and adds duplicates'], answer: 3, explain: 'With 50% overlap each chunk advances only half its size, so we get about twice as many chunks, more cost and repetitive retrieval, for little gain over a modest overlap.' },
  ],
  takeaways: [
    'A chunk must be findable (a focused vector) and useful (enough context to answer).',
    'Fixed-size is simple but cuts ideas; sentence and recursive chunking respect boundaries; structure-based uses headings.',
    'Semantic chunking cuts where meaning shifts; contextual chunking adds situating context; small-to-big searches small and returns big.',
    'Overlap of about 10–20% protects boundary facts; chunk sizes of a few hundred tokens are a common start.',
    'There is no universal best: build a small evaluation set and measure recall and answer quality.',
  ],
  terms: [
    { term: 'Chunk', def: 'A piece of a document stored, embedded and retrieved as one unit.' },
    { term: 'Chunk overlap', def: 'Text repeated at the boundary between neighbouring chunks.' },
    { term: 'Recursive chunking', def: 'Splitting by a hierarchy of separators (paragraph, sentence, word) until pieces fit a size limit.' },
    { term: 'Semantic chunking', def: 'Cutting where embedding similarity between neighbouring sentences drops.' },
    { term: 'Contextual chunking', def: 'Adding document-level context to each chunk before embedding it.' },
    { term: 'Small-to-big', def: 'Searching small child chunks but returning their larger parent chunks to the LLM.' },
    { term: 'Proposition', def: 'A short, self-contained statement of a single fact, used in agentic chunking.' },
  ],
};
