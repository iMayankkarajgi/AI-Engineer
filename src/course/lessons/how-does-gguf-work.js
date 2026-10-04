export default {
  id: 'how-does-gguf-work',
  minutes: 23,
  hook: 'Why can you download one file called something like model-Q4_K_M.gguf, double-click it in a desktop app, and be chatting with an LLM a few seconds later?',
  summary: 'GGUF is a single-file format for storing an LLM: a small header, a dictionary of metadata (architecture, tokenizer, chat template), a table describing each tensor, and then the (usually quantized) weights, aligned so they can be memory-mapped. Names like Q4_K_M describe how the weights were quantized. Because everything is in one self-describing file that loads almost instantly, GGUF became the standard for running models locally with llama.cpp, Ollama and LM Studio.',
  sections: [
    {
      id: 'model-and-weights',
      title: 'What is a model and what are weights',
      blocks: [
        { type: 'p', text: 'A language model is a big mathematical function. Text goes in as numbers (token IDs), passes through many layers of matrix multiplications, and comes out as probabilities for the next token. The numbers inside those matrices are the **weights** (also called **parameters**). Training is the process of finding good weights; after training they stay fixed.' },
        { type: 'p', text: 'The weights are grouped into **tensors**: named multi-dimensional arrays such as `blk.0.attn_q.weight` (the query projection of layer 0) or `token_embd.weight` (the embedding table). An 8B model has hundreds of tensors holding about 8 billion numbers in total. To use the model on another computer we must save all those tensors plus everything needed to interpret them: the architecture, the sizes, and the tokenizer.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a flat-pack furniture box', text: 'The weights are the boards and screws. On their own they are useless: you also need the instruction sheet (architecture and hyperparameters) and the label that says which bag is which (tensor names and shapes). A GGUF file is one box with the parts, the instructions and the labels packed together.' },
      ],
    },
    {
      id: 'local-inference',
      title: 'What is local inference',
      blocks: [
        { type: 'p', text: '**Inference** means using a trained model to produce outputs. **Local inference** means running it on your own machine (a laptop, desktop, phone or private server) instead of calling a cloud API. People do it for privacy (data never leaves the device), offline use, no per-token cost, and full control over the model version.' },
        { type: 'p', text: 'The obstacle is size. An 8B model in 16-bit precision is about 16 GB, more than many laptops can spare. So local inference relies on **quantization** (storing weights in fewer bits) and on a file format and engine that are efficient on ordinary CPUs and GPUs. Our running example: we want to run an 8B chat model on a 16 GB laptop.' },
      ],
    },
    {
      id: 'problem-before-gguf',
      title: 'The problem before GGUF',
      blocks: [
        { type: 'p', text: 'Models on Hugging Face are usually shared as a folder: weight files in PyTorch or **safetensors** format, plus `config.json` (architecture), `tokenizer.json`, `tokenizer_config.json` (with the chat template) and more. That works well for Python training code on GPUs, but is awkward for a lightweight C/C++ engine and for non-technical users who just want "the model".' },
        { type: 'p', text: 'The llama.cpp project (next lesson) first used its own formats named after its tensor library, **GGML** (later variants GGMF and GGJT). Their hyperparameters were stored as a fixed, unnamed list of numbers. Every time a new model architecture or feature appeared, the layout had to change, old files broke, and loaders needed hard-coded guesses. There was no clean place to store the tokenizer or new settings.' },
        { type: 'list', items: [
          'Breaking changes: new versions of the engine could not load old files, and vice versa.',
          'Missing information: tokenizer details and special settings lived in separate files or code.',
          'No extensibility: adding a new field meant inventing a new format version.',
        ] },
      ],
    },
    {
      id: 'what-is-gguf',
      title: 'What is GGUF',
      blocks: [
        { type: 'p', text: '**GGUF** is the binary file format that the ggml / llama.cpp project introduced in August 2023 to replace those older formats. Its name builds on GGML; you will see different expansions of the letters online, but in practice everyone just says "GGUF". Its design goals are simple:' },
        { type: 'list', items: [
          '**Single file:** weights, architecture, tokenizer and settings together.',
          '**Self-describing:** all settings are named key–value pairs, so a reader knows what each value means.',
          '**Extensible:** new keys can be added without breaking older readers, which simply ignore keys they do not know.',
          '**Fast to load:** tensor data is aligned so it can be memory-mapped straight from disk.',
          '**Quantization-friendly:** each tensor records its own data type, from 32-bit floats down to 2-bit block formats.',
        ] },
        { type: 'compare', title: 'Hugging Face folder vs a GGUF file', options: [
          { name: 'safetensors + config files', summary: 'A folder of weight shards and JSON configs, read by Python libraries.', pros: ['Standard for training and GPU serving', 'Easy to fine-tune', 'Safe, simple tensor storage'], cons: ['Several files to keep in sync', 'Usually 16-bit, so large', 'Needs Python tooling'], bestFor: 'Training, fine-tuning, vLLM / SGLang serving' },
          { name: 'GGUF', summary: 'One self-describing binary with metadata, tokenizer and (often quantized) weights.', pros: ['One file to download and share', 'Many quantization levels', 'Memory-mapped, near-instant loading'], cons: ['Mainly for inference, not training', 'Tied to the ggml ecosystem\'s quantization types'], bestFor: 'Local inference with llama.cpp, Ollama, LM Studio' },
        ], rows: [ ['Files', 'Many', 'One'], ['Tokenizer included', 'Separate JSON', 'Inside the metadata'], ['Typical precision', 'BF16 / FP16', 'Q4–Q8 block quantization'] ], verdict: 'They are complementary: models are trained and published in safetensors, then converted to GGUF (with llama.cpp\'s conversion script) for local use.' },
      ],
    },
    {
      id: 'inside-a-gguf-file',
      title: 'What is stored inside a GGUF file',
      blocks: [
        { type: 'p', text: 'A GGUF file is laid out in four parts, one after another. All numbers are fixed-size and stored little-endian by default, which makes the file the same on every machine.' },
        { type: 'flow', title: 'The layout of a GGUF file', nodes: [
          { label: 'Header', detail: 'The 4 magic bytes "GGUF", a version number (currently 3), the number of tensors, and the number of metadata entries.' },
          { label: 'Metadata', detail: 'Key–value pairs with typed values (integers, floats, booleans, strings, arrays). E.g. general.architecture = "llama", llama.context_length, llama.block_count, tokenizer.ggml.tokens (the whole vocabulary), tokenizer.chat_template.' },
          { label: 'Tensor infos', detail: 'For each tensor: its name, number of dimensions, the size of each dimension, its data type (F32, F16, Q8_0, Q4_K …) and the byte offset of its data.' },
          { label: 'Padding', detail: 'Zero bytes up to the alignment boundary (32 bytes by default, or the value of general.alignment).' },
          { label: 'Tensor data', detail: 'The raw (often quantized) weights, each tensor starting at an aligned offset, ready to be memory-mapped.' },
        ] },
        { type: 'p', text: 'The code below writes a tiny file with this exact layout (one 2×4 float tensor and three metadata keys), reads it back by walking the bytes, and memory-maps the tensor. Real GGUF files are the same structure, just with hundreds of tensors and thousands of metadata values.' },
        { type: 'code', lang: 'python', title: 'gguf_demo.py', code: `import struct
import numpy as np

def s(text):                                   # GGUF string = uint64 length + UTF-8 bytes
    b = text.encode(); return struct.pack("<Q", len(b)) + b

# ---- write a tiny but valid-layout GGUF v3 file ----
meta = [("general.architecture", 8, s("llama")), ("general.name", 8, s("tiny-demo")),
        ("llama.context_length", 4, struct.pack("<I", 4096))]   # 8 = STRING, 4 = UINT32
weights = np.arange(8, dtype=np.float32).reshape(2, 4)
out = b"GGUF" + struct.pack("<IQQ", 3, 1, len(meta))            # magic, version, #tensors, #kv
for key, vtype, val in meta:
    out += s(key) + struct.pack("<I", vtype) + val
out += s("blk.0.ffn_up.weight") + struct.pack("<I", 2)           # tensor name, n_dims
out += struct.pack("<QQIQ", 4, 2, 0, 0)                          # dims (fastest first), type F32=0, offset
out += b"\\0" * (-len(out) % 32)                                  # pad to 32-byte alignment
data_start = len(out)
open("tiny.gguf", "wb").write(out + weights.tobytes())

# ---- read it back ----
buf = open("tiny.gguf", "rb").read()
magic, (ver, n_t, n_kv) = buf[:4], struct.unpack_from("<IQQ", buf, 4)
print("magic:", magic, "version:", ver, "tensors:", n_t, "metadata keys:", n_kv)
pos = 24
def read_str():
    global pos
    n, = struct.unpack_from("<Q", buf, pos); pos += 8 + n
    return buf[pos - n:pos].decode()
for _ in range(n_kv):
    key = read_str(); vtype, = struct.unpack_from("<I", buf, pos); pos += 4
    if vtype == 8: val = read_str()
    else: val, = struct.unpack_from("<I", buf, pos); pos += 4
    print(f"  {key} = {val}")
name = read_str(); nd, = struct.unpack_from("<I", buf, pos)
dims = struct.unpack_from(f"<{nd}Q", buf, pos + 4)
print("tensor:", name, "dims:", dims, "data starts at byte", data_start)
w = np.memmap("tiny.gguf", dtype=np.float32, mode="r", offset=data_start, shape=(2, 4))
print("memory-mapped weights:\\n", w)

# ---- bits per weight of common block layouts (bytes per block / weights per block) ----
for qname, nbytes, nweights in [("Q8_0", 34, 32), ("Q4_0", 18, 32), ("Q4_K", 144, 256), ("Q6_K", 210, 256)]:
    print(f"{qname}: {nbytes * 8 / nweights:.4g} bits/weight")`, output: `magic: b'GGUF' version: 3 tensors: 1 metadata keys: 3
  general.architecture = llama
  general.name = tiny-demo
  llama.context_length = 4096
tensor: blk.0.ffn_up.weight dims: (4, 2) data starts at byte 224
memory-mapped weights:
 [[0. 1. 2. 3.]
 [4. 5. 6. 7.]]
Q8_0: 8.5 bits/weight
Q4_0: 4.5 bits/weight
Q4_K: 4.5 bits/weight
Q6_K: 6.562 bits/weight`, walkthrough: [
          { lines: [4, 5], note: 'A GGUF string is an 8-byte length followed by the UTF-8 bytes. Everything is little-endian ("<").' },
          { lines: [8, 13], note: 'Header (magic "GGUF", version 3, tensor count, metadata count) followed by typed key–value pairs. Value type 8 means string, 4 means uint32.' },
          { lines: [14, 18], note: 'One tensor info: name, number of dimensions, the dimensions (fastest-varying first, so 4 then 2), type 0 = F32, and offset 0 within the data section. Then pad to 32 bytes.' },
          { lines: [21, 35], note: 'The reader walks the same bytes in order: header, each metadata entry, then the tensor info. No outside config file is needed.' },
          { lines: [36, 37], note: 'np.memmap maps the tensor bytes straight from the file: no copying, the OS pages data in on demand. This is how real engines load GGUF.' },
          { lines: [40, 41], note: 'Bits per weight of real block layouts: each block stores its quantized values plus scales, so 4-bit types cost 4.5 bits in practice.' },
        ] },
      ],
    },
    {
      id: 'what-is-quantization',
      title: 'What is quantization (in GGUF)',
      blocks: [
        { type: 'p', text: '**Quantization** stores each weight with fewer bits by rounding it onto a small grid of allowed values, with a **scale** that converts the grid back to real numbers (the previous lesson covers this in depth). GGUF uses **block-wise** quantization: weights are cut into small blocks, and each block gets its own scale, so one large weight only affects its own block.' },
        { type: 'steps', title: 'How a Q8_0 block is stored', items: [
          { title: 'Take 32 weights', text: 'Q8_0 works on blocks of 32 consecutive weights from one row of a tensor.' },
          { title: 'Find the scale', text: 'scale = max |weight| / 127, stored as one 16-bit float (2 bytes).' },
          { title: 'Round each weight', text: 'Store round(weight / scale) as a signed 8-bit integer: 32 bytes.' },
          { title: 'Count the cost', text: '2 + 32 = 34 bytes per 32 weights = 8.5 bits per weight. Q4_0 does the same with 4-bit integers: 2 + 16 = 18 bytes, 4.5 bits per weight.' },
        ] },
        { type: 'p', text: 'The newer **k-quants** (the "K" in names like Q4_K) use **super-blocks** of 256 weights split into smaller sub-blocks. Each sub-block gets its own scale (and minimum), and those scales are themselves quantized to 6 bits, with one 16-bit scale for the whole super-block. This two-level trick gives fine-grained scales at low overhead: Q4_K costs 144 bytes per 256 weights, again 4.5 bits per weight, but with better accuracy than Q4_0.' },
      ],
    },
    {
      id: 'quantization-names',
      title: 'Understanding quantization names like Q4_K_M',
      blocks: [
        { type: 'p', text: 'When you browse GGUF files you see a menu of suffixes. They decode like this:' },
        { type: 'table', caption: 'Reading a GGUF quantization name', head: ['Part', 'Meaning', 'Example'], rows: [
          ['Q', 'Quantized weights', 'Q4_K_M'],
          ['Number', 'Approximate bits per weight for most tensors', '4 → about 4 bits (+ scale overhead)'],
          ['_0 / _1', 'Older simple block formats: _0 stores a scale only; _1 stores a scale and a minimum', 'Q4_0, Q4_1, Q8_0'],
          ['K', 'k-quant: super-blocks with quantized sub-block scales', 'Q3_K, Q4_K, Q5_K, Q6_K'],
          ['_S / _M / _L', 'Small / Medium / Large mix: how many sensitive tensors get a higher-bit type', 'Q4_K_M keeps some tensors at Q6_K'],
          ['IQ', 'Newer "i-quants", usually built with an importance matrix from calibration text; good at very low bits', 'IQ2_XXS, IQ3_M, IQ4_XS'],
          ['F16 / BF16 / F32', 'Unquantized floating point', 'Used for reference or small tensors'],
        ] },
        { type: 'p', text: 'The S/M/L mix matters because not all tensors are equally sensitive. In llama.cpp\'s Q4_K_M recipe, most tensors use Q4_K, but some of the most sensitive ones (for example part of the attention value and feed-forward down-projection tensors) use Q6_K. The result averages a little under 5 bits per weight: an 8B model in Q4_K_M is roughly 4.9 GB.' },
        { type: 'chart', kind: 'hbar', title: 'Approximate file size of an 8B model', yLabel: 'GB', unit: ' GB', labels: ['F16', 'Q8_0', 'Q6_K', 'Q5_K_M', 'Q4_K_M', 'Q3_K_M', 'Q2_K'], series: [ { name: 'Size', values: [16.1, 8.5, 6.6, 5.7, 4.9, 4.0, 3.2] } ], caption: 'Approximate sizes for an 8B Llama-style model; exact sizes vary by model and by which tensors stay at higher precision. Smaller files lose more quality.' },
        { type: 'check', question: 'Our laptop has 16 GB of RAM and we also want the browser open. Which file is the safer choice for an 8B model: Q8_0 or Q4_K_M, and why?', answer: 'Q4_K_M. At about 4.9 GB it leaves plenty of room for the KV cache, the operating system and other apps, while Q8_0 at about 8.5 GB would squeeze memory. Q4_K_M is widely considered a good quality/size balance; Q8_0 is closer to full quality if memory allows.' },
      ],
    },
    {
      id: 'memory-mapping',
      title: 'How GGUF loads fast with memory mapping',
      blocks: [
        { type: 'p', text: 'The classic way to load a model is to read the whole file and copy it into a freshly allocated block of memory. For a 5 GB file that is slow and needs the full 5 GB up front. GGUF is designed for **memory mapping** (`mmap`) instead.' },
        { type: 'p', text: 'With `mmap`, the operating system makes the file *appear* to be in memory without actually reading it. When the engine first touches a tensor, the OS loads just those pages from disk (or from its **page cache**, if the file was used recently). Because GGUF aligns every tensor\'s data to a fixed boundary, the engine can point directly at the bytes in the file and use them as-is, with no parsing or copying.' },
        { type: 'list', items: [
          '**Near-instant start:** loading takes milliseconds; data streams in as layers are used.',
          '**Fast restarts:** the second launch hits the OS page cache, so it is often far faster than the first.',
          '**Shared memory:** two processes using the same file share one copy in RAM.',
          '**Graceful limits:** if RAM is tight, the OS can drop pages and re-read them from disk later (slower, but it runs).',
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistake', text: 'Judging memory use by what your task manager shows right after loading. Mapped pages may not be counted until they are touched, so usage climbs during the first prompt. Also, storing GGUF files on a slow network or USB drive makes that first pass slow. And if you offload layers to a GPU, those tensors are copied into GPU memory, so mmap savings apply mainly to the part that stays on the CPU.' },
      ],
    },
    {
      id: 'cross-platform-extensible',
      title: 'Why GGUF is cross-platform and extensible',
      blocks: [
        { type: 'p', text: '**Cross-platform:** GGUF uses fixed-size integers and floats with a defined byte order, so the same file works on Windows, macOS, Linux, Android and on x86 or ARM chips. The engine reads the metadata and picks the right compute kernels for the local hardware. You never need a "Mac version" of a model.' },
        { type: 'p', text: '**Extensible:** every setting is a named key with a typed value. When a new architecture or feature needs new information (say, a new type of position encoding), the converter just writes new keys such as `<arch>.rope.scaling.type`. Older readers skip keys they do not understand instead of crashing. The format version only changes for structural changes; version 3 is current.' },
        { type: 'p', text: '**Self-contained:** because the tokenizer vocabulary, merges, special token IDs and even the **chat template** (the text pattern that wraps user and assistant messages) are stored in the metadata, one file is enough to chat correctly.' },
      ],
    },
    {
      id: 'gguf-in-the-real-world',
      title: 'GGUF in the real world',
      blocks: [
        { type: 'p', text: 'GGUF is the de facto standard for local LLMs. Hugging Face hosts a very large number of GGUF files (often in several quantization levels per model) and can show a file\'s metadata and tensor list in the browser. Tools that run GGUF models include **llama.cpp** itself, **Ollama**, **LM Studio**, **GPT4All**, **Jan** and **KoboldCpp**. Some other engines can also import GGUF weights.' },
        { type: 'steps', title: 'The typical workflow', items: [
          { title: 'Start from a published model', text: 'Download the original weights (safetensors + configs) from Hugging Face.' },
          { title: 'Convert', text: 'Run llama.cpp\'s `convert_hf_to_gguf.py` to produce an F16 or BF16 GGUF with all metadata and tokenizer data.' },
          { title: 'Quantize', text: 'Run `llama-quantize model-f16.gguf model-Q4_K_M.gguf Q4_K_M`. Optionally compute an importance matrix first for i-quants.' },
          { title: 'Run', text: 'Load the file in llama.cpp, Ollama or LM Studio. Most users skip steps 1–3 and download a ready-made GGUF.' },
        ] },
        { type: 'callout', tone: 'example', title: 'Our laptop, solved', text: 'We download an 8B instruct model as Q4_K_M (about 4.9 GB), open it in LM Studio or Ollama, and it starts in seconds thanks to mmap. The chat template inside the file makes sure our messages are formatted the way the model was trained.' },
        { type: 'callout', tone: 'tip', title: 'When not to use GGUF', text: 'If you are fine-tuning or training, stay with safetensors in BF16. If you are serving many users on data-centre GPUs, engines like vLLM, SGLang or TensorRT-LLM with their own formats (FP8, AWQ, GPTQ) usually give higher throughput. GGUF shines for local, single-user or small-scale inference.' },
      ],
    },
    {
      id: "counting-the-bytes",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "`gguf_demo.py` printed that the tensor data starts at byte 224. Where does that number come from? Nothing in the file is hidden, so we can add it up by hand. We need two rules from the code: a string costs 8 bytes for its length plus one byte per character, and a value type or a 32-bit number costs 4 bytes." },
        { type: "steps", title: "Adding up the tiny file", items: [
          { title: "Header", text: "4 magic bytes + 4 for the version + 8 for the tensor count + 8 for the metadata count = 24 bytes." },
          { title: "First key", text: "`general.architecture` has 20 characters: 8 + 20 = 28. Then 4 for the value type. The value `llama` is a string: 8 + 5 = 13. Total 45 bytes." },
          { title: "Second and third keys", text: "`general.name` = `tiny-demo`: (8 + 12) + 4 + (8 + 9) = 41 bytes. `llama.context_length` = 4096: (8 + 20) + 4 + 4 = 36 bytes." },
          { title: "Tensor info", text: "The name `blk.0.ffn_up.weight` has 19 characters: 8 + 19 = 27. Then 4 for the number of dimensions, 2 × 8 for the two sizes, 4 for the data type and 8 for the offset. Total 59 bytes." },
          { title: "Pad to the boundary", text: "24 + 45 + 41 + 36 + 59 = 205 bytes. The next multiple of 32 is 224, so the writer adds 19 zero bytes." },
          { title: "Tensor data", text: "Eight 32-bit floats take 32 bytes, from byte 224 to byte 255. The whole file is 256 bytes." }
        ] },
        { type: "table", caption: "Byte map of tiny.gguf", head: ["Part", "Bytes", "Size"], rows: [
          ["Header", "0 – 23", "24"],
          ["Metadata (3 keys)", "24 – 145", "122"],
          ["Tensor info (1 tensor)", "146 – 204", "59"],
          ["Padding", "205 – 223", "19"],
          ["Tensor data", "224 – 255", "32"]
        ] },
        { type: "p", text: "Two lessons hide in this sum. First, a reader never has to guess. Every string says how long it is and every value says what type it is, so the reader always knows how many bytes come next. That is also how it can step over a key it does not know. Second, in this toy file the description is larger than the data: 205 bytes against 32. In a real model it is the other way round by a huge margin: the weights are gigabytes, and the metadata, even with the whole vocabulary inside, is tiny next to them." }
      ]
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "The lesson described how a Q8_0 block is stored: one 16-bit scale followed by 32 small integers. We will pack blocks like that into real bytes and unpack them again. Then we do the same with a simplified 4-bit block that squeezes two weights into every byte. The 4-bit packing here is a teaching version, not the exact layout of any GGUF type." },
        { type: "code", lang: "python", title: "practice_block_packing.py", code: `import struct
import numpy as np
rng = np.random.default_rng(5)
BLOCK = 32
weights = rng.normal(0, 0.05, size=2 * BLOCK).astype(np.float32)   # two blocks

def pack8(block):                      # 8-bit block: one FP16 scale + one byte per weight
    scale = np.float16(np.abs(block).max() / 127)
    q = np.round(block / np.float32(scale)).clip(-127, 127).astype(np.int8)
    return struct.pack("<e", scale) + q.tobytes()

def unpack8(raw):
    scale, = struct.unpack_from("<e", raw, 0)
    return np.frombuffer(raw, dtype=np.int8, offset=2) * np.float32(scale)

def pack4(block):                      # simplified 4-bit block: two weights per byte
    scale = np.float16(np.abs(block).max() / 7)
    q = (np.round(block / np.float32(scale)).clip(-7, 7) + 8).astype(np.uint8)
    return struct.pack("<e", scale) + (q[0::2] | (q[1::2] << 4)).tobytes()

def unpack4(raw):
    scale, = struct.unpack_from("<e", raw, 0)
    b = np.frombuffer(raw, dtype=np.uint8, offset=2)
    q = np.empty(2 * len(b), dtype=np.int16)
    q[0::2], q[1::2] = b & 15, b >> 4  # split each byte back into two 4-bit values
    return (q - 8) * np.float32(scale)

for name, pack, unpack in [("8-bit", pack8, unpack8), ("4-bit", pack4, unpack4)]:
    blocks = [pack(weights[i:i + BLOCK]) for i in range(0, len(weights), BLOCK)]
    back = np.concatenate([unpack(b) for b in blocks])
    size = sum(len(b) for b in blocks)
    print(f"{name}: {len(blocks[0])} bytes per block, {size * 8 / len(weights)} bits/weight, "
          f"mean error {np.abs(back - weights).mean():.5f}")
print("as FP32:", weights.nbytes, "bytes | as FP16:", weights.nbytes // 2, "bytes")`, output: `8-bit: 34 bytes per block, 8.5 bits/weight, mean error 0.00020
4-bit: 18 bytes per block, 4.5 bits/weight, mean error 0.00324
as FP32: 256 bytes | as FP16: 128 bytes`, walkthrough: [
          { lines: [1, 5], note: "64 random weights: two blocks of 32." },
          { lines: [7, 14], note: "The 8-bit block. Packing writes a 2-byte float scale and 32 signed bytes. Unpacking reads the scale and multiplies it back." },
          { lines: [16, 26], note: "The 4-bit block. Each weight becomes a number from 1 to 15, and two of them share one byte: one in the low half, one in the high half." },
          { lines: [28, 34], note: "Pack both blocks, unpack them, and report bytes per block, bits per weight and the round-trip error." }
        ] },
        { type: "p", text: "The byte counts match the lesson exactly: 34 bytes and 8.5 bits per weight for the 8-bit block, 18 bytes and 4.5 bits per weight for the 4-bit one. The 4-bit error is about 16 times larger, because its grid has 15 levels instead of 255. Now change it:" },
        { type: "list", items: [
          "Set `BLOCK = 16`. Predict the bytes per block and the bits per weight for both formats before you run it.",
          "Add `weights[5] = 3.0` right after `weights` is created, and print the mean error of each block separately. Predict which block gets worse and which is untouched.",
          "Store the scale as a 32-bit float: use `np.float32` for the scale, `\"<f\"` in `struct`, and `offset=4`. Predict the new bits per weight. Is the extra precision of the scale worth it?"
        ] },
        { type: "check", question: "We add one more metadata key to tiny.gguf, and its entry takes 30 bytes. At which byte does the tensor data start now?", answer: "At byte 256. The part before the padding grows from 205 to 235 bytes, and the next multiple of 32 after 235 is 256. The padding is not a fixed amount: it is whatever is needed to reach the boundary, here 21 bytes instead of 19." },
        { type: "check", question: "An older reader meets a metadata key it has never heard of. What in the layout lets it skip that entry and still find the next one?", answer: "The key is a string that starts with its own length, and it is followed by a value type. The type tells the reader how big the value is, or, for a string, that a length comes first. So the reader can compute where the entry ends without knowing what the key means." }
      ]
    },
  ],
  quiz: [
    { q: "Which of these is NOT stored inside a GGUF file?", options: ["The tokenizer vocabulary and the chat template", "Each tensor's name, shape and data type", "The training dataset the model learned from", "The model architecture and context length"], answer: 2, explain: "A GGUF file contains a header, metadata (architecture, hyperparameters, tokenizer, chat template), tensor infos and tensor data. The training data is not included; only the learned weights are." },
    { q: 'A Q8_0 block stores 32 weights as 8-bit integers plus one 16-bit scale. How many bits per weight is that?', options: ['8.0', '8.5', '9.0', '16.0'], answer: 1, explain: '32 × 1 byte + 2 bytes = 34 bytes = 272 bits, and 272 / 32 = 8.5 bits per weight. Forgetting the scale overhead gives 8.0.' },
    { q: "What does the \"_M\" in Q4_K_M tell you?", options: ["The file is built and tuned for running on macOS with Metal", "The model was trained with a medium-length context window", "The weights are loaded through memory mapping instead of being read into RAM in full", "The medium mix: some sensitive tensors use a higher-bit type than the 4-bit base"], answer: 3, explain: "S, M and L describe how many tensors are upgraded to higher precision. Q4_K_M uses Q4_K for most tensors and Q6_K for some sensitive ones. All GGUF files can be memory-mapped, regardless of the suffix." },
    { q: "A user notices the model \"loads\" in a fraction of a second, but the first answer is slow and memory use rises during it. What explains this?", options: ["Memory mapping: the file maps instantly and pages load from disk as layers are first used", "The file was corrupted on download and is being repaired during the first answer", "GGUF decompresses the whole file with zip while it handles the first answer", "The tokenizer is downloaded from the internet the first time it is needed"], answer: 0, explain: "With mmap the OS maps the file without reading it; actual data is paged in when first touched, during the first forward pass. Later runs are fast because pages stay in the OS page cache. GGUF is not zip-compressed and is self-contained." },
    { q: "Compared with a safetensors folder, what is GGUF's main advantage for local inference?", options: ["It is the only model format that GPU inference kernels are able to load", "It is required for fine-tuning, so local adapters can be trained on it", "One self-describing file with metadata, tokenizer and quantized weights, quick to mmap", "Its quantized weights give better accuracy than the original 16-bit weights"], answer: 2, explain: "GGUF packs everything into one file and is built for fast mmap loading and many quantization levels. Safetensors remains the standard for training and GPU serving, and quantized GGUF files trade some accuracy for size." },
  ],
  takeaways: [
    'GGUF is one self-describing file: header, typed key–value metadata, tensor infos, then aligned tensor data.',
    'Metadata includes architecture, hyperparameters, tokenizer and chat template, so no extra config files are needed.',
    'Weights are block-quantized; names like Q4_K_M mean about 4 bits, k-quant super-blocks, medium mix.',
    'Aligned data lets engines memory-map the file for near-instant loading and shared memory.',
    'GGUF is the standard for local inference (llama.cpp, Ollama, LM Studio); safetensors remains the training format.',
  ],
  terms: [
    { term: 'GGUF', def: 'The single-file binary format from the ggml / llama.cpp project for storing models with metadata and quantized tensors.' },
    { term: 'Tensor', def: 'A named multi-dimensional array of numbers, such as one weight matrix of the model.' },
    { term: 'Metadata', def: 'Named, typed key–value pairs in the file that describe the model, its settings and its tokenizer.' },
    { term: 'Block quantization', def: 'Quantizing weights in small groups, each with its own scale, so one large value affects only its block.' },
    { term: 'k-quant', def: 'GGUF quantization types (Q2_K … Q6_K) using 256-weight super-blocks with quantized sub-block scales.' },
    { term: 'Memory mapping (mmap)', def: 'An OS feature that makes a file appear in memory and loads its pages from disk only when they are accessed.' },
  ],
};
