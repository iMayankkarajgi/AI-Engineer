import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { allLessons } from './course/curriculum';
import { examQuestions, EXAM_PASS } from './course/exam';
import { Rich } from './LessonBlocks';
import { useApp, ACCOUNTS } from './app';
import './exam.css';

const TOTAL = examQuestions.length;
// Seeded shuffle, so one attempt keeps a stable order while it is being answered.
function shuffled(n, seed) {
  const idx = [...Array(n).keys()]; let s = seed * 9301 + 49297;
  for (let i = n - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}

export default function Exam() {
  const { user, completed, exam, recordExam } = useApp();
  const [attempt, setAttempt] = useState(() => Math.floor(Math.random() * 1e6));
  const [started, setStarted] = useState(false), [picks, setPicks] = useState({}), [submitted, setSubmitted] = useState(false), [armed, setArmed] = useState(false);
  const order = useMemo(() => shuffled(TOTAL, attempt), [attempt]);
  const optionOrder = useMemo(() => examQuestions.map((q, i) => shuffled(q.options.length, attempt + i * 131 + 7)), [attempt]);
  const lessonsLeft = allLessons.filter(l => !completed.includes(l.id)).length;
  const answered = Object.keys(picks).length;
  const score = examQuestions.reduce((s, q, i) => s + (picks[i] === q.answer ? 1 : 0), 0);
  const passedBefore = exam !== null && exam >= EXAM_PASS;

  const submit = () => {
    if (answered < TOTAL && !armed) return setArmed(true);
    setSubmitted(true); setArmed(false); recordExam(score); window.scrollTo({ top: 0 });
  };
  const retake = () => { setPicks({}); setSubmitted(false); setArmed(false); setAttempt(a => a + 1); setStarted(true); window.scrollTo({ top: 0 }); };

  if (lessonsLeft > 0) return <main className="page container narrow exam-page">
    <div className="page-intro"><div className="eyebrow">Final exam</div><h1>Finish the lessons first</h1>
      <p className="dek">The final exam opens once every lesson is passed. You have {lessonsLeft} lesson{lessonsLeft === 1 ? '' : 's'} to go.</p></div>
    <div className="card exam-rules"><ul className="check-list"><li>{TOTAL} questions mixed across every module</li><li>Different from the lesson quizzes</li><li>Score {EXAM_PASS} or more to earn the certificate</li></ul></div>
    <div className="account-link"><Link className="button primary" to="/curriculum">Go To The Curriculum →</Link></div>
  </main>;

  if (!started && !submitted) return <main className="page container narrow exam-page">
    <div className="page-intro"><div className="eyebrow">Final exam</div><h1>{TOTAL} questions across the whole course</h1>
      <p className="dek">Every lesson is passed. This exam mixes all the topics, with questions you have not seen in the lesson quizzes. Score {EXAM_PASS} or more out of {TOTAL} to earn your certificate.</p></div>
    <div className="card exam-rules"><ul className="check-list">
      <li>{TOTAL} multiple-choice questions, one correct answer each</li><li>No time limit; answer in any order</li><li>Pass mark: {EXAM_PASS} correct ({Math.round((EXAM_PASS / TOTAL) * 100)}%)</li><li>You can retake it; your best score is kept</li>
    </ul>{exam !== null && <p className={'exam-best' + (passedBefore ? ' ok' : '')}>Your best score so far: <b>{exam} / {TOTAL}</b>{passedBefore ? ' — passed.' : '.'}</p>}</div>
    <div className="account-link"><button className="button primary" onClick={() => setStarted(true)}>{exam === null ? 'Start The Exam' : 'Retake The Exam'} →</button>
      {passedBefore && <Link className="button ghost" to={user ? '/profile' : '/account'}>{user ? 'View Certificate' : 'Sign In For Your Certificate'}</Link>}</div>
  </main>;

  const passed = submitted && score >= EXAM_PASS;
  return <main className="page container narrow exam-page">
    {submitted
      ? <div className={'card exam-result ' + (passed ? 'pass' : 'fail')} role="status">
          <div className="exam-score"><strong>{score}</strong><span>/ {TOTAL}</span></div>
          <div><h1>{passed ? 'You passed the final exam.' : 'Not passed yet.'}</h1>
            <p>{passed ? `You needed ${EXAM_PASS}. Your certificate is unlocked.` : `You need ${EXAM_PASS} correct; you were ${EXAM_PASS - score} short. Review the questions marked below and try again; the questions come in a new order.`}</p>
            <div className="quiz-actions">
              {passed && <Link className="button primary" to={user ? '/profile' : '/account'}>{user ? 'View Certificate →' : ACCOUNTS ? 'Sign In For Your Certificate →' : 'See Your Progress →'}</Link>}
              <button className={'button ' + (passed ? 'ghost' : 'primary')} onClick={retake}>{passed ? 'Retake The Exam' : '↺ Try Again'}</button>
            </div></div>
        </div>
      : <div className="exam-bar"><div><strong>Final exam</strong><span>{answered} of {TOTAL} answered</span></div><div className="meter"><span style={{ width: `${(answered / TOTAL) * 100}%` }}/></div></div>}

    <ol className="quiz-list exam-list">{order.map((qi, n) => {
      const q = examQuestions[qi], pick = picks[qi], right = pick === q.answer;
      return <li key={qi} className={'quiz-q' + (submitted ? (right ? ' right' : ' wrong') : '')}>
        <p className="quiz-question"><span className="quiz-num">Q{n + 1}</span><Rich text={q.q}/></p>
        <div className="exam-topic">{q.topic}</div>
        <div className="quiz-options" role="radiogroup" aria-label={`Question ${n + 1}`}>{optionOrder[qi].map((oi, pos) => {
          const mark = submitted ? (oi === q.answer ? ' correct' : pick === oi ? ' incorrect' : ' faded') : '';
          return <button key={oi} role="radio" aria-checked={pick === oi} className={(pick === oi ? 'selected' : '') + mark} disabled={submitted} onClick={() => { setPicks(p => ({ ...p, [qi]: oi })); setArmed(false); }}>
            <span className="quiz-letter">{String.fromCharCode(65 + pos)}</span><span><Rich text={q.options[oi]}/></span>
            {submitted && oi === q.answer && <span className="quiz-tick" aria-label="correct answer">✓</span>}
          </button>;
        })}</div>
        {submitted && <div className="quiz-explain"><strong>{right ? 'Correct.' : pick === undefined ? 'Not answered.' : 'Not quite.'}</strong> <Rich text={q.explain}/></div>}
      </li>;
    })}</ol>
    {!submitted && <div className="quiz-submit exam-submit">
      <span>{armed ? `${TOTAL - answered} unanswered question${TOTAL - answered === 1 ? '' : 's'} will count as wrong.` : `${answered} of ${TOTAL} answered`}</span>
      <button className="button primary" onClick={submit}>{armed ? 'Submit Anyway' : 'Submit The Exam'}</button>
    </div>}
  </main>;
}
