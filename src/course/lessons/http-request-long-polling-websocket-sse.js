export default {
  id: 'http-request-long-polling-websocket-sse',
  minutes: 22,
  hook: 'HTTP lets a browser ask a server questions, but how does the server tell the browser "you have a new message" the instant it arrives?',
  summary: 'Plain HTTP is request-response: the client asks, the server answers, and the server cannot speak first. Polling asks again and again on a timer; long polling keeps each request open until there is news; WebSocket upgrades one connection into a two-way channel; Server-Sent Events keep one HTTP response open and stream text events from server to client. They trade simplicity, latency, server load and direction of data, and LLM token streaming usually uses SSE.',
  sections: [
    {
      id: 'the-problem',
      title: 'The problem: servers cannot speak first',
      blocks: [
        { type: 'p', text: 'Our running example is a **chat app** in the browser. When Alice sends Bob a message, Bob\'s screen should show it right away. The message reaches our server instantly, but Bob\'s browser does not know it exists. Getting data from server to client *at the moment it happens* is the whole problem of this lesson, and the same problem appears in live scores, stock tickers, notifications, collaborative editors and AI chat apps that stream tokens.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like waiting for a parcel', text: '**Plain HTTP**: you ring the depot once and ask. **Polling**: you ring every five minutes, "Is it here yet?". **Long polling**: you ring and the clerk says "stay on the line, I\'ll tell you when it arrives", then you ring back after each parcel. **SSE**: you subscribe to delivery text messages: the depot texts you, you never text back on that channel. **WebSocket**: you and the clerk have an open walkie-talkie and either can talk at any time.' },
        { type: 'p', text: 'A few terms first. **HTTP** (HyperText Transfer Protocol) is the language browsers and servers use. It runs over **TCP**, a reliable, ordered connection between two machines. **Latency** here means the delay between an event happening on the server and the client seeing it. **Overhead** is the extra work per message: connection setup, HTTP headers (often several hundred bytes or more), and server threads or memory held open.' },
      ],
    },
    {
      id: 'http-request',
      title: 'HTTP request: ask, answer, done',
      blocks: [
        { type: 'p', text: 'A normal **HTTP request** is a single exchange. The client sends a request line and headers (`GET /messages HTTP/1.1`, `Host: chat.example`), the server sends back a status line (`200 OK`), headers and a body, and that exchange is complete. HTTP/1.1 keeps the underlying TCP connection open for reuse (keep-alive), but each exchange is still started by the client. The server has no way to send something unasked.' },
        { type: 'p', text: 'That is perfect for most of the web: loading a page, submitting a form, calling a REST API. It is simple, stateless, cacheable, and works with every proxy and load balancer. It just cannot deliver Bob\'s message on its own. Every technique below is either a clever use of HTTP requests, or a way to step beyond them.' },
      ],
    },
    {
      id: 'polling',
      title: 'HTTP polling and HTTP long polling',
      blocks: [
        { type: 'p', text: '**HTTP polling** (short polling) means the client sends a request on a fixed timer: every 5 seconds, "any new messages since id 41?". The server answers immediately, usually with "no". It is trivially simple, but it wastes requests when nothing happens, and messages wait on average about half the interval before the next poll picks them up. Shorter intervals reduce delay but multiply the load: 10,000 users polling every second is 10,000 requests per second, most of them empty.' },
        { type: 'p', text: '**HTTP long polling** fixes the waste. The client sends a request, and the server **holds it open** without answering until there is something to send or a timeout (say 30 seconds) expires. When a message arrives, the server replies at once; the client handles it and immediately sends a new request. On timeout, the server returns an empty response and the client re-requests. Delivery is now nearly instant, and empty traffic falls to one request per timeout period per idle client.' },
        { type: 'steps', title: 'One long-polling cycle', items: [
          { title: 'Client asks and waits', text: 'Bob\'s browser sends GET /messages?since=41. The server has nothing new, so it parks the request instead of answering.' },
          { title: 'Event happens', text: 'Alice sends a message. The server finds Bob\'s parked request and completes it with the new message (id 42).' },
          { title: 'Client re-requests immediately', text: 'Bob\'s browser shows the message and sends GET /messages?since=42 right away, which is parked again.' },
          { title: 'Timeout keeps it alive', text: 'If nothing happens for 30 s, the server replies "no news" and the client re-requests. This stops proxies from killing a silent connection.' },
          { title: 'Catch-up by cursor', text: 'Because each request says "since=42", messages that arrive in the brief gap between a reply and the next request are not lost; they are returned by the next request.' },
        ] },
        { type: 'p', text: 'Long polling\'s costs: each message still pays for a full HTTP request and response with headers, the server must hold many open requests (cheap with asynchronous servers, expensive with one thread per request), and bursts of messages cause bursts of reconnects. It was the main technique for real-time web apps (sometimes called *Comet*) before WebSocket was widely supported, and it remains a robust fallback.' },
        { type: 'check', question: 'With short polling every 5 seconds, roughly how long does a message wait on average before the client sees it, ignoring network time?', answer: 'About 2.5 seconds: a message arrives at a random moment between two polls, so on average it waits half the interval. The simulation below measures 2,630 ms including network delay.' },
      ],
    },
    {
      id: 'websocket',
      title: 'WebSocket: a two-way channel',
      blocks: [
        { type: 'p', text: '**WebSocket** (standardised as RFC 6455 in 2011) turns an HTTP connection into a persistent, **full-duplex** channel: both sides can send messages at any time, independently. It starts life as an ordinary HTTP request that asks to switch protocols. After the switch, HTTP is gone; the two sides exchange small **frames** (each with just a few bytes of header) that carry text or binary messages.' },
        { type: 'flow', title: 'WebSocket lifecycle', nodes: [
          { label: 'Upgrade request', detail: 'Client sends GET /chat with headers Upgrade: websocket, Connection: Upgrade, and a random Sec-WebSocket-Key.' },
          { label: '101 Switching Protocols', detail: 'Server replies 101 with Sec-WebSocket-Accept = base64(SHA-1(key + a fixed GUID)), proving it understood the WebSocket request.' },
          { label: 'Frames both ways', detail: 'Client and server send text or binary messages whenever they like, over the same TCP connection. Ping/pong frames keep it alive.' },
          { label: 'Close', detail: 'Either side sends a close frame with a status code; the other replies and the TCP connection ends. Clients reconnect if it drops unexpectedly.' },
        ] },
        { type: 'p', text: 'URLs use `ws://` or, encrypted with TLS, `wss://` (always use `wss` in production). WebSocket is ideal when the client also sends frequently: chat, multiplayer games, collaborative editing, trading terminals, and real-time audio for voice agents. The costs: it is a different protocol, so some proxies, firewalls and load balancers need configuration; connections are stateful, so scaling means many long-lived connections per server and a way to route messages to whichever server holds a user\'s socket (often a pub/sub system such as Redis); and we must build our own reconnection, message IDs and catch-up logic.' },
      ],
    },
    {
      id: 'sse',
      title: 'Server-Sent Events (SSE): one-way streaming over HTTP',
      blocks: [
        { type: 'p', text: '**Server-Sent Events** keep a single HTTP response open and let the server write a stream of text events into it. The response has `Content-Type: text/event-stream`. Each event is a few lines like `data: hello` ended by a blank line, optionally with `event:` (a type name) and `id:` fields. In browsers, the built-in `EventSource` API connects, parses events and calls our handler.' },
        { type: 'p', text: 'SSE is **one-way**: server to client. If the client needs to send something, it uses a normal HTTP request (a POST). In exchange, SSE is plain HTTP, so it works with existing proxies, authentication and HTTP/2; and `EventSource` **reconnects automatically**, sending a `Last-Event-ID` header so the server can resume from the last event the client saw. Limits: text only (binary must be encoded, e.g. as base64), and over HTTP/1.1 browsers allow only about six connections per domain, so many SSE tabs can starve other requests (HTTP/2 multiplexing removes most of this problem).' },
        { type: 'callout', tone: 'example', title: 'Where you have seen SSE: LLM token streaming', text: 'When a chat assistant types its answer word by word, the API usually streams tokens as Server-Sent Events: the client POSTs the prompt and the response is an event stream of small JSON chunks, ending with a final event. One-way streaming over plain HTTP fits perfectly: the server produces, the client displays.' },
        { type: 'viz', name: 'streaming', caption: 'A blocking response vs tokens streamed as they are generated. SSE is the usual transport that makes the streaming side possible in a browser.' },
      ],
    },
    {
      id: 'simulate',
      title: 'Code: measuring requests and delay',
      blocks: [
        { type: 'p', text: 'Let us simulate 10 minutes of a chat with 20 messages arriving at random times and a 100 ms round trip. For each method we count HTTP requests and the average delay from "message arrives at server" to "client receives it". We also print the raw bytes of an SSE event and compute a real WebSocket handshake value.' },
        { type: 'code', lang: 'python', title: 'realtime_methods.py', code: `# Compare how a client learns about server events: polling, long polling, push.
import base64, hashlib, random
random.seed(1)

T, RTT = 600.0, 0.1                        # 10 minutes simulated, 100 ms round trip
events = sorted(random.uniform(0, T) for _ in range(20))   # 20 chat messages

def polling(interval):
    polls = int(T / interval)              # one request per interval
    delays = [(int(e / interval) + 1) * interval - e + RTT / 2 for e in events]
    return polls, sum(delays) / len(delays)

def long_polling(timeout=30.0):
    requests, t, delays = 0, 0.0, []
    pending = list(events)
    while t < T:
        requests += 1
        nxt = pending[0] if pending else None
        if nxt is not None and nxt - t <= timeout:   # server answers when event occurs
            delays.append(max(0, t - nxt) + RTT / 2)       # queued if it came early
            t = max(t, nxt) + RTT; pending.pop(0)            # reply, then re-request
        else:
            t += timeout                             # timeout, empty reply, re-request
    return requests, sum(delays) / len(delays)

print("method           requests  avg delay")
for name, (req, d) in [("polling 5 s", polling(5)), ("polling 1 s", polling(1)),
                       ("long polling", long_polling()), ("SSE/WebSocket", (1, RTT / 2))]:
    print(f"{name:15s} {req:9d} {d*1000:8.0f} ms")

# SSE wire format: plain text lines over one HTTP response
print("\\nSSE stream bytes:", repr("id: 7\\nevent: chat\\ndata: hello\\n\\n"))

# WebSocket handshake: server proves it understood the upgrade (RFC 6455 example)
key = "dGhlIHNhbXBsZSBub25jZQ=="
GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
accept = base64.b64encode(hashlib.sha1((key + GUID).encode()).digest()).decode()
print("Sec-WebSocket-Accept:", accept)`,
          output: `method           requests  avg delay
polling 5 s           120     2630 ms
polling 1 s           600      630 ms
long polling           32       50 ms
SSE/WebSocket           1       50 ms

SSE stream bytes: 'id: 7\\nevent: chat\\ndata: hello\\n\\n'
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=`,
          walkthrough: [
            { lines: [5, 6], note: 'Ten simulated minutes, 20 messages at random times, and a 100 ms round trip (so 50 ms one way).' },
            { lines: [8, 11], note: 'Short polling: one request per interval no matter what. A message waits until the next poll tick, then travels one way.' },
            { lines: [13, 24], note: 'Long polling: each request is held until the next message (if it comes within 30 s) or a timeout. After a reply the client re-requests one round trip later; a message that lands in that gap is queued and returned by the next request.' },
            { lines: [26, 29], note: 'Results: polling every 5 s needs 120 requests and averages 2.6 s delay; every 1 s needs 600 requests and still 0.63 s. Long polling needs 32 requests (20 replies + 12 timeouts) with ~50 ms delay. A push connection needs 1 connection and ~50 ms.' },
            { lines: [31, 32], note: 'An SSE event is just text: field lines and a blank line to end the event.' },
            { lines: [34, 38], note: 'The WebSocket accept value for the example key in RFC 6455. Browsers check this before switching to frames.' },
          ] },
        { type: 'chart', kind: 'bar', title: 'Requests in 10 minutes for 20 messages', yLabel: 'HTTP requests / connections', labels: ['Polling 1 s', 'Polling 5 s', 'Long polling', 'SSE / WebSocket'], series: [ { name: 'Requests', values: [600, 120, 32, 1] } ], caption: 'From the simulation output. Push methods use one long-lived connection; real systems add occasional reconnects and keep-alive pings.' },
      ],
    },
    {
      id: 'compare',
      title: 'Side by side: which one when?',
      blocks: [
        { type: 'compare', title: 'Five ways to get data to the client', options: [
          { name: 'HTTP request', summary: 'Client asks once, server answers once.', pros: ['Simplest, cacheable', 'Works everywhere'], cons: ['No server-initiated updates'], bestFor: 'Pages, forms, REST APIs, anything on demand' },
          { name: 'Short polling', summary: 'Client repeats the request on a timer.', pros: ['Trivial to build', 'Plain HTTP'], cons: ['Wasted empty requests', 'Delay ≈ half the interval'], bestFor: 'Infrequent updates where seconds of delay are fine, e.g. a job status page' },
          { name: 'Long polling', summary: 'Server holds each request until news or timeout.', pros: ['Near-instant delivery over plain HTTP', 'Works through strict proxies'], cons: ['Full HTTP overhead per message', 'Many held requests on the server'], bestFor: 'Fallback for real-time when WebSocket/SSE are blocked' },
          { name: 'WebSocket', summary: 'Upgraded, persistent, two-way channel of frames.', pros: ['Full duplex, low overhead per message', 'Text and binary'], cons: ['Separate protocol to operate and scale', 'Manual reconnect and resume logic'], bestFor: 'Chat, games, collaboration, real-time audio' },
        ], rows: [
          ['Direction', 'Client → server, reply', 'Client pulls', 'Client pulls (server delays reply)', 'Both ways'],
          ['Delivery delay', 'On demand only', '≈ interval / 2', '≈ one-way network delay', '≈ one-way network delay'],
          ['Connection', 'Short exchange', 'New request each tick', 'One held request at a time', 'One long-lived connection'],
        ], verdict: 'Need two-way, frequent messages: WebSocket. Need server-to-client streaming (notifications, LLM tokens): SSE. Need maximum compatibility: long polling. Rare updates: just poll.' },
        { type: 'table', caption: 'SSE vs WebSocket, the two modern push options', head: ['Aspect', 'SSE', 'WebSocket'], rows: [
          ['Direction', 'Server → client only', 'Both ways'],
          ['Protocol', 'Plain HTTP response (text/event-stream)', 'HTTP upgrade, then WebSocket frames'],
          ['Data', 'UTF-8 text', 'Text or binary'],
          ['Reconnect', 'Automatic in EventSource, with Last-Event-ID', 'Write it yourself'],
          ['Typical use', 'Feeds, notifications, LLM token streams', 'Chat, games, live collaboration, audio'],
        ] },
        { type: 'timeline', title: 'How real-time web techniques evolved', items: [
          { when: '1990s', title: 'Request-response HTTP', text: 'The web is pages: the browser asks, the server answers. HTTP/1.1 adds persistent connections.' },
          { when: 'Mid-2000s', title: 'Ajax polling and long polling', text: 'Pages update in the background with XMLHttpRequest; long polling ("Comet") makes chat-like apps possible.' },
          { when: 'Around 2009–2015', title: 'Server-Sent Events', text: 'EventSource is specified with HTML5 and supported by major browsers.' },
          { when: '2011', title: 'WebSocket (RFC 6455)', text: 'A standard full-duplex protocol for the browser.' },
          { when: '2020s', title: 'Streaming AI responses', text: 'LLM APIs and chat apps widely use SSE-style streams to show tokens as they are generated.' },
        ] },
      ],
    },
    {
      id: 'pitfalls',
      title: 'Common mistakes and practical tips',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Mistake: reaching for WebSocket by default', text: 'If data only flows from server to client (notifications, dashboards, LLM tokens), SSE is simpler: it is plain HTTP, reconnects automatically and needs no special infrastructure. Use WebSocket when the client also sends frequent messages on the same channel.' },
        { type: 'list', items: [
          '**No resume logic.** Connections drop (phones switch networks). Give every message an ID and let the client ask "since id N" on reconnect, whether with long polling, SSE\'s Last-Event-ID, or your own WebSocket protocol.',
          '**Proxies cutting idle connections.** Send periodic heartbeats (SSE comment lines, WebSocket ping frames) and use timeouts below typical proxy limits.',
          '**Buffering proxies.** Some reverse proxies buffer responses, so SSE events arrive in big delayed chunks; disable response buffering for event-stream routes.',
          '**Thundering herd.** If a server restarts, thousands of clients reconnect at once; add random jitter to reconnect delays.',
          '**Polling too fast.** Polling every 100 ms "to feel real-time" multiplies server load; switch to a push method instead.',
        ] },
        { type: 'check', question: 'We are adding a feature that streams an AI assistant\'s reply into a web page, token by token. The user sends a prompt and then only reads. Which technique fits best, and why?', answer: 'SSE. The prompt goes up in a normal POST, and the reply flows one way, server to client, as a stream of text events. SSE is plain HTTP, reconnects automatically and is what most LLM APIs use; WebSocket would work but adds two-way machinery we do not need.' },
      ],
    },
  ],
  quiz: [
    { q: 'Why can a plain HTTP request-response not deliver a new chat message to the browser the moment it arrives?', options: ['HTTP is too slow to carry text, so messages must be batched first', 'The server only responds to requests; it cannot start an exchange itself', 'Browsers discard any data that arrives while the page is idle', 'HTTP connections always close after the first byte of the response'], answer: 1, explain: 'In HTTP the client always initiates. Every technique in the lesson works around that, either by keeping a request pending (long polling, SSE) or by upgrading to a two-way protocol (WebSocket).' },
    { q: 'In the simulation, how many requests did polling every 1 second make in 10 minutes, and what was its average delay?', options: ['600 requests, about 630 ms', '120 requests, about 2,630 ms', '32 requests, about 50 ms', '1 connection, about 50 ms'], answer: 0, explain: '600 s ÷ 1 s = 600 polls; average wait about half a second plus 50 ms one-way delay ≈ 630 ms. 120 requests was the 5-second interval; 32 was long polling.' },
    { q: 'A multiplayer browser game sends player moves to the server 20 times a second and receives world updates just as often. Which technique fits best?', options: ['Short polling every 5 seconds', 'Server-Sent Events alone', 'Plain HTTP requests on page load', 'WebSocket'], answer: 3, explain: 'Frequent messages in both directions call for a full-duplex channel with low per-message overhead. SSE is one-way, and polling would be slow and wasteful.' },
    { q: 'What is the key difference between long polling and Server-Sent Events?', options: ['Long polling uses WebSocket frames, while SSE sends its events over UDP', 'Long polling needs a new request after each message; SSE streams many events on one response', 'SSE is two-way, while long polling only carries data from server to client', 'Neither differs in practice: both hold a single request open and stream every event through it'], answer: 1, explain: 'Long polling completes a response per message and the client must re-request. SSE streams many events over a single long-lived HTTP response and reconnects automatically if it drops.' },
    { q: 'A teammate says: "WebSocket is just HTTP with keep-alive, so any proxy handles it like a normal request." What is wrong?', options: ['Nothing is wrong: WebSocket traffic is ordinary HTTP with keep-alive', 'WebSocket does not run over TCP, so proxies cannot see its traffic', 'After the 101 upgrade it speaks WebSocket frames, which proxies may need configuring for', 'WebSocket only carries binary data, which proxies drop unless allowed'], answer: 2, explain: 'Only the opening handshake is HTTP. After the upgrade, traffic is WebSocket frames over the same TCP connection, a different protocol that infrastructure must allow. It carries both text and binary.' },
  ],
  takeaways: [
    'HTTP is client-initiated request-response; the server cannot push on its own.',
    'Short polling is simple but wasteful and delays messages by about half the interval.',
    'Long polling holds each request until news or timeout: near-instant delivery over plain HTTP, but one request per message.',
    'WebSocket upgrades to a persistent full-duplex channel: best for frequent two-way messages.',
    'SSE streams text events one way over a single HTTP response with automatic reconnect: ideal for notifications and LLM token streaming.',
  ],
  terms: [
    { term: 'HTTP polling', def: 'The client repeatedly sends requests on a timer to check for new data.' },
    { term: 'Long polling', def: 'The server holds a request open until data is available or a timeout, then the client re-requests.' },
    { term: 'WebSocket', def: 'A protocol that upgrades an HTTP connection into a persistent two-way channel of frames.' },
    { term: 'Server-Sent Events (SSE)', def: 'A one-way stream of text events from server to client over a single HTTP response (text/event-stream).' },
    { term: 'Full duplex', def: 'Both sides can send at the same time, independently.' },
    { term: 'EventSource', def: 'The browser API that opens an SSE stream, parses events and reconnects automatically.' },
  ],
};
