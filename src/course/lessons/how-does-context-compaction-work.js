export default {
  id: "how-does-context-compaction-work",
  minutes: 16,
  hook: "How can an AI agent keep working for hours when its context window fills up in minutes?",
  summary: "Every LLM has a context window: a fixed maximum number of tokens it can see at once. Long conversations and agent sessions eventually overflow it. Context compaction solves this by replacing older parts of the history with a compact summary that keeps the important facts, decisions and open tasks, while keeping the most recent turns word for word.",
  sections: [
    {
      id: "llm-and-window",
      title: "LLMs, context and the context window",
      blocks: [
        { type: "p", text: "A **large language model (LLM)** is a neural network that reads text as **tokens** (small pieces of words) and predicts the next token, over and over, to write a response. It has no memory of its own between calls. Each call, it sees only what we send." },
        { type: "p", text: "That “what we send” is the **context**: the system prompt (standing instructions), the conversation so far, tool definitions, tool results and the new message. In a chat app, each new turn resends the whole history, because that is the only way the model can “remember” earlier turns." },
        { type: "p", text: "The **context window** is the maximum number of tokens the model can process in one call. Modern models have windows from tens of thousands to around a million tokens, depending on the model. Input plus output must fit inside it. If the context is too long, the API rejects the request or the application must cut something." },
        { type: "callout", tone: "analogy", title: "Think of it like a whiteboard in a long meeting", text: "A team plans a project on one whiteboard. After two hours it is full. Erasing the oldest corner would wipe out the budget they agreed on. Instead, someone writes a neat box in the corner: “Decided: budget 4,000, dates 12–14 June, team of 8”, then erases the messy notes around it. The meeting continues with the key decisions still visible. That box is a compaction." }
      ]
    },
    {
      id: "the-problem",
      title: "The problem of long conversations",
      blocks: [
        { type: "p", text: "Our running example: an assistant helping plan a team offsite. Over many turns, the user shares the team size, the budget, preferences, dates and a dietary need. Each turn adds tokens. An agent is even hungrier: every tool call adds its output, and a single web page or log file can be thousands of tokens." },
        { type: "list", items: [
          "**Hard limit.** Eventually the history exceeds the window and the call fails.",
          "**Rising cost and latency.** Every turn resends everything before it, so cost per turn keeps growing even before the limit.",
          "**Falling quality.** Long, cluttered contexts make it harder for the model to focus. Key facts get buried in the middle among stale tool outputs."
        ] },
        { type: "chart", kind: "line", title: "Context size per turn: unmanaged vs compacted", xLabel: "Turn", yLabel: "Tokens in context", series: [
          { name: "Unmanaged (stuck at the limit)", points: [[1, 3500], [2, 5000], [3, 6500], [4, 8000], [5, 9500], [6, 11000], [7, 12500], [8, 14000], [9, 15500], [10, 17000], [11, 18500], [12, 20000], [13, 20000], [14, 20000], [15, 20000], [16, 20000], [17, 20000], [18, 20000], [19, 20000], [20, 20000], [21, 20000], [22, 20000], [23, 20000], [24, 20000], [25, 20000], [26, 20000], [27, 20000], [28, 20000], [29, 20000], [30, 20000]] },
          { name: "With compaction at 16k", points: [[1, 3500], [2, 5000], [3, 6500], [4, 8000], [5, 9500], [6, 11000], [7, 12500], [8, 14000], [9, 15500], [10, 4000], [11, 5500], [12, 7000], [13, 8500], [14, 10000], [15, 11500], [16, 13000], [17, 14500], [18, 16000], [19, 4000], [20, 5500], [21, 7000], [22, 8500], [23, 10000], [24, 11500], [25, 13000], [26, 14500], [27, 16000], [28, 4000], [29, 5500], [30, 7000]] }
        ], caption: "Illustrative: a 20k-token window, 1,500 tokens added per turn, compaction triggered above 16k that shrinks the history to about 4k. The unmanaged session is capped at the limit from turn 12, which means requests fail or something must be cut every turn." }
      ]
    },
    {
      id: "naive-fix",
      title: "The naive fix, and why it fails",
      blocks: [
        { type: "p", text: "The simplest fix is **truncation**: when the history is too long, drop the oldest messages. A common version is a **sliding window** that always keeps only the last N turns. It is easy and cheap, but it forgets blindly." },
        { type: "p", text: "In our offsite chat, the very first assistant turn recorded “team of 8, budget 4,000”. A sliding window that keeps the last 4 turns drops it. A few turns later the assistant suggests a lodge for 20 people at 9,000 dollars, because it no longer knows the constraints. Old messages are often exactly where the goal, the rules and the key decisions live." },
        { type: "check", question: "Pause and predict: why not just keep the first few turns and the last few turns, and drop the middle?", answer: "It helps a bit (the original goal survives), but facts stated in the middle, such as the dates or the vegetarian guest, are still lost. What we need is to keep the important information from every part of the history, not to keep certain positions. That requires understanding the content, which is what a summary does." }
      ]
    },
    {
      id: "what-is-compaction",
      title: "What is context compaction?",
      blocks: [
        { type: "p", text: "**Context compaction** is replacing a long stretch of context with a shorter version that keeps what matters for the rest of the task, then continuing from the compacted context. Usually the older part of the history is summarized and the most recent turns are kept verbatim, because they carry the immediate thread of the conversation." },
        { type: "p", text: "Compaction has three parts: a **trigger** (when to compact, for example when the context passes 80% of the window), a **method** (how to shrink: summarize, trim tool outputs, drop duplicates) and a **policy** (what to keep raw: the system prompt, the last few turns, pinned facts)." },
        { type: "compare", title: "Ways to deal with a full context",
          options: [
            { name: "Truncation / sliding window", summary: "Drop the oldest messages.", pros: ["Trivial to implement", "No extra model call"], cons: ["Forgets goals and decisions stated early", "No sense of importance"], bestFor: "Casual chat where old turns rarely matter" },
            { name: "Compaction (summarize)", summary: "Replace old turns with an LLM-written summary; keep recent turns raw.", pros: ["Keeps important facts from the whole history", "Large token savings"], cons: ["Costs an extra model call", "Summaries can lose or distort details"], bestFor: "Long chats and long-running agents" },
            { name: "External memory + retrieval", summary: "Save facts to a store and retrieve them when relevant.", pros: ["Can hold far more than any window", "Survives across sessions"], cons: ["Needs a store and good retrieval", "Retrieval can miss what matters"], bestFor: "Assistants that must remember across days" }
          ],
          rows: [
            ["Decides what to keep by", "Position (recency)", "Meaning (a summary)", "Relevance to the current query"],
            ["Extra model call", "No", "Yes, per compaction", "Usually an embedding call"],
            ["Main risk", "Forgetting key facts", "Lossy or wrong summary", "Missing the right memory"]
          ],
          verdict: "Production agents often combine them: compaction for the working session, external memory for facts that must last, and trimming for bulky tool outputs." }
      ]
    },
    {
      id: "summarization",
      title: "How summarization powers compaction",
      blocks: [
        { type: "p", text: "The summarizer is usually the same LLM (or a cheaper one) called with a special prompt. The quality of the compaction is the quality of that prompt. A good compaction prompt asks the model to preserve, in a structured form:" },
        { type: "list", items: [
          "**The goal** the user is trying to achieve.",
          "**Hard constraints and decisions**: numbers, dates, names, choices already made (team of 8, budget 4,000, 12–14 June).",
          "**Progress so far**: what is done, what was tried and failed, and why.",
          "**Open tasks and next steps.**",
          "**Important references**: file paths, IDs, URLs, so the agent can look details up again instead of keeping them in the context."
        ] },
        { type: "p", text: "It should drop chit-chat, pleasantries, repeated content and raw tool outputs whose conclusions are already captured. The summary is then inserted as a single message (often labelled as a summary of earlier conversation) in place of the old turns." },
        { type: "deeper", title: "The token math of a compaction", blocks: [
          { type: "formula", expr: "tokens after = system + summary + recent  ≪  system + old + recent", where: [["old", "the turns being summarized"], ["summary", "typically a small fraction of old"], ["recent", "last K turns kept verbatim"]] },
          { type: "p", text: "In our code below, 59 tokens become 33: the four old turns (40 tokens) become a 14-token summary while the two most recent turns stay as they were. Real compactions often shrink tens of thousands of tokens to a few thousand. The cost is one summarization call, paid once, while every later turn becomes cheaper." }
        ] }
      ]
    },
    {
      id: "walkthrough",
      title: "A step-by-step walkthrough",
      blocks: [
        { type: "steps", title: "One compaction cycle", items: [
          { title: "Measure", text: "After each turn, count the tokens in the context (most APIs return usage counts; a tokenizer works offline)." },
          { title: "Trigger", text: "If the count crosses the threshold (say 80% of the window), start compaction before the next call fails." },
          { title: "Split", text: "Divide the history into an old part to summarize and a recent part (last K turns) to keep verbatim." },
          { title: "Summarize", text: "Send the old part to the LLM with a compaction prompt that asks for goals, facts, decisions and open tasks." },
          { title: "Replace", text: "Build the new context: system prompt + summary + recent turns. The old turns are removed (and can be archived on disk)." },
          { title: "Continue", text: "The conversation goes on with plenty of room. The cycle repeats if the context fills up again; later summaries fold in the earlier summary." }
        ] },
        { type: "flow", title: "The compaction loop", loop: true, nodes: [
          { label: "Converse", detail: "User and model exchange turns; tool results are added." },
          { label: "Measure", detail: "Count tokens in the context after each turn." },
          { label: "Threshold?", detail: "Below the threshold: keep going. Above: compact." },
          { label: "Summarize", detail: "LLM condenses old turns into goals, facts, decisions and next steps." },
          { label: "Rebuild", detail: "System prompt + summary + recent turns become the new context." }
        ] }
      ]
    },
    {
      id: "code",
      title: "Context compaction in code",
      blocks: [
        { type: "p", text: "A runnable toy version. The summarizer is a stand-in that keeps sentences tagged `FACT`; a real system would call an LLM with a compaction prompt. Tokens are counted as words." },
        { type: "code", lang: "python", title: "compaction.py", code: `def tokens(text):
    return len(text.split())   # rough stand-in for a tokenizer

def summarize(turns):
    # Stand-in for an LLM summary call: keep the facts, drop the chatter
    facts = [t.split("FACT", 1)[1].strip() for t in turns if "FACT" in t]
    return "SUMMARY: " + "; ".join(facts)

LIMIT, KEEP_RECENT = 50, 2     # compact when over 50 tokens; keep last 2 turns raw
turns = [
    "user: hi, can you help me plan a small team offsite please",
    "assistant: sure! FACT team of 8 people, budget 4000 dollars",
    "user: we like hiking and good food, nothing too fancy",
    "assistant: FACT likes hiking and food, casual style",
    "user: FACT dates must be 12-14 June",
    "assistant: great, I will look for lodges near trails for those dates",
    "user: FACT one person is vegetarian",
    "assistant: noted, I will check every menu for vegetarian options",
]

history = []
for t in turns:
    history.append(t)
    used = sum(tokens(h) for h in history)
    if used > LIMIT:                                    # trigger
        old, recent = history[:-KEEP_RECENT], history[-KEEP_RECENT:]
        history = [summarize(old)] + recent             # replace old turns
        after = sum(tokens(h) for h in history)
        print(f"compacted {len(old)} turns: {used} -> {after} tokens")

print("\\nContext the model sees next:")
for h in history:
    print(" ", h)`, output: `compacted 4 turns: 59 -> 33 tokens

Context the model sees next:
  SUMMARY: team of 8 people, budget 4000 dollars; likes hiking and food, casual style
  user: FACT dates must be 12-14 June
  assistant: great, I will look for lodges near trails for those dates
  user: FACT one person is vegetarian
  assistant: noted, I will check every menu for vegetarian options`,
          walkthrough: [
            { lines: [1, 7], note: "A word-count tokenizer and a fake summarizer that keeps only the facts. In production this is an LLM call with a compaction prompt." },
            { lines: [9, 19], note: "Trigger at 50 tokens, keep the last 2 turns raw. The conversation mixes facts with chatter." },
            { lines: [21, 24], note: "Add each turn and measure the total context size." },
            { lines: [25, 29], note: "Over the limit: split into old and recent, replace old with one summary message, and report the savings." },
            { lines: [31, 33], note: "The final context: a summary carrying all early facts, plus the recent turns word for word." }
          ] },
        { type: "check", question: "In the output, the team size and budget came from turn 2, which a 4-turn sliding window would have dropped. Where are they now?", answer: "Inside the SUMMARY line at the top of the context. Compaction kept the facts and dropped the chatter (“hi, can you help me…”, “nothing too fancy”), so the context shrank from 59 to 33 tokens without losing the constraints." }
      ]
    },
    {
      id: "real-agents",
      title: "Compaction in real AI agents, and why it matters",
      blocks: [
        { type: "callout", tone: "example", title: "Where you will meet it", text: "Coding agents such as Claude Code offer a manual compact command and also compact automatically when the conversation approaches the context limit, replacing the history with a summary of the work so far. Other agent tools and frameworks provide similar summarization or “memory” features, and some APIs offer server-side helpers that clear old tool results or summarize history. Details differ by product and change quickly, but the core idea is the same." },
        { type: "list", items: [
          "**Long tasks become possible.** An agent can work through hundreds of tool calls instead of stopping when the window is full.",
          "**Cost and latency stay bounded.** The context size oscillates within a range instead of growing forever.",
          "**Focus improves.** Removing stale logs and dead ends leaves the model with a clean statement of goal and progress.",
          "**Complementary tricks**: clearing old tool outputs (keep only their conclusions), writing notes to a file the agent can re-read, and handing sub-tasks to sub-agents with fresh windows."
        ] },
        { type: "callout", tone: "warn", title: "Compaction is lossy", text: "A summary can drop a detail that turns out to matter later (an exact error message, a specific number) or even state something slightly wrong, and the model will trust the summary. Mitigations: tell the summarizer to keep numbers, names, paths and decisions verbatim; keep recent turns raw; archive the full history so tools can look things up; avoid compacting in the middle of a delicate step; and test compaction on real long sessions." }
      ]
    }
  ],
  quiz: [
    { q: "What does context compaction do?", options: ["Raises the model's context window size for the current session", "Replaces older context with a short summary of what matters", "Deletes the oldest messages without reading what they contain", "Compresses tokens with a zip algorithm before they are sent"], answer: 1, explain: "Compaction rewrites old history into a compact summary. Dropping old messages blindly is truncation, and the window size is fixed by the model." },
    { q: "Our long-running agent keeps forgetting the user's original requirements after about an hour. It uses a sliding window of the last 20 messages. What is the best change?", options: ["Lower the temperature so the agent stays more focused on the task", "Grow the sliding window to the last 25 messages instead of 20", "Summarize older turns, preserving the goals and constraints", "Remove the system prompt entirely to free up space for history"], answer: 2, explain: "The requirements were stated early and a sliding window drops them. A slightly bigger window only delays the problem; a summary keeps the goals regardless of where they appeared." },
    { q: "In the code example, why did the context shrink from 59 to 33 tokens?", options: ["The 4 old turns became one summary; the last 2 stayed as-is", "The tokenizer was switched to a more efficient one mid-run", "The 2 most recent turns were deleted to make room for more", "Every turn was summarized, including the two newest ones"], answer: 0, explain: "With KEEP_RECENT = 2, the last two turns stay verbatim and the older four (40 tokens) become a single 14-token summary line." },
    { q: "How does compaction compare with truncation?", options: ["Truncation keeps more of the important facts than compaction does", "Compaction keeps by meaning at the cost of a call; truncation by position", "Both need an extra LLM call every time the context gets too long", "They behave the same way in long conversations, so either is fine"], answer: 1, explain: "Truncation keeps recent messages regardless of importance and costs nothing. Compaction uses a model to keep what matters, which costs a summarization call and can be lossy." },
    { q: "Which statement about compaction is a misconception?", options: ["A good compaction prompt keeps numbers, decisions and open tasks", "It is common to keep the most recent turns word for word", "Compaction can start when the context crosses a set threshold", "A summary is lossless, so the full history is never needed"], answer: 3, explain: "Summaries are lossy and can omit or distort details. That is why systems keep recent turns raw, preserve key values verbatim and often archive the full history." }
  ],
  takeaways: [
    "The context window is a hard token limit; long chats and agent sessions eventually overflow it.",
    "Truncation and sliding windows forget by position and can drop early goals and constraints.",
    "Compaction summarizes older history into goals, facts, decisions and next steps, and keeps recent turns raw.",
    "It needs a trigger, a summarization method and a policy for what to keep verbatim.",
    "Compaction is lossy: preserve exact values, archive the full history, and test it on real sessions."
  ],
  terms: [
    { term: "Context", def: "Everything sent to the model in one call: instructions, history, tool data and the new message." },
    { term: "Context window", def: "The maximum number of tokens a model can process in one call, input plus output." },
    { term: "Truncation", def: "Cutting old messages to make the context fit, without regard to their importance." },
    { term: "Sliding window", def: "Keeping only the last N messages of a conversation." },
    { term: "Context compaction", def: "Replacing older context with a compact summary so the session can continue within the window." },
    { term: "Compaction trigger", def: "The condition, such as a token threshold, that starts a compaction." }
  ]
};
