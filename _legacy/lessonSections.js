// Hand-authored lesson bodies. Add an entry keyed by lesson id to replace the
// generated structure for that lesson; see the block reference in lessonModel.js.
// Quiz, key terms, takeaways and further reading are still appended from the
// lesson's fields in content.js / expandedContent.js.

export const authoredSections = {
  'kv-cache': [
    { id: 'intuition', title: 'The intuition', blocks: [
      { type: 'p', text: 'A language model writes one token at a time. To choose each new token, attention looks back at every token that came before it. Without a cache, the model would recompute its view of the whole prefix on every single step, even though most of that work has already been done.' },
      { type: 'p', text: 'The **KV cache** is the model keeping its notes. After a token has been processed once, the attention **keys** and **values** for it are stored, so later steps can read them instead of recomputing them.' },
      { type: 'callout', tone: 'note', title: 'In one sentence', text: 'A KV cache trades GPU memory for compute: it stores per-token attention state so each decode step only has to process the newest token.' },
    ] },
    { id: 'see-it', title: 'See it work', blocks: [
      { type: 'figure', visual: 'cache', caption: 'Step through decoding. Each generated token adds one entry per layer; earlier entries are reused, not recomputed.' },
    ] },
    { id: 'how-it-works', title: 'How it works', blocks: [
      { type: 'p', text: 'Serving a request has two phases. **Prefill** runs the whole prompt through the model in parallel and writes a key and value vector for every prompt token, in every layer. **Decode** then generates tokens one by one. Each decode step computes a query, key and value only for the newest token, appends the new key and value to the cache, and attends over everything stored so far.' },
      { type: 'steps', items: [
        { title: 'Prefill the prompt', text: 'Process all prompt tokens at once and write their keys and values into the cache. This phase is compute-heavy and sets time to first token.' },
        { title: 'Compute the newest token only', text: 'For the next step, project only the latest token into a query, key and value.' },
        { title: 'Append and attend', text: 'Append the new key and value, then let the query attend over every cached entry for that layer.' },
        { title: 'Repeat until done', text: 'Sample a token, stream it to the user, and loop. Each step reads the whole cache, so decode is usually limited by memory bandwidth rather than arithmetic.' },
      ] },
      { type: 'deeper', title: 'Why only keys and values, not queries?', blocks: [
        { type: 'p', text: 'A past token’s query was only needed to compute that token’s own output, which has already been produced. Future tokens never reuse old queries. They do compare their own query against every earlier key and mix the earlier values, so keys and values are the only state worth keeping.' },
      ] },
    ] },
    { id: 'sizing', title: 'Sizing the cache', blocks: [
      { type: 'p', text: 'Cache memory grows linearly with context length. For one sequence:' },
      { type: 'code', lang: 'text', code: 'bytes per token = 2 (K and V) × layers × kv_heads × head_dim × bytes_per_element\ntotal bytes     = bytes per token × tokens in the sequence' },
      { type: 'p', text: 'Plug in a typical 8B-parameter model that uses grouped-query attention, stored in 16-bit precision:' },
      { type: 'table', head: ['Setting', 'Value'], rows: [
        ['Layers', '32'], ['KV heads', '8'], ['Head dimension', '128'], ['Bytes per element (FP16/BF16)', '2'],
        ['Bytes per token', '2 × 32 × 8 × 128 × 2 = 131,072 (128 KiB)'], ['One 8,192-token sequence', '≈ 1 GiB'],
      ] },
      { type: 'code', lang: 'python', code: 'def kv_cache_bytes(layers, kv_heads, head_dim, tokens, bytes_per_elem=2):\n    per_token = 2 * layers * kv_heads * head_dim * bytes_per_elem  # K and V\n    return per_token * tokens\n\ngib = kv_cache_bytes(layers=32, kv_heads=8, head_dim=128, tokens=8192) / 2**30\nprint(f"{gib:.2f} GiB per sequence")' },
      { type: 'output', text: '1.00 GiB per sequence' },
      { type: 'callout', tone: 'tip', title: 'Try it', text: 'Change `kv_heads` to 32, which is what the same model would need with standard multi-head attention. How much more memory does each sequence take?' },
    ] },
    { id: 'serving', title: 'Why it shapes serving', blocks: [
      { type: 'p', text: 'Model weights are a fixed cost. The KV cache is the variable cost, and it usually decides how many requests a GPU can serve at once. Inference engines manage it carefully:' },
      { type: 'list', items: [
        '**Paged allocation** stores the cache in fixed-size blocks, like virtual memory, so long and short requests can share GPU memory with little waste.',
        '**Prefix caching** reuses cache blocks when many requests start with the same system prompt.',
        '**Cache quantization** stores keys and values in 8-bit formats to fit more concurrent tokens.',
        '**Preemption** pauses or evicts requests when the cache is full, then recomputes or swaps their state later.',
      ] },
      { type: 'check', question: 'A GPU has 20 GiB free after loading weights. Using the model above, roughly how many concurrent 8,192-token sequences fit?', answer: 'About 20. Each full-length sequence needs about 1 GiB of cache, before any allocator overhead.' },
    ] },
    { id: 'pitfall', title: 'Common misconception', blocks: [
      { type: 'callout', tone: 'warn', title: 'Watch out', text: 'The KV cache is not part of the model’s learned weights and does not persist between unrelated requests unless the server deliberately reuses a shared prefix. Caching also does not make long context free: memory use still grows with every token.' },
    ] },
  ],
};
