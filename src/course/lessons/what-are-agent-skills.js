export default {
  id: 'what-are-agent-skills',
  minutes: 18,
  hook: 'How can one agent know how to fill PDF forms, follow your brand guide and run your release checklist, without stuffing all of that into every prompt?',
  summary: 'An Agent Skill is a folder with a `SKILL.md` file (a short name and description, then instructions) plus any scripts or reference files the task needs. The agent sees only each skill\'s name and description at first, and opens the full instructions and files only when a task needs them. This "progressive disclosure" lets one agent carry many skills while keeping its context window small.',
  sections: [
    {
      id: 'the-problem',
      title: 'The problem before Agent Skills',
      blocks: [
        { type: 'p', text: 'Let us follow one running example through this lesson. We run a small company and use an AI agent for office work. We want it to fill in PDF forms the way our finance team likes, make slides in our brand style, and follow our 12-step release checklist.' },
        { type: 'p', text: 'Before skills, we had three weak options. We could paste every instruction into the **system prompt** (the fixed text the model reads before every conversation). We could paste the right instructions into each chat by hand. Or we could fine-tune a model, which is slow, costly and hard to update.' },
        { type: 'list', items: [
          '**A giant system prompt** wastes the **context window** (the limited number of tokens the model can read at once) on instructions that are irrelevant to most requests, costs money on every call, and can distract the model.',
          '**Copy-pasting by hand** is error-prone. Every person keeps a slightly different version of the "right" prompt.',
          '**Prompts cannot run code.** A careful procedure like "extract every form field, then validate the dates" is more reliable as a small script than as prose the model must imitate.',
        ] },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a new employee\'s bookshelf', text: 'A new hire does not memorise every company manual on day one. They read the spines on the shelf: "Expense policy", "Brand guide", "Release checklist". When a task needs one, they pull that binder down and read it. Agent Skills give an agent the same shelf: spines always visible, binders opened only when needed.' },
      ],
    },
    {
      id: 'what-are-skills',
      title: 'What are Agent Skills, and what is inside one?',
      blocks: [
        { type: 'p', text: 'An **Agent Skill** is a folder that packages instructions, scripts and resources for one kind of task, so an agent can discover it and load it on demand. Anthropic introduced Skills for Claude in October 2025 and published the format as an open specification in December 2025 (at [agentskills.io](https://agentskills.io)), so other agent tools can read the same folders. Support details still differ between products, so always check the docs of the agent you use.' },
        { type: 'p', text: 'The key point: a skill is **not a new model and not a new API**. It is plain files on disk. The agent already knows how to read files and run commands; a skill just tells it *which* files to read, *when*, and *what to do* with them.' },
        { type: 'p', text: 'So "skill" here means *packaged know-how*: a procedure, a style, domain knowledge, or a tested script. The model stays the same; what it knows how to do grows as we add folders.' },
        { type: 'p', text: '**What is inside a Skill?** The only required file is `SKILL.md`. It begins with **YAML frontmatter** (a small block of `key: value` metadata between two `---` lines) followed by normal Markdown instructions. Everything else is optional.' },
        { type: 'code', lang: 'markdown', title: 'pdf-forms/SKILL.md', code: `---
name: pdf-forms
description: Fill in and read PDF forms. Use when the user mentions a PDF form, form fields, or filling a PDF.
---
# Filling PDF forms

1. Run \`python scripts/list_fields.py <file>\` to list every field.
2. Map the user's data to the field names. Ask if anything is missing.
3. Run \`python scripts/fill.py <file> <data.json>\` and open the result.
4. Dates must be DD/MM/YYYY. See reference/finance-rules.md for other rules.` },
        { type: 'table', caption: 'A typical skill folder', head: ['Path', 'What it holds', 'Required?'], rows: [
          ['`SKILL.md`', 'Frontmatter (`name`, `description`) + main instructions', 'Yes'],
          ['`scripts/`', 'Code the agent can run, e.g. `fill.py`', 'No'],
          ['`reference/` or other `.md` files', 'Longer docs read only when needed', 'No'],
          ['`assets/`', 'Templates, fonts, images, sample data', 'No'],
        ] },
        { type: 'p', text: 'In the open spec, `name` must be short (up to 64 characters, lowercase letters, numbers and hyphens) and normally matches the folder name. `description` can be up to 1,024 characters. A few optional fields exist, such as `license` and tool permissions, but which ones an agent honours varies by product.' },
      ],
    },
    {
      id: 'description-is-trigger',
      title: 'The description is the trigger',
      blocks: [
        { type: 'p', text: 'There is no keyword router or classifier hidden in the system. At startup the agent puts each skill\'s `name` and `description` into its context. When we ask for something, **the model itself** reads those descriptions and decides whether a skill is relevant. So the description is the only thing that decides whether the skill ever gets used.' },
        { type: 'p', text: 'A good description says two things: **what** the skill does and **when** to use it, using the words users are likely to type.' },
        { type: 'compare', title: 'Weak vs strong description', options: [
          { name: 'Weak', summary: '`description: Helps with documents.`', pros: ['Short'], cons: ['Matches almost everything and nothing', 'No "when to use"', 'The agent may never pick it, or pick it wrongly'], bestFor: 'Nothing' },
          { name: 'Strong', summary: '`description: Fill in and read PDF forms. Use when the user mentions a PDF form, form fields, or filling a PDF.`', pros: ['Names the task', 'Lists trigger words', 'Easy for the model to match'], cons: ['Must be kept in sync with what the skill really does'], bestFor: 'Every real skill' },
        ], rows: [
          ['Says what it does', 'Vaguely', 'Precisely'],
          ['Says when to use it', 'No', 'Yes, with trigger phrases'],
          ['Risk', 'Never triggers or over-triggers', 'Low'],
        ], verdict: 'Write the description for the model that has to choose: concrete task, concrete trigger words.' },
        { type: 'check', question: 'Our skill has perfect instructions, but the agent never uses it when people say "fill this form". What is the first thing to fix?', answer: 'The `description`. The model only sees name and description until it decides to load the skill, so if the description does not mention forms or filling, the agent has no reason to open it. The body does not matter until then.' },
      ],
    },
    {
      id: 'progressive-disclosure',
      title: 'Progressive disclosure, the main idea',
      blocks: [
        { type: 'p', text: '**Progressive disclosure** means showing information in layers: a little first, more only when needed. Skills use three levels.' },
        { type: 'steps', title: 'The three levels of a skill', items: [
          { title: 'Level 1: metadata (always loaded)', text: 'At startup the agent reads only `name` + `description` of every installed skill. That is roughly a hundred tokens per skill, so even dozens of skills cost little.' },
          { title: 'Level 2: the SKILL.md body (on trigger)', text: 'When a request matches, the agent reads the full `SKILL.md` instructions into context. Guidance from Anthropic is to keep this body fairly short (a few thousand tokens, under about 500 lines) and move detail elsewhere.' },
          { title: 'Level 3: extra files (only if needed)', text: 'The body points to other files, like `reference/finance-rules.md` or `scripts/fill.py`. The agent opens a reference file only if this task needs it, and it can run a script and read only its output, without loading the code into context.' },
          { title: 'Work and finish', text: 'The agent follows the steps, runs the scripts, checks the result and answers. Skills that never matched stayed at Level 1 the whole time.' },
        ] },
        { type: 'flow', title: 'A request meets the skill shelf', nodes: [
          { label: 'Startup', detail: 'Names and descriptions of all skills are added to context (Level 1).' },
          { label: 'User request', detail: '"Please fill this PDF form with my address."' },
          { label: 'Model matches', detail: 'The model reads the descriptions and decides pdf-forms is relevant.' },
          { label: 'Read SKILL.md', detail: 'The agent opens pdf-forms/SKILL.md with its file tool (Level 2).' },
          { label: 'Run script', detail: 'It runs scripts/list_fields.py and fill.py; only their output enters context (Level 3).' },
          { label: 'Answer', detail: 'Returns the filled PDF and a short summary.' },
        ] },
        { type: 'chart', kind: 'bar', title: 'Context cost with 20 installed skills (illustrative)', yLabel: 'Tokens in context', labels: ['All bodies pasted in prompt', 'Skills: metadata only', 'Skills: metadata + 1 body'], series: [ { name: 'Tokens', values: [60000, 2000, 5000] } ], caption: 'Illustrative numbers: 20 skills × ~3,000-token bodies vs ~100 tokens of metadata each. The exact numbers depend on the skills, but the shape is the point.' },
      ],
    },
    {
      id: 'skills-carry-code',
      title: 'A Skill can carry real code',
      blocks: [
        { type: 'p', text: 'Language models are good at judgement and bad at exact, repetitive work like counting fields or validating a date format a hundred times. A script does that exactly the same way every run. So a skill can ship scripts, and the instructions tell the agent when to run them.' },
        { type: 'p', text: 'This also saves context: when the agent runs `scripts/fill.py`, the code itself does not need to be read; only the printed result comes back. To use script skills, the agent needs a **code execution environment** (a sandbox or a shell). Without one, only the text parts of a skill work.' },
        { type: 'p', text: 'Below we simulate the idea in plain Python: parse frontmatter, build the Level 1 list, let a simple word-overlap rule stand in for the model\'s choice, and compare token costs.' },
        { type: 'code', lang: 'python', title: 'progressive_disclosure.py', code: `# Simulate progressive disclosure for Agent Skills (stdlib only).
SKILLS = {
    "pdf-forms": """---
name: pdf-forms
description: Fill in and read PDF forms. Use when the user mentions a PDF form, fields, or filling a PDF.
---
# Filling PDF forms
1. Run scripts/list_fields.py on the file.
2. Map the user's data to field names.
3. Run scripts/fill.py and check the result.
""" + "Detailed notes about edge cases. " * 300,
    "brand-slides": """---
name: brand-slides
description: Make slide decks in our company style. Use for presentations, decks, or slides.
---
# Brand slides
Use the colours in assets/palette.json and the layouts in reference/layouts.md.
""" + "Style rules and examples. " * 200,
}

def tokens(text):            # rough rule of thumb: ~0.75 words per token
    return round(len(text.split()) / 0.75)

def frontmatter(md):         # read the YAML block between the two '---' lines
    block = md.split("---")[1]
    return dict(line.split(": ", 1) for line in block.strip().splitlines())

meta = {k: frontmatter(v) for k, v in SKILLS.items()}
startup = "\\n".join(f"- {m['name']}: {m['description']}" for m in meta.values())
print("Level 1 (always loaded):", tokens(startup), "tokens")
print("If we loaded every full SKILL.md:", sum(tokens(v) for v in SKILLS.values()), "tokens")

request = "please fill this pdf form with my address"
words = set(request.split())
score = {}
for name, m in meta.items():   # stand-in for the model reading descriptions
    desc = set(m["description"].lower().replace(",", "").replace(".", "").split())
    score[name] = sorted(words & desc)
    print(f"{name:12s} overlap={score[name]}")
best = max(score, key=lambda n: len(score[n]))
print("Level 2 loads:", best, "->", tokens(SKILLS[best]), "tokens")`, output: `Level 1 (always loaded): 48 tokens
If we loaded every full SKILL.md: 3173 tokens
pdf-forms    overlap=['fill', 'form', 'pdf']
brand-slides overlap=[]
Level 2 loads: pdf-forms -> 2065 tokens`, walkthrough: [
          { lines: [2, 19], note: 'Two fake skills. Each SKILL.md has frontmatter plus a long body (we repeat a sentence to make the body realistically large).' },
          { lines: [21, 26], note: 'A rough token counter (about 0.75 words per token) and a tiny frontmatter parser that reads the text between the `---` lines.' },
          { lines: [28, 31], note: 'Level 1: only names and descriptions go into the startup list. Compare its cost with loading every full body.' },
          { lines: [33, 39], note: 'A word-overlap score stands in for the model reading descriptions. A real agent uses the LLM\'s own judgement, not keyword matching.' },
          { lines: [40, 41], note: 'Level 2: only the winning skill\'s body is loaded. The slides skill never costs more than its one-line description.' },
        ] },
        { type: 'p', text: 'The output shows the trade: 48 tokens of metadata let the agent *know about* both skills, and only the needed body (about 2,000 tokens) is paid for when a matching task arrives.' },
      ],
    },
    {
      id: 'where-skills-live',
      title: 'Where Skills live and how to create one',
      blocks: [
        { type: 'p', text: 'Because a skill is just a folder, "installing" one means putting the folder where the agent looks. The exact places depend on the product. For Claude, as documented at the time of writing:' },
        { type: 'table', head: ['Where', 'Location', 'Who sees it'], rows: [
          ['Claude Code, personal', '`~/.claude/skills/<skill-name>/SKILL.md`', 'You, in every project'],
          ['Claude Code, project', '`.claude/skills/<skill-name>/SKILL.md` in the repo', 'Everyone who clones the repo'],
          ['Claude Code plugins', 'Bundled inside an installed plugin', 'Anyone with the plugin'],
          ['Claude apps', 'Uploaded as a zip in settings (plus built-in skills)', 'Your account / organisation'],
          ['Claude API', 'Uploaded via the API and attached to requests that use code execution', 'Your app'],
        ] },
        { type: 'steps', title: 'Creating our own skill', items: [
          { title: 'Pick one repeatable task', text: 'For example "write release notes from merged pull requests". One skill = one job. Narrow skills trigger more reliably.' },
          { title: 'Make the folder and SKILL.md', text: 'Create `release-notes/SKILL.md` with `name: release-notes` and a description that says what it does and when ("Use when the user asks for release notes or a changelog").' },
          { title: 'Write short, ordered instructions', text: 'Numbered steps, the format of the result, and examples of good output. Move long material into separate files and link them by relative path.' },
          { title: 'Add scripts for exact work', text: 'Anything deterministic (collect PR titles, sort by label) goes into `scripts/`. Tell the agent when to run them and what the output means.' },
          { title: 'Test with real prompts', text: 'Try requests that should trigger it and ones that should not. Fix the description first if it misfires, then the body.' },
        ] },
      ],
    },
    {
      id: 'skills-vs-mcp',
      title: 'Agent Skills vs MCP',
      blocks: [
        { type: 'p', text: 'The **Model Context Protocol (MCP)** is an open protocol that connects an agent to external tools and data through a server: a database, GitHub, a calendar. People often ask whether skills replace MCP. They do different jobs: MCP gives the agent **new abilities to reach things**, skills give it **know-how about doing things**.' },
        { type: 'compare', title: 'Agent Skills vs MCP', options: [
          { name: 'Agent Skills', summary: 'Folders of instructions, scripts and resources, loaded on demand.', pros: ['Just files: easy to write, review, version', 'Very cheap until used', 'Can carry tested scripts'], cons: ['Needs file access (and code execution for scripts)', 'Cannot reach a remote system by itself'], bestFor: 'Procedures, house style, domain workflows' },
          { name: 'MCP server', summary: 'A running server that exposes tools, resources and prompts over a protocol.', pros: ['Live access to external systems', 'Auth and permissions live in the server', 'Works with any MCP-capable client'], cons: ['Must be built, run and maintained', 'Tool definitions usually sit in context all the time'], bestFor: 'Connecting to APIs, databases, SaaS apps' },
        ], rows: [
          ['What it adds', 'Know-how', 'Connectivity'],
          ['Form', 'Folder of files', 'Running process / service'],
          ['Context cost when idle', 'About a line per skill', 'Tool schemas, often always loaded'],
        ], verdict: 'Use both: an MCP server gives access to our ticketing system, and a skill teaches the agent our triage procedure using that server.' },
      ],
    },
    {
      id: 'real-example-and-importance',
      title: 'A real example and why Skills matter',
      blocks: [
        { type: 'callout', tone: 'example', title: 'Built-in document skills', text: 'Anthropic ships skills for creating and editing Word, Excel, PowerPoint and PDF files. When we ask Claude for "a spreadsheet of these numbers", it triggers the spreadsheet skill, reads its instructions and runs its helper scripts in a sandbox to produce a real file. The same mechanism is open to us: a team can write a "quarterly-report" skill containing its template and a script that pulls the numbers.' },
        { type: 'list', items: [
          '**Composable**: many skills can be installed; the agent may use two together (e.g. a data skill and a slides skill).',
          '**Portable**: the same folder can work in several agents that follow the open format.',
          '**Reviewable**: it is plain text and code in git, so changes get code review like anything else.',
          '**Cheap**: thanks to progressive disclosure, an unused skill costs about one line of context.',
          '**Reliable**: scripts make exact steps exact, and instructions encode what experts already know.',
        ] },
        { type: 'check', question: 'We install 40 skills. Roughly how much context do they cost on a simple "hello" message, and why?', answer: 'Only their metadata: on the order of 40 × ~100 tokens, a few thousand tokens at most. No skill matches "hello", so no SKILL.md body or extra file is loaded.' },
      ],
    },
    {
      id: 'be-careful',
      title: 'Things we must be careful about',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'A skill is code you are trusting', text: 'Installing a skill means letting its instructions steer the agent and letting its scripts run in your environment. A malicious skill could tell the agent to send data somewhere or run a harmful script. Only install skills from sources you trust, and read the SKILL.md and scripts first, just as you would review a dependency.' },
        { type: 'list', items: [
          '**Vague or overlapping descriptions**: two skills that both claim "documents" confuse the model. Make triggers distinct.',
          '**Bloated SKILL.md**: putting everything in the body defeats progressive disclosure. Keep the body lean and link to reference files.',
          '**No execution environment**: script-based skills silently degrade where code cannot run.',
          '**Stale skills**: when the procedure changes, the skill must change too. Version them in git.',
          '**Not a security boundary**: instructions in a skill are guidance to the model, not enforced permissions. Real limits belong in the sandbox and tool permissions.',
        ] },
        { type: 'p', text: '**When not to use a skill**: for a one-off task, just write the instruction in the chat. For reaching a live external system, you need a tool or MCP server (possibly plus a skill). For changing the model\'s core behaviour across everything, a system prompt or fine-tuning may fit better.' },
      ],
    },
    {
      id: 'summary',
      title: 'Summary',
      blocks: [
        { type: 'p', text: 'An Agent Skill is a folder: `SKILL.md` with a name and a trigger-style description, the main instructions, and optional scripts and reference files. The agent keeps only the descriptions in mind, loads a skill\'s body when a task matches, and opens deeper files or runs scripts only when needed. That progressive disclosure is why one agent can carry many skills cheaply. Skills add know-how; MCP adds connections; the two work well together. Treat skills like code: review them, version them, and install only from trusted sources.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the only file every Agent Skill must contain?', options: ['`manifest.json` listing the skill\'s scripts', '`SKILL.md` with frontmatter and instructions', '`server.py` exposing the skill as a service', '`index.md` linking every reference file'], answer: 1, explain: 'A skill is a folder whose required file is `SKILL.md`: frontmatter (`name`, `description`) plus Markdown instructions. Scripts and reference files are optional. A running server is what MCP uses, not skills.' },
    { q: 'Our team wrote a great "expense-report" skill, but the agent ignores it when users say "file my expenses". The body is excellent. What should we change first?', options: ['Make the SKILL.md body longer and more detailed', 'Convert the whole skill into an MCP server', 'Rewrite the description to name the task and "expenses"', 'Move every script into the SKILL.md body'], answer: 2, explain: 'Until it triggers, the model sees only `name` and `description`. The description is the trigger, so it must mention the task and the user\'s likely words. A longer body does not help because it is never read.' },
    { q: 'An agent has 30 skills installed, each with ~100 tokens of metadata and a ~4,000-token body. A request matches exactly one skill. About how many skill tokens are in context after it triggers?', options: ['About 3,000', 'About 7,000', 'About 120,000', 'About 4,000'], answer: 1, explain: 'Level 1 metadata for all 30 skills is 30 × 100 = 3,000 tokens, plus one body of ~4,000 = ~7,000. Loading all bodies would be ~120,000, which is what progressive disclosure avoids. (Only 4,000 forgets the always-loaded metadata.)' },
    { q: 'Which statement best contrasts Agent Skills and MCP?', options: ['Skills package know-how as files; MCP connects to outside systems', 'Skills are simply a newer version of MCP that fully replaces it', 'MCP stores instructions in Markdown; skills expose tools over JSON-RPC', 'Both are fine-tuning methods that change the model\'s weights'], answer: 0, explain: 'Skills are folders of instructions and scripts loaded on demand; MCP is a protocol for live access to tools and data. They complement each other. Neither changes model weights.' },
    { q: 'Which belief about skills is a misconception?', options: ['A skill can include scripts that the agent runs instead of reading them', 'Skill instructions enforce security limits, so any skill is safe', 'An unused skill costs roughly one line of context, its description', 'Long reference material can live in files opened only when needed'], answer: 1, explain: 'Skill instructions are guidance, not enforced permissions, and a skill\'s scripts run in your environment. Untrusted skills can be dangerous, so we review them. The other three statements are true.' },
  ],
  takeaways: [
    'An Agent Skill is a folder: `SKILL.md` (name, description, instructions) plus optional scripts and reference files.',
    'The description is the trigger: the model decides to load a skill only from its name and description.',
    'Progressive disclosure: metadata always, body on trigger, extra files and scripts only when needed.',
    'Scripts make exact steps reliable and keep code out of the context window.',
    'Skills add know-how; MCP adds connectivity; use them together.',
    'Treat skills as trusted code: review, version and install only from trusted sources.',
  ],
  terms: [
    { term: 'Agent Skill', def: 'A folder of instructions, scripts and resources that an agent discovers and loads on demand for one kind of task.' },
    { term: 'SKILL.md', def: 'The required file of a skill: YAML frontmatter with name and description, then Markdown instructions.' },
    { term: 'Frontmatter', def: 'A block of key: value metadata between two --- lines at the top of a Markdown file.' },
    { term: 'Progressive disclosure', def: 'Loading information in layers: a short summary first, details only when the task needs them.' },
    { term: 'Context window', def: 'The maximum amount of text, in tokens, a model can read in one call.' },
    { term: 'MCP (Model Context Protocol)', def: 'An open protocol for connecting agents to external tools and data through servers.' },
  ],
};
