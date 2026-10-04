export default {
  id: 'vectorless-rag',
  minutes: 20,
  hook: 'When you look something up in a 300-page manual, you don\'t compute embeddings: you open the table of contents, pick a chapter, then a section. Can an LLM retrieve the same way?',
  summary: 'Vectorless RAG retrieves context for an LLM without embeddings or a vector database. The best-known form turns a document into a tree, like a table of contents with section summaries, and lets an LLM reason its way down the tree to the right section; other forms use keyword search, agentic file search, SQL or simply long context. It avoids chunking and similarity problems and gives explainable retrieval paths, but costs more LLM calls per query and does not scale to huge unstructured collections as easily as vector search.',
  sections: [
    {
      id: 'llm-and-rag',
      title: 'What is an LLM, and what is RAG?',
      blocks: [
        { type: 'p', text: 'A **Large Language Model (LLM)** is a neural network trained on huge amounts of text to predict the next token. That simple skill lets it answer questions, summarise, write code and reason step by step. But it only knows what was in its training data, up to a cutoff date, and nothing about our private documents.' },
        { type: 'p', text: '**RAG (Retrieval-Augmented Generation)** fixes that: before the LLM answers, we **retrieve** relevant passages from our own documents and put them in the prompt, so the model **generates** an answer grounded in them. The "retrieve" part does not have to use vectors. That is the whole idea of this lesson.' },
        { type: 'p', text: 'Our running example: a company\'s **employee handbook**, a long, well-structured document with chapters on leave, expenses, security and so on. Employees ask things like *"How many vacation days can I carry over?"*' },
      ],
    },
    {
      id: 'vector-rag',
      title: 'How normal vector RAG works, and its problems',
      blocks: [
        { type: 'flow', title: 'Classic vector RAG', nodes: [
          { label: 'Chunk', detail: 'Split the handbook into pieces of a few hundred tokens.' },
          { label: 'Embed', detail: 'Turn each chunk into a vector with an embedding model.' },
          { label: 'Store', detail: 'Keep the vectors in a vector database.' },
          { label: 'Search', detail: 'Embed the question and fetch the most similar chunks.' },
          { label: 'Answer', detail: 'The LLM answers from those chunks.' },
        ] },
        { type: 'p', text: 'This works very well in many cases, but it has known weak spots:' },
        { type: 'list', items: [
          '**Similarity is not relevance**: the chunk most *similar* to the question is not always the one that *answers* it. "Vacation days carry over" might match an intro paragraph that mentions vacation many times.',
          '**Chunking breaks context**: a rule can be split across chunks, or a chunk can say "this limit" without saying which limit.',
          '**Lost structure**: chunks forget which chapter and section they came from, and cross-references ("see section 4.2") are not followed.',
          '**Opaque**: it is hard to explain *why* a chunk was chosen beyond "its vector was close".',
          '**Extra infrastructure**: an embedding model, a vector database, re-embedding when the model changes.',
        ] },
        { type: 'callout', tone: 'analogy', title: 'Think of it like two ways to find a recipe', text: 'Vector RAG is like tearing every cookbook into single pages, shuffling them, and picking the pages that "feel" closest to "chocolate cake". Vectorless tree RAG is like opening the cookbook\'s contents page, going to Desserts, then Cakes, then Chocolate cake. The second keeps the book intact and you can explain every step.' },
      ],
    },
    {
      id: 'what-is-vectorless',
      title: 'What is vectorless RAG?',
      blocks: [
        { type: 'p', text: '**Vectorless RAG** is any RAG system that finds the context for the LLM **without embeddings and without a vector database**. Instead of measuring vector similarity, it uses structure, keywords, queries, or the LLM\'s own reasoning to decide what to read.' },
        { type: 'p', text: 'The approach that made the term popular is **reasoning-based tree retrieval**: build a hierarchical index of a document, like a table of contents where each node has a title and a short summary, and let an LLM navigate it the way a person would. Open-source projects such as PageIndex describe themselves this way. The core claim is that for long, structured, professional documents (financial reports, contracts, manuals, regulations), retrieval by **reasoning over structure** finds the relevant section more reliably than retrieval by **similarity of chunks**. How much better it is depends on the documents and questions, so test on your own data.' },
        { type: 'check', question: 'Is a plain BM25 keyword search over the handbook "vectorless RAG"?', answer: 'Yes, by definition: it retrieves context without embeddings or a vector database. In practice the term is most often used for LLM-guided navigation of a document tree, but keyword search, SQL and file-search agents are all vectorless retrieval.' },
      ],
    },
    {
      id: 'how-it-works',
      title: 'How vectorless (tree-based) RAG works',
      blocks: [
        { type: 'steps', title: 'Indexing and querying', items: [
          { title: 'Parse the structure', text: 'Read the document\'s headings, sections and page ranges (from Markdown, HTML, or PDF layout) to build a tree: document → chapters → sections → subsections.' },
          { title: 'Summarise each node', text: 'Store a title and a short summary for every node (often written by an LLM once, at indexing time). This is the "table of contents with notes".' },
          { title: 'Show the LLM the top level', text: 'At question time, give the LLM the question plus the titles and summaries of the root\'s children.' },
          { title: 'Reason and descend', text: 'The LLM picks the most promising child (and can explain why), then sees that node\'s children, and so on. It may backtrack or open several branches.' },
          { title: 'Read the leaf text', text: 'When it reaches the right section, the full text of that section goes into the prompt.' },
          { title: 'Answer with a path', text: 'The LLM answers and can cite the exact path, e.g. Handbook > Leave > Vacation.' },
        ] },
        { type: 'p', text: 'Notice what changed: the "index" is the document\'s own structure, not a set of vectors; the "search algorithm" is the LLM\'s reasoning, not a nearest-neighbour lookup. Sections stay whole, so no chunk boundary cuts a rule in half.' },
      ],
    },
    {
      id: 'example',
      title: 'An example of vectorless RAG, in code',
      blocks: [
        { type: 'p', text: 'The script below builds a tiny handbook tree and navigates it. To keep it runnable without an API key, the `choose` function is a stand-in for the LLM: it picks the child whose title and summary share the most words with the question. A real system sends the question and the child summaries to an LLM, which can also understand synonyms and reason about the question.' },
        { type: 'code', lang: 'python', title: 'tree_navigation.py', code: `import re

# A document turned into a tree: every node has a title and a short summary.
tree = {"title": "Employee Handbook", "summary": "all company policies", "children": [
    {"title": "1 Leave", "summary": "vacation sick parental leave days", "children": [
        {"title": "1.1 Vacation", "summary": "25 vacation days per year, carry over up to 5",
         "text": "Staff get 25 vacation days a year. Up to 5 unused days carry over."},
        {"title": "1.2 Parental leave", "summary": "parental leave weeks for new parents",
         "text": "New parents get 16 weeks of paid parental leave."}]},
    {"title": "2 Expenses", "summary": "travel meals expense claims receipts", "children": [
        {"title": "2.1 Travel", "summary": "flights hotels travel booking rules",
         "text": "Book economy for flights under 6 hours."},
        {"title": "2.2 Meals", "summary": "meal allowance per day when travelling",
         "text": "The meal allowance is 50 EUR per travel day."}]}]}

def words(t):
    return set(re.findall(r"[a-z]+", t.lower()))

def choose(question, children):
    # Stand-in for the LLM step "which section should I open next, and why?"
    # Here: count shared words with each title + summary.
    q = words(question)
    return max(children, key=lambda c: len(q & words(c["title"] + " " + c["summary"])))

def navigate(question, node, path=()):
    path = path + (node["title"],)
    if "children" not in node:                  # reached a leaf: read it
        return path, node["text"]
    return navigate(question, choose(question, node["children"]), path)

for q in ["How many vacation days can I carry over?",
          "What is the meal allowance when I travel?"]:
    path, text = navigate(q, tree)
    print(q)
    print("   path:", " > ".join(path))
    print("   read:", text)`, output: `How many vacation days can I carry over?
   path: Employee Handbook > 1 Leave > 1.1 Vacation
   read: Staff get 25 vacation days a year. Up to 5 unused days carry over.
What is the meal allowance when I travel?
   path: Employee Handbook > 2 Expenses > 2.2 Meals
   read: The meal allowance is 50 EUR per travel day.`,
          walkthrough: [
            { lines: [3, 14], note: 'The index is a tree: every node has a title and a summary; leaves also hold the full section text.' },
            { lines: [16, 23], note: 'choose() stands in for one LLM step: given the question and the children\'s summaries, pick where to go next.' },
            { lines: [25, 29], note: 'navigate() walks from the root down, recording the path, until it reaches a leaf, then returns that section\'s text.' },
            { lines: [31, 36], note: 'Two questions, each answered by a different branch of the tree; we print the path and the text retrieved.' },
          ] },
        { type: 'p', text: 'Each question needed only **two decisions** (chapter, then section) and retrieved one complete, self-contained section. The output also shows *why* that text was chosen: the path. With a real LLM doing `choose`, a question like "Can I bring unused days into next year?" would also work, even though it shares no word with "carry over", because the model reasons about meaning.' },
        { type: 'chart', kind: 'bar', title: 'Decisions needed to reach a section (balanced tree, 10 children per node)', yLabel: 'LLM navigation steps', labels: ['100 sections', '1,000 sections', '10,000 sections'], series: [ { name: 'Steps', values: [2, 3, 4] } ], caption: 'Tree depth grows with the logarithm of the number of sections (log₁₀ N here). Each step is an LLM call, so latency grows slowly with size but is never as low as a single vector lookup.' },
      ],
    },
    {
      id: 'other-approaches',
      title: 'Other vectorless approaches',
      blocks: [
        { type: 'table', caption: 'Ways to retrieve without vectors.', head: ['Approach', 'How it finds context', 'Good for'], rows: [
          ['Keyword search (BM25)', 'Inverted index of words, ranked by term statistics', 'Exact terms, codes, names; cheap baseline'],
          ['Tree / table-of-contents navigation', 'LLM reasons down a hierarchy of section summaries', 'Long structured documents: reports, contracts, manuals'],
          ['Agentic file search', 'An agent uses tools like grep, find and open-file, iterating like a developer', 'Codebases, folders of text files'],
          ['Text-to-SQL / structured queries', 'LLM writes a database query and reads the rows', 'Tables, metrics, records'],
          ['Knowledge-graph queries', 'Traverse explicit entity relationships', 'Connection and multi-hop questions'],
          ['Long-context stuffing', 'Put the whole document in the prompt', 'Small or medium documents that fit the context window'],
        ] },
        { type: 'p', text: 'These are often combined. A coding assistant might grep for a function name, open the file, follow an import, and read another file: retrieval through reasoning and simple tools, no embeddings at all. As LLM context windows have grown to hundreds of thousands of tokens or more, simply including a whole document has also become practical for many cases, though it costs more per call and models can still overlook details buried in very long inputs.' },
      ],
    },
    {
      id: 'pros-cons-compare',
      title: 'Advantages, disadvantages and the comparison',
      blocks: [
        { type: 'p', text: '**Advantages.** No embedding model or vector database to run. No arbitrary chunking: sections stay intact. Retrieval follows document structure and can follow cross-references. Every decision is explainable as a path ("Leave > Vacation"). Often better on long, professional, well-structured documents where similar-sounding passages are common.' },
        { type: 'p', text: '**Disadvantages.** Several LLM calls per query (one per level, more with backtracking), so higher latency and cost than one vector lookup. It depends on good structure: messy PDFs, chat logs or millions of short unrelated documents have no useful tree. LLM navigation can take a wrong branch early and miss the answer. Building good node summaries at indexing time also costs LLM calls. And for "find anything similar to X across a huge corpus", vector search remains far more scalable.' },
        { type: 'compare', title: 'Vector RAG vs vectorless (tree-based) RAG',
          options: [
            { name: 'Vector RAG', summary: 'Embed chunks; retrieve by similarity.', pros: ['Fast single lookup (milliseconds)', 'Scales to millions of documents', 'Handles unstructured text well'], cons: ['Similarity is not always relevance', 'Chunking can break context', 'Hard to explain why a chunk was chosen'], bestFor: 'Large, varied, unstructured collections; high traffic' },
            { name: 'Vectorless (tree) RAG', summary: 'LLM reasons down a document\'s structure.', pros: ['Keeps sections whole', 'Explainable path', 'No embeddings or vector DB'], cons: ['Several LLM calls per query', 'Needs well-structured documents', 'Wrong early branch can miss the answer'], bestFor: 'Long structured documents: reports, contracts, manuals, regulations' },
          ],
          rows: [
            ['Index', 'Vectors of chunks', 'Tree of sections + summaries'],
            ['Retrieval step', 'Nearest-neighbour search', 'LLM reasoning, level by level'],
            ['Typical latency', 'Low', 'Higher (multiple LLM calls)'],
          ],
          verdict: 'They are complementary. Many systems use vector or hybrid search to find the right documents, then structure-aware navigation within a long document.' },
      ],
    },
    {
      id: 'when-to-use',
      title: 'When to use which one',
      blocks: [
        { type: 'list', items: [
          '**Choose vectorless tree RAG** for a modest number of long, structured, high-stakes documents (annual reports, legal contracts, technical manuals, regulations) where precision and explainability matter more than milliseconds.',
          '**Choose vector (or hybrid) RAG** for large, diverse, unstructured collections (support tickets, chat logs, web pages, millions of short documents), high query volume, or tight latency budgets.',
          '**Choose long-context stuffing** when the document is small enough to fit comfortably in the context window and query volume is low.',
          '**Choose SQL or graph queries** when the knowledge is already structured as tables or relationships.',
          '**Combine** them when needed: vectors to pick candidate documents, tree navigation to find the exact section.',
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Treating "vectorless" as automatically better: it trades cheap lookups for LLM reasoning, so measure accuracy, latency and cost on your own questions. Applying tree navigation to documents with no real structure (the tree becomes arbitrary). Writing vague node summaries, which give the LLM nothing to reason about. Forgetting a fallback (such as keyword search) when navigation reaches a dead end.' },
        { type: 'check', question: 'We have 2 million customer-support chat transcripts and need answers in under a second. Is tree-based vectorless RAG a good fit?', answer: 'No. Chat transcripts have little hierarchical structure, the collection is huge, and multiple LLM navigation calls would break the latency budget. Vector or hybrid search, perhaps with a reranker, fits much better.' },
      ],
    },
    {
      id: 'watch-next',
      title: 'Watch next',
      blocks: [
        { type: 'p', text: 'Two videos from the course author that tie this module together:' },
        { type: 'list', items: [
          '[AI Engineering Explained: LLM, RAG, MCP, Agent, Fine-Tuning, Quantization](https://www.youtube.com/watch?v=lnfWvX66FUk) (video)',
          '[Agentic RAG Explained](https://www.youtube.com/watch?v=6nSegpuWJVw) (video)',
        ] },
        { type: 'callout', tone: 'tip', title: 'How this lesson connects', text: 'Vectorless tree navigation is a form of agentic retrieval: an LLM decides step by step where to look. Compare it with the agentic RAG lesson (agents choosing tools) and the GraphRAG lesson (retrieval over explicit structure).' },
      ],
    },
  ],
  quiz: [
    { q: 'What defines vectorless RAG?', options: ['RAG that uses no LLM to write the final answer', 'Retrieval without embeddings or a vector database', 'RAG that only works on images and scanned PDFs', 'Vector search with very small embedding sizes'], answer: 1, explain: 'Vectorless RAG still uses an LLM to answer; it just finds context through structure, keywords, queries or reasoning instead of vector similarity.' },
    { q: 'In tree-based vectorless RAG, what plays the role that nearest-neighbour search plays in vector RAG?', options: ['A BM25 score computed for every node', 'Random sampling of sections in the tree', 'The LLM reasoning down the section tree', 'A cosine similarity over node summaries'], answer: 2, explain: 'The LLM reads the question and the child summaries at each level and chooses where to go next. No vectors are compared.' },
    { q: 'A balanced tree has 10 children per node and 1,000 leaf sections. How many navigation decisions does a single path from the root to a leaf take?', options: ['3', '10', '100', '1,000'], answer: 0, explain: '10 × 10 × 10 = 1,000, so the depth is log₁₀(1,000) = 3 decisions, each typically one LLM call.' },
    { q: 'Our legal team needs precise answers with exact clause references from 40 long contracts, and a few seconds per answer is fine. Vector RAG keeps returning similar but wrong clauses. What should we try?', options: ['Shrink the chunks to 20 tokens each', 'Raise the embedding dimension to 4,096', 'Turn off citations to speed up answers', 'Tree navigation over contract structure'], answer: 3, explain: 'Long, structured, high-stakes documents with relaxed latency are the sweet spot for reasoning-based tree retrieval, which keeps clauses whole and gives an explainable path.' },
    { q: 'A teammate says: "Vectorless RAG is strictly better, so let\'s drop vector search for our 5 million support tickets." What is the main problem?', options: ['Vectorless RAG cannot read English text', 'It scales poorly to huge unstructured sets', 'Vectorless RAG always needs a large GPU cluster', 'Tickets cannot be stored in any database'], answer: 1, explain: 'Tickets have little hierarchical structure and the collection is huge; several LLM calls per query would be slow and costly. Vector or hybrid search is the better fit here.' },
  ],
  takeaways: [
    'RAG only needs a way to retrieve relevant context; it does not have to use embeddings.',
    'Vector RAG can confuse similarity with relevance, break context with chunking, and is hard to explain.',
    'Tree-based vectorless RAG lets an LLM navigate a document\'s structure, like a table of contents, to the right section.',
    'Other vectorless options: BM25, agentic file search, SQL, graph queries and long-context stuffing.',
    'Vectorless suits long, structured documents with relaxed latency; vector search suits huge, unstructured, high-traffic collections.',
  ],
  terms: [
    { term: 'Vectorless RAG', def: 'RAG that retrieves context without embeddings or a vector database.' },
    { term: 'Tree index', def: 'A hierarchy of document sections, each with a title and summary, used for navigation.' },
    { term: 'Reasoning-based retrieval', def: 'Retrieval where an LLM decides step by step which part of the content to read.' },
    { term: 'Long-context stuffing', def: 'Putting a whole document directly into the LLM prompt instead of retrieving parts.' },
    { term: 'Text-to-SQL', def: 'An LLM writes a database query from a natural-language question and reads the result.' },
  ],
};
