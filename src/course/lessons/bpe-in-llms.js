export default {
  id: "bpe-in-llms",
  minutes: 20,
  hook: "How can a model with a fixed list of about 100,000 tokens read any word ever written, including typos, names and emoji it has never seen?",
  summary: "Before a language model can read text, a tokenizer cuts the text into tokens and maps each one to an integer ID. Byte Pair Encoding (BPE) builds that token list by starting from single characters (or bytes) and repeatedly merging the most frequent neighbouring pair, so common words become one token while rare words split into reusable pieces. To tokenize new text it replays the learned merges in order, which is why BPE never meets a truly unknown word.",
  sections: [
    {
      id: "what-is-tokenization",
      title: "What is Tokenization?",
      blocks: [
        { type: "p", text: "A neural network only understands numbers. **Tokenization** is the first step that turns text into numbers: we cut the text into small units called **tokens** and replace each token with its position in a fixed list called the **vocabulary**. That position is the **token ID**." },
        { type: "p", text: "For example, a tokenizer might turn “unhappiness is rare” into the tokens `un` `happiness` ` is` ` rare` and then into IDs such as `[403, 23157, 318, 4071]` (illustrative numbers). The model reads and writes these IDs; a decoder turns IDs back into text at the end. Note that many tokenizers attach the leading space to the word, so ` is` (with a space) and `is` are different tokens." },
        { type: "callout", tone: "analogy", title: "Think of it like LEGO", text: "Imagine building every possible house from a box of standard LEGO pieces. If the box has only tiny 1×1 bricks, any house is possible but takes forever to build. If the box has a ready-made piece for every possible house, it would be impossibly large. The best box has common big pieces (whole walls, windows) plus small bricks for unusual details. BPE designs exactly that kind of box for text." },
        { type: "p", text: "Tokens matter in daily practice: API prices, context-window limits and generation speed are all counted in tokens, not words. In English, one token is roughly three quarters of a word on average, but this varies by tokenizer and language." },
      ],
    },
    {
      id: "the-problem",
      title: "The Problem: How to Break Text into Tokens?",
      blocks: [
        { type: "p", text: "There are three obvious ways to cut text, and each has a serious flaw at one extreme." },
        { type: "compare", title: "Three ways to split text",
          options: [
            { name: "Word-level", summary: "Each whole word is one token.", pros: ["Short sequences", "Tokens carry clear meaning"], cons: ["Vocabulary explodes (every word form, name and typo)", "Unknown words become a useless `[UNK]` token", "“run”, “runs”, “running” share nothing"], bestFor: "Older NLP systems with small, clean vocabularies" },
            { name: "Character-level", summary: "Each character is one token.", pros: ["Tiny vocabulary", "Never meets an unknown word"], cons: ["Very long sequences (attention cost grows fast with length)", "The model must learn spelling before meaning"], bestFor: "Some research models and spelling-heavy tasks" },
            { name: "Subword (BPE)", summary: "Frequent words stay whole; rare words split into frequent pieces.", pros: ["Balanced vocabulary size and sequence length", "No unknown words (byte-level)", "Shares pieces like “un”, “ing”, “est”"], cons: ["Splits can look odd to humans", "Some languages get more tokens per word"], bestFor: "Essentially every modern LLM" },
          ],
          rows: [
            ["Vocabulary size", "Hundreds of thousands or more", "~100 to a few thousand", "Chosen: commonly 32k–200k"],
            ["Tokens for “lowest”", "1 (if seen) or [UNK]", "6", "Usually 1–2"],
            ["Handles new words", "No", "Yes", "Yes"],
          ],
          verdict: "Subword tokenization takes the best of both ends, and BPE is the most widely used subword method." },
        { type: "check", question: "Why is character-level tokenization expensive for a Transformer even though its vocabulary is tiny?", answer: "It makes sequences several times longer. Self-attention compares every token with every other token, so cost grows roughly with the square of sequence length, and the context window fills up with far less actual text." },
      ],
    },
    {
      id: "what-is-bpe",
      title: "What is BPE (Byte Pair Encoding)?",
      blocks: [
        { type: "p", text: "**Byte Pair Encoding** began as a data-compression trick, described by Philip Gage in 1994: find the most common pair of adjacent bytes and replace it with a new symbol, then repeat. In 2016, Sennrich, Haddow and Birch adapted it to build vocabularies for neural machine translation. GPT-2 (2019) popularised **byte-level BPE**, which starts from the 256 possible byte values instead of characters." },
        { type: "p", text: "The core idea in one sentence: **start with the smallest units and keep gluing together the pair that appears next to each other most often**, until the vocabulary reaches the size we want. The result is an ordered list of **merge rules** plus the vocabulary they create." },
        { type: "list", items: [
          "**Training corpus**: a large sample of text used only to learn the merges.",
          "**Merge rule**: an instruction such as “replace `e` followed by `s` with `es`”.",
          "**Vocabulary size**: a number we choose in advance; it equals the base symbols plus the number of merges.",
          "**End-of-word marker**: in classic BPE a symbol like `_` marks where a word ends, so `est_` (word ending) differs from `est` inside a word. Byte-level BPE instead keeps the space as part of the next token.",
        ] },
      ],
    },
    {
      id: "how-bpe-works",
      title: "How BPE Works: Step by Step",
      blocks: [
        { type: "p", text: "Let us train BPE by hand on a tiny corpus with word counts: `low` ×5, `lower` ×2, `newest` ×6, `widest` ×3. We split each word into characters and add `_` at the end: `l o w _`, `l o w e r _`, `n e w e s t _`, `w i d e s t _`." },
        { type: "steps", title: "One BPE training run", items: [
          { title: "Start with characters", text: "The base vocabulary is every character that appears: l, o, w, e, r, n, s, t, i, d and _ (11 symbols). The corpus has 95 symbols in total (word length × count)." },
          { title: "Count adjacent pairs", text: "Count each neighbouring pair, weighted by word frequency. `e s` appears in newest (6) and widest (3): 9 times. `s t` and `t _` also appear 9 times. `l o` appears 7 times." },
          { title: "Merge the top pair", text: "Take the most frequent pair, `e s` (ties are broken by a fixed rule; here, the first one found), add `es` to the vocabulary, and rewrite the corpus: `n e w es t _`." },
          { title: "Repeat", text: "Recount and merge again: `es t` → `est`, then `est _` → `est_`, then `l o` → `lo`, `lo w` → `low`, `n e` → `ne`. Each merge adds one vocabulary entry." },
          { title: "Stop at the target size", text: "Stop when the vocabulary hits the chosen size. Real tokenizers run tens of thousands of merges on gigabytes of text. Save the merges in order: that ordered list is the tokenizer." },
        ] },
        { type: "chart", kind: "line", title: "Corpus length shrinks with every merge", xLabel: "Merges performed", yLabel: "Total symbols in corpus", series: [ { name: "Symbols", points: [[0, 95], [1, 86], [2, 77], [3, 68], [4, 61], [5, 54], [6, 48]] } ], caption: "Measured on our toy corpus. Each merge saves as many symbols as the pair's count, so early merges (count 9) shrink the text fastest." },
        { type: "viz", name: "tokenizer-bpe", caption: "Step through real BPE merges on a small corpus and watch the vocabulary grow while the token count falls." },
      ],
    },
    {
      id: "code",
      title: "Code: train BPE and tokenize new words",
      blocks: [
        { type: "p", text: "This is a complete, minimal BPE trainer and tokenizer. It learns six merges from our corpus and then tokenizes three words that were *not* in the corpus." },
        { type: "code", lang: "python", title: "bpe_mini.py", code: `from collections import Counter

# Training corpus: word -> how often it appears. "_" marks the end of a word.
corpus = {"low": 5, "lower": 2, "newest": 6, "widest": 3}
words = {tuple(w) + ("_",): f for w, f in corpus.items()}

def pair_counts(words):
    pairs = Counter()
    for symbols, freq in words.items():
        for a, b in zip(symbols, symbols[1:]):
            pairs[(a, b)] += freq
    return pairs

def merge(words, pair):
    out = {}
    for symbols, freq in words.items():
        s, i = [], 0
        while i < len(symbols):
            if i < len(symbols) - 1 and (symbols[i], symbols[i + 1]) == pair:
                s.append(symbols[i] + symbols[i + 1]); i += 2
            else:
                s.append(symbols[i]); i += 1
        out[tuple(s)] = freq
    return out

# Training: repeatedly merge the most frequent adjacent pair
merges = []
for step in range(6):
    pairs = pair_counts(words)
    best = max(pairs, key=pairs.get)
    merges.append(best)
    words = merge(words, best)
    print(f"merge {step + 1}: {best[0]!r:6} + {best[1]!r:5} (seen {pairs[best]:2}x) -> {best[0] + best[1]!r}")

# Tokenizing NEW text: apply the learned merges in the same order
def tokenize(word):
    symbols = {tuple(word) + ("_",): 1}
    for pair in merges:
        symbols = merge(symbols, pair)
    return list(next(iter(symbols)))

for w in ["lowest", "newer", "wider"]:
    print(f"{w:7} -> {tokenize(w)}")`, output: `merge 1: 'e'    + 's'   (seen  9x) -> 'es'
merge 2: 'es'   + 't'   (seen  9x) -> 'est'
merge 3: 'est'  + '_'   (seen  9x) -> 'est_'
merge 4: 'l'    + 'o'   (seen  7x) -> 'lo'
merge 5: 'lo'   + 'w'   (seen  7x) -> 'low'
merge 6: 'n'    + 'e'   (seen  6x) -> 'ne'
lowest  -> ['low', 'est_']
newer   -> ['ne', 'w', 'e', 'r', '_']
wider   -> ['w', 'i', 'd', 'e', 'r', '_']`,
          walkthrough: [
            { lines: [3, 5], note: "The corpus as word counts. Each word becomes a tuple of characters plus the end marker `_`." },
            { lines: [7, 12], note: "Count every adjacent pair, multiplied by how often the word appears." },
            { lines: [14, 24], note: "Rewrite every word, gluing each occurrence of the chosen pair into one symbol." },
            { lines: [26, 33], note: "Training loop: find the most frequent pair, record it as a merge rule, apply it. Six merges here." },
            { lines: [35, 40], note: "Tokenizing new text: split into characters, then apply the saved merges in the same order they were learned." },
            { lines: [42, 43], note: "Three unseen words: lowest, newer, wider." },
          ] },
        { type: "p", text: "“lowest” was never in the corpus, yet it becomes just two tokens, `low` + `est_`, because both pieces were learned from other words. “newer” and “wider” share fewer learned pieces with only six merges, so they fall back to smaller units. With tens of thousands of merges, a real tokenizer would keep them in one or two tokens. Nothing ever becomes “unknown”: the worst case is single characters." },
      ],
    },
    {
      id: "tokenizing-new-text",
      title: "How BPE Tokenizes New Text",
      blocks: [
        { type: "p", text: "Once trained, the tokenizer is fixed. To encode any new text, it does the following." },
        { type: "flow", title: "Encoding text with a trained BPE tokenizer", nodes: [
          { label: "Pre-split", detail: "Split text into chunks, typically words with their leading space, numbers and punctuation, using a pattern. Merges never cross these chunk borders." },
          { label: "To bytes", detail: "In byte-level BPE each chunk becomes its UTF-8 bytes, so any character, emoji or script is representable." },
          { label: "Apply merges", detail: "Repeatedly apply the highest-priority (earliest learned) merge that is possible in the chunk, until no learned merge applies." },
          { label: "Look up IDs", detail: "Each resulting symbol is in the vocabulary by construction; replace it with its integer ID." },
          { label: "Model input", detail: "The list of IDs goes to the model's embedding layer. Decoding reverses the process: IDs → bytes → text." },
        ] },
        { type: "check", question: "With our six merges, how would BPE tokenize “slow”? Work it out before reading on.", answer: "Start from s l o w _. No merge involves `s l`, but `l o` → `lo` applies, then `lo w` → `low`. Result: `s` + `low` + `_` (3 tokens). The `est`-related merges do not apply because there is no `e s` pair." },
        { type: "callout", tone: "note", title: "Order matters", text: "Merges must be applied in the order they were learned. Applying them in a different order can produce different tokens than the model saw in training, and the model would then receive unfamiliar ID sequences." },
      ],
    },
    {
      id: "why-bpe-in-llms",
      title: "Why BPE is Used in Modern LLMs",
      blocks: [
        { type: "list", items: [
          "**No unknown tokens**: byte-level BPE can encode any string, including code, typos, rare names and emoji.",
          "**Efficient sequences**: common words and word pieces are single tokens, so a context window holds much more text than with characters.",
          "**Controllable vocabulary size**: we pick the number of merges to balance embedding-table size against sequence length.",
          "**Shared pieces**: suffixes and prefixes like `ing`, `est` and `un` are reused, helping the model generalise across related words.",
          "**Simple and fast**: training is counting and merging; encoding is deterministic and can be implemented very efficiently.",
        ] },
        { type: "table", caption: "Publicly documented vocabulary sizes", head: ["Model / tokenizer", "Method", "Vocabulary size"], rows: [
          ["GPT-2", "Byte-level BPE", "50,257"],
          ["GPT-3.5 / GPT-4 (cl100k_base)", "Byte-level BPE", "about 100,000"],
          ["GPT-4o (o200k_base)", "Byte-level BPE", "about 200,000"],
          ["Llama 2", "SentencePiece BPE", "32,000"],
          ["Llama 3", "Byte-level BPE (tiktoken-based)", "128,256"],
          ["BERT (base, uncased)", "WordPiece (a BPE relative)", "30,522"],
        ] },
        { type: "p", text: "Close relatives exist. **WordPiece** (used by BERT) picks merges that most increase the likelihood of the training data rather than raw frequency. **Unigram** tokenization (available in the SentencePiece library) starts with a big vocabulary and prunes it. All three are subword methods with the same goal." },
      ],
    },
    {
      id: "pitfalls",
      title: "Common mistakes and limits",
      blocks: [
        { type: "callout", tone: "warn", title: "Tokens are not words", text: "A common bug is estimating cost or context limits by counting words or characters. Always count with the model's own tokenizer. Different models use different tokenizers, so the same text can be a different number of tokens for each." },
        { type: "list", items: [
          "**Language fairness**: tokenizers trained mostly on English often split other languages, especially non-Latin scripts, into more tokens per word, which costs more and uses more context.",
          "**Numbers and arithmetic**: numbers can be split inconsistently (for example `1234` as `12` + `34` or `123` + `4`), which makes digit-level reasoning harder. Some tokenizers split digits individually or in fixed groups for this reason.",
          "**Spelling tasks**: the model sees `strawberry` as a few tokens, not letters, so counting letters is surprisingly hard for it.",
          "**Whitespace sensitivity**: “hello” and “ hello” are different tokens; trailing spaces in prompts can change outputs.",
          "**Tokenizer and model must match**: never feed IDs from one tokenizer into a model trained with another.",
          "**Glitch tokens**: rare strings that got their own token but almost never appeared in model training can trigger odd behaviour.",
        ] },
      ],
    },
  ],
  quiz: [
    { q: "What does each BPE training step do?", options: ["Splits the longest word in the corpus into two equal-length halves", "Removes the least frequent symbol from a large starting vocabulary list", "Merges the most frequent adjacent pair of symbols into a new symbol", "Assigns each whole word in the corpus a new random integer ID"], answer: 2, explain: "BPE grows the vocabulary bottom-up by merging the most frequent neighbouring pair. Pruning a big vocabulary is what Unigram tokenization does, not BPE." },
    { q: "Corpus counts: newest ×6, widest ×3. How many times does the pair `e s` occur?", options: ["6", "3", "2", "9"], answer: 3, explain: "Each word contains `e s` once, weighted by its count: 6 + 3 = 9. Answers 6 or 3 count only one of the words." },
    { q: "Our tokenizer turns an unseen product name into many single-character tokens and the model handles it poorly. What is the most likely reason?", options: ["Its letter pairs were rare in the tokenizer's corpus, so few merges apply", "BPE maps any word missing from its training corpus to one shared unknown token", "The temperature is too low for the model to pick rare character tokens", "The causal mask hides the rare characters from the attention layers"], answer: 0, explain: "BPE always encodes new words, but only merges learned from frequent pairs can apply. A name with unusual letter combinations falls back to small pieces. It does not become unknown, and temperature or masking are unrelated to tokenization." },
    { q: "Compared with word-level tokenization, what is the main advantage of BPE?", options: ["It produces fewer tokens than word-level tokenization on every possible sentence", "It avoids unknown words while keeping sequences far shorter than characters", "It needs no training data, because its merges are fixed in advance", "It gives every word exactly one token, so lengths are predictable"], answer: 1, explain: "BPE balances vocabulary size and sequence length, and byte-level BPE has no unknown words. It does not always produce fewer tokens than word-level (rare words split into several), it needs a corpus to learn merges, and it does not give every word one token." },
    { q: "A teammate estimates their prompt fits in a 4,000-token limit because it has 3,900 words. What is wrong?", options: ["Nothing; in English each word maps to exactly one token, so it fits", "Tokens are longer than words, so the prompt uses fewer tokens than words", "Only punctuation and numbers count as tokens, so it is far under the 4,000 limit", "English averages more than one token per word, so it probably exceeds 4,000"], answer: 3, explain: "In English, one token is roughly three quarters of a word, so 3,900 words is usually well over 4,000 tokens, and other languages can need even more. The exact number depends on the tokenizer, so measure it." },
  ],
  takeaways: [
    "Tokenization turns text into integer IDs from a fixed vocabulary; models, prices and limits all count tokens.",
    "Word-level has unknown words; character-level is too long; subword methods like BPE balance both.",
    "BPE training: start from characters or bytes and repeatedly merge the most frequent adjacent pair.",
    "BPE encoding: replay the learned merges in order; byte-level BPE can encode any text with no unknown token.",
    "Tokenizers vary by model and language, so always count tokens with the model's own tokenizer.",
  ],
  terms: [
    { term: "Token", def: "A unit of text (word, word piece, character or byte) that the model reads as one ID." },
    { term: "Vocabulary", def: "The fixed list of all tokens a tokenizer can produce, each with an integer ID." },
    { term: "Byte Pair Encoding (BPE)", def: "A subword method that builds a vocabulary by repeatedly merging the most frequent adjacent pair of symbols." },
    { term: "Merge rule", def: "One learned instruction to glue two adjacent symbols into a new symbol, applied in learned order." },
    { term: "Byte-level BPE", def: "BPE that starts from the 256 byte values, so any text can be encoded." },
    { term: "Out-of-vocabulary (OOV)", def: "A word a tokenizer cannot represent; byte-level BPE avoids this." },
  ],
};
