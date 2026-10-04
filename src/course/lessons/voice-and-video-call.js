export default {
  id: 'voice-and-video-call',
  minutes: 24,
  hook: 'When you video-call a friend, your faces often travel directly between your two phones, so how do two devices hidden behind home routers even find each other?',
  summary: 'A call has two phases. First, signaling: the two apps exchange messages through a server to agree on codecs and share possible network addresses (session descriptions and ICE candidates). Then media flows, ideally peer-to-peer over UDP using WebRTC. Because most devices sit behind NAT routers, a STUN server tells each device its public address so a direct path can be punched through, and when that fails a TURN server relays the media. Codecs such as Opus, VP8, H.264 and AV1 compress the audio and video so it fits the network.',
  sections: [
    {
      id: 'big-picture',
      title: 'The big picture: two phases of a call',
      blocks: [
        { type: 'p', text: 'Our running example: **Asha** in Bengaluru starts a video call with **Ben** in London from a chat app. Within a second or two, they see and hear each other. Under the hood, the call has two phases with very different needs.' },
        { type: 'list', ordered: true, items: [
          '**Signaling (setting up the call).** Small control messages: "Asha is calling Ben", "Ben accepted", "here are the codecs I support", "here are addresses where you might reach me". These go through our servers, typically over WebSocket or HTTPS, because the two devices cannot yet reach each other directly.',
          '**Media (the call itself).** A continuous stream of audio and video packets, about 50 audio packets a second and dozens of video frames a second. This must be fast, so it goes as directly as possible between the two devices, usually over UDP.',
        ] },
        { type: 'callout', tone: 'analogy', title: 'Think of it like arranging to meet a pen pal', text: 'You cannot phone your pen pal because you do not know their number, so you exchange letters through a mutual friend (the signaling server) to agree on a language and swap phone numbers. Once both have the numbers, you talk directly and the friend is no longer involved. If one of you is in a building that blocks direct calls, you ask an operator (TURN) to connect you through their switchboard.' },
        { type: 'p', text: 'Most modern browser and app calling is built on **WebRTC** (Web Real-Time Communication): an open standard and set of APIs, built into all major browsers and available as libraries for mobile, that handle capturing the camera and microphone, encoding, network traversal, encryption and playback. Many native calling apps use their own stacks built on the same ideas (SDP-like negotiation, ICE, STUN, TURN, RTP).' },
      ],
    },
    {
      id: 'signaling',
      title: 'Signaling: agreeing how to talk',
      blocks: [
        { type: 'p', text: 'WebRTC deliberately does **not** define how signaling messages travel; every app chooses its own channel (often a WebSocket to the app server, as in the previous lesson). What WebRTC does define is *what* must be exchanged, using the **offer/answer model**.' },
        { type: 'p', text: 'The exchanged documents are written in **SDP** (Session Description Protocol), a text format listing the media streams (one audio, one video), the codecs each side supports in order of preference, encryption fingerprints, and connection parameters. The caller creates an **offer**; the callee replies with an **answer** that picks compatible options. Separately, each side sends **ICE candidates**: possible network addresses at which it might be reachable. Sending candidates one by one as they are discovered, instead of waiting for all of them, is called **trickle ICE** and speeds up setup.' },
        { type: 'steps', title: 'Setting up Asha\'s call to Ben', items: [
          { title: 'Asha creates an offer', text: 'Her app asks WebRTC for an SDP offer: "audio with Opus; video with VP8, H.264 or AV1; here is my DTLS fingerprint". It sets this as its local description and sends it to the signaling server.' },
          { title: 'Server relays it to Ben', text: 'The signaling server looks up Ben\'s online session and forwards the offer; Ben\'s phone rings.' },
          { title: 'Ben answers', text: 'When Ben accepts, his app sets Asha\'s offer as the remote description, creates an SDP answer choosing codecs both support (say Opus and VP8), and sends it back through the server.' },
          { title: 'Both trickle ICE candidates', text: 'Each side gathers candidate addresses (local, public via STUN, relay via TURN) and sends each one through the signaling server as it is found.' },
          { title: 'Connectivity checks', text: 'ICE pairs up candidates and tests them with small STUN packets sent directly between the devices, picking the best pair that works.' },
          { title: 'Secure media flows', text: 'A DTLS handshake on the chosen path derives keys; audio and video flow as encrypted SRTP packets. The signaling server is no longer in the media path.' },
        ] },
        { type: 'check', question: 'After the call is connected, Asha\'s chat server crashes. Does the video call drop?', answer: 'Usually not. The signaling server was only needed to set the call up. Media flows directly (or via TURN) between the devices, so the call continues; only new signaling, such as adding a participant or renegotiating, would fail until the server recovers.' },
      ],
    },
    {
      id: 'p2p-and-nat',
      title: 'Peer-to-peer connection and the NAT problem',
      blocks: [
        { type: 'p', text: 'A **peer-to-peer (P2P)** connection means media goes straight from one device to the other without passing through our servers. It gives the lowest latency (no detour), costs us no server bandwidth, and keeps media off our infrastructure. The obstacle is **NAT**.' },
        { type: 'p', text: '**NAT** (Network Address Translation) lets many devices on a home or office network share one public IPv4 address. Asha\'s phone has a **private address** such as 192.168.1.20 that is meaningless on the internet. When it sends a packet out, her router rewrites the source to its own public address and a port, say 203.0.113.7:54321, and remembers the mapping so replies can come back in. But the router drops unsolicited packets from strangers. So Ben cannot simply send packets to "192.168.1.20", and he does not know "203.0.113.7:54321" exists.' },
        { type: 'p', text: 'NATs differ in how they create mappings. Many home routers reuse the same public port for a device\'s socket no matter which destination it talks to; these are friendly to P2P. A **symmetric NAT** (common in some corporate and mobile carrier networks) creates a different public port for every destination, so the address learned from one server is useless for reaching another peer. Firewalls that block all UDP are a further obstacle.' },
        { type: 'p', text: 'The framework that solves this is **ICE** (Interactive Connectivity Establishment). Each device gathers three kinds of **candidates**: **host** candidates (its own local addresses, which work on the same network), **server-reflexive** candidates (its public NAT address, learned from STUN), and **relay** candidates (an address on a TURN server). Both sides exchange candidates via signaling, then systematically test pairs and pick the best working one, preferring direct paths over relays.' },
        { type: 'flow', title: 'How ICE finds a path', nodes: [
          { label: 'Gather host', detail: 'List local interfaces: e.g. 192.168.1.20:50000 on Wi-Fi. Works if both peers are on the same network.' },
          { label: 'Ask STUN', detail: 'Send a Binding request to a STUN server; learn the public address the NAT assigned (server-reflexive candidate).' },
          { label: 'Allocate TURN', detail: 'Optionally reserve a relay address on a TURN server, the fallback that works almost everywhere.' },
          { label: 'Exchange via signaling', detail: 'Send all candidates to the other peer through the signaling server (trickle ICE).' },
          { label: 'Connectivity checks', detail: 'Both sides send STUN checks across candidate pairs at the same time. Outgoing packets open NAT mappings so the other side\'s packets can get in: this is UDP hole punching.' },
          { label: 'Nominate best pair', detail: 'Choose the highest-priority pair that works: host, then server-reflexive, then relay.' },
        ] },
      ],
    },
    {
      id: 'stun-turn',
      title: 'STUN server and TURN server',
      blocks: [
        { type: 'p', text: 'A **STUN server** (Session Traversal Utilities for NAT) answers one question: "what IP address and port do you see my packet coming from?". The device sends a small Binding request over UDP; the server replies with the source address it observed, which is the device\'s public NAT mapping. STUN servers are cheap to run because they handle only tiny packets and never carry media. Once both peers know their public addresses and send checks to each other simultaneously, their NATs usually let the traffic through.' },
        { type: 'p', text: 'A **TURN server** (Traversal Using Relays around NAT) is the fallback for when a direct path cannot be made, for example with symmetric NATs on both sides or firewalls that block UDP. The device allocates a relay address on the TURN server, and all media goes device → TURN → other device. TURN can also run over TCP or TLS on port 443, which gets through most restrictive firewalls. It always works, but it adds latency (a detour through the server) and costs us real bandwidth, since every byte of every relayed call passes through our infrastructure.' },
        { type: 'code', lang: 'python', title: 'stun_ice_sim.py', code: `# A STUN Binding exchange (RFC 5389 format), simulated offline, then ICE-style choice.
import ipaddress, struct

COOKIE = 0x2112A442
txn = bytes.fromhex("a1b2c3d4e5f6a7b8c9d0e1f2")   # 12-byte transaction id (fixed for demo)

# 1) Client -> STUN server: "What address do you see me as?"
request = struct.pack("!HHI", 0x0001, 0, COOKIE) + txn   # type=Binding Request, length=0
print("request:", request.hex(), f"({len(request)} bytes)")

# 2) Server sees the packet arrive from the NAT's public side and answers.
public_ip, public_port = "203.0.113.7", 54321            # what the NAT mapped us to
x_port = public_port ^ (COOKIE >> 16)
x_addr = int(ipaddress.IPv4Address(public_ip)) ^ COOKIE
attr = struct.pack("!HHBBHI", 0x0020, 8, 0, 0x01, x_port, x_addr)  # XOR-MAPPED-ADDRESS
response = struct.pack("!HHI", 0x0101, len(attr), COOKIE) + txn + attr

# 3) Client parses the response to learn its public (server-reflexive) address.
mtype, mlen, cookie = struct.unpack("!HHI", response[:8])
assert mtype == 0x0101 and response[8:20] == txn         # Binding Success, our txn
atype, alen, _, fam, xp, xa = struct.unpack("!HHBBHI", response[20:32])
port = xp ^ (COOKIE >> 16)
ip = ipaddress.IPv4Address(xa ^ COOKIE)
print(f"STUN says our public address is {ip}:{port}")

# 4) ICE: gather candidates, try pairs, prefer direct paths over relays
candidates = [("host", "192.168.1.20:50000", 126),
              ("srflx", f"{ip}:{port}", 100),            # learned via STUN
              ("relay", "198.51.100.9:3478", 0)]         # allocated on a TURN server
def connect(peer_nat):
    for kind, addr, pref in sorted(candidates, key=lambda c: -c[2]):
        works = ((kind == "host" and peer_nat == "same LAN") or
                 (kind == "srflx" and peer_nat != "symmetric") or kind == "relay")
        if works:
            return f"{kind:5s} via {addr}"
for nat in ["same LAN", "home router", "symmetric"]:
    print(f"peer behind {nat:11s} -> {connect(nat)}")`,
          output: `request: 000100002112a442a1b2c3d4e5f6a7b8c9d0e1f2 (20 bytes)
STUN says our public address is 203.0.113.7:54321
peer behind same LAN    -> host  via 192.168.1.20:50000
peer behind home router -> srflx via 203.0.113.7:54321
peer behind symmetric   -> relay via 198.51.100.9:3478`,
          walkthrough: [
            { lines: [4, 9], note: 'A real STUN Binding request is just 20 bytes: message type 0x0001, length 0, the fixed "magic cookie" 0x2112A442, and a random 12-byte transaction ID that matches requests to responses.' },
            { lines: [11, 16], note: 'We play the server. It saw our packet arrive from 203.0.113.7:54321 (the NAT\'s public mapping) and returns it in an XOR-MAPPED-ADDRESS attribute. The address is XORed with the cookie so that NATs which rewrite addresses inside packets do not corrupt it.' },
            { lines: [18, 24], note: 'The client checks the response type (0x0101, Binding Success) and transaction ID, then undoes the XOR to recover its public address: its server-reflexive candidate.' },
            { lines: [26, 37], note: 'A toy ICE decision with the standard type preferences (host 126, server-reflexive 100, relay 0). Real ICE tests pairs from both sides in parallel; here, a peer on the same LAN connects directly, a typical home router works via the STUN address, and a symmetric NAT falls back to the TURN relay.' },
          ] },
        { type: 'compare', title: 'Three ways media can travel', options: [
          { name: 'Direct (host / STUN)', summary: 'Packets go straight between the two devices after NAT traversal.', pros: ['Lowest latency', 'No server bandwidth cost', 'Media never touches our servers'], cons: ['Fails with some NATs and firewalls', 'Each peer uploads to every other peer in a group'], bestFor: 'One-to-one calls on typical home and mobile networks' },
          { name: 'TURN relay', summary: 'Both devices send media to a relay server that forwards it.', pros: ['Works almost everywhere, even over TCP/TLS 443'], cons: ['Extra latency', 'We pay for all relayed bandwidth'], bestFor: 'Fallback when direct connection fails' },
          { name: 'SFU (media server)', summary: 'Each participant sends one stream to a Selective Forwarding Unit, which forwards it to everyone else.', pros: ['Scales group calls', 'Can pick quality per receiver'], cons: ['Server cost and operations', 'Server sees encrypted media routing (end-to-end encryption needs extra work)'], bestFor: 'Group calls and webinars' },
        ], rows: [
          ['Path', 'Device ↔ device', 'Device → TURN → device', 'Device → SFU → many devices'],
          ['Latency', 'Lowest', 'Higher (detour)', 'Low to moderate'],
          ['Server bandwidth', 'None (only STUN)', 'All media', 'All media, but upload once per sender'],
        ], verdict: 'Always configure both STUN and TURN for 1:1 calls; use an SFU once calls have more than a few participants.' },
      ],
    },
    {
      id: 'media-and-codecs',
      title: 'Carrying the media: RTP, codecs and bad networks',
      blocks: [
        { type: 'p', text: 'Once a path exists, media travels in **RTP** (Real-time Transport Protocol) packets, each with a sequence number and timestamp so the receiver can reorder them and play them at the right time. In WebRTC, RTP is always encrypted as **SRTP**, with keys negotiated by a DTLS handshake, so a STUN or TURN server cannot listen in on a 1:1 call. **RTCP** packets carry feedback such as packet loss and round-trip time.' },
        { type: 'p', text: 'Media goes over **UDP**, not TCP, on purpose. TCP retransmits every lost packet and holds back everything behind it until the gap is filled. For a live call, a frame that arrives half a second late is useless; it is better to skip it and keep going. UDP lets the application decide what to do about loss.' },
        { type: 'p', text: 'A **codec** (coder-decoder) compresses media. Raw 720p video at 30 frames per second is roughly 1280 × 720 × 1.5 bytes × 30 ≈ 41 MB/s (in common YUV 4:2:0 format), hopeless on a phone network; a video codec brings that to around a megabit or two per second by sending mostly differences between frames. In WebRTC, **Opus** is the mandatory audio codec (flexible from a few kbps up to high-quality music, robust to loss); **VP8** and **H.264** are the mandatory video codecs, and **VP9** and **AV1** are widely supported for better compression at the cost of more CPU.' },
        { type: 'list', items: [
          '**Jitter buffer:** packets arrive with uneven delay (jitter); the receiver holds a few tens of milliseconds of audio to play it smoothly, growing the buffer on bad networks.',
          '**Packet loss concealment and FEC:** Opus can guess a missing 20 ms of audio, and forward error correction sends a little redundant data so a lost packet can be rebuilt.',
          '**NACK and keyframes:** the receiver can ask for a lost video packet again, or request a fresh full frame (keyframe) if decoding broke.',
          '**Congestion control and simulcast:** the sender estimates available bandwidth and lowers bitrate or resolution when the network struggles; with simulcast it sends several qualities so an SFU can forward the right one to each receiver.',
          '**Echo cancellation and noise suppression:** stop the remote voice coming out of your speaker from being sent back, and remove keyboard and fan noise.',
        ] },
        { type: 'chart', kind: 'line', title: 'Upload needed per participant in a group video call', xLabel: 'Participants in the call', yLabel: 'Upload (Mbps)', series: [ { name: 'Mesh (P2P to everyone)', points: [[2, 1.5], [3, 3], [4, 4.5], [5, 6], [6, 7.5], [8, 10.5]] }, { name: 'SFU (send once)', points: [[2, 1.5], [3, 1.5], [4, 1.5], [5, 1.5], [6, 1.5], [8, 1.5]] } ], caption: 'Illustrative, assuming 1.5 Mbps per video stream. In a mesh each person uploads (n − 1) copies; with an SFU each uploads one (or a few simulcast layers). This is why group calls use media servers.' },
      ],
    },
    {
      id: 'real-world',
      title: 'Real-world architecture and timeline',
      blocks: [
        { type: 'callout', tone: 'example', title: 'A production calling stack', text: 'Mobile and web clients with WebRTC; a signaling service over WebSocket handling presence, ringing, offer/answer and ICE candidates; STUN and TURN servers in several regions (TURN on UDP plus TLS 443 for strict networks); SFUs for group calls; push notifications to wake up a phone for incoming calls; and call-quality metrics (round-trip time, loss, jitter, bitrate, freeze counts) collected from clients. Voice AI agents, from the earlier lesson, plug into the same stack: the agent joins the call as a WebRTC peer or SFU participant.' },
        { type: 'timeline', title: 'Milestones in internet calling', items: [
          { when: '1996', title: 'RTP standardised', text: 'The Real-time Transport Protocol for audio and video over IP is published (later updated as RFC 3550 in 2003).' },
          { when: '2008', title: 'STUN revised', text: 'RFC 5389 defines modern STUN, including the magic cookie and XOR-MAPPED-ADDRESS used in our code.' },
          { when: '2010', title: 'TURN and ICE', text: 'RFC 5766 (TURN) and RFC 5245 (ICE) define relaying and the candidate-checking process; ICE was later revised as RFC 8445.' },
          { when: '2011', title: 'WebRTC project announced', text: 'Google open-sources WebRTC technology and standardisation work begins at the W3C and IETF.' },
          { when: '2021', title: 'WebRTC 1.0 a W3C Recommendation', text: 'Real-time audio and video become a formal web standard supported by all major browsers.' },
        ] },
      ],
    },
    {
      id: 'pitfalls',
      title: 'Common mistakes and when P2P is not enough',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Mistake: shipping without a TURN server', text: 'Calls work perfectly in testing on office Wi-Fi and home networks, then fail for some users on corporate networks or certain mobile carriers. STUN alone cannot get through symmetric NATs or UDP-blocking firewalls. Always deploy TURN (with TLS on port 443) as a fallback and monitor how many calls use it.' },
        { type: 'list', items: [
          '**Confusing signaling with media.** The signaling server does not carry audio or video; scaling it is about connections and messages, not bandwidth.',
          '**Leaving TURN open to anyone.** Use short-lived credentials generated per user, or strangers will use your relay as free bandwidth.',
          '**Mesh for big groups.** Beyond about 3 or 4 participants, upload and CPU explode; use an SFU.',
          '**Ignoring network changes.** When a phone switches from Wi-Fi to mobile data, the path breaks; use ICE restarts to find a new one.',
          '**Testing only on perfect networks.** Simulate loss, jitter and low bandwidth; tune jitter buffers and bitrate adaptation.',
        ] },
        { type: 'check', question: 'Ben is on a corporate network with a symmetric NAT and a firewall that blocks UDP. Which candidate type will the call most likely use, and over what transport?', answer: 'A relay candidate on a TURN server, reached over TCP or TLS on port 443. The STUN-learned address is useless with a symmetric NAT, and UDP is blocked, so TURN over TLS is the path that gets through.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the job of signaling in a WebRTC call?', options: ['Carrying the audio and video packets between peers for the whole call', 'Exchanging SDP offer/answer and ICE candidates so the peers can connect', 'Compressing the video frames with a codec such as VP8 before sending them', 'Relaying the media through a server whenever NAT traversal fails'], answer: 1, explain: 'Signaling carries setup messages: SDP offer/answer and ICE candidates. Media flows separately; relaying media is TURN\'s job, and compression is the codec\'s.' },
    { q: 'In our STUN simulation the response says 203.0.113.7:54321 while the phone\'s own address is 192.168.1.20. What does 203.0.113.7:54321 represent?', options: ['The STUN server\'s own public address, which our packets are sent to', 'The peer\'s private address, learned from its ICE candidates', 'The public address and port our NAT mapped us to (server-reflexive)', 'A relay address that a TURN server allocated for our media'], answer: 2, explain: 'STUN reports the source address it observed, which is the NAT\'s public mapping of our socket. That becomes the server-reflexive candidate. The relay address came from TURN.' },
    { q: 'Users on one mobile carrier report that calls connect but no video or audio flows, while everyone else is fine. The app only configures a STUN server. What should we add?', options: ['A TURN server, ideally also reachable over TLS on port 443', 'A second STUN server hosted on a different network', 'A bigger signaling server so offers and answers arrive faster', 'A higher video bitrate so the media survives packet loss'], answer: 0, explain: 'Their network likely uses symmetric NAT or blocks UDP, so the STUN-learned path does not work. TURN relays media and works where direct paths fail. More STUN or signaling capacity does not help.' },
    { q: 'How does a direct peer-to-peer path compare with a TURN relay?', options: ['TURN is usually faster, because relay servers sit on better networks than users', 'They are identical in latency and cost; TURN only changes the IP addresses', 'Direct paths cannot be encrypted, so TURN is needed whenever privacy matters', 'Direct is faster and costs us no bandwidth; TURN works nearly everywhere at a cost'], answer: 3, explain: 'Relaying sends every packet via the server, adding delay and bandwidth cost, in exchange for reliability. WebRTC encrypts media in both cases (SRTP).' },
    { q: 'A teammate says: "Media should use TCP because it is reliable, so we never lose a frame." Why do real-time calls prefer UDP?', options: ['UDP is encrypted by default while TCP is not, so only UDP keeps calls private', 'TCP cannot carry binary data, so audio frames would have to be text-encoded', 'TCP stalls new packets behind lost ones; over UDP the app can skip or conceal losses', 'UDP guarantees in-order delivery, so no frame is lost or delayed in the first place'], answer: 2, explain: 'For live media, freshness beats completeness. TCP\'s head-of-line blocking causes freezes; over UDP, jitter buffers, FEC and concealment handle loss. TCP is only a fallback, for example TURN over TLS.' },
  ],
  takeaways: [
    'A call = signaling (offer/answer and ICE candidates through a server) + media (ideally direct between devices).',
    'NAT hides devices behind shared public addresses; ICE gathers host, server-reflexive and relay candidates and tests pairs.',
    'STUN tells a device its public address so UDP hole punching can create a direct path; it never carries media.',
    'TURN relays media when direct paths fail; it is essential in production but adds latency and bandwidth cost.',
    'Media uses encrypted RTP over UDP with codecs (Opus, VP8/H.264, VP9, AV1), jitter buffers and congestion control; group calls use SFUs.',
  ],
  terms: [
    { term: 'Signaling', def: 'Exchanging setup messages (session descriptions and network candidates) between call participants through a server.' },
    { term: 'SDP', def: 'Session Description Protocol: a text format describing media streams, codecs and connection details in an offer or answer.' },
    { term: 'NAT', def: 'Network Address Translation: a router maps many private addresses to one public address and port.' },
    { term: 'ICE', def: 'Interactive Connectivity Establishment: gathers candidate addresses and tests pairs to find a working path.' },
    { term: 'STUN server', def: 'A server that tells a device which public IP address and port its packets appear to come from.' },
    { term: 'TURN server', def: 'A server that relays media between peers when they cannot connect directly.' },
    { term: 'SFU', def: 'Selective Forwarding Unit: a media server that receives each participant\'s stream once and forwards it to others.' },
    { term: 'Codec', def: 'Software that compresses and decompresses audio or video, such as Opus or VP8.' },
  ],
};
