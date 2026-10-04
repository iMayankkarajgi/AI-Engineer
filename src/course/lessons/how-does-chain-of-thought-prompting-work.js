export default {
  id: "how-does-chain-of-thought-prompting-work",
  minutes: 18,
  hook: "Why does adding one sentence, “Let's think step by step”, make a language model noticeably better at word problems?",
  summary: "Chain-of-Thought (CoT) prompting asks a language model to write out its intermediate reasoning before giving the final answer. Because every generated token is extra computation the model can build on, writing the steps down turns one hard leap into many small, easier steps. We can trigger it with a short instruction (zero-shot) or with worked examples (few-shot), and we can make it more reliable by sampling several chains and taking a vote.",
  sections: [
    {
      id: "prompts-and-llms",
      title: "First, what is a prompt and what is an LLM?",
      blocks: [
        { type: "p", text: "A **Large Language Model (LLM)** is a neural network trained on a huge amount of text to do one job: given some text, predict the next **token**. A token is a small piece of text, often a word or part of a word. To write a full answer, the model predicts one token, appends it to the text, predicts the next one, and repeats. This is called **autoregressive generation**." },
        { type: "p", text: "A **prompt** is the text we give the model as its starting point: our question, instructions, examples and any data it needs. The model never sees anything except the prompt plus the tokens it has already written. So the way we phrase the prompt shapes what the model writes next. **Prompt engineering** is the craft of writing prompts that reliably get good answers." },
        { type: "callout", tone: "analogy", title: "Think of it like a student with scratch paper", text: "Ask a student “What is 17 × 24?” and demand an answer in one second, and they may guess. Give them scratch paper and they write 17 × 20 = 340, 17 × 4 = 68, 340 + 68 = 408. Same student, same knowledge, better answer. Chain-of-Thought prompting is how we hand the model scratch paper." },
        { type: "p", text: "Our running example in this lesson is a small word problem: *“A cafe has 23 apples. It uses 20 for lunch and buys 6 more. How many apples does it have now?”* The right answer is 23 − 20 + 6 = **9**." }
      ]
    },
    {
      id: "the-problem",
      title: "The problem: when the model jumps straight to the answer",
      blocks: [
        { type: "p", text: "If our prompt says “Answer with just a number”, the very first token the model writes must already be the answer. That means the model has to do all the arithmetic *inside* one forward pass of the network, with no room to write anything down." },
        { type: "p", text: "Here is the key fact: **a Transformer spends roughly the same amount of computation on every token it generates.** A fixed number of layers runs once per token. An easy question and a hard question both get the same budget for that single answer token. For a multi-step problem, that budget can be too small, so the model falls back on a pattern that *looks* right, such as copying a number from the question or doing only one of the two operations." },
        { type: "list", items: [
          "It might answer **29** (23 + 6, forgetting the 20 used for lunch).",
          "It might answer **3** (23 − 20, forgetting the 6 bought).",
          "It might answer **9**, but we cannot see why, so we cannot check it."
        ] },
        { type: "p", text: "This failure mode is common on math word problems, multi-hop questions (“Who was president when the author of X was born?”), logic puzzles and anything where a later step depends on an earlier result." }
      ]
    },
    {
      id: "what-is-cot",
      title: "What is Chain-of-Thought prompting?",
      blocks: [
        { type: "p", text: "**Chain-of-Thought (CoT) prompting** is a prompting technique in which we get the model to produce a sequence of intermediate reasoning steps (the “chain of thought”) before the final answer. The technique was described and named by Wei and colleagues at Google in the 2022 paper *Chain-of-Thought Prompting Elicits Reasoning in Large Language Models*." },
        { type: "p", text: "Nothing about the model changes. No training, no new weights. We only change the prompt so that the most likely continuation is a worked solution rather than a bare number." },
        { type: "tabs", items: [
          { label: "Without CoT", blocks: [
            { type: "p", text: "**Prompt:** `Q: A cafe has 23 apples. It uses 20 for lunch and buys 6 more. How many apples now? Answer with a number only.`" },
            { type: "p", text: "**Typical failure:** `29` — one step was skipped and we have no trace to see which." }
          ] },
          { label: "With CoT", blocks: [
            { type: "p", text: "**Prompt:** `Q: A cafe has 23 apples. It uses 20 for lunch and buys 6 more. How many apples now? Let's think step by step, then give the answer.`" },
            { type: "p", text: "**Typical output:** `The cafe starts with 23. After lunch it has 23 − 20 = 3. It buys 6, so 3 + 6 = 9. The answer is 9.`" }
          ] }
        ] },
        { type: "p", text: "Two things improved. The answer is more likely to be right, because each step is small. And the answer is **inspectable**: if it were wrong, we could see exactly which line went wrong." },
        { type: "check", question: "Pause and predict: if CoT does not change the model's weights, where does the extra accuracy come from?", answer: "From extra computation at inference time. Every reasoning token is another full forward pass whose result is written into the context, and later tokens can read it. The model gets to store intermediate results (like “3”) instead of holding everything in one pass." }
      ]
    },
    {
      id: "zero-shot-vs-few-shot",
      title: "Zero-shot CoT vs Few-shot CoT",
      blocks: [
        { type: "p", text: "There are two classic ways to trigger a chain of thought. **Few-shot CoT** (the original Wei et al. method) puts a few worked examples, each with question, reasoning and answer, in the prompt. The model copies that format for the new question. **Zero-shot CoT** (Kojima et al., 2022, *Large Language Models are Zero-Shot Reasoners*) adds no examples at all, just a trigger phrase like “Let's think step by step.”" },
        { type: "compare", title: "Two ways to ask for reasoning",
          options: [
            { name: "Zero-shot CoT", summary: "Add a short instruction such as “Let's think step by step.”", pros: ["No examples to write", "Short prompt, cheap", "Works across many task types"], cons: ["Less control over the format and style of reasoning", "Final answer can be buried in prose"], bestFor: "Quick wins, varied tasks, strong modern models" },
            { name: "Few-shot CoT", summary: "Show 1–8 worked examples with their reasoning, then the new question.", pros: ["We control step style and answer format", "Teaches domain-specific procedures", "Easier to parse the final answer"], cons: ["Longer prompt costs more tokens", "Bad examples teach bad habits", "Examples must match the task"], bestFor: "A fixed task with a known solution procedure" }
          ],
          rows: [
            ["What we add", "One trigger sentence", "Several Q → reasoning → A demos"],
            ["Prompt length", "Barely changes", "Grows with each example"],
            ["Format control", "Low", "High"],
            ["Source", "Kojima et al., 2022", "Wei et al., 2022"]
          ],
          verdict: "Start with zero-shot CoT. Switch to few-shot when we need a specific reasoning procedure or a strict output format." },
        { type: "p", text: "A practical variant asks for the reasoning and the answer in separate, labelled parts, for example “Think in a section called Reasoning, then write `Answer: <number>`.” This makes it easy for code to extract the answer." }
      ]
    },
    {
      id: "walkthrough",
      title: "A step-by-step walkthrough of a reasoning chain",
      blocks: [
        { type: "p", text: "Let us follow what happens, token by token, when we send the CoT prompt for our cafe problem." },
        { type: "steps", title: "One chain of thought, from prompt to answer", items: [
          { title: "Read the prompt", text: "The model processes the question plus “Let's think step by step.” The likeliest continuation is now a worked explanation, not a number." },
          { title: "Restate the start", text: "It writes “The cafe starts with 23.” This copies the key quantity into a fresh, nearby spot in the context." },
          { title: "First operation", text: "It writes “23 − 20 = 3”. This is one small subtraction, easy to get right in a single step. The result “3” is now in the context." },
          { title: "Second operation", text: "It writes “3 + 6 = 9”. It reads the “3” it wrote a moment ago instead of recomputing it." },
          { title: "State the answer", text: "It writes “The answer is 9.” Our code finds this line with a regular expression and grades it." }
        ] },
        { type: "flow", title: "Each written step becomes input for the next", nodes: [
          { label: "Question", detail: "23 apples, use 20, buy 6. How many now?" },
          { label: "Step 1", detail: "Start: 23 apples (copied from the question)." },
          { label: "Step 2", detail: "23 − 20 = 3. The intermediate result is stored as text." },
          { label: "Step 3", detail: "3 + 6 = 9. Reads the stored 3 instead of redoing the work." },
          { label: "Answer", detail: "“The answer is 9.” A fixed phrase that code can parse." }
        ] }
      ]
    },
    {
      id: "why-it-works",
      title: "Why does Chain-of-Thought prompting work?",
      blocks: [
        { type: "p", text: "There is no single proven explanation, but several reasons are widely accepted:" },
        { type: "list", items: [
          "**More computation per answer.** Each token gets a fixed amount of compute. Writing 40 reasoning tokens before the answer means 40 more forward passes are spent on the problem.",
          "**A working memory.** Intermediate results are written into the context, so later steps can attend to them. The model does not have to carry everything in its hidden state.",
          "**Decomposition.** A hard problem becomes a chain of easy sub-problems, each of which looks like something the model has seen many times in training.",
          "**It matches the training data.** The web is full of worked solutions, tutorials and step-by-step explanations. The trigger phrase pushes the model into that familiar style."
        ] },
        { type: "p", text: "The original paper also observed that the benefit depends on model size: in their experiments CoT helped large models a lot, while for small models it gave little benefit or even hurt, because small models wrote fluent but wrong reasoning. Today's strong models handle CoT well." },
        { type: "deeper", title: "Self-consistency: vote over several chains", blocks: [
          { type: "p", text: "One chain can still slip. **Self-consistency** (Wang et al., 2022) samples several chains at a temperature above 0, extracts each final answer, and returns the most common one. Different chains make *different* mistakes, but correct chains tend to agree on the same answer." },
          { type: "formula", expr: "P(majority correct) = ∑ₖ₌⌈n/2⌉ⁿ C(n, k) · pᵏ · (1 − p)ⁿ⁻ᵏ", where: [["n", "number of sampled chains (odd)"], ["p", "chance that one chain is correct"], ["C(n, k)", "number of ways to pick which k chains are correct"]], caption: "A pessimistic estimate that treats every wrong chain as voting for the same wrong answer." },
          { type: "chart", kind: "line", title: "Majority-vote accuracy as we sample more chains (p = 0.6)", xLabel: "Chains sampled", yLabel: "P(vote is correct)", series: [ { name: "Majority vote", points: [[1, 0.6], [3, 0.648], [5, 0.683], [9, 0.733], [15, 0.787], [25, 0.846], [41, 0.903]] } ], caption: "Computed from the binomial formula above, assuming chains are independent and each is right 60% of the time. Real chains are correlated, so gains are usually smaller, and cost grows linearly with n." }
        ] }
      ]
    },
    {
      id: "code",
      title: "Code you can run: building CoT prompts and voting",
      blocks: [
        { type: "p", text: "We cannot call a real model here, so we hard-code five chains that a model *might* sample. The code shows the parts we really write in production: the two prompt styles, an answer extractor, and a self-consistency vote." },
        { type: "code", lang: "python", title: "cot_vote.py", code: `import re
from collections import Counter

question = "A cafe has 23 apples. It uses 20 for lunch and buys 6 more. How many apples now?"

# Zero-shot CoT: append a trigger phrase, no examples
zero_shot = f"Q: {question}\\nA: Let's think step by step."

# Few-shot CoT: show one worked example (with its reasoning) first
demo = ("Q: Tom has 5 pens and buys 2 packs of 3 pens. How many pens?\\n"
        "A: He starts with 5. Two packs of 3 is 6. 5 + 6 = 11. The answer is 11.")
few_shot = f"{demo}\\n\\nQ: {question}\\nA:"

# Pretend we sampled 5 reasoning chains from a model at temperature 0.7
chains = [
    "Start with 23. 23 - 20 = 3. 3 + 6 = 9. The answer is 9.",
    "23 apples minus 20 is 3. Buying 6 gives 9. The answer is 9.",
    "23 - 20 = 13. 13 + 6 = 19. The answer is 19.",   # an arithmetic slip
    "After lunch: 3 left. Plus 6 bought: 9. The answer is 9.",
    "23 + 6 = 29. 29 - 20 = 9. The answer is 9.",
]

def final_answer(chain):
    # Pull out the number after 'The answer is' so code can grade it
    m = re.search(r"The answer is (-?\\d+)", chain)
    return int(m.group(1)) if m else None

answers = [final_answer(c) for c in chains]
best, count = Counter(answers).most_common(1)[0]
print("Zero-shot CoT prompt:\\n" + zero_shot)
print("\\nFew-shot CoT prompt:", len(few_shot.split()), "words")
print("Extracted answers:", answers)
print(f"Self-consistency vote: {best} ({count} of {len(chains)} chains)")`, output: `Zero-shot CoT prompt:
Q: A cafe has 23 apples. It uses 20 for lunch and buys 6 more. How many apples now?
A: Let's think step by step.

Few-shot CoT prompt: 55 words
Extracted answers: [9, 9, 19, 9, 9]
Self-consistency vote: 9 (4 of 5 chains)`,
          walkthrough: [
            { lines: [6, 7], note: "Zero-shot CoT: the question plus a trigger phrase. No examples." },
            { lines: [9, 12], note: "Few-shot CoT: one worked example (question, reasoning, answer) placed before our question so the model copies the format." },
            { lines: [14, 21], note: "Five sampled chains. Chain 3 makes an arithmetic slip (23 − 20 = 13)." },
            { lines: [23, 26], note: "Because every demo ends with “The answer is N”, a regular expression can pull out the final answer reliably." },
            { lines: [28, 33], note: "Self-consistency: count the answers and keep the most common. The slip is outvoted 4 to 1." }
          ] },
        { type: "check", question: "In the output, one chain answered 19. Why did the final answer still come out as 9?", answer: "Because we voted. Four chains independently reached 9 and only one reached 19. Correct reasoning paths tend to converge on the same answer, while mistakes scatter, so the majority answer is more reliable than any single chain." }
      ]
    },
    {
      id: "where-useful",
      title: "Where Chain-of-Thought prompting is useful",
      blocks: [
        { type: "table", caption: "Good fits and poor fits for CoT", head: ["Task", "Does CoT help?", "Why"], rows: [
          ["Math word problems", "Usually a lot", "Several dependent arithmetic steps"],
          ["Multi-hop questions", "Yes", "Each hop's answer feeds the next hop"],
          ["Logic and planning puzzles", "Yes", "Constraints must be checked one by one"],
          ["Code debugging", "Often", "Tracing values line by line finds the bug"],
          ["Agents choosing tools", "Yes", "Patterns like ReAct interleave reasoning with tool calls"],
          ["Simple fact lookup (“capital of France?”)", "Little or none", "One step; extra tokens only add cost"],
          ["Sentiment of a short review", "Little", "Pattern recognition, not multi-step reasoning"]
        ] },
        { type: "callout", tone: "example", title: "Real-world use", text: "A tutoring app asks the model to solve a problem step by step, then checks the final answer against a known key, and only shows the student the steps if the answer matched. A support bot reasons privately about which refund rule applies, then shows the customer only the short conclusion. Agent frameworks use reasoning steps before each tool call so the next action is planned, not guessed." }
      ]
    },
    {
      id: "keep-in-mind",
      title: "Things to keep in mind",
      blocks: [
        { type: "callout", tone: "warn", title: "The reasoning is not a window into the model's mind", text: "A chain of thought is generated text, not a log of the network's internal computation. Research has shown that models can produce plausible reasoning that does not reflect what actually drove the answer (the “faithfulness” problem). Treat the chain as a useful aid and a debugging hint, not as proof." },
        { type: "list", items: [
          "**Cost and latency.** Reasoning tokens are output tokens, which are billed and take time. A 5-token answer can become 200 tokens.",
          "**Errors can cascade.** A wrong early step is copied into every later step. Self-consistency or a verification step helps.",
          "**Parse the answer.** Ask for a fixed final line (`Answer: ...`) so code does not have to guess which number in the prose is the answer.",
          "**Do not show raw reasoning to end users by default.** It can be long, confusing, or contain wrong intermediate claims. Show the conclusion.",
          "**Reasoning models change the picture.** Models trained to think before answering (for example OpenAI's o-series, DeepSeek-R1, and the extended-thinking modes of Claude and Gemini) already produce a hidden or visible chain of thought. Adding “think step by step” to them usually adds little, and some vendors advise against prescribing the steps. Give them a clear goal instead.",
          "**Skip it for one-step tasks.** If the task has no intermediate steps, CoT costs more and may even overthink."
        ] }
      ]
    }
  ],
  quiz: [
    { q: "What is the core change Chain-of-Thought prompting makes?", options: ["It fine-tunes the model on many step-by-step worked solutions", "It has the model write out reasoning steps before the final answer", "It lowers the sampling temperature so the model answers more carefully", "It splits the question across several separate model calls in sequence"], answer: 1, explain: "CoT changes only the prompt so the model writes its reasoning first. No weights change (so not fine-tuning), temperature is unrelated, and splitting work across calls is prompt chaining, a different technique." },
    { q: "Our app asks a model a 3-step word problem with “Answer with a number only” and gets frequent wrong answers. What is the most direct fix?", options: ["Add more background facts about apples and cafes to the prompt", "Ask for the final number in bold so it stands out in the reply", "Ask it to reason step by step and end with a line `Answer: N`", "Set max output tokens to 1 so the model cannot ramble at all"], answer: 2, explain: "A forced one-token answer gives the model no room to compute intermediate steps. Asking for reasoning plus a fixed answer line both improves accuracy and keeps the answer easy to parse. Limiting tokens makes the problem worse." },
    { q: "We sample 5 chains and extract the answers [9, 9, 19, 9, 9]. What does self-consistency return?", options: ["9", "19", "11 (the average)", "Nothing, because the chains disagree"], answer: 0, explain: "Self-consistency takes the most frequent final answer: 9 appears 4 times. It votes; it does not average answers or require unanimity." },
    { q: "How does few-shot CoT differ from zero-shot CoT?", options: ["Few-shot needs a much larger model; zero-shot runs on any model size", "Zero-shot uses worked examples; few-shot uses only a trigger phrase", "They are the same technique; only the papers that named them differ", "Few-shot shows worked examples; zero-shot adds only a trigger phrase"], answer: 3, explain: "Few-shot shows demos (question, reasoning, answer) for the model to imitate. Zero-shot just adds a trigger sentence such as “Let's think step by step”. The second option has them reversed." },
    { q: "Which statement about the written chain of thought is accurate?", options: ["It is an exact, step-by-step log of the computation inside the network", "It helps accuracy, but may not reflect what really drove the answer", "It always makes answers cheaper because the model works more efficiently", "It only works if the model was trained on the phrase “think step by step”"], answer: 1, explain: "The chain is just more generated tokens. It improves accuracy and debuggability, but research shows it can be unfaithful to the model's internal process. It also costs more tokens, not fewer." }
  ],
  takeaways: [
    "CoT prompting makes the model write intermediate steps before the answer; only the prompt changes.",
    "Each generated token is extra computation and stored working memory, so many small steps beat one big leap.",
    "Zero-shot CoT uses a trigger phrase; few-shot CoT uses worked examples for more control.",
    "Self-consistency samples several chains and takes a majority vote to cancel out random slips.",
    "CoT costs more tokens, can be unfaithful, and adds little for one-step tasks or built-in reasoning models."
  ],
  terms: [
    { term: "Prompt", def: "The text we give an LLM as its starting point: instructions, examples, data and the question." },
    { term: "Chain-of-Thought (CoT)", def: "A prompting technique where the model writes intermediate reasoning steps before its final answer." },
    { term: "Zero-shot CoT", def: "Triggering reasoning with an instruction such as “Let's think step by step”, without examples." },
    { term: "Few-shot CoT", def: "Triggering reasoning by including worked examples that show the reasoning format." },
    { term: "Self-consistency", def: "Sampling several reasoning chains and returning the most common final answer." },
    { term: "Faithfulness", def: "Whether a model's written reasoning truly reflects the process that produced its answer." }
  ]
};
