export default {
  id: 'llm-routing',
  minutes: 19,
  hook: 'Why pay a top-tier model to answer "How do I reset my password?" a million times a day?',
  summary: 'LLM routing puts a small decision layer, the router, in front of several language models and sends each query to the cheapest model that can answer it well. Routers can use rules, a trained classifier, embeddings, or a cascade that tries a small model first and escalates when its answer looks weak. Done well, routing cuts cost and latency sharply while keeping quality close to always using the biggest model.',
  sections: [
    {
      id: 'big-picture',
      title: 'The big picture: one size does not fit all queries',
      blocks: [
        { type: 'p', text: 'Imagine we run a **customer-support chatbot** for a software company. Every day it receives thousands of messages. Most are simple: "How do I reset my password?", "Where is my invoice?", "What are your opening hours?". A few are hard: "I was double-charged after downgrading my plan mid-cycle; explain why and fix it." Today we send every message to the same large, expensive model.' },
        { type: 'p', text: 'Language models come in many sizes. Large frontier models are strongest at multi-step reasoning, but they cost far more per token and respond more slowly. Small models are cheap and fast, and on easy questions they are often just as good. Sending everything to the large model wastes money on easy questions; sending everything to the small model fails the hard ones.' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like a hospital triage desk', text: 'A triage nurse looks at each patient for a minute and decides: a bandage from the nurse, a visit to the general doctor, or the specialist surgeon. The surgeon is not wasted on scraped knees, and serious cases are not left with the bandage. An LLM router is the triage desk for queries.' },
      ],
    },
    {
      id: 'what-and-why',
      title: 'What LLM routing is and why we need it',
      blocks: [
        { type: 'p', text: '**LLM routing** is the practice of choosing, for each incoming request, which model (or which provider, or which configuration) should handle it. The component that decides is the **router**. The pool of models it chooses from is often called the **model pool** or set of **candidates**. The router\'s goal is usually stated as: maximise answer quality subject to a cost or latency budget, or minimise cost subject to a quality floor.' },
        { type: 'list', items: [
          '**Cost.** Prices per million tokens can differ by one or two orders of magnitude between small and large models. If 70% of traffic is easy, moving it to a small model cuts the bill dramatically.',
          '**Latency.** Small models usually return the first token sooner and generate faster, so easy questions feel instant.',
          '**Quality.** Routing also works upward: hard or specialised queries (code, maths, legal) can go to the model that is best at them, which can beat any single model.',
          '**Reliability.** If one provider is down or rate-limited, the router can fail over to another model.',
          '**Specialisation.** Some models are better at certain languages, at coding, or at long contexts; routing lets each do what it is good at.',
        ] },
        { type: 'viz', name: 'llm-routing', caption: 'Move the threshold: a lower threshold sends more queries to the large model (higher quality, higher cost); a higher threshold saves money but risks hard queries landing on the small model.' },
      ],
    },
    {
      id: 'anatomy',
      title: 'Anatomy of an LLM router',
      blocks: [
        { type: 'p', text: 'Every router, simple or sophisticated, has the same parts: something that reads the query, something that scores it, a policy that turns the score into a choice, and a feedback loop that keeps the router honest.' },
        { type: 'flow', title: 'Parts of a router', nodes: [
          { label: 'Request', detail: 'The user message plus context: conversation history, user tier, language, attached files, required tools.' },
          { label: 'Feature extraction', detail: 'Cheap signals: length, keywords, detected intent, language, an embedding vector of the query. Must be much cheaper than calling an LLM.' },
          { label: 'Scorer', detail: 'Estimates something useful, such as "probability the small model answers well" or "difficulty from 0 to 1". Could be rules, a classifier, or similarity to past queries.' },
          { label: 'Policy', detail: 'Turns the score into a decision with a threshold and constraints: e.g. if difficulty > 0.35, use the large model; premium users always get the large model; fall back if a provider fails.' },
          { label: 'Model call', detail: 'The chosen model answers. The response is returned to the user.' },
          { label: 'Logging and feedback', detail: 'Log the route, cost, latency and quality signals (ratings, escalations to humans, eval scores). Use them to retrain the scorer and re-tune the threshold.' },
        ] },
        { type: 'p', text: 'Two numbers define a router\'s value: its **overhead** (extra milliseconds and money per request spent deciding) and its **accuracy** (how often it sends a query to a model that can actually handle it). A router that costs as much as the small model, or that misroutes hard queries often, can make things worse than no router at all.' },
      ],
    },
    {
      id: 'strategies',
      title: 'Routing strategies',
      blocks: [
        { type: 'p', text: 'There are four common families of routing strategy. Many production systems combine two of them.' },
        { type: 'compare', title: 'Four ways to decide', options: [
          { name: 'Rule-based', summary: 'Hand-written if/else: keywords, length, intent, user tier.', pros: ['Zero ML, instant', 'Easy to explain and debug'], cons: ['Brittle; misses paraphrases', 'Rules pile up over time'], bestFor: 'Clear-cut cases: code questions to a coding model, short FAQs to a small model' },
          { name: 'Classifier', summary: 'A small trained model predicts difficulty or "will the small model succeed?".', pros: ['Learns subtle patterns', 'One threshold to tune cost vs quality'], cons: ['Needs labelled training data', 'Must be retrained when models change'], bestFor: 'High-volume apps with logs of past queries and outcomes' },
          { name: 'Semantic (embedding)', summary: 'Embed the query, compare to example queries for each route, pick the nearest.', pros: ['Handles paraphrase', 'Add a route by adding examples'], cons: ['Similar wording can hide very different difficulty'], bestFor: 'Topic or intent routing (billing vs tech support vs sales)' },
          { name: 'Cascade', summary: 'Try the cheap model first; check its answer; escalate to a bigger model only if it looks weak.', pros: ['No need to predict difficulty upfront', 'Judges the real answer'], cons: ['Hard queries pay for two calls', 'Needs a reliable answer-quality check'], bestFor: 'When a verifier exists: tests for code, schema checks, confidence scores' },
        ], rows: [
          ['Decides from', 'Query text and metadata', 'Learned score of the query', 'Similarity to examples', 'The small model\'s actual answer'],
          ['Added latency', 'Near zero', 'A few ms', 'An embedding call', 'A whole extra LLM call on escalation'],
          ['Training data', 'None', 'Labelled outcomes', 'Example queries per route', 'None for routing; a checker'],
        ], verdict: 'Start with rules for the obvious cases, add a classifier or semantic router as logs accumulate, and use a cascade where answers can be verified cheaply.' },
        { type: 'p', text: 'Two research names are useful to know. **FrugalGPT** (Chen, Zaharia and Zou, 2023) studied LLM cascades with a learned scorer that decides whether to accept an answer or try a stronger model. **RouteLLM** (from the LMSYS team, 2024) is an open-source framework for training routers between a strong and a weak model from human preference data. Both reported large cost savings at similar quality on their benchmarks; exact savings depend heavily on the traffic mix.' },
        { type: 'check', question: 'A cascade sends every query to the small model first. For a query that ends up escalated, how does its cost compare with sending it straight to the large model?', answer: 'It costs more: we paid for the small model\'s attempt and then the large model\'s answer, and the user waited for both. Cascades pay off only when most queries are accepted at the first, cheap step.' },
      ],
    },
    {
      id: 'trace',
      title: 'A full trace example',
      blocks: [
        { type: 'p', text: 'Let us follow one message through a hybrid router for our support bot. The pool has a small model (cheap, fast) and a large model (strong, expensive). The router combines a few rules with a difficulty classifier, using a threshold of 0.35.' },
        { type: 'steps', title: '"Why was I double-charged after a downgrade?"', items: [
          { title: 'Request arrives', text: 'The message comes in with metadata: a free-tier user, English, no attachments, two earlier turns in the conversation.' },
          { title: 'Rules check', text: 'No rule fires: it is not a coding question, not a language that needs a special model, and the user is not on a premium tier that always gets the large model.' },
          { title: 'Classifier scores it', text: 'A small classifier, a few milliseconds of CPU, estimates difficulty 0.72. Signals: the word "double-charged", a mention of plan changes, a request for an explanation.' },
          { title: 'Policy decides', text: '0.72 > 0.35, so the request goes to the large model. A password-reset question scoring 0.08 would have gone to the small one.' },
          { title: 'Large model answers', text: 'It calls the billing tool, reads the invoices, and explains the proration. The response is returned.' },
          { title: 'Log for learning', text: 'We record the route, tokens, cost, latency, and later whether the user rated the answer or escalated to a human. These logs become training data for the next version of the classifier.' },
        ] },
        { type: 'p', text: 'Now let us simulate a whole day of traffic to see how the threshold trades cost against quality.' },
        { type: 'code', lang: 'python', title: 'router_sim.py', code: `# Simulate an LLM router for a support chatbot: small vs large model.
import numpy as np
rng = np.random.default_rng(42)

N = 10_000
difficulty = rng.beta(2, 5, N)                 # most queries are easy (near 0)
# Router's estimate of difficulty = truth + noise (a cheap classifier)
predicted = np.clip(difficulty + rng.normal(0, 0.08, N), 0, 1)

COST = {"small": 0.0002, "large": 0.01}        # $ per query (illustrative)
def p_correct(model, d):                       # chance the answer is good
    return 1 - 1.2 * d**2 if model == "small" else 1 - 0.3 * d

def evaluate(threshold):
    to_large = predicted > threshold
    cost = np.where(to_large, COST["large"], COST["small"]).sum()
    quality = np.where(to_large, p_correct("large", difficulty),
                       p_correct("small", difficulty)).mean()
    return to_large.mean(), cost, quality

print("strategy           %->large   cost($)  quality")
for name, t in [("always small", 1.01), ("router t=0.50", 0.50),
                ("router t=0.35", 0.35), ("router t=0.20", 0.20),
                ("always large", -0.01)]:
    share, cost, q = evaluate(t)
    print(f"{name:16s} {share:9.1%} {cost:9.2f} {q:8.3f}")

# Trace: the router's decision for three example queries (t = 0.35)
for query, d_hat in [("How do I reset my password?", 0.08),
                     ("Summarise my last 3 invoices", 0.31),
                     ("Why was I double-charged after a downgrade?", 0.72)]:
    print(f"{d_hat:.2f} -> {'large' if d_hat > 0.35 else 'small':5s} | {query}")`,
          output: `strategy           %->large   cost($)  quality
always small          0.0%      2.00    0.871
router t=0.50        12.5%     14.28    0.898
router t=0.35        33.5%     34.84    0.914
router t=0.20        65.1%     65.83    0.919
always large        100.0%    100.00    0.914
0.08 -> small | How do I reset my password?
0.31 -> small | Summarise my last 3 invoices
0.72 -> large | Why was I double-charged after a downgrade?`,
          walkthrough: [
            { lines: [5, 8], note: '10,000 queries with a true difficulty from a Beta(2, 5) distribution, so most are easy. The router does not see the truth; it sees a noisy estimate, like a real classifier.' },
            { lines: [10, 12], note: 'Illustrative prices (the large model is 50× more expensive) and quality curves: the small model is excellent on easy queries but collapses on hard ones; the large model degrades slowly.' },
            { lines: [14, 19], note: 'For a threshold t, every query with estimated difficulty above t goes to the large model. We total the cost and average the chance of a good answer.' },
            { lines: [21, 26], note: 'At t = 0.35 we send only a third of traffic to the large model, pay about 35% of the always-large bill, and match its quality (0.914). At t = 0.20 quality is even slightly higher, because the small model is better than the large one on the very easiest queries in this toy setup.' },
            { lines: [28, 32], note: 'The same policy applied to three named queries from the trace above.' },
          ] },
        { type: 'chart', kind: 'line', title: 'Cost vs quality as the threshold moves', xLabel: 'Cost for 10,000 queries ($)', yLabel: 'Average quality', series: [ { name: 'Router (always-small → always-large)', points: [[2, 0.871], [14.28, 0.898], [34.84, 0.914], [65.83, 0.919], [100, 0.914]] } ], caption: 'Points from the simulation output above. Illustrative: real curves depend on your traffic, models and router accuracy, but the shape (most of the quality for a fraction of the cost) is typical.' },
      ],
    },
    {
      id: 'routing-vs-moe',
      title: 'LLM routing vs Mixture of Experts',
      blocks: [
        { type: 'p', text: 'The word "router" also appears inside **Mixture of Experts (MoE)** models, which can cause confusion. In an MoE layer, a learned gating network sends each **token** to a few "expert" feed-forward sub-networks *inside one model*. LLM routing sends each **whole request** to one of several *separate models*, possibly from different providers.' },
        { type: 'compare', title: 'Two kinds of router', options: [
          { name: 'LLM routing', summary: 'A system component that picks which complete model answers a request.', pros: ['Works with any models, including closed APIs', 'Easy to change or add models'], cons: ['Router is trained separately', 'Decides once per request, coarse-grained'], bestFor: 'Cutting cost and latency across a pool of models' },
          { name: 'Mixture of Experts', summary: 'A layer inside one neural network that sends each token to its top-k experts.', pros: ['Huge total capacity with few active parameters per token', 'Trained end to end with the model'], cons: ['Only exists inside that model', 'You cannot change it from outside'], bestFor: 'Building a single large model that is cheaper to run per token' },
        ], rows: [
          ['Unit routed', 'A whole request', 'Each token, at each MoE layer'],
          ['What it chooses', 'Separate models', 'Sub-networks inside one model'],
          ['Who builds it', 'The application team', 'The model\'s creators, during training'],
        ], verdict: 'They are complementary: our router might choose between a small dense model and a large MoE model.' },
      ],
    },
    {
      id: 'when-worth-it',
      title: 'When LLM routing is worth it',
      blocks: [
        { type: 'list', items: [
          '**Worth it:** high traffic with a mix of easy and hard queries; a clear quality signal (ratings, tests, evals) to train and check the router; meaningful price or latency gaps between models.',
          '**Probably not worth it:** low traffic (the engineering cost exceeds the savings); every query is uniformly hard or uniformly easy; strict requirements that every user gets identical model behaviour.',
          '**Simpler alternatives first:** prompt caching, shorter prompts, or switching entirely to a cheaper model that passes your evals may save more with less complexity.',
        ] },
        { type: 'callout', tone: 'example', title: 'Real-world use', text: 'Routing shows up in API gateways that sit in front of several providers, in assistants that pick a "fast" or "thinking" mode depending on the request, and in support and coding tools that send simple edits to small models and complex refactors to large ones. Several commercial and open-source routing products exist; their methods and claims vary, so evaluate them on your own traffic.' },
      ],
    },
    {
      id: 'mistakes',
      title: 'Common mistakes and how to fix them',
      blocks: [
        { type: 'callout', tone: 'warn', title: 'Mistake: optimising cost without measuring quality', text: 'A router that sends 95% of traffic to the small model looks great on the bill, until complaints arrive. Always track quality per route (offline eval sets plus online signals such as thumbs-down, retries and human escalations) and tune the threshold against both cost and quality.' },
        { type: 'list', items: [
          '**A router as expensive as the models.** Using a big LLM to decide where to send the query can cost more than it saves. Fix: use rules, a small classifier or embeddings.',
          '**Ignoring conversation context.** "Yes, do that" is short, but it may continue a hard task. Fix: route on the conversation state, not just the last message, and avoid switching models mid-task without reason.',
          '**Stale router after a model upgrade.** When the small model improves, the old threshold over-routes to the large model. Fix: re-evaluate and retrain whenever the pool changes.',
          '**No fallback.** If the chosen provider times out, the request fails. Fix: add a fallback model and timeouts in the policy.',
          '**Inconsistent tone across models.** Users notice style changes. Fix: shared system prompts and output format checks across models.',
        ] },
        { type: 'check', question: 'Our router saved 60% on cost, but human escalations rose from 3% to 9%, mostly on billing questions. What should we change first?', answer: 'Lower the threshold for billing-type queries (or add a rule sending billing disputes to the large model), and retrain the classifier with these misrouted examples labelled as hard. The router is misjudging a category; we should fix routing, not drop it.' },
      ],
    },
  ],
  quiz: [
    { q: 'What does an LLM router decide?', options: ['Which tokens inside a model go to which expert sub-network', 'Which model in a pool should handle each incoming request', 'How to split a long document into chunks', 'Which GPU a model\'s weights are loaded on'], answer: 1, explain: 'An LLM router picks a model per request. Token-to-expert routing is Mixture of Experts, which happens inside a single model.' },
    { q: 'In the simulation, threshold 0.35 sends 33.5% of queries to the large model and costs $34.84 vs $100 for always-large, with equal quality. What fraction of the always-large cost do we save?', options: ['About 35%', 'About 50%', 'About 65%', 'About 90%'], answer: 2, explain: 'Savings = 1 − 34.84 / 100 ≈ 65%. "About 35%" is the fraction we still pay, not what we save.' },
    { q: 'Our coding assistant can run unit tests on generated code. Which strategy fits especially well?', options: ['A cascade: try the small model first, escalate if the tests fail', 'Always use the small model, since the tests will catch any bad code', 'Route by message length, sending long prompts to the big model', 'Mixture of Experts routing, so each token reaches a code expert'], answer: 0, explain: 'Cascades need a reliable, cheap check of answer quality. Unit tests are exactly that, so escalation happens only when the small model\'s code actually fails.' },
    { q: 'How does LLM routing differ from Mixture of Experts?', options: ['They are the same idea: both pick experts per token inside one large model', 'MoE routes whole requests between providers; LLM routing routes each token', 'LLM routing trains the pool models jointly from scratch; MoE reuses them', 'Routing picks a whole model per request; MoE sends each token to experts in one model'], answer: 3, explain: 'The unit and scope differ: request-level choice among separate models vs token-level choice among sub-networks within one model trained end to end.' },
    { q: 'A teammate proposes using the largest available LLM as the router to get the most accurate routing decisions. What is the main problem?', options: ['Large models cannot output a model name reliably, so routes would break', 'The router\'s own cost and latency hit every request and can erase the savings', 'Routers must stay rule-based so that every decision can be audited', 'Large models route worse than small classifiers because they overthink'], answer: 1, explain: 'A router runs on 100% of traffic, so it must be much cheaper than the models it chooses between. A big-LLM router can wipe out the savings and add latency.' },
  ],
  takeaways: [
    'LLM routing sends each request to the cheapest model that can answer it well, cutting cost and latency.',
    'A router = features → scorer → policy (threshold, rules, fallbacks) → model call → logging and feedback.',
    'Strategies: rules, trained classifiers, semantic/embedding similarity, and cascades that escalate weak answers.',
    'The threshold trades cost against quality; tune it on real traffic with quality metrics, not cost alone.',
    'Routing chooses between whole models per request; Mixture of Experts routes tokens inside one model.',
  ],
  terms: [
    { term: 'LLM router', def: 'A component that chooses which language model handles each request.' },
    { term: 'Model pool', def: 'The set of candidate models a router can choose from.' },
    { term: 'Cascade', def: 'Trying a cheaper model first and escalating to a stronger one only if the answer fails a check.' },
    { term: 'Semantic routing', def: 'Choosing a route by comparing the query\'s embedding with example queries for each route.' },
    { term: 'Routing threshold', def: 'The score above which a request is sent to the stronger, more expensive model.' },
    { term: 'Mixture of Experts (MoE)', def: 'A model architecture where a gate sends each token to a few expert sub-networks inside the model.' },
  ],
};
