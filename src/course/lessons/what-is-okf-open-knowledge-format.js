export default {
  id: 'what-is-okf-open-knowledge-format',
  minutes: 21,
  hook: 'Our company\'s knowledge lives in wikis, chat threads, spreadsheets and people\'s heads, so how does an AI agent find the one definition of "active user" that is actually right?',
  summary: 'OKF (Open Knowledge Format) is an open, vendor-neutral specification from Google Cloud for writing down curated knowledge as a folder of Markdown files. Each file describes one concept, starts with a small YAML header whose only required field is `type`, and links to related concepts with ordinary Markdown links. An agent reads the files directly and follows the links like a graph, instead of guessing from scattered search results.',
  sections: [
    {
      id: 'scattered-knowledge',
      title: 'The problem: our knowledge is scattered',
      blocks: [
        { type: 'p', text: 'Our running example: an analytics team at an online shop. Their AI agent answers questions such as "How many weekly active users did we have last month?" To answer correctly, the agent must know what "weekly active user" means here, which table holds the events, that timestamps are stored in UTC, and that test accounts must be excluded.' },
        { type: 'p', text: 'That knowledge exists, but it is spread across a wiki page from 2023, a comment in a SQL file, a spreadsheet of metric owners and a senior analyst\'s memory. Each tool stores it differently: some behind an API, some in a proprietary database, some nowhere at all.' },
        { type: 'list', items: [
          '**Agents guess.** With no curated definition, the agent may invent a plausible but wrong formula.',
          '**Search returns fragments.** Retrieval over raw documents finds similar text, not the one approved definition, and not how it connects to other facts.',
          '**Knowledge is locked in.** If definitions live inside one vendor\'s catalog, a different agent or tool cannot read them.',
        ] },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a well-kept recipe binder', text: 'A family can keep recipes on sticky notes, in phone photos and in grandma\'s head. Or they can keep a binder: one page per recipe, a label at the top ("dessert", "sauce"), and notes like "see the pastry page". Anyone, even a new cook, can open the binder, find the page and follow the cross-references. OKF is that binder for an organisation, written so both people and agents can read it.' },
      ],
    },
    {
      id: 'what-is-okf',
      title: 'What is OKF? Open + Knowledge + Format',
      blocks: [
        { type: 'p', text: '**OKF (Open Knowledge Format)** is a specification that Google Cloud published in June 2026 for packaging curated knowledge so that AI agents can read it. Version 0.1 was the first public draft, and a later revision (v0.2) added optional fields for provenance, trust and freshness. The spec is published on GitHub under the Apache-2.0 licence. Because it is young, details may still change, so check the current spec before you build on it.' },
        { type: 'p', text: 'The core idea fits in one sentence: **a bundle is a directory of Markdown files; each file is one concept; each file starts with YAML frontmatter; files link to each other with normal Markdown links.** That is all. There is no server to run and no special database.' },
        { type: 'p', text: 'It also helps to say what OKF is **not**. It is not a runtime (nothing executes), not a search index (no embeddings are required), and not a model. It is only a *format*: an agreement about how files are laid out, so that any tool or agent can read them.' },
        { type: 'p', text: '**OKF = Open + Knowledge + Format.** Each word in the name carries a design choice:' },
        { type: 'table', caption: 'Each word in the name carries a design choice', head: ['Word', 'What it means', 'Why it matters'], rows: [
          ['Open', 'A public, vendor-neutral spec with an open licence', 'Any agent, any cloud, any editor can read and write bundles. No lock-in.'],
          ['Knowledge', 'Curated, approved facts: definitions, rules, relationships', 'Not raw documents. Someone decided "this is the right definition".'],
          ['Format', 'A file layout convention, not software', 'Plain files work with git, code review, diff tools and any text editor.'],
        ] },
        { type: 'p', text: 'Notice the word **curated**. RAG (retrieval-augmented generation) pulls similar chunks out of whatever documents exist at question time. OKF instead stores knowledge that someone deliberately wrote, reviewed and linked. The two can coexist, but they answer different needs: breadth from RAG, trustworthy core facts from a curated bundle.' },
      ],
    },
    {
      id: 'inside-a-bundle',
      title: 'What is inside an OKF bundle?',
      blocks: [
        { type: 'p', text: 'A **bundle** is simply a folder. Its file paths act as concept identities: `metrics/weekly_active_users.md` *is* the concept "weekly active users" in this bundle.' },
        { type: 'code', lang: 'text', title: 'analytics-bundle/', code: `analytics-bundle/
├── index.md                     # optional: lists what is here
├── log.md                       # optional: dated history of changes
├── metrics/
│   ├── weekly_active_users.md   # one concept per file
│   └── revenue.md
├── tables/
│   └── events.md
└── glossary/
    └── user_id.md` },
        { type: 'list', items: [
          '**Concept files**: one Markdown file per concept (a metric, a table, a policy, a term, a decision).',
          '**`index.md`** (reserved name, optional): a directory listing so an agent can see what exists before opening anything. This is *progressive disclosure*: read the overview first, open details only when needed.',
          '**`log.md`** (reserved name, optional): a chronological record of what changed and when, kept next to the knowledge it describes.',
        ] },
        { type: 'p', text: 'The reserved names must not be used for ordinary concepts, so tools always know that `index.md` means "listing" and `log.md` means "history".' },
      ],
    },
    {
      id: 'frontmatter',
      title: 'The frontmatter and the one required field',
      blocks: [
        { type: 'p', text: '**Frontmatter** is the small YAML block between two `---` lines at the top of a Markdown file. In OKF it carries machine-readable facts about the concept, and the Markdown body below explains the concept in prose for both humans and models.' },
        { type: 'code', lang: 'markdown', title: 'metrics/weekly_active_users.md', code: `---
type: Metric
title: Weekly active users (WAU)
description: Distinct signed-in users with at least one event in a 7-day window.
tags: [growth, engagement]
---
# Weekly active users

Count distinct \`user_id\` values in [events](/tables/events.md) over the last
7 days (UTC). Exclude test accounts (see [user id rules](/glossary/user_id.md)).
Owned by the growth team.` },
        { type: 'p', text: 'In v0.1, **the only required field is `type`**: what kind of thing this concept is, such as `Metric`, `BigQuery Table` or `Policy`. Everything else is optional. The spec reserves a few common names so tools agree on their meaning: `title`, `description`, `resource` (a link to the real underlying object, like a table URI), `tags` and `timestamp`. Later revisions add optional fields for where a fact came from, who generated or verified it, and when it goes stale.' },
        { type: 'check', question: 'Why would a spec require only one field instead of ten?', answer: 'A low bar makes adoption easy: any existing Markdown note becomes a valid concept by adding one line, `type: ...`. The `type` is the minimum an agent needs to know what kind of thing it is reading; richer fields can be added when a team needs them.' },
      ],
    },
    {
      id: 'cross-links',
      title: 'Cross-links turn files into a graph',
      blocks: [
        { type: 'p', text: 'Concepts refer to each other with **ordinary Markdown links**, written as paths from the bundle root, like `[events](/tables/events.md)`. Each link is an edge; each file is a node. Together they form a **knowledge graph** that does not depend on the folder hierarchy: a metric in `metrics/` can point to a table in `tables/` and a rule in `glossary/`.' },
        { type: 'p', text: 'A link to a file that does not exist yet is allowed. It simply marks knowledge that has not been written down. That is useful: it shows the team where the gaps are.' },
        { type: 'flow', title: 'Following links to answer "How is WAU computed?"', nodes: [
          { label: 'index.md', detail: 'The agent sees a listing and picks metrics/weekly_active_users.md.' },
          { label: 'WAU metric', detail: 'type: Metric. The body says: count distinct user_id in events over 7 days, UTC.' },
          { label: 'events table', detail: 'Linked from the metric. type: BigQuery Table. One row per user action; resource points to the real table.' },
          { label: 'user id rules', detail: 'Linked from the table. Explains that test accounts have a special prefix and must be excluded.' },
          { label: 'Answer / SQL', detail: 'With three small, approved files in context, the agent writes a correct query.' },
        ] },
        { type: 'matrix', title: 'Who links to whom in the example bundle', rows: ['index.md', 'metrics/wau', 'tables/events', 'glossary/user-id'], cols: ['metrics/wau', 'tables/events', 'glossary/user-id', 'teams/growth'], values: [[1, 1, 0, 0], [null, 1, 0, 1], [0, null, 1, 0], [0, 0, null, 0]], format: 'int', caption: 'Each 1 is a Markdown link from the row file to the column file (blank = the file itself). This is the graph the code below walks. teams/growth is linked but not written yet, so it has no row.' },
        { type: 'p', text: 'Below we build a tiny bundle in Python, check that every concept has a `type`, and walk the links breadth-first (closest concepts first) with a hop limit, the way a careful agent would gather context.' },
        { type: 'code', lang: 'python', title: 'walk_bundle.py', code: `# A tiny OKF-style bundle: check frontmatter and follow cross-links (stdlib only).
import re
from collections import deque

BUNDLE = {
    "/index.md": "# Analytics bundle\\n- [Weekly active users](/metrics/wau.md)\\n- [Events table](/tables/events.md)",
    "/metrics/wau.md": "---\\ntype: Metric\\ntitle: Weekly active users\\n---\\nDistinct users with an event in 7 days. "
                       "Computed from [events](/tables/events.md). Owner: [growth team](/teams/growth.md).",
    "/tables/events.md": "---\\ntype: BigQuery Table\\ntitle: events\\n---\\nOne row per user action. "
                         "Timestamps are UTC. See [user id rules](/glossary/user-id.md).",
    "/glossary/user-id.md": "---\\ntitle: User ID\\n---\\nA user id is stable across devices.",
}
LINK = re.compile(r"\\]\\((/[^)]+\\.md)\\)")       # bundle-absolute markdown links

def frontmatter(text):
    block = text.split("---")[1]
    return dict(l.split(": ", 1) for l in block.strip().splitlines())

RESERVED = {"index.md", "log.md"}               # listing / history, not concepts
for path, text in BUNDLE.items():               # the only required field is \`type\`
    if path.rsplit("/", 1)[-1] in RESERVED:
        continue
    fm = frontmatter(text)
    print(f"{path:22s} type={fm.get('type', 'MISSING -> invalid')}")

def gather(start, max_hops):                    # breadth-first walk along links
    seen, queue, order = {start}, deque([(start, 0)]), []
    while queue:
        path, hops = queue.popleft()
        if path not in BUNDLE:
            order.append(f"{path} (not written yet)")
            continue
        order.append(f"{path} (hop {hops})")
        if hops == max_hops:
            continue
        for link in LINK.findall(BUNDLE[path]):
            if link not in seen:
                seen.add(link)
                queue.append((link, hops + 1))
    return order

print("\\nContext for 'How is WAU computed?':")
for line in gather("/metrics/wau.md", max_hops=2):
    print("  ", line)`, output: `/metrics/wau.md        type=Metric
/tables/events.md      type=BigQuery Table
/glossary/user-id.md   type=MISSING -> invalid

Context for 'How is WAU computed?':
   /metrics/wau.md (hop 0)
   /tables/events.md (hop 1)
   /teams/growth.md (not written yet)
   /glossary/user-id.md (hop 2)`, walkthrough: [
          { lines: [5, 12], note: 'A four-file bundle held in a dictionary: path → file text. `index.md` is a listing; the others are concept files with frontmatter.' },
          { lines: [13, 17], note: 'A regex finds bundle-absolute Markdown links like `](/tables/events.md)`, and a tiny parser reads the frontmatter block.' },
          { lines: [19, 24], note: 'Validation: skip the reserved files, then report each concept\'s `type`. The glossary file forgot `type`, so it is not a valid concept.' },
          { lines: [26, 40], note: 'Breadth-first traversal: start at the WAU metric, follow links, stop at `max_hops`. A link to a missing file is reported as "not written yet", not as an error.' },
          { lines: [42, 44], note: 'Print the ordered list of files the agent would read for this question.' },
        ] },
        { type: 'p', text: 'The output shows two OKF ideas at once: the missing `type` is caught by a simple lint, and the missing `/teams/growth.md` is a visible knowledge gap rather than a crash.' },
      ],
    },
    {
      id: 'why-markdown',
      title: 'Why plain Markdown files?',
      blocks: [
        { type: 'list', items: [
          '**Models already read Markdown well.** It is everywhere in their training data, so no conversion step is needed.',
          '**Humans can read and edit it.** Analysts, engineers and lawyers can all review a `.md` file.',
          '**Git works out of the box.** We get history, diffs, blame and pull-request review for free. A bad edit arrives as a diff someone can reject.',
          '**No lock-in.** Any vendor, any agent framework and any static-site tool can consume a folder of files.',
          '**Cheap to start.** Many teams already keep Markdown notes; adding frontmatter and links makes them a bundle.',
        ] },
        { type: 'compare', title: 'Where can an agent get company knowledge?', options: [
          { name: 'OKF bundle', summary: 'Curated Markdown concepts with frontmatter and links.', pros: ['Reviewed, authoritative facts', 'Readable by people and any agent', 'Versioned in git'], cons: ['Someone must write and maintain it', 'Not built for millions of documents'], bestFor: 'Core definitions, rules, data catalog knowledge' },
          { name: 'RAG over raw docs', summary: 'Chunk and embed existing documents; retrieve similar chunks per question.', pros: ['Covers huge, messy corpora', 'No manual writing'], cons: ['May return outdated or conflicting text', 'Loses links between facts'], bestFor: 'Broad search across many documents' },
          { name: 'Proprietary catalog / API', summary: 'Knowledge stored inside a vendor tool, read through its API.', pros: ['Rich UI and permissions', 'Integrated with that vendor'], cons: ['Format locked to one vendor', 'Each agent needs a custom connector'], bestFor: 'Teams fully inside one platform' },
        ], rows: [
          ['Who decides what is true', 'Reviewers of the bundle', 'Whatever text ranks highest', 'The tool owner'],
          ['Relationships', 'Explicit links', 'Implicit similarity', 'Tool-specific'],
          ['Portability', 'High', 'Medium (index is tool-specific)', 'Low'],
        ], verdict: 'Use an OKF bundle for the facts that must be right, and RAG for the long tail of everything else.' },
      ],
    },
    {
      id: 'how-agents-use-it',
      title: 'How an agent actually uses it',
      blocks: [
        { type: 'steps', title: 'An agent working with a bundle', items: [
          { title: 'Discover', text: 'Read `index.md` (or list the directory) to see which concepts exist. This costs few tokens.' },
          { title: 'Select', text: 'Pick the concept files that match the question, using titles, types and descriptions from frontmatter.' },
          { title: 'Traverse', text: 'Follow links from those files to related concepts, usually only one or two hops, to collect definitions and rules.' },
          { title: 'Act', text: 'Answer the question or do the task (for example, write SQL) using only the gathered, approved context.' },
          { title: 'Update (if allowed)', text: 'An agent that learns something new can propose an edit to a concept file and add a line to `log.md`. In a git workflow, a human reviews that change.' },
        ] },
        { type: 'callout', tone: 'tip', title: 'Read with the tools the agent already has', text: 'An agent with ordinary file tools (list, read, search) can use a bundle directly. No new protocol is required. A team may still expose a bundle through a server, for example over MCP, so remote agents can read it.' },
      ],
    },
    {
      id: 'okf-mcp-skills',
      title: 'OKF, MCP, and Agent Skills',
      blocks: [
        { type: 'p', text: 'These three ideas are often mentioned together because they answer three different questions an agent has.' },
        { type: 'table', head: ['', 'Answers the question', 'What it is', 'Example'], rows: [
          ['OKF', '"What is true in this domain?"', 'A file format for curated knowledge', 'The definition of WAU and the events table'],
          ['Agent Skills', '"How do I do this kind of task?"', 'Folders of instructions and scripts loaded on demand', 'A skill: "write a metric query and test it"'],
          ['MCP', '"How do I reach that system?"', 'A protocol for tools and data served by a server', 'A server that runs queries on the warehouse'],
        ] },
        { type: 'p', text: 'They combine naturally. The skill tells the agent the procedure, the bundle tells it what the words mean, and an MCP tool runs the query. Both skills and OKF also share the same design taste: plain Markdown with YAML frontmatter, and progressive disclosure through short metadata first.' },
        { type: 'check', question: 'Our agent knows *how* to write SQL (it has a skill for it) but keeps using the wrong definition of "churned customer". Which of the three should we add?', answer: 'An OKF concept for "churned customer" (with `type: Metric` and links to the right tables). The problem is missing knowledge about *what* the term means here, not a missing procedure or a missing connection.' },
      ],
    },
    {
      id: 'what-ships-and-limits',
      title: 'What ships with OKF today, and its limits',
      blocks: [
        { type: 'p', text: 'Alongside the spec, Google released reference material: example bundles, a tool that renders a bundle as a browsable static site with its link graph, and an agent that drafts concept files from BigQuery metadata. The community has since built validators, linters and agent plugins. The ecosystem is new and changing quickly, so treat any tool list as a snapshot.' },
        { type: 'callout', tone: 'warn', title: 'A format does not make knowledge correct', text: 'OKF only standardises the *shape* of the files. If nobody reviews them, a bundle can still be stale, contradictory or wrong, and an agent will trust it more because it looks official. Keep bundles in git, require review for changes, and use the optional freshness and verification fields where your version of the spec supports them.' },
        { type: 'list', items: [
          '**Maintenance cost**: curated knowledge must be written and kept up to date.',
          '**Scale**: a hand-curated bundle suits hundreds or thousands of core concepts, not every document a company owns.',
          '**Early spec**: version numbers below 1.0 signal that fields and rules may still change.',
          '**When not to use it**: for a small one-off project, a README may be enough; for searching a vast archive, use retrieval; for live data, use a tool or MCP server.',
        ] },
      ],
    },
    {
      id: "common-mistakes-bundle",
      title: "Common mistakes and how to spot them",
      blocks: [
        { type: "p", text: "A bundle is easy to start and easy to let drift. Most problems fall into two groups: things a simple script can find, and things only a reviewer can find. It helps to know which is which, so we automate the first group and save human attention for the second." },
        { type: "table", caption: "What goes wrong in a bundle and who can catch it",
          head: ["Problem", "How we spot it", "Who catches it"],
          rows: [
            ["A concept file has no `type`", "Parse the frontmatter of every concept file", "A script. This is the one hard rule from the lesson."],
            ["A concept that nothing links to", "Count the links pointing at each file; a count of 0 means agents that follow links will never reach it", "A script. This is a team check, not a rule of the format."],
            ["A link to a file that is not written", "Collect link targets that are not in the bundle", "A script. It is allowed, so we report it as a gap, not an error."],
            ["Two files define the same idea differently", "Read them side by side", "A reviewer. Both files are valid; the format cannot tell which is right."],
            ["A definition that is out of date", "Compare with how the real system behaves today", "A reviewer, helped by `log.md` and any freshness fields the team uses."],
            ["A file that mixes several concepts", "The title needs the word “and”", "A reviewer. One concept per file keeps links precise."]
          ] },
        { type: "p", text: "The gaps deserve a second look. A missing file that one concept links to is a small hole. A missing file that five concepts link to is knowledge the whole team relies on and nobody has written down. So we do not just list gaps; we count how many files want each one and write the most wanted first." },
        { type: "steps", title: "A review routine for every change to the bundle",
          items: [
            { title: "Run the script checks", text: "Missing `type`, zero in-links, and the list of gaps with their counts. These take seconds and need no judgement." },
            { title: "Fix errors, triage warnings", text: "A missing `type` must be fixed. A file with no in-links is either linked from `index.md` or from a related concept, or removed." },
            { title: "Read the diff as a person", text: "Is the definition right? Does it contradict another file? This is the part a script cannot do." },
            { title: "Record the change", text: "Add a dated line to `log.md` so the next reader, human or agent, can see what changed and when." }
          ] },
        { type: "p", text: "Remember the warning from earlier: a tidy bundle looks official. Passing every script check means the files have the right shape. It says nothing about whether the facts are true." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "The earlier code walked *forward* along links, the way an agent gathers context. Now we look at the bundle the way a maintainer does. We build a small linter that checks the required field, counts the links pointing *at* each concept, and lists the gaps with how many files want each one." },
        { type: "code", lang: "python", title: "practice_bundle_lint.py", code: `# Lint a tiny OKF-style bundle: required field, in-links, and knowledge gaps.
import re

BUNDLE = {
    "/index.md": "- [WAU](/metrics/wau.md)\\n- [Revenue](/metrics/revenue.md)",
    "/metrics/wau.md": "---\\ntype: Metric\\ntitle: Weekly active users\\n---\\n"
                       "From [events](/tables/events.md). Owner: [growth](/teams/growth.md).",
    "/metrics/revenue.md": "---\\ntype: Metric\\ntitle: Revenue\\n---\\nSum of paid [orders](/tables/orders.md).",
    "/tables/events.md": "---\\ntype: BigQuery Table\\ntitle: events\\n---\\nOne row per user action.",
    "/glossary/churn.md": "---\\ntitle: Churned customer\\n---\\nNo order in 90 days. See [orders](/tables/orders.md).",
}
LINK = re.compile(r"\\]\\((/[^)]+\\.md)\\)")        # links written from the bundle root
RESERVED = {"index.md", "log.md"}               # listing / history, not concepts

def frontmatter(text):
    block = text.split("---")[1]
    return dict(line.split(": ", 1) for line in block.strip().splitlines())

concepts = {p: t for p, t in BUNDLE.items() if p.rsplit("/", 1)[-1] not in RESERVED}
incoming = {p: [] for p in concepts}            # concept -> files that link to it
gaps = {}                                       # missing target -> files that link to it
for source, text in BUNDLE.items():
    for target in LINK.findall(text):
        (incoming[target] if target in concepts else gaps.setdefault(target, [])).append(source)

for path, text in concepts.items():
    fm = frontmatter(text)
    notes = []
    if "type" not in fm:
        notes.append("ERROR: no type")
    if not incoming[path]:
        notes.append("warning: nothing links here")
    print(f"{path:20s} in-links={len(incoming[path])}  {'; '.join(notes) or 'ok'}")
for target, sources in sorted(gaps.items()):
    print(f"gap: {target} not written yet, wanted by {len(sources)} file(s)")`, output: `/metrics/wau.md      in-links=1  ok
/metrics/revenue.md  in-links=1  ok
/tables/events.md    in-links=1  ok
/glossary/churn.md   in-links=0  ERROR: no type; warning: nothing links here
gap: /tables/orders.md not written yet, wanted by 2 file(s)
gap: /teams/growth.md not written yet, wanted by 1 file(s)`,
          walkthrough: [
            { lines: [4, 13], note: "A five-file bundle. The churn file has no `type` and nothing links to it. Two files link to an orders table that does not exist yet." },
            { lines: [19, 24], note: "One pass over every link in every file. A link to an existing concept is recorded under `incoming`; a link to a missing file is recorded under `gaps`. Links from `index.md` count too." },
            { lines: [26, 33], note: "Report each concept: how many files link to it, an error if `type` is missing, and a warning if nothing links to it." },
            { lines: [34, 35], note: "Report each gap with the number of files that want it." }
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Add `- [Churn](/glossary/churn.md)` to the text of `/index.md`. Predict the new line for the churn file. Which note disappears and which stays?",
          "Write the missing table: add a `/tables/orders.md` entry with `type: BigQuery Table`. Predict its in-link count and which gap line disappears.",
          "Add an empty `\"/log.md\": \"2026: bundle created\"` entry. Predict whether it shows up in the report, and explain why from the code."
        ] },
        { type: "check", question: "The linter prints an ERROR for a missing `type` but only a warning for a file nothing links to, and a plain “gap” for a missing target. Why three different levels?", answer: "They match what the lesson says about the format. A missing `type` breaks the one required rule, so the file is not a valid concept. A file with no in-links is valid, just hard for a link-following agent to find, so it is a team-level warning. A link to an unwritten file is explicitly allowed and useful: it marks knowledge still to be written. Treating all three as errors would make the report noisy and teach people to ignore it." },
        { type: "check", question: "`/tables/orders.md` is wanted by 2 files and `/teams/growth.md` by 1. Suppose we have time to write only one. Which do we pick, and what does the forward walk from the earlier code tell us that this count does not?", answer: "We pick the orders table: two concepts depend on it, so writing it fills two holes at once. The in-link count shows how widely a file is needed across the bundle. The forward walk shows something different: what an agent would actually read for one specific question. A gap can have a low count and still sit on the path of our most common question, so a careful team looks at both." }
      ]
    },
    {
      id: 'summary',
      title: 'Summary',
      blocks: [
        { type: 'p', text: 'OKF is an open format for curated knowledge: a folder of Markdown files, one concept per file, each with YAML frontmatter whose only required field is `type`, connected by bundle-absolute Markdown links into a graph. Optional `index.md` and `log.md` give a listing and a change history. Agents discover, select, traverse and act using ordinary file reading, and git gives review and history. OKF says *what is true*, Agent Skills say *how to do things*, and MCP connects to *live systems*.' },
      ],
    },
  ],
  quiz: [
    { q: 'In OKF v0.1, which frontmatter field is required in every concept file?', options: ['`title`', '`resource`', '`tags`', '`type`'], answer: 3, explain: 'Only `type` is required. `title`, `description`, `resource`, `tags` and `timestamp` are reserved optional fields that tools understand when present.' },
    { q: 'Our agent keeps defining "active user" differently from the finance team, even though finance has an approved definition in a slide deck. What is the OKF-style fix?', options: ['Fine-tune the model on the finance slide deck', 'Write a linked concept file holding the approved definition', 'Index the deck in a vector store and hope it ranks first', 'Raise the temperature so the agent explores more definitions'], answer: 1, explain: 'OKF captures curated knowledge as a concept file (for example `type: Metric`) that the agent reads directly, with links to the tables it uses. Retrieval may surface the deck but does not guarantee it; fine-tuning is costly and hard to update; temperature has nothing to do with correctness.' },
    { q: 'In the lesson\'s traversal code, the WAU file links to `/teams/growth.md`, which does not exist. What did the walk do?', options: ['Reported it as "not written yet" and kept walking', 'Raised an error and stopped the whole traversal', 'Skipped it silently, leaving no record of the gap', 'Created an empty concept file for it on the spot'], answer: 0, explain: 'A missing link target is allowed in OKF; it marks knowledge not yet written. The code records it as a gap and continues to the other links, which is why `/glossary/user-id.md` was still reached at hop 2.' },
    { q: 'Which pairing correctly matches each idea to the question it answers?', options: ['OKF: how to do a task; Skills: what is true; MCP: file format', 'OKF: what is true; Skills: how to do it; MCP: how to reach systems', 'OKF: how to reach systems; Skills: what is true; MCP: how to do it', 'All three answer one question, just in different file formats'], answer: 1, explain: 'OKF stores curated knowledge (what is true), Skills package procedures (how to do it), and MCP is a protocol for connecting to tools and data (how to reach it).' },
    { q: 'A teammate says: "Once our knowledge is in OKF format, the agent\'s answers will be correct." What is wrong with this?', options: ['Nothing; the OKF format itself validates every fact it holds', 'OKF bundles only work with models made by Google', 'OKF fixes the file shape, not the truth of the content', 'OKF bundles cannot contain links, so context is always missing'], answer: 2, explain: 'OKF is a format. A bundle can still be stale or wrong, and an agent may trust it more because it looks official, so content still needs review and updating. OKF is vendor-neutral and does use links.' },
  ],
  takeaways: [
    'OKF packages curated knowledge as a folder of Markdown files: one concept per file.',
    'Each concept starts with YAML frontmatter; in v0.1 only `type` is required.',
    'Bundle-absolute Markdown links turn files into a knowledge graph; missing targets mark gaps.',
    '`index.md` (listing) and `log.md` (history) are optional reserved files.',
    'Plain files mean any agent can read them and git gives review and history.',
    'OKF = what is true; Agent Skills = how to do it; MCP = how to reach live systems.',
  ],
  terms: [
    { term: 'OKF (Open Knowledge Format)', def: 'An open, vendor-neutral spec for storing curated knowledge as linked Markdown files with YAML frontmatter.' },
    { term: 'Bundle', def: 'A directory of OKF concept files, optionally with index.md and log.md.' },
    { term: 'Concept file', def: 'One Markdown file describing one thing (a metric, table, policy, term), identified by its path.' },
    { term: 'Frontmatter', def: 'The YAML metadata block between --- lines at the top of a Markdown file.' },
    { term: 'Knowledge graph', def: 'A network of concepts (nodes) connected by relationships (edges); in OKF the edges are Markdown links.' },
    { term: 'Curated knowledge', def: 'Facts that someone deliberately wrote and reviewed, as opposed to text retrieved from whatever documents exist.' },
  ],
};
