export default {
  id: 'cloud-vs-on-device-model-deployment',
  minutes: 23,
  hook: 'Should your model live in a data center a thousand kilometres away, or inside the phone in your user\'s pocket?',
  summary: 'Deployment is putting a trained model where it can answer real requests. In cloud deployment the model runs on servers and devices send data over the network; in on-device deployment the model ships inside the app and runs locally. The choice trades model size and easy updates (cloud) against latency, privacy, offline use and zero server cost (on-device), and many real products use a hybrid of both.',
  sections: [
    {
      id: 'what-is-deployment',
      title: 'What is deployment? Training vs inference',
      blocks: [
        { type: 'p', text: 'A machine learning model has two lives. First it is **trained**: we show it lots of examples and adjust its numbers (its *weights*) until it gets good at the task. Training is slow and expensive and usually happens once, or once in a while, on powerful GPUs. Then the model is used for **inference**: it receives a new input (a photo, a sentence, a voice clip) and produces an output (a label, a reply, a transcript). Inference happens millions of times, every time a user touches the feature.' },
        { type: 'p', text: '**Deployment** is the step between the two: taking the trained model file and putting it somewhere it can serve inference requests from real users. The big question of deployment is *where* that somewhere is. There are two main answers: on a server in the **cloud**, or directly **on the device** (phone, laptop, car, smart speaker, camera).' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a calculator', text: 'Cloud deployment is like phoning a friend who has a huge calculator: they can do any sum, but you must call, wait for them to pick up, and pay for the call. On-device deployment is like carrying a pocket calculator: it is smaller and can do less, but it answers instantly, works in a tunnel, and nobody hears your numbers.' },
        { type: 'p', text: 'Throughout this lesson we will use one running example: a **photo app** that writes a short caption for each picture a user takes ("a dog running on a beach"). We will ask, for each concern, whether that captioning model should live in the cloud or on the phone.' },
      ],
    },
    {
      id: 'two-ways',
      title: 'Cloud deployment and on-device deployment',
      blocks: [
        { type: 'p', text: 'In **cloud deployment**, the model runs on servers we rent or own (for example GPU machines in a data center). The app sends the photo over the internet to an API endpoint, the server runs the model, and the caption travels back. The app itself contains no model, only code that makes a network request.' },
        { type: 'p', text: 'In **on-device deployment** (also called *edge* deployment), the model file is bundled with the app or downloaded once, and inference runs on the phone\'s own CPU, GPU or NPU (*neural processing unit*, a chip specialised for neural network math). The photo never leaves the phone. Runtimes such as TensorFlow Lite (now also branded LiteRT), Core ML on Apple devices, and ONNX Runtime Mobile exist to run models efficiently on such hardware.' },
        { type: 'flow', title: 'Cloud inference: one request', nodes: [
          { label: 'Take photo', detail: 'The user snaps a picture on the phone. The app compresses it (say to about 200 KB).' },
          { label: 'Upload', detail: 'The photo travels over Wi-Fi or mobile data to our API server. This costs time that depends on the network.' },
          { label: 'Server runs model', detail: 'A GPU server loads the photo, runs the captioning model and produces text. It can use a very large model.' },
          { label: 'Download reply', detail: 'The short caption travels back over the network. Text is tiny, so this part is mostly waiting for the round trip.' },
          { label: 'Show caption', detail: 'The app displays the caption. Total time = network round trip + upload + server compute.' },
        ] },
        { type: 'flow', title: 'On-device inference: one request', nodes: [
          { label: 'Take photo', detail: 'Same as before: the user snaps a picture.' },
          { label: 'Preprocess locally', detail: 'The app resizes the image and converts it to the tensor shape the model expects.' },
          { label: 'Local model runs', detail: 'The bundled model runs on the phone\'s CPU, GPU or NPU. No network is touched.' },
          { label: 'Show caption', detail: 'Total time = local compute only. Works in airplane mode.' },
        ] },
        { type: 'callout', tone: 'note', title: 'The one big difference', text: 'Everything else in this lesson follows from a single fact: **where the computation happens**. Cloud means the data goes to the model; on-device means the model goes to the data. Latency, privacy, model size, cost, updates and offline behaviour are all consequences of that one choice.' },
      ],
    },
    {
      id: 'round-trip-and-data',
      title: 'The round trip problem and where our data goes',
      blocks: [
        { type: 'p', text: '**Latency** is the time from the user\'s action to the result. For cloud inference, latency has three parts: the **round-trip time (RTT)**, which is how long a tiny message takes to go to the server and back; the **upload time**, which is data size divided by upload speed; and the **server compute time**. On good Wi-Fi the RTT might be tens of milliseconds; on a congested mobile network it can be hundreds; in a lift or on a train it can be infinite.' },
        { type: 'p', text: 'Small numbers make this concrete. Suppose the photo is 200 KB = 1,600 kilobits. On a 5 Mbps (5,000 kilobits per second) uplink it takes 1,600 / 5,000 = 0.32 s = 320 ms just to upload. Add a 90 ms RTT and 120 ms of server work and the user waits about 530 ms. On a weak 0.5 Mbps connection the upload alone is 3.2 seconds. The on-device model has no such term: if it takes 350 ms to run locally, it takes 350 ms everywhere.' },
        { type: 'chart', kind: 'bar', title: 'Time to caption one 200 KB photo', yLabel: 'Milliseconds', unit: ' ms', labels: ['Cloud, good Wi-Fi', 'Cloud, 4G', 'Cloud, weak 3G', 'On-device'], series: [ { name: 'Latency', values: [240, 530, 3720, 350] } ], caption: 'Illustrative numbers computed by the code later in this lesson (RTT + upload + 120 ms server time vs 350 ms local). Real figures vary with model, phone and network.' },
        { type: 'p', text: 'The second consequence is **privacy**. In cloud deployment the user\'s photo, voice or text physically leaves the device and lands on someone else\'s computer. It must be encrypted in transit, may be logged, may be subject to data-protection rules such as GDPR or HIPAA, and becomes a target if the server is breached. With on-device inference, the raw data never leaves the phone, which is a strong and easy-to-explain guarantee. This is why features such as keyboard next-word prediction, face unlock and on-device photo search are commonly processed locally.' },
        { type: 'check', question: 'Our photo app is used mostly by travellers on spotty mobile data. Which cloud latency component hurts them most, and why does on-device avoid it?', answer: 'The upload time and the round trip. A 200 KB photo on a slow uplink can take seconds to send, and a bad connection can fail entirely. On-device inference never uses the network, so its latency stays the same in a hotel lobby or a mountain village.' },
      ],
    },
    {
      id: 'size-cost-shipping',
      title: 'Model size, the bill, and the shipping problem',
      blocks: [
        { type: 'p', text: '**How big can the model be?** A model\'s memory is roughly *number of parameters × bytes per parameter*. A 70-billion-parameter model in 16-bit floats needs about 70 × 2 = 140 GB, which needs several data-center GPUs. A phone app might realistically be allowed one or two gigabytes of RAM for a model, shared with everything else the phone is doing. So on-device models are small (from a few megabytes for an image classifier to a few gigabytes for a small language model) and are usually **quantised**: weights stored as 8-bit or 4-bit integers instead of 32-bit floats, shrinking them 4× to 8×. The cloud can host models of almost any size.' },
        { type: 'formula', expr: 'memory ≈ parameters × bytes per parameter', where: [ ['parameters', 'number of learned weights, e.g. 1 billion = 1e9'], ['bytes per parameter', '4 for FP32, 2 for FP16, 1 for INT8, 0.5 for INT4'] ], caption: '1B params at INT8 ≈ 1 GB; 7B at INT4 ≈ 3.5 GB; 70B at FP16 ≈ 140 GB (weights only, before activations).' },
        { type: 'p', text: '**Who pays the bill?** In the cloud, we pay for every inference: GPU hours, or per-token or per-request API fees. The bill grows linearly with users. On-device, the user\'s hardware and battery do the work, so the marginal server cost of one more inference is zero. The trade is that on-device inference drains the user\'s battery and heats the phone, and we pay instead in engineering effort to make the model small and fast.' },
        { type: 'p', text: '**The shipping problem.** Updating a cloud model is easy: replace the file on the server and every user gets the new version on their next request. Updating an on-device model means shipping bytes to every phone, either inside an app update (which users may postpone for months) or as a separate model download. So at any moment, many model versions are live in the wild. Bugs take longer to fix, A/B tests are harder, and the model weights are on the device where a determined person can extract them, which matters if the model is valuable intellectual property.' },
        { type: 'callout', tone: 'note', title: 'What happens when the network is gone?', text: 'A cloud feature simply fails offline, so we must design a fallback: a friendly error, a queue to retry later, or a cached answer. An on-device feature keeps working in airplane mode, underground, or in a region with no coverage. For safety-critical uses (a car\'s lane detection, a factory sensor) "fail when the network drops" is not acceptable, which pushes them firmly on-device.' },
      ],
    },
    {
      id: 'code',
      title: 'Code: putting numbers on the trade-off',
      blocks: [
        { type: 'p', text: 'This small script answers three questions for our photo app: does the model fit on the phone, how long does the user wait, and what does the cloud cost as we grow? All inputs are illustrative assumptions that you can change.' },
        { type: 'code', lang: 'python', title: 'deploy_tradeoffs.py', code: `# Compare cloud vs on-device for one feature: photo captioning in an app.
# All numbers are illustrative assumptions, not measurements.

def model_size_gb(params_billion, bytes_per_param):
    return params_billion * bytes_per_param  # 1e9 params * bytes / 1e9

def cloud_latency_ms(rtt_ms, upload_kb, uplink_mbps, server_ms):
    upload_ms = upload_kb * 8 / (uplink_mbps * 1000) * 1000
    return rtt_ms + upload_ms + server_ms

# 1) Does the model fit on a phone with ~2 GB free for our app?
for name, params, bpp in [("70B fp16", 70, 2), ("7B int4", 7, 0.5), ("1B int8", 1, 1)]:
    gb = model_size_gb(params, bpp)
    print(f"{name:9s} -> {gb:6.1f} GB  fits on phone: {gb <= 2}")

# 2) Latency: cloud round trip vs local compute
for net, rtt, up in [("good wifi", 40, 20), ("4G", 90, 5), ("weak 3G", 400, 0.5)]:
    total = cloud_latency_ms(rtt, upload_kb=200, uplink_mbps=up, server_ms=120)
    print(f"cloud on {net:9s}: {total:7.0f} ms")
print(f"on-device (small model): {350:7.0f} ms, any network, even offline")

# 3) Who pays? Monthly cost of cloud inference as usage grows
cost_per_1k_requests = 0.50  # dollars, illustrative
for users in [1_000, 100_000, 10_000_000]:
    monthly = users * 30 * 5 / 1000 * cost_per_1k_requests  # 5 requests/user/day
    print(f"{users:>10,} users -> cloud bill \${monthly:>12,.0f}/month; on-device $0 server")`,
          output: `70B fp16  ->  140.0 GB  fits on phone: False
7B int4   ->    3.5 GB  fits on phone: False
1B int8   ->    1.0 GB  fits on phone: True
cloud on good wifi:     240 ms
cloud on 4G       :     530 ms
cloud on weak 3G  :    3720 ms
on-device (small model):     350 ms, any network, even offline
     1,000 users -> cloud bill $          75/month; on-device $0 server
   100,000 users -> cloud bill $       7,500/month; on-device $0 server
10,000,000 users -> cloud bill $     750,000/month; on-device $0 server`,
          walkthrough: [
            { lines: [4, 9], note: 'Two tiny formulas: memory = params × bytes per param, and cloud latency = RTT + upload time + server time. Upload time converts KB to kilobits (× 8) and divides by the link speed.' },
            { lines: [11, 14], note: 'Only the 1B INT8 model fits a 2 GB budget. Even a 7B model at 4 bits (3.5 GB) is too big for this particular app, though it can fit on high-end phones with more memory.' },
            { lines: [16, 20], note: 'Cloud latency ranges from 240 ms to over 3.7 s depending on the network; the on-device number does not depend on the network at all.' },
            { lines: [22, 26], note: 'Cloud cost grows linearly with users (5 requests per user per day). On-device has no per-request server cost, though we still pay to build and distribute the model.' },
          ] },
        { type: 'check', question: 'If we switch the cloud model to a 2× faster GPU, server time drops from 120 ms to 60 ms. Roughly what happens to the weak-3G latency?', answer: 'It barely moves: 3,720 ms becomes 3,660 ms. The upload (3,200 ms) and RTT (400 ms) dominate, so faster servers do not help users on slow networks. Only shrinking the upload or moving inference on-device does.' },
      ],
    },
    {
      id: 'hybrid',
      title: 'The hybrid approach',
      blocks: [
        { type: 'p', text: 'We rarely have to pick only one. A **hybrid** design runs a small model on the device for the common, latency-sensitive or private cases and calls a large cloud model only when needed. The device can act as a filter, a first draft, or a fallback.' },
        { type: 'steps', title: 'A hybrid captioning flow', items: [
          { title: 'Run the small local model first', text: 'The phone captions the photo with its on-device model in a few hundred milliseconds and shows the result immediately.' },
          { title: 'Measure confidence', text: 'The local model also reports how confident it is (for example its top probability). Most everyday photos get high confidence.' },
          { title: 'Escalate only hard cases', text: 'If confidence is low, the user asks for a detailed description, and the user has allowed cloud processing, the app sends the photo to the large cloud model.' },
          { title: 'Fall back gracefully', text: 'If the network is down, the local caption stays. The feature degrades instead of breaking.' },
          { title: 'Improve over time', text: 'With consent, aggregated statistics (not raw photos) tell us which cases the small model struggles with, so the next small model can be trained to handle them.' },
        ] },
        { type: 'p', text: 'Other hybrid patterns: **split computing**, where the device runs the first layers of a network and sends a compact intermediate representation to the cloud; **on-device wake word plus cloud assistant**, where a tiny always-on model listens for "Hey ..." locally and only then streams audio to the cloud; and **on-device embedding plus cloud search**, where the phone turns content into vectors locally. The routing idea here (send each request to the cheapest model that can handle it) returns in the lesson on LLM routing.' },
      ],
    },
    {
      id: 'real-examples',
      title: 'Some real examples',
      blocks: [
        { type: 'table', caption: 'Typical placements. Exact designs vary by vendor and change over time.', head: ['Feature', 'Where it usually runs', 'Why'], rows: [
          ['Keyboard next-word suggestions', 'On-device', 'Needs instant response on every keystroke and sees private text'],
          ['Wake word ("Hey ...")', 'On-device', 'Must listen constantly; streaming all audio to the cloud would be costly and invasive'],
          ['Face unlock', 'On-device', 'Biometric data should never leave the phone; must work offline'],
          ['Camera scene detection, portrait blur', 'On-device', 'Runs on every frame of live video; network latency is impossible'],
          ['Large chat assistants (frontier LLMs)', 'Cloud', 'Models with hundreds of billions of parameters do not fit on phones'],
          ['Phone assistant features', 'Hybrid', 'Vendors such as Apple and Google run small models locally and send harder requests to larger server models'],
        ] },
        { type: 'callout', tone: 'example', title: 'Our photo app, decided', text: 'Short captions for search and accessibility: on-device, because they must work offline, are private, and would cost a lot at scale. A "describe this photo in detail" button: cloud, with explicit consent, because quality matters more than speed for that rarely used feature. That is a hybrid.' },
      ],
    },
    {
      id: 'compare-and-choose',
      title: 'Let\'s tabulate the difference, and when to use which',
      blocks: [
        { type: 'compare', title: 'Cloud vs on-device deployment', options: [
          { name: 'Cloud', summary: 'The model runs on servers; devices send inputs over the network.', pros: ['Any model size, the newest large models', 'Update once, everyone gets it', 'Works on cheap or old devices', 'Weights stay private on our servers'], cons: ['Network latency and failure offline', 'User data leaves the device', 'Server cost grows with every request'], bestFor: 'Large generative models, rarely used heavy features, fast-changing models' },
          { name: 'On-device', summary: 'The model ships with the app and runs on the phone\'s own chips.', pros: ['Low, predictable latency', 'Works offline', 'Data stays on the device', 'No per-request server bill'], cons: ['Must be small and usually quantised', 'Slow, fragmented updates', 'Uses battery and memory; varies by phone model'], bestFor: 'Real-time camera/audio, private data, offline use, very high request volume' },
          { name: 'Hybrid', summary: 'A small local model handles most requests; the cloud handles hard ones.', pros: ['Fast and private by default', 'Big-model quality when needed', 'Graceful offline degradation'], cons: ['Two models to build, test and keep consistent', 'Routing logic adds complexity'], bestFor: 'Assistants, cameras with "enhance" features, most mature consumer apps' },
        ], rows: [
          ['Latency', 'Network-dependent (tens of ms to seconds)', 'Compute only, predictable', 'Fast for most, slower for escalated'],
          ['Privacy', 'Data sent to server', 'Data stays local', 'Local by default'],
          ['Model size', 'Practically unlimited', 'MBs to a few GB', 'Both'],
          ['Cost per request', 'Paid by us', 'Paid by user\'s battery', 'Mostly local'],
          ['Updates', 'Instant', 'Via app or model download', 'Mixed'],
          ['Offline', 'Fails', 'Works', 'Degrades gracefully'],
        ], verdict: 'Default to on-device when the task is small, frequent, real-time or private; default to cloud when it needs a big model or changes often; go hybrid when you need both.' },
        { type: 'list', ordered: true, items: [
          '**Does the model fit?** If even the quantised model is far beyond the device\'s memory, it is cloud (or hybrid).',
          '**Is the data sensitive?** Health, biometrics, private messages: prefer on-device.',
          '**Does it need to be real-time or offline?** Live video, audio, cars, field devices: on-device.',
          '**How many requests?** Millions per day of a simple task: on-device saves a large bill.',
          '**How often will the model change?** Weekly improvements or experiments: cloud makes this easy.',
        ] },
      ],
    },
    {
      id: "worked-hybrid-budget",
      title: "Worked example, step by step",
      blocks: [
        { type: "p", text: "The hybrid idea sounds like 'the best of both'. Let us check that with numbers before we believe it. We reuse the figures from the code above, all **illustrative**: 100,000 users, 5 captions each per day, $0.50 per 1,000 cloud requests, 350 ms on the phone, and 530 ms for a cloud call on 4G. The one new number is the **escalation rate**: the share of photos the small model passes to the cloud." },
        { type: "steps", title: "Budgeting a hybrid photo app", items: [
          { title: "Count the requests", text: "100,000 users × 5 per day × 30 days = 15,000,000 captions per month." },
          { title: "Cloud-only bill", text: "15,000,000 / 1,000 × $0.50 = **$7,500** per month, as the script printed." },
          { title: "Hybrid bill", text: "Only escalated requests reach the server. At a 20% escalation rate: 0.20 × $7,500 = **$1,500**. At 5%: $375. The bill is simply the escalation rate times the cloud-only bill." },
          { title: "Hybrid latency for an easy photo", text: "The local model answers alone: **350 ms**, on any network." },
          { title: "Hybrid latency for a hard photo", text: "The phone tries first, then calls the cloud: 350 + 530 = **880 ms** on 4G. That is slower than going to the cloud directly." },
          { title: "Average and break-even", text: "Mean latency on 4G = 350 + rate × 530. At 20% that is 456 ms, better than cloud-only's 530. But set 350 + rate × 530 equal to 530 and we get a rate of about 34%. Above that, hybrid is slower on average than cloud-only on this network." },
        ] },
        { type: "chart", kind: "line", title: "Monthly cloud bill vs escalation rate (illustrative)", xLabel: "Requests escalated to the cloud (%)", yLabel: "Dollars per month", series: [
          { name: "Hybrid bill", points: [[0, 0], [5, 375], [10, 750], [20, 1500], [50, 3750], [100, 7500]] },
        ], caption: "A straight line from $0 (pure on-device) to $7,500 (every request escalated), using the lesson's illustrative prices." },
        { type: "p", text: "So a hybrid design is only as good as its small model. If the phone handles most photos well, we get a small bill, low latency and offline safety. If it passes most photos on, we pay for two models, wait for both, and gain little. The number to watch in production is the escalation rate, and the way to improve it is a better small model, not a faster server." },
      ],
    },
    {
      id: "practice-lab",
      title: "Practice: try it yourself",
      blocks: [
        { type: "p", text: "Averages hide what real users feel. We will simulate 10,000 caption requests arriving on a mix of networks, including some with no connection at all, and compare cloud, on-device and hybrid by their **median**, their **95th percentile** (the wait that only the unluckiest 5% exceed) and their failure rate." },
        { type: "code", lang: "python", title: "practice_deploy_simulation.py", code: `import random
import statistics
random.seed(42)

# Each request happens on some network. Shares and speeds are illustrative.
NETWORKS = [("good wifi", 0.50, 40, 20), ("4G", 0.35, 90, 5),
            ("weak 3G", 0.10, 400, 0.5), ("offline", 0.05, None, None)]
LOCAL_MS, SERVER_MS, PHOTO_KB = 350, 120, 200

def cloud_ms(rtt, uplink_mbps):
    return rtt + PHOTO_KB * 8 / uplink_mbps + SERVER_MS   # kbit / Mbps = ms

def one_request():
    """Return the latency (ms) of cloud, on-device and hybrid; None = failed."""
    _, _, rtt, up = random.choices(NETWORKS, weights=[n[1] for n in NETWORKS])[0]
    cloud = None if rtt is None else cloud_ms(rtt, up)
    hard = random.random() < 0.20                # local model unsure on 20%
    hybrid = LOCAL_MS + (cloud if hard and cloud is not None else 0)
    return cloud, LOCAL_MS, hybrid, hard and cloud is not None

results = [one_request() for _ in range(10_000)]

def report(name, values):
    ok = sorted(v for v in values if v is not None)
    failed = 1 - len(ok) / len(values)
    p95 = ok[int(0.95 * len(ok))]
    print(f"{name:10s} median {statistics.median(ok):5.0f} ms   "
          f"p95 {p95:5.0f} ms   failed {failed:4.1%}")

report("cloud", [r[0] for r in results])
report("on-device", [r[1] for r in results])
report("hybrid", [r[2] for r in results])
escalated = sum(r[3] for r in results) / len(results)
print(f"hybrid sent {escalated:.1%} of requests to the cloud "
      f"-> about {escalated:.0%} of the cloud-only bill")`, output: `cloud      median   240 ms   p95  3720 ms   failed 5.2%
on-device  median   350 ms   p95   350 ms   failed 0.0%
hybrid     median   350 ms   p95   880 ms   failed 0.0%
hybrid sent 19.2% of requests to the cloud -> about 19% of the cloud-only bill`,
          walkthrough: [
            { lines: [6, 11], note: "The network mix: name, share of requests, round-trip time and uplink speed. The latency formula is the same one the lesson used, with the upload written as kilobits divided by megabits per second." },
            { lines: [13, 19], note: "One request. We draw a network, compute the cloud latency (or None when offline), and decide whether the local model is unsure (20% of the time). The hybrid always pays the local 350 ms and adds a cloud call only for hard photos that have a connection." },
            { lines: [23, 28], note: "A small report: sort the successful latencies, read off the median and the 95th percentile, and count failures." },
            { lines: [30, 35], note: "Cloud has the best median (240 ms) but a p95 of 3,720 ms and 5.2% failures. On-device is always 350 ms. Hybrid never fails, has a p95 of 880 ms, and sends about 19% of requests to the cloud." },
          ] },
        { type: "p", text: "Now change it:" },
        { type: "list", items: [
          "Make the audience more rural: set the shares to wifi `0.30`, 4G `0.35`, weak 3G `0.10`, offline `0.25`. Predict the failure rate of cloud and of hybrid before running.",
          "Set `LOCAL_MS = 1200`, as on an old budget phone. Predict the hybrid median and p95. Does on-device still look like the safe default?",
          "Change the unsure share from `0.20` to `0.60`. Predict the hybrid p95 and the share of the cloud-only bill we now pay.",
        ] },
        { type: "check", question: "In the run above, cloud had the best median (240 ms against 350 ms). Why might we still choose on-device or hybrid for a photo app used by travellers?", answer: "The median describes the typical lucky request. The p95 of 3,720 ms says one request in twenty takes close to four seconds, and 5.2% fail outright because there is no connection. Travellers are exactly the users who live in that tail. On-device gives every request 350 ms and no failures; hybrid keeps that floor and adds cloud quality when a connection exists." },
        { type: "check", question: "Suppose the small model becomes unsure on 60% of photos. Using the worked example's numbers on 4G, is hybrid still faster on average than cloud-only, and what happens to the bill?", answer: "No. Mean hybrid latency is 350 + 0.60 × 530 = 668 ms, worse than cloud-only's 530 ms, because most requests now pay for both models. The bill rises to 60% of the cloud-only bill. The break-even is near 34%. The real fix is a better small model (or a smarter confidence check), so that fewer photos need to be escalated." },
      ],
    },
    {
      id: 'pitfalls',
      title: 'Common mistakes and limits',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Mistake: testing only on your own flagship phone', text: 'On-device performance varies hugely across devices. A model that runs in 80 ms on a new high-end phone may take a second or crash with out-of-memory on a five-year-old budget phone. Test on the low end of your user base, and have a fallback (smaller model or cloud) for weak devices.' },
        { type: 'list', items: [
          '**Ignoring the network in cloud latency estimates.** Server benchmarks measure only compute; users experience RTT and upload too.',
          '**Assuming on-device means perfectly private.** The raw input stays local, but logs, analytics or crash reports can still leak data if we are careless.',
          '**Forgetting quantisation costs accuracy.** Shrinking to INT8 or INT4 usually loses a little quality; measure it on real data before shipping.',
          '**No version strategy for on-device models.** Old app versions will keep running old models for months; servers and features must stay compatible with them.',
          '**Using cloud for a tiny model at huge volume.** If a 5 MB classifier is called a billion times a day, paying servers to run it is usually wasteful.',
        ] },
        { type: 'p', text: '**When not to go on-device:** when the task needs a frontier-size model, when results must be identical and auditable for every user, or when the model changes daily. **When not to go cloud:** when the feature must work offline, runs on every camera frame, or processes data users would not want uploaded. In the next lesson we will build a real on-device classifier with TensorFlow Lite on Android.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is the single underlying difference between cloud and on-device deployment from which the other trade-offs follow?', options: ['Cloud models are trained, while on-device models ship untrained', 'Where inference runs: on remote servers or on the user\'s own device', 'The language: Python on the servers, Kotlin or Swift on the phone', 'Whether the weights are quantised to 8-bit integers or kept as floats'], answer: 1, explain: 'Both kinds are trained the same way. The difference is where inference runs; latency, privacy, cost, size and updates all follow from that. Language and quantisation are details, not the root difference.' },
    { q: 'A 200 KB photo is uploaded on a 0.5 Mbps uplink with 400 ms RTT and 120 ms server time. We buy GPUs that halve server time. About how long does a cloud request now take?', options: ['About 1.9 s', 'About 0.5 s', 'About 3.7 s', 'About 3.2 s'], answer: 2, explain: 'Upload is 1,600 kbit / 500 kbit/s = 3.2 s, plus 0.4 s RTT, plus 0.06 s server ≈ 3.66 s. Halving server time barely matters because the network dominates. 3.2 s forgets the RTT and server time.' },
    { q: 'A health app classifies heart-sound recordings and must work in rural clinics with no internet. The model is 20 MB. Which deployment fits best?', options: ['Cloud, because medical models need large GPUs to stay accurate', 'Cloud, with requests queued and retried once the network returns', 'Hybrid, sending every recording to the cloud first for a check', 'On-device: the model is small, the data private, and it must work offline'], answer: 3, explain: 'A 20 MB model easily fits on a phone, the recordings are private health data, and offline operation is a requirement. All three point on-device. Retrying or cloud-first designs fail exactly when the clinic has no connection.' },
    { q: 'Which statement correctly compares updating models in the two approaches?', options: ['Cloud updates reach all users at once; on-device versions roll out slowly and linger', 'On-device updates are instant because the phone re-downloads the model every request', 'Both are equally easy, because a model is just a file that can be swapped anywhere', 'Cloud models need an app store release, while on-device models update silently'], answer: 0, explain: 'Replacing a model on our servers changes it for everyone immediately. On-device models travel inside app updates or downloads, which users install at different times, so many versions run at once.' },
    { q: 'A teammate says: "On-device inference is free, so it is always cheaper." What is the best correction?', options: ['They are right: once the app ships, on-device inference has no costs of any kind', 'No per-request server bill, but costs shift to model shrinking, battery, memory and fallbacks', 'On-device costs more overall, because phones run models far slower than servers do', 'Cloud is cheaper, since providers give free inference to the first million users'], answer: 1, explain: 'The server cost per inference is zero, but the costs move elsewhere: quantisation and optimisation work, testing across devices, battery drain, and sometimes a cloud fallback. Cost is shifted, not eliminated.' },
  ],
  takeaways: [
    'Deployment is putting a trained model where it can serve inference; the key choice is cloud servers vs the user\'s device.',
    'Cloud latency = round trip + upload + server compute; on slow networks the network, not the GPU, dominates.',
    'On-device keeps data local, works offline and has no per-request server cost, but the model must be small (often quantised).',
    'Cloud allows any model size and instant updates, but costs grow with every request and data leaves the device.',
    'Hybrid designs run a small local model by default and escalate hard cases to a big cloud model.',
  ],
  terms: [
    { term: 'Inference', def: 'Using a trained model to produce an output for a new input.' },
    { term: 'Deployment', def: 'Putting a trained model somewhere it can serve inference requests from real users.' },
    { term: 'On-device (edge) deployment', def: 'Running the model locally on the user\'s phone, laptop or embedded hardware.' },
    { term: 'Round-trip time (RTT)', def: 'The time for a small message to travel to a server and for the reply to come back.' },
    { term: 'Quantisation', def: 'Storing model weights with fewer bits (e.g. 8-bit integers) to shrink memory and speed up inference.' },
    { term: 'NPU', def: 'Neural processing unit: a chip on many phones built to run neural network math efficiently.' },
    { term: 'Hybrid deployment', def: 'Combining a small on-device model with a larger cloud model, escalating only when needed.' },
  ],
};
