export default {
  id: 'grouped-query-attention',
  minutes: 25,
  hook: 'Why does a 70B model\'s memory for one long chat shrink from about 10 GB to about 1.25 GB just by letting attention heads share notes?',
  summary: 'During generation an LLM stores the keys and values of every past token (the KV cache), and with standard multi-head attention that cache becomes the main memory and speed bottleneck. Multi-Query Attention shares one key-value head across all query heads, which is fast but can hurt quality. Grouped-Query Attention sits in between: query heads are split into groups and each group shares one key-value head, keeping almost all the quality at a fraction of the memory.',
  sections: [
    {
      id: 'big-picture',
      title: 'The big picture',
      blocks: [
        { type: 'p', text: 'When an LLM writes an answer, it produces one token at a time. To avoid recomputing everything for every new token, it keeps the **keys** and **values** of all previous tokens in GPU memory. This store is the **KV cache**. For long chats and many simultaneous users, the KV cache, not the model weights, is often what fills the GPU and limits speed.' },
        { type: 'p', text: '**Grouped-Query Attention (GQA)** is a small change to attention that shrinks the KV cache several times over with very little quality loss. It is used in Llama 2 70B, the Llama 3 family, Mistral 7B, Qwen and many other open models, so understanding it helps us read any model config.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like study groups', text: 'Eight students (query heads) each keep their own full set of lecture notes (key-value heads): lots of paper. Multi-query: the whole class shares one notebook, cheap but everyone must agree on what to write. Grouped-query: four students per study group, two notebooks in total. Each group still has notes suited to it, and the class carries a quarter of the paper.' },
      ],
    },
    {
      id: 'mha-recap',
      title: 'Quick recap: Multi-Head Attention (MHA)',
      blocks: [
        { type: 'p', text: 'In attention, each token creates a **query** (what it looks for), a **key** (what it offers to be matched on) and a **value** (what it passes along). Scores are `softmax(QKᵀ / √dₖ)` and the output is those weights times `V`.' },
        { type: 'p', text: '**Multi-Head Attention (MHA)**, from the original Transformer, runs several attention operations side by side. With `H` heads, each head has its own Q, K and V projections of size `d_head = d_model / H`. One head may track the previous word, another the subject of the sentence. Their outputs are concatenated and projected back.' },
        { type: 'viz', name: 'multi-head', caption: 'Switch between heads to see that each head learns a different attention pattern.' },
      ],
    },
    {
      id: 'problem-with-mha',
      title: 'The problem with Multi-Head Attention',
      blocks: [
        { type: 'p', text: 'In MHA every head has its **own** keys and values, so the KV cache stores `H` key vectors and `H` value vectors per token, per layer. The size per token is:' },
        { type: 'formula', expr: 'KV bytes per token = 2 × layers × n_kv_heads × d_head × bytes_per_number', where: [ ['2', 'one key and one value'], ['layers', 'number of Transformer layers'], ['n_kv_heads', 'number of key-value heads (equals H in MHA)'], ['d_head', 'size of each head vector'], ['bytes_per_number', '2 for FP16/BF16'] ] },
        { type: 'p', text: 'Plug in a 70B-class shape: 80 layers, 64 heads, d_head = 128, FP16. That is `2 × 80 × 64 × 128 × 2 = 2,621,440 bytes`, about **2.5 MiB per token**. A 4,096-token chat needs about 10 GiB of cache, and 32 users at once would need about 320 GiB, on top of 140 GB of weights.' },
        { type: 'p', text: 'Memory is only half the story. Generating each new token requires reading the whole KV cache from GPU memory. During decoding the GPU does little math per byte loaded, so it is **memory-bandwidth bound**: time is spent waiting on memory, not computing. A bigger cache means slower tokens.' },
        { type: 'viz', name: 'kv-cache', caption: 'Step through decoding: keys and values pile up for every token; use the calculator to see the cache grow with layers, heads and context.' },
      ],
    },
    {
      id: 'mqa',
      title: 'What is Multi-Query Attention (MQA)?',
      blocks: [
        { type: 'p', text: '**Multi-Query Attention** (Shazeer, 2019) keeps all `H` query heads but uses **a single key head and a single value head** shared by every query head. The KV cache shrinks by a factor of `H`: 64 times smaller in our example.' },
        { type: 'p', text: 'The catch: all query heads must now match against the same keys and read the same values. The model loses some ability to attend to different kinds of information in different heads. In practice MQA often shows a measurable quality drop and can be less stable to train. PaLM and the original Falcon models used MQA.' },
      ],
    },
    {
      id: 'what-is-gqa',
      title: 'What is Grouped-Query Attention (GQA)?',
      blocks: [
        { type: 'p', text: 'GQA was introduced by Ainslie et al. (2023). We pick a number of key-value heads `G` between 1 and `H`. The `H` query heads are split into `G` equal **groups**, and all query heads in a group share one key head and one value head. With 64 query heads and 8 KV heads, each group has 8 query heads.' },
        { type: 'p', text: 'The KV cache shrinks by `H / G` (8× in the example) while each group still has its own keys and values, so the model keeps most of the diversity of MHA. The paper reported quality close to MHA with speed close to MQA.' },
        { type: 'viz', name: 'gqa', caption: 'Toggle MHA, GQA and MQA: watch query heads share key-value heads and the KV-cache bar shrink.' },
      ],
    },
    {
      id: 'how-gqa-works',
      title: 'How Grouped-Query Attention works',
      blocks: [
        { type: 'steps', title: 'GQA for one layer, with 8 query heads and 2 KV heads', items: [
          { title: 'Project', text: 'Each token is projected into 8 query heads but only 2 key heads and 2 value heads. The K and V projection matrices are 4× smaller than in MHA.' },
          { title: 'Cache', text: 'Only the 2 key heads and 2 value heads are written into the KV cache for this token.' },
          { title: 'Assign groups', text: 'Query heads 0–3 form group 0 and use KV head 0; query heads 4–7 form group 1 and use KV head 1. In code, query head h uses KV head `h // (H / G)`.' },
          { title: 'Attend', text: 'Each query head runs ordinary scaled dot-product attention against its group\'s keys and values. Implementations often "repeat" the KV heads in memory views so standard kernels can be reused.' },
          { title: 'Combine', text: 'The 8 head outputs are concatenated and projected exactly as in MHA. Nothing downstream changes.' },
        ] },
        { type: 'code', lang: 'python', title: 'gqa_demo.py', code: `import numpy as np
np.random.seed(0)

def attention(q, k, v):                       # q,k,v: (seq, head_dim)
    s = q @ k.T / np.sqrt(q.shape[-1])
    w = np.exp(s - s.max(-1, keepdims=True)); w /= w.sum(-1, keepdims=True)
    return w @ v

seq, n_q_heads, head_dim = 5, 8, 4
Q = np.random.randn(n_q_heads, seq, head_dim)
for n_kv in [8, 2, 1]:                        # MHA, GQA-2, MQA
    K = np.random.randn(n_kv, seq, head_dim)  # only n_kv key/value heads exist
    V = np.random.randn(n_kv, seq, head_dim)
    group = n_q_heads // n_kv                 # query heads per KV head
    out = np.stack([attention(Q[h], K[h // group], V[h // group])
                    for h in range(n_q_heads)])
    print(f"kv_heads={n_kv}: group size={group}, output shape={out.shape}")

# KV cache for a 70B-class config: 80 layers, 64 query heads, head_dim 128, fp16
layers, hd, bytes_ = 80, 128, 2
for name, n_kv in [("MHA", 64), ("GQA-8", 8), ("MQA", 1)]:
    per_token = 2 * layers * n_kv * hd * bytes_   # 2 = keys + values
    print(f"{name:6s} KV/token={per_token/1024:7.0f} KiB  "
          f"for 4096 tokens={per_token*4096/2**30:6.2f} GiB")

# Uptraining step 1: mean-pool 8 MHA key heads into 2 GQA key heads
K_mha = np.random.randn(8, seq, head_dim)
K_gqa = K_mha.reshape(2, 4, seq, head_dim).mean(axis=1)
print("pooled key heads:", K_mha.shape, "->", K_gqa.shape)`, output: `kv_heads=8: group size=1, output shape=(8, 5, 4)
kv_heads=2: group size=4, output shape=(8, 5, 4)
kv_heads=1: group size=8, output shape=(8, 5, 4)
MHA    KV/token=   2560 KiB  for 4096 tokens= 10.00 GiB
GQA-8  KV/token=    320 KiB  for 4096 tokens=  1.25 GiB
MQA    KV/token=     40 KiB  for 4096 tokens=  0.16 GiB
pooled key heads: (8, 5, 4) -> (2, 5, 4)`,
          walkthrough: [
            { lines: [4, 7], note: 'Plain scaled dot-product attention for one head.' },
            { lines: [9, 17], note: 'The same 8 query heads with 8, 2 or 1 KV heads. Query head h reads KV head h // group. The output shape never changes: GQA is a drop-in replacement.' },
            { lines: [19, 24], note: 'KV cache per token and for a 4,096-token chat. GQA-8 is 8× smaller than MHA; MQA is 64× smaller.' },
            { lines: [26, 29], note: 'The first step of uptraining: average each group of original key heads into one shared head (same for values).' },
          ] },
        { type: 'check', question: 'A model has 32 query heads and 8 KV heads. How many query heads share each KV head, and how much smaller is its KV cache than the same model with MHA?', answer: '32 / 8 = 4 query heads per KV head. The cache stores 8 KV heads instead of 32, so it is 4× smaller. (This is Mistral 7B\'s and Llama 3 8B\'s setup.)' },
      ],
    },
    {
      id: 'generalization',
      title: 'GQA is a generalization of MHA and MQA',
      blocks: [
        { type: 'p', text: 'GQA is a dial, not a separate invention. With `G = H` (one KV head per query head) it **is** MHA. With `G = 1` (one KV head for all) it **is** MQA. Everything in between trades memory for quality. Model designers commonly pick `G = 8`, which also maps neatly onto 8 GPUs when a model is split across them (tensor parallelism), since each GPU can then hold whole KV heads.' },
        { type: 'chart', kind: 'bar', title: 'KV cache for a 4,096-token chat, 70B-class shape (80 layers, 64 query heads, d_head 128, FP16)', yLabel: 'GiB', unit: ' GiB', labels: ['MHA (64 KV)', 'GQA (16 KV)', 'GQA (8 KV)', 'GQA (4 KV)', 'MQA (1 KV)'], series: [ { name: 'KV cache', values: [10, 2.5, 1.25, 0.63, 0.16] } ], caption: 'Computed with the formula above; real models may differ in layers and head sizes.' },
      ],
    },
    {
      id: 'gqa-vs-mha-vs-mqa',
      title: 'GQA vs MHA vs MQA',
      blocks: [
        { type: 'compare', title: 'Three ways to share keys and values', options: [
          { name: 'MHA', summary: 'Every query head has its own K and V head.', pros: ['Highest expressiveness', 'The original, well understood'], cons: ['Largest KV cache', 'Slowest decoding at long context'], bestFor: 'Small models or short contexts where memory is not the bottleneck' },
          { name: 'GQA', summary: 'Groups of query heads share one K and V head.', pros: ['Quality close to MHA', 'KV cache H/G times smaller', 'Tunable'], cons: ['Slight quality loss vs MHA', 'One more hyperparameter'], bestFor: 'Most modern LLMs, especially large ones served at scale' },
          { name: 'MQA', summary: 'All query heads share a single K and V head.', pros: ['Smallest KV cache', 'Fastest decoding'], cons: ['Noticeable quality drop', 'Can be less stable to train'], bestFor: 'Extreme memory or latency limits' },
        ], rows: [
          ['KV heads', 'H', 'G (1 < G < H)', '1'],
          ['Cache size vs MHA', '1×', 'G/H', '1/H'],
          ['Quality', 'Best', 'Near MHA', 'Lower'],
        ], verdict: 'GQA became the default because it captures most of MQA\'s speed for little of its quality cost.' },
        { type: 'callout', tone: 'note', title: 'What GQA does not change', text: 'GQA does not reduce the number of attention scores (still every query against every key), so it does not fix the n² cost of the prefill phase. It reduces how many keys and values are stored and read. Other techniques in this module (sliding windows, Flash Attention, compressed attention) attack the other costs.' },
      ],
    },
    {
      id: 'real-world-and-terminology',
      title: 'Real-world use and a note on terminology',
      blocks: [
        { type: 'table', caption: 'Published attention configurations of some well-known open models', head: ['Model', 'Query heads', 'KV heads', 'Type'], rows: [
          ['Llama 2 70B', '64', '8', 'GQA'],
          ['Llama 3 8B', '32', '8', 'GQA'],
          ['Mistral 7B', '32', '8', 'GQA'],
          ['Falcon 7B', '71', '1', 'MQA'],
        ] },
        { type: 'callout', tone: 'example', title: 'Reading a config file', text: 'In Hugging Face model configs, look for `num_attention_heads` (query heads) and `num_key_value_heads`. If they are equal, the model uses MHA; if `num_key_value_heads` is 1, MQA; anything in between is GQA.' },
        { type: 'p', text: '**Terminology:** people write "GQA-8" to mean 8 KV heads (8 groups), not 8 query heads per group. "KV heads", "key-value groups" and "number of groups" usually all mean `G`. Some later designs, such as DeepSeek\'s **Multi-head Latent Attention (MLA)**, shrink the cache differently, by compressing keys and values into a small latent vector; that is a different technique, not a GQA setting.' },
      ],
    },
    {
      id: 'uptraining',
      title: 'Uptraining: converting MHA to GQA',
      blocks: [
        { type: 'p', text: 'Training a big model from scratch is very expensive. The GQA paper showed we can convert an existing MHA checkpoint instead, a process called **uptraining**:' },
        { type: 'list', ordered: true, items: [
          '**Mean-pool the heads.** For each group, average the original key projection matrices of its heads into one key projection, and the same for values. Query projections are kept as they are.',
          '**Continue pre-training briefly.** Train the converted model on the original data for a small fraction of the original compute (the paper used about 5%) so it adapts to the shared heads.',
        ] },
        { type: 'p', text: 'The paper found mean-pooling worked better than picking one head or random initialization, because it preserves information from all original heads.' },
        { type: 'callout', tone: 'warn', title: 'Common mistake', text: 'Mean-pooling heads without any further training gives a noticeably worse model. The short uptraining phase is not optional. Also, choosing too few KV heads (approaching MQA) to save memory can quietly cost quality on long-context tasks, so evaluate before shipping.' },
      ],
    },
    {
      id: 'parameter-and-memory-math',
      title: 'Going one level deeper',
      blocks: [
        { type: 'p', text: "GQA changes the shape of two weight matrices and nothing else. Let us count with a small layer: `d_model = 512` and 8 query heads, so `d_head = 64`. We ignore bias terms." },
        { type: 'table', caption: "Attention weights in one layer (d_model 512, 8 query heads, d_head 64)", head: ['Matrix', 'MHA (8 KV heads)', 'GQA (2 KV heads)', 'MQA (1 KV head)'], rows: [
          ['Query projection', '512 × 512 = 262,144', '262,144', '262,144'],
          ['Key projection', '512 × 512 = 262,144', '512 × 128 = 65,536', '512 × 64 = 32,768'],
          ['Value projection', '512 × 512 = 262,144', '512 × 128 = 65,536', '512 × 64 = 32,768'],
          ['Output projection', '262,144', '262,144', '262,144'],
          ['Total', '1,048,576', '655,360', '589,824'],
        ] },
        { type: 'p', text: "We can read the table in two ways. First, weights: GQA with 2 KV heads removes 393,216 of 1,048,576 attention weights in this layer, about 37%. Second, cache: each token now stores 2 key vectors and 2 value vectors instead of 8 of each, a 4× cut. The weight saving happens once. The cache saving repeats for every token of every chat, which is why it matters far more when serving." },
        { type: 'list', items: [
          "**H must divide evenly by G.** 8 query heads with 3 KV heads cannot form equal groups, so the head mapping breaks.",
          "**Query heads in a group are not copies.** They share keys and values, but each keeps its own query projection, so each can focus on different tokens.",
          "**Use KV heads in the cache formula.** Plugging the number of query heads into the formula for a GQA model overstates the cache by a factor of H / G.",
        ] },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: "We will do two small things by hand. First we print which KV head each query head reads for different group counts. Then we turn the cache formula into a serving question: how many chats fit into a fixed amount of GPU memory?" },
        { type: 'code', lang: 'python', title: 'practice_gqa_budget.py', code: `# Part 1: which KV head does each query head read?
H = 8                                    # query heads
for G in [8, 4, 2, 1]:                   # KV heads: MHA, GQA-4, GQA-2, MQA
    group = H // G                       # query heads per KV head
    mapping = [h // group for h in range(H)]
    print(f"G={G}: query head -> KV head {mapping}")

# Part 2: how many chats fit in a fixed cache budget?
# Illustrative small model: 24 layers, 16 query heads, d_head 64, FP16
layers, d_head, nbytes = 24, 64, 2
budget_gib, chat_tokens = 8, 4096        # memory left for caches, tokens per chat
for G in [16, 4, 1]:
    per_token = 2 * layers * G * d_head * nbytes       # keys + values, in bytes
    per_chat_gib = per_token * chat_tokens / 2**30
    chats = int(budget_gib / per_chat_gib)
    print(f"G={G:>2}: {per_token / 1024:4.0f} KiB/token, {per_chat_gib:.3f} GiB/chat, "
          f"{chats:>3} chats fit in {budget_gib} GiB")`, output: `G=8: query head -> KV head [0, 1, 2, 3, 4, 5, 6, 7]
G=4: query head -> KV head [0, 0, 1, 1, 2, 2, 3, 3]
G=2: query head -> KV head [0, 0, 0, 0, 1, 1, 1, 1]
G=1: query head -> KV head [0, 0, 0, 0, 0, 0, 0, 0]
G=16:   96 KiB/token, 0.375 GiB/chat,  21 chats fit in 8 GiB
G= 4:   24 KiB/token, 0.094 GiB/chat,  85 chats fit in 8 GiB
G= 1:    6 KiB/token, 0.023 GiB/chat, 341 chats fit in 8 GiB`,
          walkthrough: [
            { lines: [1, 6], note: "The whole of GQA's bookkeeping is one integer division. With 8 query heads and G KV heads, query head h reads KV head h // (8 // G)." },
            { lines: [8, 11], note: "An illustrative small model and a serving budget: 8 GiB of GPU memory left for KV caches, and chats of 4,096 tokens." },
            { lines: [12, 17], note: "Apply the cache formula for 16, 4 and 1 KV heads. Going from 16 to 4 KV heads lets 85 chats fit instead of 21, on the same hardware." },
          ] },
        { type: 'p', text: "Now change it:" },
        { type: 'list', items: [
          "Set `H = 12` and loop over `[12, 6, 4, 3, 1]`. Predict the mapping for `G = 4` before running. Then add `5` to the list and explain the odd result.",
          "Double `chat_tokens` to `8192`. Predict the new number of chats for each G without running the code.",
          "Set `nbytes = 1`, as if the cache were stored in 8 bits (illustrative). Predict which gives more chats: halving the bytes, or going from 16 to 4 KV heads.",
        ] },
        { type: 'check', question: "With H = 8 and G = 2, query heads 0 to 3 read the same keys and values. Will they produce the same attention pattern?", answer: "No. Each query head still has its own query projection, so each asks a different question of the same keys and gets different scores. What they share is what can be matched and what is handed over, not what they look for. That is why GQA loses little quality." },
        { type: 'check', question: "In the small layer of the table, GQA with 2 KV heads removes about 37% of the attention weights and cuts the KV cache 4 times. Which saving matters more for serving long chats, and why?", answer: "The cache saving. Weights are stored once, no matter how many users or tokens there are. The cache is paid again for every token of every active chat, so a 4× cut there multiplies across the whole load, as the 21 versus 85 chats in the script show." },
      ],
    },
    {
      id: 'quick-summary',
      title: 'Quick summary',
      blocks: [
        { type: 'list', items: [
          'The KV cache stores keys and values for every past token; with MHA it grows with every head and quickly dominates memory.',
          'MQA shares one KV head across all query heads: tiny cache, some quality loss.',
          'GQA shares one KV head per group of query heads: cache shrinks by H/G with quality close to MHA.',
          'MHA and MQA are the two extremes of GQA (G = H and G = 1).',
          'Existing MHA models can be uptrained to GQA by mean-pooling heads and training briefly.',
        ] },
      ],
    },
  ],
  quiz: [
    { q: 'What does Grouped-Query Attention share between query heads?', options: ['The query projection matrices of all heads', 'One key head and one value head per group', 'The softmax weights computed by the first head', 'The feed-forward network that follows attention'], answer: 1, explain: 'In GQA each group of query heads uses one shared key head and one shared value head. Queries stay separate per head.' },
    { q: 'A model with 80 layers, 8 KV heads, d_head = 128 in FP16 uses how much KV cache per token?', options: ['40 KiB', '2,560 KiB', '160 KiB', '320 KiB'], answer: 3, explain: '2 × 80 × 8 × 128 × 2 bytes = 327,680 bytes = 320 KiB. 2,560 KiB would be MHA with 64 KV heads.' },
    { q: 'Decoding is slow and the GPU runs out of memory when many users have long chats. Quality must stay close to today\'s MHA model. What is the most sensible change?', options: ['Uptrain the checkpoint to GQA with about 8 KV heads', 'Switch to MQA with one KV head for the whole layer', 'Add more query heads so each head does less work', 'Drop the KV cache and recompute all keys every step'], answer: 0, explain: 'GQA cuts the cache several times with little quality loss. MQA saves more memory but risks the quality requirement; removing the cache makes decoding much slower.' },
    { q: 'Which is true about how MHA, GQA and MQA relate?', options: ['GQA with a single KV head is exactly MHA', 'MQA keeps more KV heads than any GQA setting', 'GQA with G = H is MHA; with G = 1 it is MQA', 'They differ mainly in how the softmax is computed'], answer: 2, explain: 'GQA is the general case: one KV head per query head gives MHA, one KV head for all gives MQA. The softmax is identical.' },
    { q: 'A teammate says "GQA makes attention scoring cheaper, so it fixes the quadratic cost of long prompts." What is wrong?', options: ['Nothing; cutting the n² scoring cost is its main purpose', 'It shrinks the KV cache, but every query still scores every key', 'GQA only works for prompts shorter than 4,096 tokens', 'GQA actually makes the KV cache larger than in MHA'], answer: 1, explain: 'GQA shrinks the KV cache and memory traffic. It does not reduce the number of query-key scores; other techniques address that.' },
  ],
  takeaways: [
    'During generation the KV cache, not the weights, often limits memory and speed.',
    'KV bytes per token = 2 × layers × KV heads × d_head × bytes per number.',
    'GQA shares each key-value head across a group of query heads, cutting the cache by H/G.',
    'MHA (G = H) and MQA (G = 1) are the extremes; GQA keeps near-MHA quality at near-MQA cost.',
    'MHA checkpoints can be uptrained to GQA with head mean-pooling plus a short training run.',
  ],
  terms: [
    { term: 'KV cache', def: 'Stored keys and values of past tokens, reused so each new token does not recompute them.' },
    { term: 'Multi-Head Attention (MHA)', def: 'Attention with several heads, each with its own query, key and value projections.' },
    { term: 'Multi-Query Attention (MQA)', def: 'All query heads share a single key head and value head.' },
    { term: 'Grouped-Query Attention (GQA)', def: 'Query heads are split into groups; each group shares one key head and one value head.' },
    { term: 'KV head', def: 'One key projection plus one value projection whose outputs are cached.' },
    { term: 'Uptraining', def: 'Converting an MHA checkpoint to GQA by pooling heads and training briefly.' },
    { term: 'Memory-bandwidth bound', def: 'Limited by how fast data can be read from memory rather than by arithmetic speed.' },
  ],
};
