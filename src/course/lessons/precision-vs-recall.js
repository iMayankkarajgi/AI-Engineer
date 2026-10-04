export default {
  id: 'precision-vs-recall',
  minutes: 17,
  hook: 'A spam filter that marks nothing as spam can still score 99% accuracy. So how do we actually tell whether a classifier is good?',
  summary: 'Precision asks: of everything the model flagged, how much was really positive? Recall asks: of everything that was really positive, how much did the model catch? Raising the decision threshold usually raises precision and lowers recall, so we choose based on which mistake costs more: false alarms (favour precision) or misses (favour recall). F1 combines both into one number.',
  sections: [
    {
      id: 'the-problem',
      title: 'The problem we are trying to solve',
      blocks: [
        { type: 'p', text: 'We have built a **spam filter**: a classifier that reads each email and outputs a spam score between 0 and 1. If the score is above a **threshold** (say 0.5), the email goes to the spam folder. How do we judge whether it is any good?' },
        { type: 'p', text: 'The obvious answer is **accuracy**: the fraction of emails classified correctly. But imagine an inbox of 1,000 emails where only 10 are spam. A lazy "filter" that never marks anything as spam is right on 990 emails: 99% accuracy, while catching zero spam. Accuracy hides the failure because the positive class (spam) is rare. This is called **class imbalance**, and it is the normal situation for fraud, disease, defects, and many other things we care about.' },
        { type: 'callout', tone: 'analogy', title: 'A fishing net', text: 'Think of the model as a fishing net, and spam as the fish we want. **Precision** asks: of everything in the net, how much is fish and how much is old boots? **Recall** asks: of all the fish in the lake, how many ended up in the net? A tiny net gives a clean catch (high precision) but misses most fish (low recall). A huge net catches every fish (high recall) and lots of boots too (low precision).' },
        { type: 'p', text: 'To measure those two ideas precisely, we first need names for the four ways a single prediction can turn out.' },
      ],
    },
    {
      id: 'four-outcomes',
      title: 'The four possible outcomes',
      blocks: [
        { type: 'p', text: 'For a yes/no classifier, "positive" means the class we are looking for (spam) and "negative" means the other class (a normal email, often called "ham"). Each prediction is either right or wrong, and either positive or negative, giving four outcomes:' },
        { type: 'table', head: ['Outcome', 'Model said', 'Truth', 'In our spam filter'], rows: [
          ['True Positive (TP)', 'Spam', 'Spam', 'Spam correctly sent to the spam folder'],
          ['False Positive (FP)', 'Spam', 'Not spam', 'A real email wrongly hidden in spam (a false alarm)'],
          ['False Negative (FN)', 'Not spam', 'Spam', 'Spam that slipped into the inbox (a miss)'],
          ['True Negative (TN)', 'Not spam', 'Not spam', 'A real email correctly left in the inbox'],
        ] },
        { type: 'p', text: 'A handy way to read the names: the second word (Positive or Negative) is what the **model predicted**; the first word (True or False) says whether that prediction was **correct**. Arranged in a 2 × 2 grid, these counts form the **confusion matrix**.' },
        { type: 'matrix', title: 'Confusion matrix for 20 emails at threshold 0.5', rows: ['Actually spam', 'Actually not spam'], cols: ['Predicted spam', 'Predicted not spam'], values: [[7, 1], [4, 8]], format: 'int', caption: 'Counts from the code later in this lesson: TP = 7, FN = 1, FP = 4, TN = 8.' },
        { type: 'p', text: 'In statistics, a false positive is also called a **Type I error** and a false negative a **Type II error**. Accuracy is (TP + TN) / total, which here is (7 + 8) / 20 = 0.75.' },
      ],
    },
    {
      id: 'precision',
      title: 'What is precision?',
      blocks: [
        { type: 'p', text: '**Precision** is the fraction of the model\'s positive predictions that were actually positive. It answers: "When the model says spam, how often is it right?"' },
        { type: 'formula', expr: 'Precision = TP / (TP + FP)', where: [ ['TP', 'positives correctly flagged'], ['FP', 'negatives wrongly flagged (false alarms)'] ], caption: 'At threshold 0.5: 7 / (7 + 4) = 7 / 11 ≈ 0.64.' },
        { type: 'p', text: 'High precision means **few false alarms**. Notice what precision ignores: the spam the model never flagged (false negatives) does not appear in the formula at all. A filter that flags only the single most obvious spam email can have perfect precision of 1.0 while missing everything else.' },
      ],
    },
    {
      id: 'recall',
      title: 'What is recall?',
      blocks: [
        { type: 'p', text: '**Recall** is the fraction of actual positives that the model caught. It answers: "Of all the real spam, how much did we find?" Recall is also called **sensitivity** or the **true positive rate**.' },
        { type: 'formula', expr: 'Recall = TP / (TP + FN)', where: [ ['TP', 'positives correctly flagged'], ['FN', 'positives the model missed'] ], caption: 'At threshold 0.5: 7 / (7 + 1) = 7 / 8 = 0.875.' },
        { type: 'p', text: 'High recall means **few misses**. Recall ignores false alarms: a filter that sends every email to spam has perfect recall of 1.0, and is useless.' },
        { type: 'check', question: 'Pause and predict: a model flags 50 emails as spam. 40 of them really are spam. There are 80 spam emails in total. What are its precision and recall?', answer: 'TP = 40, FP = 50 − 40 = 10, FN = 80 − 40 = 40. Precision = 40 / 50 = 0.80. Recall = 40 / 80 = 0.50. It is usually right when it flags, but it misses half of the spam.' },
      ],
    },
    {
      id: 'tradeoff',
      title: 'Precision vs recall: the trade-off',
      blocks: [
        { type: 'p', text: 'Precision and recall usually pull against each other, and the **threshold** is the lever. Raise the threshold and the model flags only emails it is very sure about: fewer false alarms (precision up) but more misses (recall down). Lower it and it flags more: more spam caught (recall up) but more good emails caught too (precision down).' },
        { type: 'steps', title: 'Watching the threshold move', items: [
          { title: 'Threshold 0.9', text: 'Only 2 emails flagged, both spam. Precision 1.00, recall 0.25. Very safe, misses most spam.' },
          { title: 'Threshold 0.7', text: '7 flagged, 5 are spam. Precision 0.71, recall 0.625.' },
          { title: 'Threshold 0.5', text: '11 flagged, 7 are spam. Precision 0.64, recall 0.875.' },
          { title: 'Threshold 0.3', text: '15 flagged, all 8 spam caught. Precision 0.53, recall 1.00. Nothing missed, many false alarms.' },
        ] },
        { type: 'chart', kind: 'line', title: 'Precision and recall as the threshold changes', xLabel: 'Threshold', yLabel: 'Score', series: [
          { name: 'Precision', points: [[0.1, 0.44], [0.2, 0.47], [0.3, 0.53], [0.4, 0.62], [0.5, 0.64], [0.6, 0.67], [0.7, 0.71], [0.8, 0.8], [0.9, 1]] },
          { name: 'Recall', points: [[0.1, 1], [0.2, 1], [0.3, 1], [0.4, 1], [0.5, 0.88], [0.6, 0.75], [0.7, 0.63], [0.8, 0.5], [0.9, 0.25]] },
        ], caption: 'Computed from the 20 example emails in the code below. As the threshold rises, precision climbs and recall falls.' },
        { type: 'viz', name: 'precision-recall', caption: 'Drag the threshold. Watch the confusion matrix, precision, recall and F1 update live.' },
        { type: 'p', text: 'When we want a single number that balances both, we use the **F1 score**, the harmonic mean of precision and recall:' },
        { type: 'formula', expr: 'F1 = 2 · Precision · Recall / (Precision + Recall)', caption: 'At threshold 0.5: 2 × 0.64 × 0.875 / (0.64 + 0.875) ≈ 0.74. The harmonic mean is pulled towards the smaller value, so F1 is only high when both are high.' },
        { type: 'deeper', title: 'Why the harmonic mean, and what is F-beta?', blocks: [
          { type: 'p', text: 'With precision 1.0 and recall 0.02, the ordinary average is 0.51, which sounds decent for a useless model. The harmonic mean gives 2 × 1.0 × 0.02 / 1.02 ≈ 0.04, which honestly reflects that the model misses nearly everything.' },
          { type: 'p', text: 'The general **F-beta score** lets us weight recall β times as much as precision: `Fβ = (1 + β²) · P · R / (β² · P + R)`. F2 (β = 2) favours recall, useful for screening. F0.5 favours precision. F1 (β = 1) weights them equally.' },
          { type: 'p', text: 'To summarise performance across all thresholds at once, teams use the **precision-recall curve** and the area under it (often reported as **average precision**). For heavily imbalanced data it is usually more informative than the ROC curve.' },
        ] },
      ],
    },
    {
      id: 'code',
      title: 'Code: computing everything from scratch',
      blocks: [
        { type: 'code', lang: 'python', title: 'precision_recall.py', code: `import numpy as np

# 20 emails: model's spam score (0-1) and the truth (1 = spam, 0 = not spam)
scores = np.array([0.95, 0.91, 0.88, 0.85, 0.80, 0.74, 0.70, 0.66, 0.62, 0.55,
                   0.52, 0.47, 0.41, 0.38, 0.33, 0.27, 0.21, 0.15, 0.09, 0.04])
truth  = np.array([1,    1,    1,    0,    1,    1,    0,    1,    0,    1,
                   0,    0,    1,    0,    0,    0,    0,    0,    0,    0])

def evaluate(threshold):
    pred = (scores >= threshold).astype(int)      # flag as spam if score >= threshold
    tp = int(((pred == 1) & (truth == 1)).sum())  # spam caught
    fp = int(((pred == 1) & (truth == 0)).sum())  # good email wrongly flagged
    fn = int(((pred == 0) & (truth == 1)).sum())  # spam missed
    tn = int(((pred == 0) & (truth == 0)).sum())  # good email left alone
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn)
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return tp, fp, fn, tn, precision, recall, f1

print("thresh  TP FP FN TN  precision recall   F1")
for t in (0.9, 0.7, 0.5, 0.3):
    tp, fp, fn, tn, p, r, f1 = evaluate(t)
    print(f"  {t:.1f}   {tp:2d} {fp:2d} {fn:2d} {tn:2d}    {p:.2f}     {r:.2f}   {f1:.2f}")

# Accuracy can mislead: a model that NEVER flags spam
acc_lazy = (truth == 0).mean()
print(f"'never spam' model: accuracy {acc_lazy:.2f}, recall 0.00")`, output: `thresh  TP FP FN TN  precision recall   F1
  0.9    2  0  6 12    1.00     0.25   0.40
  0.7    5  2  3 10    0.71     0.62   0.67
  0.5    7  4  1  8    0.64     0.88   0.74
  0.3    8  7  0  5    0.53     1.00   0.70
'never spam' model: accuracy 0.60, recall 0.00`, walkthrough: [
          { lines: [3, 7], note: 'Twenty emails sorted by the model\'s spam score, with the true labels. Eight are spam. The model is decent but imperfect: some spam has low scores and some good emails have high ones.' },
          { lines: [9, 14], note: 'Apply a threshold, then count the four outcomes by comparing predictions with the truth.' },
          { lines: [15, 18], note: 'The three formulas. The guards avoid dividing by zero when nothing is flagged.' },
          { lines: [20, 23], note: 'Sweep thresholds. Precision rises from 0.53 to 1.00 as the threshold goes up, while recall falls from 1.00 to 0.25. (0.62 is 5/8 = 0.625 rounded.) F1 peaks in the middle.' },
          { lines: [25, 27], note: 'The "never spam" model still gets 60% accuracy here, with zero recall. With rarer spam (1 in 100), it would get 99%.' },
        ] },
      ],
    },
    {
      id: 'when-to-use',
      title: 'When to use which one?',
      blocks: [
        { type: 'p', text: 'The right metric depends on **which mistake is more expensive** in our product.' },
        { type: 'compare', title: 'Optimise for precision or for recall?', options: [
          { name: 'Favour precision', summary: 'False positives are costly; we must be sure before we flag.', pros: ['Few false alarms', 'Users trust the flags'], cons: ['Some positives slip through'], bestFor: 'Spam filters (hiding a real email is bad), auto-blocking payments, automatic content takedowns, recommending products' },
          { name: 'Favour recall', summary: 'False negatives are costly; we must not miss positives.', pros: ['Few misses', 'Safer for critical detection'], cons: ['More false alarms to review'], bestFor: 'Cancer screening, fraud alerts sent to a human reviewer, safety defect detection, retrieving documents for RAG' },
        ], rows: [
          ['Cost of a false positive', 'High', 'Low or manageable'],
          ['Cost of a false negative', 'Manageable', 'High'],
          ['Threshold', 'Higher', 'Lower'],
          ['Typical follow-up', 'Act automatically', 'Send to a second check or a human'],
        ], verdict: 'Ask: "What happens when we wrongly flag?" and "What happens when we miss?" Then set the threshold to match. If both matter equally, track F1.' },
        { type: 'callout', tone: 'example', title: 'Precision and recall in AI engineering', text: 'In a RAG system (Module 10), **retrieval recall** asks: did the retriever find the documents that contain the answer? If not, the LLM cannot answer correctly however good it is, so retrieval often favours recall, and a **reranker** then improves precision by pushing the best passages to the top. Guardrails (Module 15) face the same trade-off: blocking too eagerly annoys users (low precision); blocking too little lets harmful content through (low recall).' },
        { type: 'check', question: 'A hospital screening test flags patients for a follow-up scan. Missing a sick patient is far worse than an extra scan. Which metric should we prioritise, and should the threshold go up or down?', answer: 'Prioritise recall and lower the threshold, so almost every sick patient is flagged. The extra false positives are handled by the follow-up scan.' },
      ],
    },
    {
      id: 'recap',
      title: 'A quick recap of the formulas, and summary',
      blocks: [
        { type: 'table', caption: 'All the formulas in one place', head: ['Metric', 'Formula', 'Question it answers'], rows: [
          ['Accuracy', '(TP + TN) / (TP + TN + FP + FN)', 'How often is the model right overall?'],
          ['Precision', 'TP / (TP + FP)', 'When it says positive, how often is it right?'],
          ['Recall (sensitivity)', 'TP / (TP + FN)', 'Of all real positives, how many did it find?'],
          ['Specificity', 'TN / (TN + FP)', 'Of all real negatives, how many did it correctly leave alone?'],
          ['F1 score', '2 · P · R / (P + R)', 'One number that is high only when both P and R are high'],
        ] },
        { type: 'callout', tone: 'warn', title: 'Common mistakes', text: 'Reporting accuracy on imbalanced data; reporting precision without recall (or the reverse), since each can be made perfect by a silly model; mixing up which class is "positive"; and leaving the threshold at 0.5 by habit instead of choosing it for the business cost of each error.' },
        { type: 'p', text: '**Summary:** precision measures how trustworthy the model\'s positive predictions are; recall measures how complete they are. The threshold trades one for the other. Choose based on the cost of false alarms vs misses, use F1 (or F-beta) when you need one number, and never rely on accuracy alone when one class is rare.' },
      ],
    },
  ],
  quiz: [
    {
      q: 'What does recall measure?',
      options: ['Of all items the model flagged, the fraction that were truly positive', 'Of all truly positive items, the fraction the model flagged', 'The fraction of all predictions that were correct', 'Of all truly negative items, the fraction the model left alone'],
      answer: 1,
      explain: 'Recall = TP / (TP + FN): of the real positives, how many did we catch. The first option is precision, the third is accuracy and the fourth is specificity.',
    },
    {
      q: 'Users complain that our spam filter keeps hiding important real emails, but almost no spam gets through. What should we do?',
      options: ["Lower the threshold so that recall goes up", "Raise the threshold to improve precision", "Report accuracy instead", "Remove the threshold entirely"],
      answer: 1,
      explain: 'Hidden real emails are false positives, so precision is too low. Raising the threshold makes the filter flag only emails it is more sure about, cutting false positives (at some cost in recall).',
    },
    {
      q: 'A fraud model flags 20 transactions; 15 are real fraud. There were 60 fraudulent transactions in total. What are precision and recall?',
      options: ['Precision 0.25, recall 0.75', 'Precision 0.75, recall 0.75', 'Precision 0.33, recall 0.25', 'Precision 0.75, recall 0.25'],
      answer: 3,
      explain: 'TP = 15, FP = 5, FN = 60 − 15 = 45. Precision = 15 / 20 = 0.75. Recall = 15 / 60 = 0.25.',
    },
    {
      q: 'How do precision and recall usually respond when we lower the decision threshold?',
      options: ['Recall tends to rise and precision tends to fall', 'Both always rise', 'Precision tends to rise and recall tends to fall', 'Neither changes, because the model is the same'],
      answer: 0,
      explain: 'A lower threshold flags more items: more real positives are caught (recall up) but more negatives are flagged too (precision down).',
    },
    {
      q: 'A model detects a rare disease that affects 1% of patients. It reports 99% accuracy. A colleague says it must be excellent. What is the best response?',
      options: ["Agree: 99% accuracy is an excellent score for any task", "Accuracy can hit 99% with zero detection; check recall and precision", "Accuracy above 95% always guarantees that recall is high too", "Only specificity matters for rare diseases, so report just that"],
      answer: 1,
      explain: 'With 1% positives, predicting "healthy" for everyone gives 99% accuracy and 0 recall. On imbalanced data, look at precision and recall.',
    },
  ],
  takeaways: [
    'Every prediction is a TP, FP, FN or TN; together they form the confusion matrix.',
    'Precision = TP / (TP + FP): how trustworthy positive predictions are.',
    'Recall = TP / (TP + FN): how many real positives we found.',
    'Raising the threshold usually raises precision and lowers recall; lowering it does the opposite.',
    'Favour precision when false alarms are costly and recall when misses are costly; use F1 to balance both.',
    'Accuracy misleads on imbalanced data.',
  ],
  terms: [
    { term: 'Confusion matrix', def: 'A table of counts of true positives, false positives, false negatives and true negatives.' },
    { term: 'Precision', def: 'The fraction of predicted positives that are actually positive: TP / (TP + FP).' },
    { term: 'Recall', def: 'The fraction of actual positives that the model found: TP / (TP + FN).' },
    { term: 'F1 score', def: 'The harmonic mean of precision and recall.' },
    { term: 'Threshold', def: 'The score above which a classifier predicts the positive class.' },
    { term: 'Class imbalance', def: 'When one class is much rarer than the other, making accuracy misleading.' },
  ],
};
