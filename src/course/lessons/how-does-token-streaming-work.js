export default {
  id: 'how-does-token-streaming-work',
  minutes: 23,
  hook: 'A long chatbot answer can take 20 seconds to generate, yet the first words appear almost instantly. How does text travel to your screen while the model is still writing it?',
  summary: 'LLMs generate one token at a time, so a server can send each token as soon as it exists instead of waiting for the full answer. Most LLM APIs do this with Server-Sent Events (SSE): one long-lived HTTP response with content type text/event-stream, in which each token arrives as a small "data:" event followed by a blank line, and a final marker (such as data: [DONE]) ends the stream. Streaming does not make generation faster; it makes the wait feel much shorter by cutting time to first token.',
  sections: [
    {
      id: 'what-is-streaming',
      title: 'What is token streaming?',
      blocks: [
        { type: 'p', text: '**Token streaming** means sending a model\'s output to the client **piece by piece, as it is generated**, rather than all at once at the end. Each piece is usually one token or a few tokens. The text appears on screen word by word, which is the familiar "typing" effect in chat apps.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a live sports commentary', text: 'A newspaper reports the match the next morning, all at once (a blocking response). A radio commentator describes each play the moment it happens (streaming). The match lasts the same 90 minutes either way, but the radio listener is never left waiting in silence.' },
        { type: 'p', text: 'Running example: our support chatbot answers **"When will my order arrive?"** with **"Your order ships on Monday."** We will follow those tokens from the model, through the network, to the screen.' },
      ],
    },
    {
      id: 'generation-recap',
      title: 'A quick recap of how an LLM generates text',
      blocks: [
        { type: 'p', text: 'Generation has two phases. In **prefill**, the model reads the whole prompt in one parallel pass and produces the first token. In **decode**, it produces one token per forward pass: each new token is appended to the input and the model runs again to get the next one. This loop continues until the model emits an end-of-sequence token or hits a maximum length.' },
        { type: 'flow', title: 'The generation loop', loop: true, nodes: [
          { label: 'Forward pass', detail: 'Run the model on the prompt plus all tokens generated so far (with a KV cache, only the new token is processed).' },
          { label: 'Pick token', detail: 'Turn logits into probabilities and choose a token (greedy, temperature, top-p ...).' },
          { label: 'Emit', detail: 'This is the moment a streaming server can send the token to the client.' },
          { label: 'Append', detail: 'Add the token to the sequence and loop again until an end token or the length limit.' },
        ] },
        { type: 'p', text: 'Because tokens come out **sequentially**, the full answer simply does not exist until the last step. A blocking API must hold everything back until then. Streaming exploits the fact that the early tokens are final as soon as they are generated.' },
      ],
    },
    {
      id: 'why-streaming',
      title: 'Why we need streaming at all',
      blocks: [
        { type: 'p', text: 'Two numbers describe how fast a response *feels*:' },
        { type: 'list', items: [
          '**Time to first token (TTFT):** how long from sending the request until the first token is visible. This is mostly queueing plus prefill.',
          '**Total time:** until the last token. Roughly TTFT plus (number of tokens × time per token).',
        ] },
        { type: 'p', text: 'Suppose prefill takes 300 ms and each token takes 40 ms (illustrative; real speeds vary widely by model, hardware and load). A 500-token answer then needs about 300 + 500 × 40 = 20,300 ms. Without streaming the user stares at a spinner for 20 seconds. With streaming, text starts appearing after about a third of a second and keeps flowing at reading speed. The **total time is identical**, but people tolerate a stream far better than a blank screen.' },
        { type: 'viz', name: 'streaming', caption: 'Start both timers. The blocking response shows nothing until the end; the streamed one starts almost immediately. Compare time to first token with total time.' },
        { type: 'p', text: 'Streaming has practical benefits too: users can **stop** a bad answer early (saving tokens and cost), front-ends can start rendering markdown or running tool calls sooner, and long responses avoid some proxy and gateway timeouts because bytes keep flowing.' },
      ],
    },
    {
      id: 'what-is-sse',
      title: 'What is SSE, and how the connection stays open',
      blocks: [
        { type: 'p', text: '**Server-Sent Events (SSE)** is a simple web standard for a server to push a stream of text messages to a client over an ordinary HTTP response. The client makes one request; the server answers with the header `Content-Type: text/event-stream` and then **keeps the response open**, writing new messages whenever it has something to say. It is one-way: server to client.' },
        { type: 'p', text: 'How does a response stay open? Normally an HTTP response says up front how long it is (`Content-Length`), and the client knows it is done after that many bytes. A streaming response does not know its length in advance. In HTTP/1.1 the server uses **chunked transfer encoding**, sending the body in pieces, each prefixed with its size, with a final zero-size chunk meaning "finished". In HTTP/2 and HTTP/3 the body is naturally sent as a series of frames on a stream. Either way, the client reads bytes as they arrive instead of waiting for the end.' },
        { type: 'code', lang: 'text', title: 'What a streamed HTTP response looks like (simplified)', code: `HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"choices": [{"delta": {"content": "Your"}}]}

data: {"choices": [{"delta": {"content": " order"}}]}

data: [DONE]
` },
        { type: 'p', text: '`Cache-Control: no-cache` tells caches and proxies not to store or hold the response. Each `data:` line is written and **flushed** to the network immediately, rather than sitting in a buffer.' },
      ],
    },
    {
      id: 'message-format',
      title: 'The format of a streamed message',
      blocks: [
        { type: 'p', text: 'SSE is plain UTF-8 text, organized into **events**. An event is one or more lines of the form `field: value`, and **a blank line ends the event**. The standard fields are:' },
        { type: 'table', caption: 'SSE fields (from the HTML standard that defines SSE)', head: ['Field', 'Meaning', 'Typical LLM use'], rows: [
          ['data:', 'The message payload; several data lines in one event are joined with newlines', 'A JSON object holding the new token(s)'],
          ['event:', 'A name for the event type', 'Some APIs name events, e.g. a content delta vs a stop event'],
          ['id:', 'An ID the browser remembers for reconnecting', 'Rarely used by LLM APIs'],
          ['retry:', 'Reconnect delay in milliseconds', 'Rarely used by LLM APIs'],
          [': comment', 'A line starting with a colon is ignored', 'Keep-alive "heartbeat" pings'],
        ] },
        { type: 'p', text: 'Inside `data:`, each provider defines its own JSON. A common pattern is a **delta**: only the *new* text since the last event, not the whole answer so far. The client must **concatenate** deltas to rebuild the full message. The final events often carry extra information such as the finish reason or token usage counts.' },
        { type: 'check', question: 'A client receives deltas "Your", " order", " ships". What should it display, and why must it not replace the text each time?', answer: 'It should display "Your order ships" by appending each delta. Each event carries only the new piece; replacing would show just the latest fragment.' },
      ],
    },
    {
      id: 'full-walkthrough',
      title: 'A full walkthrough from server to screen',
      blocks: [
        { type: 'steps', title: 'One streamed answer, end to end', items: [
          { title: 'Request', text: 'The client sends a normal POST with the prompt and a flag such as "stream": true.' },
          { title: 'Headers first', text: 'The server replies 200 OK with Content-Type: text/event-stream and starts the model. The connection stays open.' },
          { title: 'Token generated', text: 'Each time the model emits a token, the server wraps it in JSON, writes "data: {...}" plus a blank line, and flushes.' },
          { title: 'Client parses', text: 'The client reads bytes into a buffer, splits on blank lines, strips "data: ", parses the JSON and appends the delta to the text on screen.' },
          { title: 'Stream ends', text: 'The server sends a final marker (for example data: [DONE]) and closes the response; the client stops reading and finalizes the message.' },
        ] },
        { type: 'code', lang: 'python', title: 'sse_simulation.py', code: `import json

PREFILL_MS, PER_TOKEN_MS = 300, 40        # illustrative timings
answer = ["Your", " order", " ships", " on", " Monday", "."]

def server_sse(tokens):
    """Yield the raw bytes a server would write for each event."""
    for t in tokens:
        payload = {"choices": [{"delta": {"content": t}}]}
        yield f"data: {json.dumps(payload)}\\n\\n"   # blank line ends an event
    yield "data: [DONE]\\n\\n"

def client(raw_stream):
    """Parse SSE text: split on blank lines, read the data: field."""
    buffer, clock = "", PREFILL_MS
    for chunk in raw_stream:
        buffer += chunk
        while "\\n\\n" in buffer:
            event, buffer = buffer.split("\\n\\n", 1)
            data = event.removeprefix("data: ")
            if data == "[DONE]":
                print(f"[{clock:>4} ms] stream closed")
                return clock
            clock += PER_TOKEN_MS              # time to generate this token
            token = json.loads(data)["choices"][0]["delta"]["content"]
            print(f"[{clock:>4} ms] render {token!r}")

print(repr(next(server_sse(answer))))     # what one event looks like on the wire
total = client(server_sse(answer))
print(f"streaming : first token at {PREFILL_MS + PER_TOKEN_MS} ms, done at {total} ms")
print(f"blocking  : nothing on screen until {PREFILL_MS + PER_TOKEN_MS * len(answer)} ms")`,
          output: `'data: {"choices": [{"delta": {"content": "Your"}}]}\\n\\n'
[ 340 ms] render 'Your'
[ 380 ms] render ' order'
[ 420 ms] render ' ships'
[ 460 ms] render ' on'
[ 500 ms] render ' Monday'
[ 540 ms] render '.'
[ 540 ms] stream closed
streaming : first token at 340 ms, done at 540 ms
blocking  : nothing on screen until 540 ms`,
          walkthrough: [
            { lines: [3, 4], note: 'A simulated clock (no real waiting) with illustrative prefill and per-token times, and the six tokens of our answer.' },
            { lines: [6, 11], note: 'The server side: each token becomes one SSE event, "data: <json>" followed by a blank line. The stream ends with data: [DONE].' },
            { lines: [13, 19], note: 'The client keeps a buffer, because network chunks can split an event in half. It only processes complete events, which end in a blank line.' },
            { lines: [20, 26], note: 'Strip the "data: " prefix, stop on [DONE], otherwise parse the JSON and render the delta.' },
            { lines: [28, 31], note: 'Same total time (540 ms) either way, but the streamed version shows the first word at 340 ms.' },
          ] },
        { type: 'callout', tone: 'tip', title: 'In the browser', text: 'The browser\'s built-in `EventSource` API reads SSE automatically, but it only makes GET requests and cannot set custom headers such as an API key. LLM front-ends therefore usually call `fetch` with POST and read `response.body` as a stream, parsing events themselves just like the code above, or they use a provider SDK that does this for them.' },
      ],
    },
    {
      id: 'done-marker',
      title: 'The [DONE] marker that ends the stream',
      blocks: [
        { type: 'p', text: 'A client needs to know whether the stream finished **normally** or was **cut off** (network drop, server crash, timeout). Some APIs send a sentinel: an OpenAI-style stream ends with the literal line `data: [DONE]`, which is not JSON, so clients must check for it before parsing. Other APIs use named events instead; Anthropic\'s Messages API, for example, sends typed events such as `content_block_delta` and finishes with a `message_stop` event.' },
        { type: 'p', text: 'Whatever the marker, the rule is the same: **only treat the answer as complete after the end marker arrives.** If the connection closes without it, show the partial answer as incomplete or retry. The final events are also where you usually find the finish reason (stop, length limit, tool call) and token usage for billing.' },
      ],
    },
    {
      id: 'sse-vs-websockets',
      title: 'SSE vs WebSockets',
      blocks: [
        { type: 'compare', title: 'Two ways to push data to a client', options: [
          { name: 'Server-Sent Events', summary: 'One-way text stream over a normal HTTP response.', pros: ['Plain HTTP: works with existing load balancers, auth and logging', 'Very simple text format', 'Browser EventSource auto-reconnects'], cons: ['Server to client only', 'Text only (binary must be encoded)', 'Many open streams per domain can hit HTTP/1.1 connection limits'], bestFor: 'Streaming LLM answers: one request, many tokens back' },
          { name: 'WebSockets', summary: 'A persistent two-way channel upgraded from an HTTP handshake.', pros: ['Full duplex: both sides send any time', 'Supports binary frames', 'Low per-message overhead'], cons: ['Separate protocol to proxy, scale and secure', 'You manage reconnects and message framing'], bestFor: 'Real-time interaction such as live voice, collaborative apps, games' },
        ], rows: [
          ['Direction', 'Server → client', 'Both ways'],
          ['Protocol', 'HTTP response (text/event-stream)', 'ws:// or wss:// after an Upgrade'],
          ['Fits the LLM request/response pattern', 'Very well', 'Works, but more machinery than needed'],
        ], verdict: 'For "send a prompt, stream back an answer", SSE is the simple, standard choice. WebSockets make sense when the client must keep sending data during the response, as in real-time voice.' },
      ],
    },
    {
      id: 'real-world',
      title: 'Token streaming in the real world, and common mistakes',
      blocks: [
        { type: 'callout', tone: 'example', title: 'Where you see it', text: 'Chat interfaces stream nearly every answer. Major LLM APIs offer a streaming mode based on SSE, and their SDKs expose it as an iterator or event callbacks. Coding assistants stream code into the editor; agent frameworks stream both text and tool-call arguments so they can show progress. Some real-time voice APIs use WebSockets or WebRTC instead, because audio flows in both directions.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'A reverse proxy or server framework **buffering** the response, so tokens arrive in one burst at the end (for example, Nginx proxy buffering must be disabled for SSE routes). Parsing each network chunk as one event, which breaks when an event is split across chunks or two arrive together. Calling JSON.parse on the [DONE] line. Rendering partial markdown or code blocks naively, which makes the screen flicker. Forgetting that **moderation and validation** of the full answer can only happen at the end, so a streamed answer may already be visible before a check fails.' },
        { type: 'p', text: '**When not to stream:** back-end jobs where no human is watching (batch summarization, data extraction into a database) gain nothing from streaming and are simpler as one complete response. If you must validate the entire output (for example strict JSON for another program) before anyone sees it, you may also prefer to wait for the full response.' },
      ],
    },
    {
      id: 'split-chunks-example',
      title: 'Worked example, step by step',
      blocks: [
        { type: 'p', text: 'We said a client must keep a buffer "because network chunks can split an event in half". Let us watch that happen. The server writes three events, but the network is free to cut the bytes anywhere. Suppose they reach the client in three arrivals. We write ⏎ for a newline, so ⏎⏎ is the blank line that ends an event.' },
        { type: 'table', caption: 'Three network arrivals carrying three SSE events', head: ['Arrival', 'Bytes that arrive', 'Complete events in the buffer', 'Left in the buffer'], rows: [
          ['1', 'data: {"delta": "Yo', 'None: no blank line yet', 'data: {"delta": "Yo'],
          ['2', 'ur"}⏎⏎data: {"delta": " order"}⏎⏎da', 'Two: "Your" and " order"', 'da'],
          ['3', 'ta: [DONE]⏎⏎', 'One: the end marker', '(empty)'],
        ] },
        { type: 'steps', title: 'What the client does at each arrival', items: [
          { title: 'Arrival 1: wait', text: 'The buffer holds half an event. Its JSON is cut off in the middle of a string, so parsing it now would fail. There is no blank line, so the client does nothing yet.' },
          { title: 'Arrival 2: append, then split', text: 'The new bytes are added to the buffer. Now it contains two blank lines, so two full events can be cut off the front.' },
          { title: 'Render both', text: 'The client parses each one and appends "Your" and then " order" to the screen. One arrival produced two tokens.' },
          { title: 'Keep the rest', text: 'The two letters `da` are the start of the next event. They stay in the buffer.' },
          { title: 'Arrival 3: finish', text: 'The buffer becomes `data: [DONE]` plus a blank line. The client sees the end marker and marks the answer as complete.' },
        ] },
        { type: 'p', text: 'The rule is: **arrivals and events are unrelated**. One arrival can hold no complete event, exactly one, or several. Only blank lines mark event borders.' },
        { type: 'p', text: 'The same problem exists one level lower, for single characters. The network carries bytes, and in UTF-8 many characters need more than one byte: "é" takes two, most emoji take four. A cut can land between those bytes. If the client turns each arrival into text on its own, the first half is not a valid character: it either raises an error or shows up as a "�" on screen. The fix has the same shape as the event buffer: an **incremental decoder** that holds back an incomplete character until its remaining bytes arrive.' },
        { type: 'callout', tone: 'tip', title: 'How to spot these bugs', text: 'They hide on a fast local connection, where each event usually arrives whole. Test your parser by cutting a recorded stream into tiny pieces, even one byte at a time. A correct client gives the same text for every cut.' },
      ],
    },
    {
      id: 'practice-lab',
      title: 'Practice: try it yourself',
      blocks: [
        { type: 'p', text: 'We write a stream reader that survives any cut. We build the bytes of a real-looking stream (with a heartbeat comment and a non-ASCII word), slice them into pieces of different sizes, and check that the client rebuilds the same answer every time. Then we cut the connection early.' },
        { type: 'code', lang: 'python', title: 'practice_sse_chunks.py', code: `import codecs
import json

BLANK = "\\n\\n"                                   # a blank line ends an SSE event
tokens = ["Your", " café", " order", " ships", "."]
events = [": ping"] + ["data: " + json.dumps({"delta": t}, ensure_ascii=False)
                       for t in tokens] + ["data: [DONE]"]
wire = (BLANK.join(events) + BLANK).encode("utf-8")   # the bytes on the network

def cut(data, size):
    """Pretend the network delivers the bytes in pieces of 'size' bytes."""
    return [data[i:i + size] for i in range(0, len(data), size)]

def read_stream(chunks):
    decoder = codecs.getincrementaldecoder("utf-8")()  # remembers half characters
    buffer, text, done = "", "", False
    for chunk in chunks:
        buffer += decoder.decode(chunk)
        while BLANK in buffer:                   # handle complete events only
            event, buffer = buffer.split(BLANK, 1)
            if event.startswith(":"):            # a comment line: heartbeat
                continue
            data = event.removeprefix("data: ")
            if data == "[DONE]":
                done = True
            else:
                text += json.loads(data)["delta"]   # append the delta
    return text, done

for size in (1000, 16, 5):
    chunks = cut(wire, size)
    text, done = read_stream(chunks)
    print(f"{len(chunks):2d} chunks of up to {size:4d} bytes -> {text!r} complete={done}")

text, done = read_stream(cut(wire[:70], 16))     # connection drops after 70 bytes
print(f"dropped after 70 bytes       -> {text!r} complete={done}")

broken = [c for c in cut(wire, 5) if b"\\xc3" in c[-1:]]   # chunk ending mid-character
print("a chunk that ends inside 'é':", broken[0])`, output: ` 1 chunks of up to 1000 bytes -> 'Your café order ships.' complete=True
10 chunks of up to   16 bytes -> 'Your café order ships.' complete=True
30 chunks of up to    5 bytes -> 'Your café order ships.' complete=True
dropped after 70 bytes       -> 'Your café' complete=False
a chunk that ends inside 'é': b' caf\\xc3'`, walkthrough: [
          { lines: [4, 8], note: 'The server side. One heartbeat comment, five token events and the end marker, joined by blank lines and encoded to bytes. This is everything that travels over the network.' },
          { lines: [14, 18], note: 'The client keeps two pieces of state: an incremental decoder for half-received characters and a text buffer for half-received events.' },
          { lines: [19, 28], note: 'Only complete events leave the buffer. Comment lines are skipped, the end marker sets `done`, and every other event is parsed and its delta appended.' },
          { lines: [30, 39], note: 'One big chunk, 10 chunks or 30 chunks give the same text. A stream cut after 70 bytes gives a partial text and `complete=False`. The last line shows a real 5-byte chunk that ends on the first byte of "é".' },
        ] },
        { type: 'p', text: 'Now change it:' },
        { type: 'list', items: [
          'Replace `decoder.decode(chunk)` with `chunk.decode("utf-8")`, which decodes every chunk on its own. Predict what the 1000-byte run prints and what happens in the 5-byte run. Use the last line of the output as a hint.',
          'Change `while BLANK in buffer:` to `if BLANK in buffer:`, so at most one event is handled per chunk. Predict what the 1000-byte run prints now.',
          'Change the drop point from `wire[:70]` to `wire[:40]`. Predict the text and the `complete` flag before running.',
        ] },
        { type: 'check', question: 'When the stream was cut after 70 bytes, part of the " order" event had already arrived. Why does the client show only \'Your café\' and nothing at all from that half-received event?', answer: 'Because the client only acts on **complete** events. The bytes of the " order" event are in the buffer, but no blank line has closed that event, and half of a JSON object cannot be parsed. So the fragment stays in the buffer and never reaches the screen. The client shows exactly the tokens it fully received, and `complete=False` tells the app that the end marker never came.' },
        { type: 'check', question: 'Chunk sizes of 1000, 16 and 5 bytes all give the same text. What does that tell us about network chunks and SSE events, and which two pieces of state make it possible?', answer: 'It tells us the two are unrelated: the network may cut the byte stream anywhere, and the meaning is carried only by the bytes themselves, with blank lines as event borders. Two small memories make the client independent of the cuts: the **event buffer**, which holds text until a blank line completes an event, and the **incremental decoder**, which holds bytes until a multi-byte character is complete.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does token streaming improve?', options: ['The total time the model needs to generate the complete answer', 'The model\'s accuracy, since tokens are checked one by one', 'How soon the user sees the first words (time to first token)', 'The maximum number of tokens the model can generate in one answer'], answer: 2, explain: 'The model still generates tokens at the same speed, so total time is unchanged. Streaming shows each token as soon as it exists, cutting perceived wait.' },
    { q: 'In SSE, what marks the end of one event?', options: ['A blank line', 'A closing curly brace', 'The [DONE] string', 'A Content-Length header'], answer: 0, explain: 'Each event is one or more field lines followed by a blank line. [DONE] ends a whole OpenAI-style stream, not a single event.' },
    { q: 'Prefill takes 300 ms and each token takes 40 ms. For a 100-token answer, roughly when does the first token appear with streaming, and when does a blocking response show anything?', options: ['About 300 ms and 300 ms', 'About 340 ms and 4,300 ms', 'About 4,300 ms and 340 ms', 'About 40 ms and 4,000 ms'], answer: 1, explain: 'The first token arrives after prefill plus one token step, about 340 ms. A blocking response waits for all 100 tokens: 300 + 100 × 40 = 4,300 ms.' },
    { q: 'Your SSE endpoint works locally, but behind a production proxy all tokens appear at once at the end. What is the most likely cause?', options: ['The model stopped generating tokens one at a time in production', 'The client forgot to send "stream": true in its production request', 'SSE does not work over HTTPS, so the browser falls back to polling', 'The proxy buffers the whole response instead of forwarding each chunk'], answer: 3, explain: 'Proxy or framework buffering holds the bytes until the response completes. Disabling buffering for the streaming route fixes it. The local test shows the app itself streams correctly.' },
    { q: 'Which statement comparing SSE and WebSockets is a misconception?', options: ['SSE is one-way: only the server sends events after the request', 'WebSockets let both sides send messages at any time over a single open connection', 'SSE needs a special non-HTTP protocol, which is why most LLM APIs avoid it', 'SSE fits the "one prompt in, many tokens out" pattern of LLM chat well'], answer: 2, explain: 'SSE is an ordinary HTTP response with content type text/event-stream, which is exactly why LLM APIs commonly use it. WebSockets are the ones that upgrade to a separate protocol.' },
  ],
  takeaways: [
    'LLMs generate one token at a time, so each token can be sent as soon as it is produced.',
    'Streaming cuts time to first token; total generation time stays the same.',
    'Most LLM APIs stream with SSE: one open HTTP response, text/event-stream, "data:" events separated by blank lines.',
    'Clients must buffer and split on blank lines, append deltas, and treat the answer as complete only after the end marker.',
    'Use SSE for prompt-in, tokens-out; use WebSockets when both sides must talk continuously.',
  ],
  terms: [
    { term: 'Token streaming', def: 'Sending generated tokens to the client as they are produced instead of all at the end.' },
    { term: 'Time to first token (TTFT)', def: 'The delay between sending a request and seeing the first output token.' },
    { term: 'Server-Sent Events (SSE)', def: 'A web standard for pushing a stream of text events from server to client over one HTTP response.' },
    { term: 'Chunked transfer encoding', def: 'An HTTP/1.1 way to send a body of unknown length as a series of sized pieces.' },
    { term: 'Delta', def: 'The new piece of text in a streamed event, to be appended to what came before.' },
    { term: 'WebSocket', def: 'A persistent, two-way connection that lets client and server send messages at any time.' },
  ],
};
