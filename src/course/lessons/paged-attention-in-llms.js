export default {
  id: "paged-attention-in-llms",
  minutes: 26,
  hook: "Why could an LLM server with plenty of free GPU memory still refuse new users, and how did borrowing an idea from 1960s operating systems fix it?",
  summary: "Early LLM servers reserved one big contiguous chunk of GPU memory per request for its KV cache, sized for the longest possible answer, and wasted most of it. PagedAttention splits each request's KV cache into small fixed-size blocks that can live anywhere in memory, tracked by a block table, just like virtual memory pages in an operating system. Waste drops to a fraction of one block per request, more requests fit in a batch, and blocks can even be shared between requests.",
  sections: [
    {
      id: "kv-cache-recap",
      title: "Quick recap: the KV cache",
      blocks: [
        { type: "p", text: "An LLM writes one token at a time. In each attention layer, every token has a **key** and a **value** vector, and every new token must attend to the keys and values of all earlier tokens. Instead of recomputing them, the server stores them in the **KV cache**. For a 7B/8B-class model with 32 layers, 32 KV heads of size 128 in FP16, each token's cache entry is 512 KiB." },
        { type: "p", text: "Two facts about the cache shape everything in this lesson. First, it **grows by one token per step**, and we do not know in advance how long a reply will be. Second, it is **large**, so how we lay it out in GPU memory decides how many users we can serve at once. More users per batch means higher throughput, because decode steps are memory-bound and share each read of the weights." },
        { type: "callout", tone: "analogy", title: "Think of it like a restaurant seating guests", text: "A host who must seat every party at one long table, and reserves the table for the largest party they might become, leaves many empty chairs. A host who can split a party across any free small tables, and keeps a note of which tables belong to which party, fills the room. PagedAttention is the second host." }
      ]
    },
    {
      id: "memory-waste",
      title: "The problem: memory waste in the KV cache",
      blocks: [
        { type: "p", text: "Before PagedAttention, most serving systems stored each request's KV cache in one **contiguous** region of memory, because attention kernels expected keys and values side by side. Since the final length is unknown, they reserved space for the **maximum** possible length, for example 2,048 tokens, when the request arrived. This causes three kinds of waste:" },
        { type: "list", items: [
          "**Reserved but not yet used:** slots set aside for tokens the request has not generated yet. They will be used eventually, but meanwhile no one else can use them.",
          "**Internal fragmentation:** slots that will *never* be used because the reply ended early. A request reserved 2,048 slots and finished at 300 tokens.",
          "**External fragmentation:** free memory left in small gaps between allocations, too small to hold a new request's large contiguous reservation."
        ] },
        { type: "p", text: "The vLLM team, who introduced PagedAttention (Kwon et al., SOSP 2023), measured that existing systems used only about 20–40% of KV cache memory for actual token states; the rest was lost to these three kinds of waste." },
        { type: "viz", name: "paged-attention", caption: "Watch requests grow and finish. Contiguous allocation leaves holes and over-reserved space; paged blocks pack memory tightly." },
        { type: "check", question: "If replies are usually short but the maximum length is long, which kind of waste dominates under contiguous allocation?", answer: "Internal fragmentation (plus reserved-but-unused space): every request reserves the maximum but finishes far below it, so most of its reservation is never touched." }
      ]
    },
    {
      id: "what-is-paged-attention",
      title: "What PagedAttention is",
      blocks: [
        { type: "p", text: "**PagedAttention** is a way of storing and reading the KV cache in fixed-size **blocks** (also called pages), for example 16 tokens per block, which is vLLM's default. A request's blocks do not need to be next to each other in memory. Each request has a **block table** that maps its *logical* blocks (block 0 holds tokens 0–15, block 1 holds tokens 16–31, and so on) to *physical* blocks anywhere in GPU memory." },
        { type: "p", text: "The name comes from **virtual memory paging** in operating systems. A program sees one continuous address space, but the OS stores it in fixed-size pages scattered across physical RAM and uses a page table to translate addresses. Here, tokens play the role of bytes, blocks play the role of pages and the block table plays the role of the page table." },
        { type: "table", caption: "The operating-system analogy", head: ["Operating system", "PagedAttention"], rows: [["Process", "Request (sequence)"], ["Virtual page", "Logical KV block"], ["Physical page frame", "Physical KV block in GPU memory"], ["Page table", "Block table"], ["Byte within a page", "Token slot within a block"], ["Copy-on-write pages after fork()", "Copy-on-write KV blocks shared between sequences"]] },
        { type: "p", text: "The attention computation is changed accordingly: a special **attention kernel** reads keys and values block by block, following the block table, instead of assuming one contiguous array. This is the “attention” part of the name." }
      ]
    },
    {
      id: "how-it-works",
      title: "How PagedAttention works",
      blocks: [
        { type: "steps", title: "Life of one request's KV cache", items: [
          { title: "Prefill allocates just enough", text: "A 40-token prompt needs ceil(40/16) = 3 blocks. The block manager takes any 3 free physical blocks, say 7, 2 and 9, and records them in the request's block table." },
          { title: "Fill the last block as tokens arrive", text: "Block 9 holds tokens 32–39 and has 8 empty slots. The next 8 generated tokens go there; no allocation needed." },
          { title: "Allocate on demand", text: "When token 48 arrives and the last block is full, the manager grabs one more free block, say 4, and appends it to the table." },
          { title: "Attend through the table", text: "Each decode step, the kernel walks the table (7 → 2 → 9 → 4), loads each block's keys and values and computes attention exactly as if they were contiguous." },
          { title: "Free on finish", text: "When the request ends, its blocks go back to the free list immediately and can serve any other request." }
        ] },
        { type: "flow", title: "Finding token 37's keys and values", nodes: [
          { label: "Token index 37", detail: "The kernel needs the key and value of the 38th token of this request (counting from 0)." },
          { label: "Logical block 2", detail: "37 ÷ 16 = 2 remainder 5, so it is in logical block 2 at offset 5." },
          { label: "Block table lookup", detail: "This request's table says logical block 2 → physical block 9." },
          { label: "Physical slot", detail: "Read slot 5 of physical block 9. The result is identical to a contiguous layout." }
        ] },
        { type: "code", lang: "python", title: "paged_vs_contiguous.py", code: `import numpy as np
rng = np.random.default_rng(7)
MAX_LEN, BLOCK = 2048, 16                 # max context, tokens per KV block
lengths = rng.integers(50, 900, size=8)   # actual final lengths of 8 requests

# Contiguous: reserve MAX_LEN slots per request up front.
reserved = MAX_LEN * len(lengths)
used = lengths.sum()
print("final lengths:", lengths.tolist())
print(f"contiguous: reserved {reserved} slots, used {used}, "
      f"wasted {100*(1-used/reserved):.1f}%")

# Paged: allocate one 16-token block at a time, only when needed.
blocks = np.ceil(lengths / BLOCK).astype(int)
paged = blocks.sum() * BLOCK
print(f"paged:      allocated {paged} slots, used {used}, "
      f"wasted {100*(1-used/paged):.1f}%  (only last-block slack)")

# Block table for request 0: logical block i -> some free physical block.
free = list(rng.permutation(400))
table = [int(free.pop()) for _ in range(blocks[0])]
print(f"request 0 needs {blocks[0]} blocks; first 6 table entries:", table[:6])
tok = 37                                    # where does token 37 live?
print(f"token {tok} -> logical block {tok//BLOCK}, offset {tok%BLOCK} "
      f"-> physical block {table[tok//BLOCK]}")`, output: `final lengths: [853, 581, 631, 812, 541, 709, 758, 241]
contiguous: reserved 16384 slots, used 5126, wasted 68.7%
paged:      allocated 5200 slots, used 5126, wasted 1.4%  (only last-block slack)
request 0 needs 54 blocks; first 6 table entries: [325, 153, 308, 215, 112, 294]
token 37 -> logical block 2, offset 5 -> physical block 308`, walkthrough: [
          { lines: [1, 4], note: "Eight requests whose real final lengths vary between 50 and 900 tokens, with a maximum context of 2,048." },
          { lines: [6, 11], note: "Contiguous allocation reserves the maximum for each request, so most slots are never used." },
          { lines: [13, 17], note: "Paged allocation rounds each request up to whole 16-token blocks. Waste is at most 15 slots per request." },
          { lines: [19, 25], note: "Build a block table from scattered free blocks and translate token 37 to its physical location." }
        ] },
        { type: "p", text: "The physical block numbers are scattered (325, 153, 308, …) and that is fine: the table hides the scattering. Contiguous allocation wasted 68.7% of reserved slots in this run, while paging wasted 1.4%." }
      ]
    },
    {
      id: "why-effective",
      title: "Why PagedAttention is so effective",
      blocks: [
        { type: "chart", kind: "bar", title: "KV cache slots in our simulation of 8 requests", yLabel: "Token slots", labels: ["Contiguous (reserve max)", "Paged (16-token blocks)"], series: [{ name: "Used", values: [5126, 5126] }, { name: "Wasted", values: [11258, 74] }], caption: "From the script above. The used slots are identical; only the waste differs." },
        { type: "list", items: [
          "**Almost no internal fragmentation:** a request wastes at most one partly filled block (under 16 slots), no matter how long or short it turns out.",
          "**No external fragmentation:** all blocks are the same size, so any free block fits any request.",
          "**No over-reservation:** memory is claimed only as tokens are actually generated.",
          "**Bigger batches:** the memory saved holds more concurrent requests, and because decode is memory-bound, more requests per step means more tokens per second. The vLLM paper reported 2–4× higher throughput than the prior systems it compared against at similar latency."
        ] },
        { type: "callout", tone: "note", title: "The cost", text: "Reading through a block table adds some indirection, so the paged attention kernel is somewhat more complex than a contiguous one. Block size is a trade-off: smaller blocks waste less but mean more table entries and less efficient memory reads; 16 tokens is a common default." },
        { type: "compare", title: "Contiguous vs paged KV cache", options: [
          { name: "Contiguous per request", summary: "One big reserved region per request.", pros: ["Simple indexing", "Standard attention kernels work as-is"], cons: ["Must guess or reserve max length", "Heavy internal and external fragmentation", "Fewer requests fit, lower throughput"], bestFor: "Single-user or fixed-length offline jobs" },
          { name: "Paged (PagedAttention)", summary: "Small fixed blocks anywhere, mapped by a block table.", pros: ["Waste under one block per request", "Allocate on demand, free instantly", "Enables block sharing between requests"], cons: ["Needs a custom attention kernel", "Block table bookkeeping"], bestFor: "Multi-user serving with unpredictable lengths" }
        ], rows: [["Waste per request", "Up to (max − actual) tokens", "Under 1 block"], ["Sharing between requests", "Hard", "Natural (shared blocks + ref counts)"]], verdict: "For any multi-user LLM server, paged KV memory is the standard choice today." }
      ]
    },
    {
      id: "memory-sharing",
      title: "Memory sharing across requests",
      blocks: [
        { type: "p", text: "Because a block table is just a list of block numbers, two sequences can point at the **same** physical block. Each block keeps a **reference count**: how many sequences use it. This enables sharing in several common situations:" },
        { type: "list", items: [
          "**Parallel sampling:** asking for 4 different completions of one prompt. All 4 share the prompt's blocks instead of storing 4 copies.",
          "**Beam search:** candidate beams share their common prefix blocks and only diverge at the end.",
          "**Shared prefixes:** many requests that begin with the same long system prompt can reuse its blocks (vLLM calls this automatic prefix caching)."
        ] },
        { type: "p", text: "What happens when one sequence wants to write into a shared block? It uses **copy-on-write**: if the block's reference count is above 1, the manager copies it to a fresh block, points this sequence's table at the copy, decrements the original's count, and only then writes. Full prompt blocks are never written again, so usually only the last partly filled block ever needs copying." },
        { type: "callout", tone: "example", title: "Our support chatbot", text: "Every conversation starts with the same 1,600-token system prompt (100 blocks of 16). With 50 active users, contiguous storage would hold 50 copies; with shared blocks it holds one, freeing room for many more conversations." },
        { type: "check", question: "Four samples share a prompt whose last block holds 10 of 16 tokens. Sample A generates its first token. What happens?", answer: "The last block has reference count 4, so A gets a private copy of that block (copy-on-write), writes its token into slot 10 of the copy, and the original's count drops to 3. The full earlier blocks remain shared." },
        { type: "callout", tone: "warn", title: "Common misconceptions", text: "PagedAttention does not compress the KV cache or change the model's outputs: it stores exactly the same numbers with less waste. It also does not by itself move the cache to CPU memory; that is a separate technique (offloading/swapping), though vLLM can swap blocks out under memory pressure. When memory runs out, the server still has to queue or preempt requests." }
      ]
    },
    {
      id: "block-size-worked-example",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "The lesson said block size is a trade-off. Let us put numbers on it. Take one request that ends at 600 tokens and try four block sizes. For each we count the blocks, which is also the number of block table entries, and the empty slots left in the last block." },
        { type: "steps", title: "One 600-token request, four block sizes", items: [
          { title: "Block size 1", text: "600 blocks and 0 wasted slots. No waste at all, but the table has 600 entries and the kernel must follow a pointer for every single token." },
          { title: "Block size 16", text: "ceil(600 ÷ 16) = 38 blocks = 608 slots. 8 slots are empty. The table has 38 entries." },
          { title: "Block size 64", text: "ceil(600 ÷ 64) = 10 blocks = 640 slots. 40 slots are empty." },
          { title: "Block size 256", text: "ceil(600 ÷ 256) = 3 blocks = 768 slots. 168 slots are empty, which is 22% of what we allocated." },
          { title: "Turn slots into bytes", text: "At 512 KiB per token, 8 empty slots cost 4 MiB and 168 empty slots cost 84 MiB. That is per request, so 100 requests with 256-token blocks could waste several GiB." }
        ] },
        { type: "table", caption: "A 600-token request under different block sizes (computed)", head: ["Block size", "Blocks (table entries)", "Slots allocated", "Empty slots", "Worst case empty"], rows: [
          ["1", "600", "600", "0", "0"],
          ["16", "38", "608", "8", "15"],
          ["64", "10", "640", "40", "63"],
          ["256", "3", "768", "168", "255"]
        ] },
        { type: "p", text: "The worst case is always one slot short of a full block, and on average a request wastes about half a block. So waste grows with block size, while table length and pointer-chasing shrink. A middle value keeps both small." },
        { type: "p", text: "Paging also changes **how a server fails**. With contiguous reservation, a request is refused at the door if its full reservation does not fit. With paging, a request is admitted as soon as its prompt fits, and memory can run out later, in the middle of generation, when many requests ask for their next block at once. That is why a paged server still needs a policy for that moment: make new requests wait, or pause a running one and give its blocks to the others." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "We will build the block manager from the memory sharing section in about 35 lines: a free list, a reference count per block, on-demand allocation and copy-on-write. Blocks hold only 4 tokens so that we can follow every move by eye. Two samples, A and B, share one 6-token prompt." },
        { type: "code", lang: "python", title: "practice_block_manager.py", code: `# A tiny paged KV block manager with reference counts and copy-on-write.
BLOCK = 4                        # tokens per block (tiny, so we can see it)
free = list(range(8))            # 8 physical blocks: 0..7
refs = {}                        # physical block -> how many sequences use it
fill = {}                        # physical block -> token slots already written

def alloc():
    b = free.pop(0)
    refs[b], fill[b] = 1, 0
    return b

def append_token(table):         # table = one sequence's list of physical blocks
    if not table or fill[table[-1]] == BLOCK:    # last block full: take a new one
        table.append(alloc())
    elif refs[table[-1]] > 1:                    # last block shared: copy-on-write
        old, new = table[-1], alloc()
        fill[new] = fill[old]                    # copy the slots written so far
        refs[old] -= 1
        table[-1] = new
    fill[table[-1]] += 1

def fork(table):                 # a second sequence shares every block
    for b in table:
        refs[b] += 1
    return list(table)

a = []
for _ in range(6):               # a 6-token prompt needs 2 blocks
    append_token(a)
b = fork(a)
print("after fork:", "A", a, "B", b, "refs", refs)
append_token(a)                  # A writes into a shared block
print("A writes  :", "A", a, "B", b, "refs", refs)
append_token(b)                  # B is now the only owner of block 1
print("B writes  :", "A", a, "B", b, "refs", refs)
print("blocks in use:", len(refs), "| with two full copies:", 4)`, output: `after fork: A [0, 1] B [0, 1] refs {0: 2, 1: 2}
A writes  : A [0, 2] B [0, 1] refs {0: 2, 1: 1, 2: 1}
B writes  : A [0, 2] B [0, 1] refs {0: 2, 1: 1, 2: 1}
blocks in use: 3 | with two full copies: 4`, walkthrough: [
          { lines: [1, 10], note: "The state: a free list of 8 physical blocks, a reference count for each block in use, and how many slots of each block are written." },
          { lines: [12, 20], note: "Appending one token. A full last block means we take a new block. A shared last block means we copy it first, then write into our private copy." },
          { lines: [22, 25], note: "Forking copies only the block table and raises each block's reference count. No keys or values are copied." },
          { lines: [27, 36], note: "Fill a 6-token prompt, fork it, then let each sample write one token and print the tables and counts." }
        ] },
        { type: "p", text: "After the fork both tables are `[0, 1]`. A's write copies block 1 into block 2. B's write copies nothing. Three blocks hold what two full copies would store in four. Now change it:" },
        { type: "list", items: [
          "Make the prompt 8 tokens long (`range(8)`), so its last block is full. Predict whether A's first write causes a copy, and which block A gets.",
          "Add a third sample with `c = fork(a)` right after `b = fork(a)`, and let C write last. Predict the reference counts after all three writes, and how many copies happen in total.",
          "Write a `release(table)` function that lowers each block's count and puts blocks that reach zero back on `free`. Release A at the end. Predict which blocks become free and which do not."
        ] },
        { type: "check", question: "In the practice run, block 1 was shared when A wrote, so A had to copy it. A moment later B wrote into block 1 with no copy. Why?", answer: "Copy-on-write depends on the reference count at the time of the write. When A moved to its private copy, block 1's count dropped from 2 to 1. B was then its only owner, so writing into it could not disturb anyone else." },
        { type: "check", question: "Fifty chats share the 100 blocks of one system prompt. One chat ends. How many of those 100 blocks return to the free list?", answer: "None. Each shared block's reference count drops from 50 to 49, and a block is freed only when its count reaches zero. Only the blocks that belonged to that chat alone are freed." }
      ]
    }
  ],
  quiz: [
    { q: "What does the block table in PagedAttention do?", options: ["Maps a request's logical KV blocks to physical blocks anywhere in GPU memory", "Stores the model weights in fixed-size blocks so they load faster", "Decides which tokens' blocks to evict when GPU memory runs low", "Compresses the keys and values in each block to fewer bits"], answer: 0, explain: "Like an OS page table, it translates logical positions to scattered physical blocks. It does not evict or compress anything." },
    { q: "With 16-token blocks, a request has 100 tokens. How many blocks does it use, and how many slots are wasted?", options: ["6 blocks, 4 slots wasted", "7 blocks, 12 slots wasted", "7 blocks, 0 slots wasted", "100 blocks, 0 slots wasted"], answer: 1, explain: "ceil(100/16) = 7 blocks = 112 slots, so 12 slots in the last block are empty." },
    { q: "Our server reserves 4,096 tokens of KV cache per request, but most replies are under 300 tokens and it can only batch a few users. What change helps most?", options: ["Raise the per-request reservation to 8,192 tokens to be safe", "Switch to paged KV memory that allocates small blocks on demand", "Disable the KV cache so no memory has to be reserved at all", "Reduce the vocabulary size to cut the memory that each token needs"], answer: 1, explain: "The waste is internal fragmentation from over-reservation. Paging allocates only what is used, so far more requests fit." },
    { q: "Which statement correctly contrasts contiguous allocation with PagedAttention?", options: ["Contiguous allocation can share prompt memory between requests more easily", "PagedAttention changes the attention math, so outputs differ slightly from contiguous", "Equal-size blocks avoid external fragmentation; contiguous allocation can leave unusable gaps", "Both waste about the same memory; paging only changes how it is tracked"], answer: 2, explain: "Fixed-size blocks mean any free block fits anywhere. Outputs are identical, and sharing is easier with paging, not harder." },
    { q: "A teammate says: “PagedAttention is a KV cache compression method, so it slightly lowers answer quality.” What is the correct reply?", options: ["True, it quantizes each block to 8 bits, costing a little accuracy", "True, it evicts the oldest blocks whenever GPU memory runs low, losing some context", "False, it moves the cache from GPU to disk, which affects only speed", "False, it changes only where the same numbers are stored; outputs are unchanged"], answer: 3, explain: "Paging removes allocation waste without altering any values. Compression methods like quantization or eviction are separate and can be combined with it." }
  ],
  takeaways: [
    "Contiguous, max-length KV reservations waste most cache memory through over-reservation and fragmentation.",
    "PagedAttention stores the KV cache in fixed-size blocks mapped by a per-request block table, like OS virtual memory.",
    "Waste drops to under one block per request, so many more requests fit and throughput rises.",
    "Blocks can be shared via reference counts and copy-on-write for parallel sampling, beam search and common prefixes.",
    "Paging is exact: it changes memory layout, not the model's outputs."
  ],
  terms: [
    { term: "PagedAttention", def: "Storing and reading the KV cache in fixed-size non-contiguous blocks mapped by a block table." },
    { term: "Block (page)", def: "A fixed-size chunk of KV cache memory holding a set number of tokens, e.g. 16." },
    { term: "Block table", def: "Per-request list mapping logical block numbers to physical block locations." },
    { term: "Internal fragmentation", def: "Memory reserved for a request that it never uses." },
    { term: "External fragmentation", def: "Free memory split into gaps too small to satisfy a new allocation." },
    { term: "Copy-on-write", def: "Sharing a block until someone writes to it, then giving the writer a private copy." },
    { term: "Reference count", def: "The number of sequences currently pointing to a shared block." }
  ]
};
