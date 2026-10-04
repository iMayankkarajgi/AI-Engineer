export default {
  id: 'how-does-knowledge-distillation-work',
  minutes: 19,
  hook: 'How can a small model learn more from a big model’s “wrong” answers than from the right answer alone?',
  summary: 'Knowledge distillation trains a small student model to imitate a large teacher model. Instead of learning only from hard labels (the one correct class), the student also matches the teacher’s full probability distribution, softened with a temperature, which carries “dark knowledge” about how classes relate. The result is a smaller, faster model that keeps much of the teacher’s quality.',
  sections: [
    {
      id: 'what-is-kd',
      title: 'What is knowledge distillation?',
      blocks: [
        { type: 'p', text: '**Knowledge distillation (KD)** is a training method where a large, accurate model called the **teacher** passes what it knows to a smaller model called the **student**. The student is trained to reproduce the teacher’s outputs, not only the dataset’s labels. The idea was popularised by Hinton, Vinyals and Dean in 2015 ([paper](https://arxiv.org/abs/1503.02531)), building on earlier “model compression” work by Buciluǎ, Caruana and Niculescu-Mizil (2006).' },
        { type: 'callout', tone: 'analogy', title: 'Think of it like an apprentice', text: 'An apprentice baker can learn from a recipe card that only says “correct: sourdough”. Or they can stand next to the master, who says “this dough is mostly sourdough, a bit like ciabatta, and nothing like a croissant”. The second kind of feedback teaches how things relate, and the apprentice learns faster from fewer loaves.' },
        { type: 'p', text: 'Running example: our bike-rental shop uses a large model to classify incoming support messages into categories like refund, damage, booking and spam. It is accurate but slow and costly. We want a small model that runs cheaply on every message, so we distil the big one into it.' },
      ],
    },
    {
      id: 'why-kd',
      title: 'Why we need knowledge distillation',
      blocks: [
        { type: 'p', text: 'Big models are usually more accurate, but they are expensive to serve: more memory, more latency, more energy, and sometimes too large for a phone or edge device. Training the small model directly on the labels often gives noticeably worse results than distilling it from a strong teacher. Distillation lets us get closer to big-model quality at small-model cost.' },
        { type: 'list', items: [
          '**Cheaper serving:** fewer parameters means less GPU memory and lower cost per request.',
          '**Lower latency:** smaller models respond faster, which matters for real-time apps.',
          '**On-device use:** phones, browsers and embedded devices have tight memory budgets.',
          '**Using unlabelled data:** the teacher can label large amounts of raw data for the student.',
        ] },
      ],
    },
    {
      id: 'hard-vs-soft',
      title: 'Hard labels vs soft labels, and dark knowledge',
      blocks: [
        { type: 'p', text: 'A **hard label** is a one-hot answer: the correct class gets 1, all others 0. For an image of a cat, the hard label over `[cat, dog, fox, car]` is `[1, 0, 0, 0]`. It says nothing about which wrong answers are *almost* right.' },
        { type: 'p', text: 'A **soft label** is the teacher’s full probability distribution, for example `[0.48, 0.26, 0.20, 0.07]`. It still says “cat” most strongly, but it also says “this looks a bit like a dog and a fox, and hardly like a car”. Hinton and colleagues called this extra information **dark knowledge**: the relative probabilities of the wrong classes encode how the teacher sees similarity between classes.' },
        { type: 'p', text: 'Why does this help? Each soft label carries much more information than a hard label. The student learns that cats and dogs share features while cars do not, which helps it generalise from fewer examples and makes its mistakes more sensible.' },
        { type: 'check', question: 'For our support classifier, the teacher outputs refund 0.70, damage 0.25, booking 0.04, spam 0.01 for “the bike broke and I want my money back”. What dark knowledge does this carry?', answer: 'That the message is mainly a refund request but strongly related to damage, and almost certainly not spam. A hard label (“refund”) would hide that damage is a close second, which is useful for the student to learn.' },
      ],
    },
    {
      id: 'temperature',
      title: 'Temperature in the softmax',
      blocks: [
        { type: 'p', text: 'A model outputs raw scores called **logits**. **Softmax** turns logits into probabilities. A well-trained teacher is often very confident, so the wrong classes get tiny probabilities like 0.0003 that barely affect any loss. To reveal the dark knowledge, we divide the logits by a **temperature** T before softmax:' },
        { type: 'formula', expr: 'pᵢ = exp(zᵢ / T) / ∑ⱼ exp(zⱼ / T)', where: [
          ['zᵢ', 'logit (raw score) for class i'],
          ['T', 'temperature: T = 1 is normal softmax; T > 1 makes the distribution softer (flatter)'],
          ['pᵢ', 'resulting probability for class i'],
        ] },
        { type: 'matrix', title: 'Teacher probabilities at different temperatures (logits 6.0, 3.5, 2.5, −2.0)', rows: ['T = 1', 'T = 2', 'T = 4', 'T = 10'], cols: ['cat', 'dog', 'fox', 'car'], values: [[0.899, 0.074, 0.027, 0.0], [0.676, 0.194, 0.118, 0.012], [0.479, 0.256, 0.2, 0.065], [0.341, 0.266, 0.24, 0.153]], format: 'pct', caption: 'Computed values. Higher T keeps the same ranking but makes the small probabilities big enough to learn from. Car at T = 1 is about 0.03%, shown as 0%.' },
        { type: 'viz', name: 'temperature', caption: 'The same softmax temperature used in text generation. Slide it up and watch the distribution flatten: that is exactly what distillation does to the teacher’s outputs.' },
        { type: 'p', text: 'The student uses the **same temperature** when computing its own soft probabilities during distillation. After training, the student is used at T = 1 like any normal model. Typical temperatures in practice range from about 2 to 10; the best value is found by experiment.' },
      ],
    },
    {
      id: 'loss',
      title: 'The distillation loss',
      blocks: [
        { type: 'p', text: 'The classic distillation loss mixes two parts:' },
        { type: 'formula', expr: 'L = α · T² · KL( p_teacher(T) ‖ p_student(T) ) + (1 − α) · CE( y, p_student(1) )', where: [
          ['KL', 'Kullback–Leibler divergence: how different the student’s soft distribution is from the teacher’s'],
          ['CE', 'ordinary cross-entropy with the hard label y, at temperature 1'],
          ['α', 'mixing weight between soft and hard loss, e.g. 0.5–0.9'],
          ['T²', 'rescales the soft term, because softening by T shrinks its gradients by about 1/T²'],
        ] },
        { type: 'p', text: 'The **soft loss** makes the student match the teacher’s whole distribution. The **hard loss** keeps it anchored to the true label, which helps if the teacher is sometimes wrong. Many people write the soft term with cross-entropy instead of KL; the two differ only by a constant (the teacher’s entropy) that does not affect the student’s gradients.' },
        { type: 'code', lang: 'python', title: 'distillation_loss.py', code: `import numpy as np

classes = ["cat", "dog", "fox", "car"]
teacher_logits = np.array([6.0, 3.5, 2.5, -2.0])   # teacher's raw scores for one image
student_logits = np.array([3.0, 0.5, 0.0, 0.5])    # untrained-ish student
true_label = 0                                     # the hard label: "cat"

def softmax(z, T=1.0):
    z = z / T
    e = np.exp(z - z.max())
    return e / e.sum()

for T in (1, 4):
    p = softmax(teacher_logits, T)
    print(f"teacher T={T}:", " ".join(f"{c}={v:.3f}" for c, v in zip(classes, p)))

T, alpha = 4.0, 0.7
p_t = softmax(teacher_logits, T)                   # soft targets
p_s = softmax(student_logits, T)                   # student at the same T
kl = np.sum(p_t * np.log(p_t / p_s))               # KL(teacher || student)
soft_loss = (T ** 2) * kl                          # T^2 keeps gradients comparable
hard_loss = -np.log(softmax(student_logits)[true_label])   # normal CE at T=1
total = alpha * soft_loss + (1 - alpha) * hard_loss

print(f"soft loss (T^2 * KL) = {soft_loss:.3f}")
print(f"hard loss (CE)       = {hard_loss:.3f}")
print(f"total = {alpha}*soft + {1 - alpha:.1f}*hard = {total:.3f}")`, output: `teacher T=1: cat=0.899 dog=0.074 fox=0.027 car=0.000
teacher T=4: cat=0.479 dog=0.256 fox=0.200 car=0.065
soft loss (T^2 * KL) = 1.332
hard loss (CE)       = 0.194
total = 0.7*soft + 0.3*hard = 0.991`, walkthrough: [
          { lines: [3, 6], note: 'One example: the teacher is confident it is a cat but sees some dog and fox. The student already picks cat but scores “car” as high as “dog”, which the teacher would never do.' },
          { lines: [8, 11], note: 'Softmax with temperature. Subtracting the max keeps the exponentials numerically safe.' },
          { lines: [13, 15], note: 'At T = 4 the teacher’s wrong-class probabilities become clearly visible.' },
          { lines: [17, 21], note: 'The soft loss compares distributions at T = 4 and is scaled by T² = 16.' },
          { lines: [22, 23], note: 'The hard loss is low (the student already says cat), but the soft loss is high: the student has not learned the teacher’s view of which wrong classes are close.' },
        ] },
        { type: 'check', question: 'In the output, the hard loss is small (0.194) but the soft loss is large (1.332). What does that tell us?', answer: 'The student already gets the top answer right, so the hard label has little left to teach. The soft loss still sees a big gap: the student gives car too much and dog too little probability. Distillation keeps teaching where hard labels have gone quiet.' },
      ],
    },
    {
      id: 'walkthrough',
      title: 'A step-by-step training walkthrough',
      blocks: [
        { type: 'steps', title: 'Distilling our support classifier', items: [
          { title: 'Train or pick the teacher', text: 'Use the large, accurate model. It is frozen during distillation.' },
          { title: 'Choose a student', text: 'A smaller architecture, often the same family with fewer layers or a narrower width.' },
          { title: 'Run the teacher on the data', text: 'For each training message, get the teacher’s logits. This can be done once and cached (offline distillation).' },
          { title: 'Soften both outputs', text: 'Apply softmax at temperature T to the teacher’s and the student’s logits.' },
          { title: 'Compute the combined loss', text: 'α · T² · KL(teacher ‖ student) plus (1 − α) · cross-entropy with the true label.' },
          { title: 'Update the student only', text: 'Backpropagate and update the student’s weights. Repeat over many batches, then evaluate the student at T = 1.' },
        ] },
        { type: 'flow', title: 'Teacher → student', nodes: [
          { label: 'Input', detail: 'A support message, e.g. “bike chain snapped, refund please”.' },
          { label: 'Teacher (frozen)', detail: 'Large model produces logits; softmax at T gives soft targets.' },
          { label: 'Student', detail: 'Small model produces its own logits; softmax at the same T.' },
          { label: 'Loss', detail: 'Soft KL term plus hard cross-entropy term, mixed by α.' },
          { label: 'Update student', detail: 'Gradients change only the student’s weights.' },
        ] },
      ],
    },
    {
      id: 'types',
      title: 'Types of knowledge distillation',
      blocks: [
        { type: 'p', text: 'Distillation is a family of methods. They differ in *what* the student copies and *when* the teacher is trained.' },
        { type: 'compare', title: 'What the student imitates', options: [
          { name: 'Response-based', summary: 'Match the teacher’s final outputs (logits or probabilities).', pros: ['Simple; works with any architecture pair', 'Only needs teacher outputs'], cons: ['Ignores how the teacher computes internally'], bestFor: 'Classic classification and most LLM distillation' },
          { name: 'Feature-based', summary: 'Match the teacher’s intermediate activations (hidden states, attention maps).', pros: ['Richer signal per example'], cons: ['Needs a mapping when sizes differ', 'Needs access to the teacher’s internals'], bestFor: 'Compressing a model into a smaller version of itself (e.g. TinyBERT, FitNets)' },
          { name: 'Relation-based', summary: 'Match relationships between examples or layers, such as similarity between pairs of inputs.', pros: ['Captures structure beyond single outputs'], cons: ['More complex to design'], bestFor: 'Embedding and retrieval models' },
        ], verdict: 'Response-based distillation is the default; add feature matching when the teacher’s internals are available and sizes line up.' },
        { type: 'list', items: [
          '**Offline:** the teacher is pre-trained and frozen; the student learns afterwards. The most common setup.',
          '**Online:** teacher and student (or several peers) train at the same time and learn from each other.',
          '**Self-distillation:** a model teaches a new copy of itself, or deeper layers teach shallower ones.',
          '**Sequence-level distillation for LLMs:** the teacher generates whole answers, and the student is fine-tuned on them as ordinary text. This needs only the teacher’s text, not its logits, which is why it works even through an API.',
        ] },
      ],
    },
    {
      id: 'real-examples',
      title: 'Real examples, pitfalls and wrapping up',
      blocks: [
        { type: 'table', caption: 'Published examples (figures as reported by their authors)', head: ['Model', 'Teacher', 'What was reported'], rows: [
          ['DistilBERT (Sanh et al., 2019)', 'BERT-base', 'About 40% smaller and 60% faster, keeping about 97% of BERT’s language-understanding score'],
          ['TinyBERT (Jiao et al., 2020)', 'BERT-base', 'Feature-based distillation of hidden states and attention into a much smaller model'],
          ['DeepSeek-R1 distilled models (2025)', 'DeepSeek-R1', 'Smaller Qwen- and Llama-based models fine-tuned on reasoning traces generated by R1'],
        ] },
        { type: 'callout', tone: 'example', title: 'In LLM products', text: 'Many vendors offer small, fast model tiers, and distillation from larger models is a common ingredient, though details are often not public. Teams also distil privately: use a large model to label or answer thousands of in-domain examples, then fine-tune a small open model on them. Always check the teacher’s licence and terms of use before training on its outputs.' },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Using T = 1 so the soft targets are almost one-hot and add little; forgetting the T² factor so the soft term barely influences training; choosing a student so small it cannot represent the task (the “capacity gap”); and assuming the student can beat the teacher’s mistakes. The student inherits the teacher’s biases and errors along with its knowledge.' },
        { type: 'p', text: '**When not to distil:** if the small model trained directly already meets the quality bar, or if serving cost is not a constraint, distillation adds work for no gain. And if no good teacher exists for the task, there is nothing to distil.' },
        { type: 'p', text: '**Wrapping up:** knowledge distillation compresses a big model into a small one by training the student on the teacher’s soft probabilities. Temperature exposes the dark knowledge in those probabilities, the T²-scaled KL term teaches it, and a hard-label term keeps the student honest. Variants copy features or relations, and for LLMs the simplest form is fine-tuning a small model on text generated by a large one.' },
      ],
    },
  ],
  quiz: [
    { q: 'What is “dark knowledge” in knowledge distillation?', options: ['Hidden teacher layers whose activations the student is never allowed to see', 'The teacher’s probabilities on wrong classes, revealing which classes are similar', 'Private or unlabelled training data that only the teacher ever had access to', 'Teacher weights that are pruned away and then rebuilt inside the student'], answer: 1, explain: 'Dark knowledge is the relative probability the teacher gives to incorrect classes. It reveals similarity structure that hard labels throw away.' },
    { q: 'Teacher logits are [6.0, 3.5, 2.5, −2.0]. What happens to the probabilities when we raise the temperature from 1 to 4?', options: ['The top class becomes even more dominant over the other three', 'The class ranking changes because the logit gaps shrink unevenly', 'The distribution flattens but the class ranking stays the same', 'All four probabilities become exactly equal to 0.25'], answer: 2, explain: 'Dividing logits by T > 1 shrinks the gaps, so the distribution flattens (0.899 → 0.479 for cat) but the order stays the same. Only as T → ∞ would they approach equal.' },
    { q: 'Why is the soft-loss term multiplied by T²?', options: ['To match the hard loss’s gradient scale, since softening shrinks gradients by about 1/T²', 'To make the teacher’s softened predictions more confident again before matching', 'To convert the KL divergence into a cross-entropy so the two losses can be added', 'Because the student is later run at temperature T² at inference, so training has to match that'], answer: 0, explain: 'Softening by T shrinks the soft term’s gradients roughly by 1/T²; multiplying by T² restores balance with the hard loss. The student is used at T = 1 after training.' },
    { q: 'We only have API access to a large LLM (text out, no logits) and want a small in-house model for our support domain. Which distillation approach fits?', options: ['Feature-based distillation, matching the small model’s hidden states to the large one’s', 'Logit matching at temperature T = 4 against the large model’s outputs', 'Online distillation, where the large and small models train together', 'Sequence-level: fine-tune the small model on answers generated by the large one'], answer: 3, explain: 'Without logits or internals, we can still distil at the sequence level by training on the teacher’s generated text (if its terms allow). Feature and logit matching need access we do not have, and we cannot train the API model.' },
    { q: 'A teammate says: "After distillation the student will fix the teacher’s mistakes, because it is trained on true labels too." What is the best response?', options: ['Correct; the hard-label term removes all of the teacher’s errors during training', 'Correct; whenever the teacher is wrong, the hard-label term overrides it and fixes the error', 'Not reliably; it mostly inherits the teacher’s errors, which hard labels only partly offset', 'Incorrect, because distillation uses only teacher outputs and never true labels'], answer: 2, explain: 'The hard-label term helps, but most of the signal comes from the teacher, so its mistakes and biases carry over. The classic loss does use true labels, so the last option is wrong.' },
  ],
  takeaways: [
    'Distillation trains a small student to imitate a large teacher’s outputs.',
    'Soft labels carry dark knowledge: how wrong classes relate to the right one.',
    'Temperature T > 1 flattens softmax so that knowledge becomes learnable; the student uses the same T.',
    'Loss = α·T²·KL(teacher‖student) + (1−α)·CE(label), with T² keeping gradients balanced.',
    'Variants copy outputs, features or relations; for LLMs, fine-tuning on teacher-generated text is common.',
  ],
  terms: [
    { term: 'Teacher', def: 'The large, accurate model whose behaviour is being transferred.' },
    { term: 'Student', def: 'The smaller model trained to imitate the teacher.' },
    { term: 'Soft label', def: 'A full probability distribution over classes, as opposed to a single correct class.' },
    { term: 'Dark knowledge', def: 'The similarity information hidden in a model’s probabilities for incorrect classes.' },
    { term: 'Temperature', def: 'A divisor applied to logits before softmax; higher values flatten the distribution.' },
    { term: 'KL divergence', def: 'A measure of how one probability distribution differs from another.' },
  ],
};
