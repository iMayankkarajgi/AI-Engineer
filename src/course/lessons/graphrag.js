export default {
  id: 'graphrag',
  minutes: 22,
  hook: 'Ask a normal RAG bot "What are the main themes across all 5,000 of our incident reports?" and it will summarise five random chunks. How could it ever see the whole picture?',
  summary: 'GraphRAG uses an LLM to read every chunk of a corpus and extract entities and relationships into a knowledge graph, groups the graph into communities of closely connected entities, and writes a summary for each community. At question time, local search starts from the entities a question mentions and gathers their neighbourhood, while global search combines community summaries to answer questions about the whole dataset. It answers connection and big-picture questions that chunk retrieval cannot, at a much higher indexing cost.',
  sections: [
    {
      id: 'what-is-graphrag',
      title: 'What is GraphRAG?',
      blocks: [
        { type: 'p', text: '**GraphRAG** is a family of RAG methods that build and use a **knowledge graph** of the content. A knowledge graph stores knowledge as **nodes** (entities: people, teams, products, systems, places, events) connected by **edges** (relationships: "leads", "depends on", "reports to"), each usually with a short text description. The name became widely known through Microsoft Research\'s GraphRAG work, described in the 2024 paper *"From Local to Global: A Graph RAG Approach to Query-Focused Summarization"* (Edge et al.) and released as open source.' },
        { type: 'p', text: 'Our running example: an engineering organisation\'s internal wiki and incident reports. People lead projects, projects use databases and queues, incidents affect services. Questions like *"If Postgres goes down, which project leads should we alert?"* or *"What are the recurring causes of our incidents this year?"* are about **connections** and **the whole collection**, not about one paragraph.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a detective\'s evidence board', text: 'Normal RAG is a detective searching a filing cabinet for the page that best matches a keyword. GraphRAG first pins every person, place and event on a board and draws string between related ones. Questions like "who is connected to whom?" or "what are the main clusters of activity?" become easy once the board exists; building the board is the hard work.' },
      ],
    },
    {
      id: 'why-normal-rag-is-not-enough',
      title: 'Why normal RAG is not enough',
      blocks: [
        { type: 'p', text: 'Normal (vector) RAG embeds chunks and retrieves the few most similar to the question. That is excellent for **local, single-passage** questions: "What is the on-call policy?". It struggles with two kinds of questions:' },
        { type: 'list', items: [
          '**Connection (multi-hop) questions**: "Which project leads depend on Postgres?" The fact "Falcon stores data in Postgres" and the fact "Asha leads Falcon" may sit in different documents that share no words with each other. Similarity search on the question may find one and miss the other.',
          '**Global (sensemaking) questions**: "What are the main themes in these reports?" No single chunk contains the answer; it is spread across the entire corpus. Retrieving the top 5 chunks summarises 5 chunks, not 5,000 reports.',
        ] },
        { type: 'p', text: 'The GraphRAG paper frames global questions as **query-focused summarisation** of a whole dataset, and that is where it showed the clearest gains over standard vector RAG, especially on how comprehensive and diverse the answers were.' },
        { type: 'check', question: 'Which question is a good fit for plain vector RAG, and which needs something like GraphRAG: (a) "What is the refund window?" (b) "What themes come up most across all customer complaints?"', answer: '(a) is a local question answered by one passage; vector RAG handles it well. (b) is a global question whose answer is spread across the whole corpus; GraphRAG\'s community summaries and global search are designed for it.' },
      ],
    },
    {
      id: 'big-picture',
      title: 'The big picture of GraphRAG',
      blocks: [
        { type: 'p', text: 'GraphRAG has two phases. An expensive **indexing** phase turns raw text into a graph with summaries. A **query** phase uses that structure to assemble the right context for the LLM.' },
        { type: 'flow', title: 'GraphRAG end to end', nodes: [
          { label: 'Chunk the text', detail: 'Split documents into text units, as in normal RAG.' },
          { label: 'Extract entities & relations', detail: 'An LLM reads each chunk and lists entities and relationships with short descriptions.' },
          { label: 'Build the graph', detail: 'Merge duplicate entities across chunks; nodes = entities, edges = relationships.' },
          { label: 'Detect communities', detail: 'Group densely connected entities into communities, at several levels of detail (Microsoft\'s implementation uses the Leiden algorithm).' },
          { label: 'Summarise communities', detail: 'An LLM writes a report for each community: who and what is in it and the key facts.' },
          { label: 'Answer queries', detail: 'Local search walks the graph near the question\'s entities; global search combines community reports.' },
        ] },
      ],
    },
    {
      id: 'building-the-graph',
      title: 'How GraphRAG builds the knowledge graph',
      blocks: [
        { type: 'steps', title: 'Indexing, step by step', items: [
          { title: 'Split into text units', text: 'Documents are chunked into units of a few hundred to over a thousand tokens.' },
          { title: 'LLM extraction', text: 'For each unit, an LLM is prompted to list entities (name, type, description) and relationships (source, target, description, strength). Some setups also extract claims, such as "incident #42 was caused by a bad config push".' },
          { title: 'Merge and summarise', text: 'The same entity found in many chunks ("Postgres", "PostgreSQL") is merged into one node; its many descriptions are summarised into one.' },
          { title: 'Community detection', text: 'A graph algorithm finds groups of nodes that are more connected to each other than to the rest. Running it hierarchically gives big communities that split into smaller sub-communities.' },
          { title: 'Community reports', text: 'An LLM writes a summary for each community at each level, from the nodes, edges and claims inside it.' },
          { title: 'Embed for lookup', text: 'Entity descriptions (and often text units and reports) are embedded so queries can find their starting entities.' },
        ] },
        { type: 'p', text: 'A **community** is a cluster of entities with many links among themselves and few links outside. In our example, Asha, Ben, Project Falcon and Postgres form one; Carla, Dev, Project Owl and Kafka another. A community report might read: "Project Falcon, led by Asha with Ben, stores its data in Postgres." These pre-written summaries are what make global questions answerable.' },
        { type: 'code', lang: 'python', title: 'tiny_graphrag.py', code: `from collections import Counter, defaultdict

# Step 1 (normally done by an LLM reading every chunk): entity-relation triples
triples = [("Asha", "leads", "Falcon"), ("Ben", "works on", "Falcon"),
           ("Falcon", "stores data in", "Postgres"), ("Ben", "reports to", "Asha"),
           ("Carla", "leads", "Owl"), ("Dev", "works on", "Owl"),
           ("Owl", "streams events via", "Kafka"), ("Dev", "reports to", "Carla"),
           ("Owl", "reads reports from", "Postgres"), ("Eve", "leads", "Hawk"),
           ("Hawk", "caches with", "Redis"), ("Fay", "works on", "Hawk")]

graph = defaultdict(set)                       # Step 2: build the graph
for s, _, o in triples:
    graph[s].add(o); graph[o].add(s)

# Step 3: find communities (GraphRAG uses Leiden; label propagation is simpler)
label = {n: n for n in sorted(graph)}
for _ in range(5):
    for n in sorted(graph):
        counts = Counter(label[m] for m in graph[n])
        top = max(counts.values())
        label[n] = min(l for l, c in counts.items() if c == top)
communities = defaultdict(list)
for n, l in label.items():
    communities[l].append(n)
for l, members in communities.items():
    print("community:", sorted(members))

# Local search: start at an entity and walk 2 hops, collecting facts
def local(entity, hops=2):
    seen, frontier = {entity}, {entity}
    for _ in range(hops):
        frontier = {m for n in frontier for m in graph[n]} - seen
        seen |= frontier
    return [f"{s} {r} {o}" for s, r, o in triples if s in seen and o in seen]

facts = local("Postgres")
print(f"local('Postgres'): {len(facts)} of {len(triples)} facts reached")
for fact in facts:
    print("  ", fact)`, output: `community: ['Asha', 'Ben', 'Falcon', 'Postgres']
community: ['Carla', 'Dev', 'Kafka', 'Owl']
community: ['Eve', 'Fay', 'Hawk', 'Redis']
local('Postgres'): 9 of 12 facts reached
   Asha leads Falcon
   Ben works on Falcon
   Falcon stores data in Postgres
   Ben reports to Asha
   Carla leads Owl
   Dev works on Owl
   Owl streams events via Kafka
   Dev reports to Carla
   Owl reads reports from Postgres`,
          walkthrough: [
            { lines: [3, 9], note: 'The triples an LLM would extract from the wiki: (entity, relationship, entity). Here we write them by hand.' },
            { lines: [11, 13], note: 'Build an undirected graph: each entity points to the entities it is linked with.' },
            { lines: [15, 21], note: 'Label propagation: every node repeatedly adopts the most common label among its neighbours (ties go to the alphabetically smallest). Densely linked groups converge to one label. Microsoft GraphRAG uses the more sophisticated Leiden algorithm.' },
            { lines: [22, 26], note: 'Group nodes by final label and print the communities.' },
            { lines: [28, 34], note: 'Local search: start from one entity, expand 2 hops through the graph, and collect every fact whose two ends were reached.' },
            { lines: [36, 39], note: 'Ask about Postgres and print the facts that would go into the LLM\'s context.' },
          ] },
        { type: 'p', text: 'The algorithm found the three teams as communities without being told. Local search from Postgres reached 9 of 12 facts: both projects that use it (Falcon, Owl), their leads (Asha, Carla) and team members. That is exactly the context needed for "which project leads should we alert if Postgres goes down?", even though no single document states it. The Hawk team, which uses Redis, was correctly left out.' },
      ],
    },
    {
      id: 'answering-and-search-modes',
      title: 'How GraphRAG answers a question: local vs global search',
      blocks: [
        { type: 'p', text: '**Local search** is for questions about specific entities. The query is matched (usually by embedding similarity) to entity descriptions to find starting nodes. The system gathers their neighbours, the relationships between them, the original text units that mention them, and relevant community reports, ranks and trims all of this to fit the context window, and asks the LLM to answer.' },
        { type: 'p', text: '**Global search** is for questions about the whole dataset. It uses a **map-reduce** pattern over community reports at a chosen level: in the **map** step, the LLM reads each report (or batch of reports) and writes a partial answer with a helpfulness score; in the **reduce** step, the most helpful partial answers are combined into one final answer. Because every community contributes, the answer reflects the whole corpus, not just the top few chunks.' },
        { type: 'compare', title: 'Local search vs global search',
          options: [
            { name: 'Local search', summary: 'Start at entities named in the question; expand through the graph.', pros: ['Precise, entity-focused answers', 'Follows multi-hop links', 'Relatively cheap per query'], cons: ['Needs the question to mention findable entities', 'Weak for "overall" questions'], bestFor: '"Who works with Asha?", "What depends on Postgres?"' },
            { name: 'Global search', summary: 'Map-reduce over community summaries for the whole dataset.', pros: ['Answers big-picture, sensemaking questions', 'Covers the entire corpus'], cons: ['Many LLM calls per query: slow and costly', 'Less detail on specific facts'], bestFor: '"What are the main themes?", "What risks recur?"' },
          ],
          rows: [
            ['Starting point', 'Entities matching the query', 'All community reports at one level'],
            ['LLM calls per query', 'Usually one', 'One per report batch, plus a reduce step'],
          ],
          verdict: 'Route entity questions to local search and dataset-wide questions to global search. Some implementations add hybrid modes (e.g. Microsoft\'s DRIFT search) that start global and drill down locally.' },
      ],
    },
    {
      id: 'when-to-use',
      title: 'When to use GraphRAG',
      blocks: [
        { type: 'list', items: [
          '**Use it** for corpora full of interlinked entities (organisations, people, systems, cases, research literature) where questions ask about relationships, dependencies or paths.',
          '**Use it** when users ask global, summarising questions about a large collection: themes, trends, recurring causes.',
          '**Use it** when explainability matters: an answer can point to the entities and relationships it used.',
          '**Skip it** when questions are mostly local look-ups ("what does policy X say?"); vector or hybrid RAG is cheaper and usually just as good.',
          '**Skip it** when data changes constantly and re-indexing cost is unaffordable, or when the corpus is small enough to read whole.',
        ] },
        { type: 'callout', tone: 'example', title: 'Where it is used', text: 'Intelligence and investigative analysis (who is connected to whom), enterprise knowledge bases with many teams and systems, research-literature exploration, IT dependency and incident analysis, and compliance reviews over large document sets. Open-source tooling includes Microsoft\'s `graphrag` package, plus graph features in LlamaIndex, LangChain and graph databases such as Neo4j. Approaches and APIs are evolving quickly; check current docs.' },
      ],
    },
    {
      id: 'trade-offs',
      title: 'Trade-offs of GraphRAG',
      blocks: [
        { type: 'table', caption: 'Costs and risks (qualitative; actual numbers depend heavily on corpus size and model choice).', head: ['Aspect', 'Vector RAG', 'GraphRAG'], rows: [
          ['Indexing work', 'One embedding per chunk', 'Several LLM calls per chunk plus summaries for every community'],
          ['Indexing cost', 'Low', 'High; can be orders of magnitude more than embedding'],
          ['Updates', 'Re-embed changed chunks', 'Re-extract, re-merge, possibly re-cluster and re-summarise'],
          ['Local questions', 'Strong', 'Strong, with multi-hop links'],
          ['Global questions', 'Weak', 'Strong (global search)'],
          ['Failure mode', 'Missed or irrelevant chunks', 'Extraction errors, merged or duplicated entities'],
        ] },
        { type: 'chart', kind: 'bar', title: 'Relative indexing effort per chunk', yLabel: 'Model calls per chunk', labels: ['Vector RAG', 'GraphRAG'], series: [ { name: 'Calls', values: [1, 4] } ], caption: 'Illustrative: one embedding call vs an extraction call, possible extra "gleaning" passes and a share of summary calls. The real ratio varies by configuration, and GraphRAG calls use a full LLM, which is far more expensive than an embedding model.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Running GraphRAG on a corpus where questions are simple look-ups (paying a lot for nothing). Not reviewing extraction quality: if the LLM merges "Apple (company)" with "apple (fruit)" or misses relationships, every later step inherits the error. Using generic entity types that do not fit the domain; tune the extraction prompt. Using global search for specific questions (slow and vague) or local search for themes (narrow).' },
        { type: 'p', text: 'Researchers are actively reducing the indexing cost. For example, Microsoft described **LazyGraphRAG** (late 2024), which defers most LLM summarisation until query time, making indexing much cheaper. Expect this area to keep changing.' },
      ],
    },
    {
      id: 'quick-summary',
      title: 'Quick summary',
      blocks: [
        { type: 'list', ordered: true, items: [
          'GraphRAG builds a knowledge graph of entities and relationships from text with an LLM.',
          'It groups the graph into communities and writes a summary report for each.',
          'Local search starts from the question\'s entities and gathers their neighbourhood: good for multi-hop questions.',
          'Global search map-reduces community reports: good for whole-dataset questions that vector RAG cannot answer.',
          'The price is a much more expensive, slower-to-update index; use it where connections and big-picture questions matter.',
        ] },
        { type: 'check', question: 'Our team asks "What are the three biggest recurring causes of outages this year?" over 4,000 incident reports. Should we use local or global search, and why?', answer: 'Global search. The answer is spread across the whole collection, and no specific entity anchors the question. Map-reduce over community summaries lets every cluster of incidents contribute before the results are combined.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does the GraphRAG indexing phase produce that plain vector RAG does not?', options: ['Larger chunks with more overlap between them', 'An entity graph with community summaries', 'A fine-tuned embedding model for the corpus', 'A keyword index with BM25 scores per chunk'], answer: 1, explain: 'GraphRAG uses an LLM to extract entities and relationships, builds a graph, detects communities and summarises them. Those structures are what local and global search use.' },
    { q: 'Our vector RAG bot cannot answer "What are the main themes across all our customer interviews?" What is the best explanation?', options: ['The embedding model is too small for long interviews', 'The chunk overlap is set too low to keep context', 'No top-k chunks hold the answer; it spans the corpus', 'The vector database is missing a metadata filter'], answer: 2, explain: 'Global questions need information from the whole collection. Retrieving a handful of similar chunks cannot summarise thousands of interviews; GraphRAG\'s global search over community reports targets this.' },
    { q: 'In the code, local search from "Postgres" with 2 hops reached 9 of 12 facts. Why were the Hawk team\'s facts not included?', options: ['Hawk is not within 2 hops of Postgres', 'Label propagation deleted the Hawk team', 'Hawk facts were filtered out by relation type', 'The graph is directed and Hawk points away'], answer: 0, explain: 'The Hawk community (Eve, Fay, Hawk, Redis) has no link to Postgres, so a 2-hop expansion from Postgres never reaches it.' },
    { q: 'How does global search differ from local search in GraphRAG?', options: ['Global uses BM25 while local uses embeddings', 'Global reads only one community report per query', 'Local search map-reduces all community reports', 'Global map-reduces community reports; local expands from entities'], answer: 3, explain: 'Local search anchors on entities found in the query and walks their neighbourhood. Global search runs map-reduce over community summaries to cover the whole dataset.' },
    { q: 'A teammate wants to switch our policy FAQ bot (simple look-ups, documents updated daily) to GraphRAG "because it is more advanced". What is the main concern?', options: ['GraphRAG cannot read policy documents', 'GraphRAG only answers global questions', 'High indexing cost and slow updates for little gain', 'GraphRAG requires a separate SQL database'], answer: 2, explain: 'For local look-ups, vector or hybrid RAG works well. GraphRAG adds many LLM calls per chunk and costly re-indexing, which daily updates would make worse.' },
  ],
  takeaways: [
    'GraphRAG extracts entities and relationships with an LLM to build a knowledge graph of the corpus.',
    'Community detection groups related entities; LLM-written community reports summarise each group.',
    'Local search expands from the question\'s entities through the graph, handling multi-hop questions.',
    'Global search map-reduces community reports to answer whole-dataset questions vector RAG cannot.',
    'Indexing is far more expensive and slower to update than vector RAG, so use GraphRAG where connections and big-picture questions matter.',
  ],
  terms: [
    { term: 'Knowledge graph', def: 'A network of entities (nodes) linked by typed relationships (edges).' },
    { term: 'Entity extraction', def: 'Using a model to find people, systems, places and other things, plus their relations, in text.' },
    { term: 'Community', def: 'A group of graph nodes more densely linked to each other than to the rest of the graph.' },
    { term: 'Community report', def: 'An LLM-written summary of the entities, relationships and key facts in one community.' },
    { term: 'Local search', def: 'Answering by expanding from entities mentioned in the question through their graph neighbourhood.' },
    { term: 'Global search', def: 'Answering by map-reducing community reports so the whole dataset contributes.' },
    { term: 'Leiden algorithm', def: 'A community-detection algorithm used by Microsoft GraphRAG to find hierarchical communities.' },
  ],
};
