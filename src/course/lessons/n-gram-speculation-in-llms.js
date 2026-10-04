export default {
  id: "n-gram-speculation-in-llms",
  minutes: 25,
  hook: "When an LLM is rewriting your code and most of the answer is copied from the prompt, why should it generate every copied token the slow way?",
  summary: "Speculative decoding speeds up generation by letting cheap guesses be verified by the big model in one pass, but a separate draft model costs memory, engineering and compute. N-gram speculation drops the draft model: it finds the last few generated tokens earlier in the text (usually the prompt) and proposes whatever followed them there. The big model verifies the guesses as usual, so the output is unchanged, and on copy-heavy tasks like code editing, summarisation with quotes or RAG answers, many tokens arrive per pass almost for free.",
  sections: [
    {
      id: "how-generation-works",
      title: "How an LLM generates text, and why it is slow",
      blocks: [
        { type: "p", text: "An LLM produces text one **token** (word piece) at a time. Each step is a full **forward pass** through the model that outputs a probability for every possible next token; we pick one, append it and repeat. A 200-token reply needs 200 sequential passes." },
        { type: "p", text: "Each pass is slow for a surprising reason: not the math, but the **memory traffic**. The GPU must stream all the weights (16 GB for an 8B model in FP16) from memory to produce a single token, while its compute units mostly wait. This makes decoding **memory-bound**. The flip side is good news: processing a handful of tokens in the same pass costs barely more than processing one." },
        { type: "p", text: "Our running example: a **code assistant** asked to fix a bug in a function the user pasted. The answer is the same function with one line changed, so 90% of the output tokens already appear in the prompt." },
        { type: "callout", tone: "analogy", title: "Think of it like retyping a document with one correction", text: "A typist asked to retype a letter with one word changed does not compose each sentence from scratch. They glance at the original and copy whole phrases, slowing down only around the change. N-gram speculation lets the model “glance at the original” for its guesses." }
      ]
    },
    {
      id: "speculative-recap",
      title: "Speculative decoding and the cost of a draft model",
      blocks: [
        { type: "p", text: "**Speculative decoding** (previous lesson) uses that cheap-to-verify property. Something fast proposes k future tokens (the **draft**); the big **target model** runs one pass over all of them, keeps the longest prefix that matches what it would have produced, and adds one token of its own. When guesses are good, several tokens are produced per target pass." },
        { type: "p", text: "The classic drafter is a **small draft model**. That works, but has real costs:" },
        { type: "list", items: [
          "**Memory:** the draft model's weights and its own KV cache take GPU memory away from user batches.",
          "**Compute:** k draft passes per round are not free; a draft too large eats the savings.",
          "**Compatibility:** the draft must use the same tokenizer as the target and should be well aligned with it, so you need the right model pair.",
          "**Engineering:** two models to load, schedule, version and keep in sync."
        ] },
        { type: "p", text: "So a natural question is: can we get useful guesses with no model at all?" }
      ]
    },
    {
      id: "what-is-ngram",
      title: "What an n-gram is",
      blocks: [
        { type: "p", text: "An **n-gram** is a sequence of n consecutive tokens. In the token list `s = 0 ; for x in items`, the 1-grams (unigrams) are single tokens like `for`; the 2-grams (bigrams) are pairs like `for x` and `x in`; the 3-grams (trigrams) are triples like `for x in`." },
        { type: "p", text: "Classic language models before neural networks were n-gram models: they predicted the next word from counts of what followed the previous n−1 words in a big corpus. N-gram speculation borrows the same intuition but uses a tiny, local “corpus”: the current prompt and the text generated so far." }
      ]
    },
    {
      id: "what-is-ngram-speculation",
      title: "What n-gram speculation is, step by step",
      blocks: [
        { type: "p", text: "**N-gram speculation** (also known as **prompt lookup decoding**) drafts tokens by pattern matching. Take the last n tokens of the current text as a search key. Look for an earlier place in the context where the same n tokens appear. If found, propose the k tokens that followed that earlier occurrence as the draft. Then verify with the target model exactly as in ordinary speculative decoding." },
        { type: "steps", title: "One round of n-gram speculation", items: [
          { title: "Take the key", text: "Use the last n generated tokens, e.g. n = 2: `def total`." },
          { title: "Search the context", text: "Scan the prompt and earlier output for `def total`. It appears in the pasted code." },
          { title: "Copy the continuation", text: "Propose the k tokens that followed it there, e.g. k = 4: `( items ) :`." },
          { title: "Verify in one target pass", text: "Run the target over the text plus the 4 draft tokens; it gives its own prediction at every position." },
          { title: "Accept and add one", text: "Keep drafts up to the first mismatch, then append the target's own next token. No match found? Just do a normal decode step." }
        ] },
        { type: "flow", title: "Drafting with no draft model", nodes: [
          { label: "Last n tokens", detail: "The search key, for example the 2 most recent tokens." },
          { label: "Lookup in context", detail: "String matching over the prompt and generated text. Microseconds on a CPU, no GPU needed." },
          { label: "Copy k tokens", detail: "What followed the match becomes the draft." },
          { label: "Target verifies", detail: "One forward pass checks all k positions in parallel." },
          { label: "Accept prefix + 1", detail: "Matching drafts are kept and the target adds one token of its own." }
        ] },
        { type: "callout", tone: "tip", title: "Practical knobs", text: "Implementations let you set the key length (often trying a longer n first, then falling back to shorter) and the maximum draft length k. Hugging Face Transformers exposes prompt lookup through a generation argument (`prompt_lookup_num_tokens`), and vLLM offers an `ngram` speculative method; check current docs for exact names." }
      ]
    },
    {
      id: "code",
      title: "Code: prompt lookup on a bug fix",
      blocks: [
        { type: "p", text: "Here the “target model” is a stand-in that returns the next token of a fixed greedy answer, so we can focus on the drafting and verification logic. In a real system, the target's predictions for all draft positions come from one forward pass." },
        { type: "code", lang: "python", title: "prompt_lookup.py", code: `# Prompt-lookup (n-gram) speculation with a stand-in "target model".
prompt = ("Fix: def total ( items ) : s = 0 ; for x in items : "
          "s += x.price ; return s Answer:").split()
answer = ("def total ( items ) : s = 0 ; for x in items : "
          "s += x.price * x.qty ; return s").split()   # target's greedy output
FULL = prompt + answer

def target_next(seq):                 # stand-in for one greedy model step
    return FULL[len(seq)]

def ngram_draft(seq, n=2, k=4):
    # find the last n tokens earlier in the text; propose what followed them
    key = seq[-n:]
    for i in range(len(seq) - n - 1, -1, -1):
        if seq[i:i + n] == key:
            return seq[i + n:i + n + k]
    return []                         # no match: no draft this step

seq, passes = list(prompt), 0
while len(seq) < len(FULL):
    draft = ngram_draft(seq)
    passes += 1                       # ONE target pass verifies all drafts
    accepted = 0
    for tok in draft:                 # keep drafts while they match target
        if len(seq) < len(FULL) and tok == target_next(seq):
            seq.append(tok); accepted += 1
        else:
            break
    if len(seq) < len(FULL):
        seq.append(target_next(seq))  # the same pass yields one more token
    print(f"pass {passes}: draft={draft} accepted={accepted}")

print("output identical:", seq == FULL)
print(f"{len(answer)} tokens in {passes} target passes (plain decoding: {len(answer)})")`, output: `pass 1: draft=[] accepted=0
pass 2: draft=[] accepted=0
pass 3: draft=['(', 'items', ')', ':'] accepted=4
pass 4: draft=['+=', 'x.price', ';', 'return'] accepted=0
pass 5: draft=['0', ';', 'for', 'x'] accepted=4
pass 6: draft=['items', ':', 's', '+='] accepted=4
pass 7: draft=[';', 'return', 's', 'Answer:'] accepted=0
pass 8: draft=[] accepted=0
pass 9: draft=[] accepted=0
pass 10: draft=[] accepted=0
pass 11: draft=['s', 'Answer:', 'def', 'total'] accepted=1
output identical: True
23 tokens in 11 target passes (plain decoding: 23)`, walkthrough: [
          { lines: [1, 6], note: "The prompt contains buggy code; the answer repeats it with one change (`* x.qty`). Tokens are just whitespace-split words here." },
          { lines: [8, 9], note: "Stand-in for the target model: it returns what a greedy model would write next." },
          { lines: [11, 17], note: "The n-gram drafter: search backwards for the most recent earlier occurrence of the last 2 tokens and copy the next 4." },
          { lines: [19, 31], note: "Each loop is one target pass: accept matching drafts, stop at the first mismatch, then add the target's own token." },
          { lines: [33, 34], note: "The output is identical to plain decoding, in fewer target passes." }
        ] },
        { type: "p", text: "Read the trace. Passes 1–2 find no match (`Answer: def` never appeared before), so they behave like plain decoding. In pass 3 the key `def total` matches the prompt and all 4 copied tokens are accepted, plus one target token: 5 tokens for one pass. Pass 4 shows a **wrong match**: the key `: s` matched the later spot `items : s +=` rather than `) : s =`, so the draft was rejected, costing nothing but a little wasted verification. Passes 8–10 sit around the actual bug fix (`* x.qty`), which appears nowhere in the prompt, so there is nothing to copy. Overall: 23 tokens in 11 passes, about 2.1× fewer target passes." },
        { type: "check", question: "Why did pass 7's draft get rejected even though `; return s` really does follow in the answer?", answer: "Because the target's next token after `x.price` was `*` (the fix), not `;`. The draft copied the old, buggy code. The first mismatch ends acceptance, and the target supplies `*` itself." }
      ]
    },
    {
      id: "exact-output",
      title: "Why the output stays exactly the same",
      blocks: [
        { type: "p", text: "The n-gram lookup only *proposes*. Every token that ends up in the output is either (a) a draft token the target model confirmed it would have produced at that position, or (b) a token the target produced itself. With greedy decoding that means token-by-token equality with plain decoding, as our `output identical: True` line shows." },
        { type: "p", text: "With sampling, the same speculative-sampling acceptance rule applies. The n-gram drafter acts like a draft model whose distribution puts all its probability on the copied token, so the target accepts it with probability equal to the target's own probability of that token, and otherwise samples a replacement from its distribution with that token excluded and renormalised. The output distribution is still exactly the target's." },
        { type: "callout", tone: "note", title: "Small print", text: "As with any batched computation on GPUs, tiny floating-point differences between processing 1 and k + 1 positions can occasionally flip a near-tie. This is a numerical effect, not a flaw of the method." }
      ]
    },
    {
      id: "where-it-works",
      title: "Where it works well and where it fails",
      blocks: [
        { type: "chart", kind: "hbar", title: "How much of the output is likely to be copyable from context (illustrative)", labels: ["Code editing / refactoring", "RAG answers quoting sources", "Summaries with extracted quotes", "Multi-turn chat re-using earlier text", "Translation", "Creative writing / brainstorming"], series: [{ name: "Copyable share", values: [85, 50, 40, 25, 5, 3] }], caption: "Illustrative ranking, not measurements. N-gram speculation helps in proportion to how much of the answer repeats text already in the context." },
        { type: "list", items: [
          "**Works well:** editing or reformatting code or documents, answering from retrieved passages (RAG) with quotes, extracting fields from a document, chat where the model restates earlier content. Long, repetitive contexts help.",
          "**Fails or does nothing:** open-ended creative text, translation (output is in a different language), short prompts with little to copy, and the novel parts of any answer (like our bug fix). When no match is found it falls back to normal decoding, so the cost is small.",
          "**Watch out for:** frequent wrong matches in very repetitive text, which waste verification work, and large batch sizes, where verification is no longer nearly free."
        ] },
        { type: "callout", tone: "warn", title: "Common mistake", text: "Turning on n-gram speculation and expecting a universal speedup. On tasks with little overlap between input and output, it rarely drafts anything useful. Measure the acceptance rate and tokens per target pass on your real traffic." }
      ]
    },
    {
      id: "vs-draft-model",
      title: "N-gram speculation vs draft-model speculative decoding",
      blocks: [
        { type: "compare", title: "Two ways to get draft tokens", options: [
          { name: "N-gram (prompt lookup)", summary: "Copy continuations of matching text from the context.", pros: ["No extra model, memory or training", "Drafting cost is near zero (string search)", "Works with any target model and tokenizer", "Very high acceptance on copy-heavy tasks"], cons: ["Only drafts text that already appears in context", "Useless for novel or creative content", "Can match the wrong earlier occurrence"], bestFor: "Code edits, RAG, document rewriting, extraction" },
          { name: "Draft model", summary: "A small LLM predicts the next k tokens.", pros: ["Can guess new text, not just copies", "Works across many task types"], cons: ["Extra GPU memory and compute", "Needs a matching tokenizer and good alignment", "More engineering to deploy"], bestFor: "General chat and writing where latency matters" }
        ], rows: [["Drafting cost", "Negligible", "k small-model passes"], ["Extra memory", "None", "Draft weights + its KV cache"], ["Output", "Identical to target", "Identical to target"]], verdict: "Start with n-gram speculation when outputs echo inputs; it is free to try. Add a draft model (or heads like EAGLE/Medusa) when your outputs are mostly new text." },
        { type: "callout", tone: "example", title: "Related ideas", text: "LLMA (“Inference with Reference”, 2023) copies spans from retrieved reference documents. Lookahead decoding builds its pool of n-grams from the model's own parallel guesses rather than from the prompt. Both share the idea of cheap drafting plus exact verification." },
        { type: "check", question: "Our RAG bot answers by quoting policy documents, and we cannot spare GPU memory for a draft model. Which drafting method fits, and why?", answer: "N-gram speculation (prompt lookup): the answers copy long spans from the retrieved documents in the prompt, so matches are frequent, and it needs no extra GPU memory." }
      ]
    },
    {
      id: "choosing-the-key-length",
      title: "Going one level deeper",
      blocks: [
        { type: "p", text: "The key length n is the main setting we control, and the trace of `prompt_lookup.py` already showed why it matters. Pass 4 used the 2-token key `: s`. That key appears twice in the prompt: in `) : s = 0` and in `items : s += x.price`. The search took the most recent one, which was the wrong one, and the whole draft was rejected." },
        { type: "steps", title: "Replaying pass 4 with a longer key", items: [
          { title: "Use three tokens", text: "With n = 3 the key is `) : s`. This appears only once in the prompt." },
          { title: "Copy what follows", text: "The draft becomes `= 0 ; for`, which is exactly what the target writes next. A rejected round turns into a fully accepted one." },
          { title: "The price of a long key", text: "Right after the fix, the text ends in `* x.qty ;`. No 3-token or 2-token key ending there exists in the prompt, because `x.qty` is new. A long key finds nothing." },
          { title: "Fall back", text: "So we try the long key first and shorten it only when there is no match: n = 3, then 2, then 1. The 1-token key `;` does match, and we get a guess where we would otherwise have none." },
          { title: "Trust short keys less", text: "A 1-token key matches almost anywhere, so its guess is often from the wrong place. It is worth trying only because a wrong draft costs little." }
        ] },
        { type: "table", caption: "How key length changes the drafter's behaviour", head: ["Key length n", "How often it finds a match", "How often the match is the right place", "What goes wrong"], rows: [
          ["1", "Almost always", "Often wrong", "Common tokens such as `;` or `the` appear in many places"],
          ["2", "Often", "Usually right", "Repeated phrases still collide, as `: s` did"],
          ["3 or more", "Less often", "Nearly always right", "Finds nothing just after new text"]
        ] },
        { type: "p", text: "There is a second choice hidden in the search: **which** occurrence to copy from when there are several. Our code took the most recent one. In text that repeats a pattern with small changes, such as similar functions one after another, the most recent occurrence is often the closest match, but in pass 4 it was the wrong one. Neither choice is always right, which is another reason to measure acceptance on real traffic." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will measure the drafter on its own, with no verification loop. A support bot must quote a refund policy from its prompt. For each token of the answer we ask: does the key find a match in the prompt, and is the first copied token the one the target will write? We repeat this for key lengths 1, 2 and 3. To keep it short, the index covers only the prompt." },
        { type: "code", lang: "python", title: "practice_ngram_index.py", code: `# How good is an n-gram drafter's FIRST guess, for different key lengths n?
from collections import defaultdict
context = ("policy : refunds are issued within 14 days of purchase . "
           "exchanges are sent within 30 days of purchase . "
           "question : when are refunds issued ? answer :").split()
answer = "refunds are issued within 14 days of purchase .".split()

def build_index(tokens, n):
    # map every n-gram to the positions of the token that follows it
    index = defaultdict(list)
    for i in range(len(tokens) - n):
        index[tuple(tokens[i:i + n])].append(i + n)
    return index

print("n  lookups  hits  correct  wrong")
for n in (1, 2, 3):
    index = build_index(context, n)
    seq, hits, correct, wrong = list(context), 0, 0, []
    for tok in answer:                       # tok = what the target will write
        key = tuple(seq[-n:])
        if key in index:                     # the key appears in the prompt
            hits += 1
            guess = context[index[key][-1]]  # use the most recent occurrence
            if guess == tok:
                correct += 1
            else:
                wrong.append(f"{' '.join(key)} -> {guess}")
        seq.append(tok)
    print(f"{n}  {len(answer):7d}  {hits:4d}  {correct:7d}  {wrong}")`, output: `n  lookups  hits  correct  wrong
1        9     9        4  [': -> when', 'refunds -> issued', 'are -> refunds', 'issued -> ?', 'within -> 30']
2        9     8        8  []
3        9     7        7  []`, walkthrough: [
          { lines: [1, 6], note: "The prompt holds a policy with two similar sentences and a question. The answer quotes the first sentence." },
          { lines: [8, 13], note: "Build a lookup table: every n-gram in the prompt points to the positions of the token that came after it." },
          { lines: [15, 28], note: "Walk through the answer. At each step, look up the last n tokens, take the most recent occurrence, and compare its next token with what the target writes." },
          { lines: [29, 29], note: "Print how many lookups hit, how many guesses were right, and each wrong guess." }
        ] },
        { type: "p", text: "A 1-token key hits on all 9 lookups but is right only 4 times. A 2-token key hits 8 times and is right every time. A 3-token key is also always right but hits only 7 times. Now change it:" },
        { type: "list", items: [
          "Change `index[key][-1]` to `index[key][0]` to copy from the earliest occurrence. Predict which of the wrong n = 1 guesses become right.",
          "Replace `answer` with new text that is not in the policy, such as `\"you will get your money back soon .\".split()`. Predict the hits and correct counts for each n.",
          "Add fallback: for each token try n = 3, then 2, then 1, and use the first key that hits. Predict the total hits and how many guesses are right, compared with the best single n."
        ] },
        { type: "check", question: "A wrong draft only costs a little wasted verification. So why not always use n = 1, which finds a match every time?", answer: "Because its guess often replaces a better one. When a longer key would have matched the right place, n = 1 may copy from the wrong place, the first draft token is rejected, and the pass yields one token instead of several. Short keys are useful only as a fallback, when longer keys find nothing." },
        { type: "check", question: "Our practice index covers only the prompt. The real method also searches the text generated so far. Give a case where that matters.", answer: "When the model repeats something it wrote itself that is not in the prompt: a new variable name it uses again, or a phrase it repeats in each item of a list. The first use must be generated the slow way, but every later use can be copied from the earlier output." }
      ]
    }
  ],
  quiz: [
    { q: "How does n-gram speculation produce its draft tokens?", options: ["By running a small draft language model k times on the current context", "By finding the last n tokens earlier in the context and copying what followed", "By sampling random tokens from the vocabulary and letting the target filter them", "By re-running the target model at a lower temperature to guess ahead"], answer: 1, explain: "It is pure pattern matching over the prompt and generated text; no model is used for drafting." },
    { q: "In the lesson's run, the 23-token answer took 11 target passes. Roughly how many tokens per target pass is that, compared with plain decoding?", options: ["About 1.0, the same as plain decoding", "About 11, the same as the target passes", "About 2.1, versus 1 for plain decoding", "About 0.5, half of plain decoding"], answer: 2, explain: "23 / 11 ≈ 2.1 tokens per pass. Plain decoding always gives exactly one token per pass." },
    { q: "Our creative-writing app enables n-gram speculation and sees no speedup. What is the most likely reason?", options: ["The target model is too accurate for any drafting method to help it", "The output rarely repeats text from the context, so few useful drafts are found", "N-gram speculation needs a high sampling temperature to find any drafts", "The KV cache gets disabled whenever n-gram speculation is turned on"], answer: 1, explain: "N-gram drafting can only propose text that already appears in context. Novel creative text offers few matches." },
    { q: "Compared with draft-model speculative decoding, what is a key advantage of n-gram speculation?", options: ["It predicts entirely new text better than a draft model can", "It needs no extra model, GPU memory or matching tokenizer", "It makes the output more fluent than the target alone", "It removes the need for the target to verify drafts"], answer: 1, explain: "Its drafter is a string search, so there is no second model to load or align. It still needs target verification, and it cannot invent new text." },
    { q: "A teammate worries: “Copying tokens from the prompt will make the model parrot the input instead of fixing the bug.” Why is this wrong?", options: ["N-gram speculation is only applied to the prompt, never to the generated output", "The copied tokens are hidden from the user and dropped before the reply is sent", "The draft length is fixed at one token, so too little is copied to matter", "Every draft is verified by the target, which rejects mismatches and writes its own token"], answer: 3, explain: "Drafts are only proposals. At the bug line, the target predicted `*`, rejected the copied `;`, and wrote the fix itself. The output is identical to plain decoding." }
  ],
  takeaways: [
    "Decoding is memory-bound, so verifying several guessed tokens in one pass is nearly as cheap as generating one.",
    "N-gram speculation drafts by matching the last n tokens earlier in the context and copying what followed.",
    "Target-model verification keeps the output exactly the same as plain decoding.",
    "It shines on copy-heavy tasks (code edits, RAG, rewriting) and does little for novel text.",
    "It needs no draft model, memory or training, so it is a cheap first speculative method to try."
  ],
  terms: [
    { term: "N-gram", def: "A sequence of n consecutive tokens." },
    { term: "N-gram speculation", def: "Speculative decoding where drafts are copied from earlier text that follows a matching n-gram." },
    { term: "Prompt lookup decoding", def: "Another name for n-gram speculation that searches mainly in the prompt." },
    { term: "Draft", def: "The k candidate tokens proposed before the target model verifies them." },
    { term: "Target model", def: "The main LLM whose output must be preserved." },
    { term: "Acceptance rate", def: "The fraction of draft tokens the target model confirms." }
  ]
};
