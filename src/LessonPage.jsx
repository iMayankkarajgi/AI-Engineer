import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { lessonById, lessonIds, moduleOf } from './course/curriculum';
import { Block, Rich } from './LessonBlocks';
import { useApp, PASS_MARK, LOCKS } from './app';
import { NotFound } from './pages';
import { setDescription } from './seo';

const pad = n => String(n).padStart(2, '0');
const loaders = import.meta.glob('./course/lessons/*.js');

// Loads a lesson body on demand. Returns undefined while loading, null if the
// lesson has not been written yet.
function useLessonBody(id) {
  const [state, setState] = useState({ id: null, body: undefined });
  useEffect(() => {
    let live = true;
    const load = loaders[`./course/lessons/${id}.js`];
    if (!load) { setState({ id, body: null }); return; }
    setState({ id, body: undefined });
    load().then(m => { if (live) setState({ id, body: m.default }); }).catch(() => { if (live) setState({ id, body: null }); });
    return () => { live = false; };
  }, [id]);
  return state.id === id ? state.body : undefined;
}

function LessonNav({ mod, currentId }) {
  const { completed, isUnlocked } = useApp();
  const [open, setOpen] = useState(() => matchMedia('(min-width: 1100px)').matches);
  const done = mod.lessons.filter(l => completed.includes(l.id)).length;
  return <nav className={'lesson-nav' + (open ? ' open' : '')} aria-label="Lessons in this module">
    <button className="lesson-nav-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
      <span><small>Module {mod.number}</small><strong>{mod.short}</strong><small>{done} of {mod.lessons.length} passed</small></span>
      <svg className="chevron" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    </button>
    <div className="lesson-nav-body">
      <div className="meter" aria-hidden="true"><span style={{ width: `${(done / mod.lessons.length) * 100}%` }}/></div>
      <ol>{mod.lessons.map(l => {
        const isDone = completed.includes(l.id), open = isUnlocked(l.id);
        return <li key={l.id} className={(l.id === currentId ? 'current ' : '') + (isDone ? 'done ' : '') + (open ? '' : 'locked')}>
          <Link to={`/lesson/${l.id}`} aria-current={l.id === currentId ? 'page' : undefined}>
            <span className="nav-index">{isDone ? '✓' : open ? l.num : '🔒'}</span><span>{l.title}</span>
          </Link>
        </li>;
      })}</ol>
      <Link className="lesson-nav-back" to={`/module/${mod.id}`}>← Module overview</Link>
    </div>
  </nav>;
}

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const els = ids.map(id => document.getElementById(id)).filter(Boolean);
    const ob = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActive(visible[0].target.id);
    }, { rootMargin: '-90px 0px -60% 0px' });
    els.forEach(el => ob.observe(el));
    return () => ob.disconnect();
  }, [ids.join()]);
  return active;
}

function Toc({ sections }) {
  const active = useActiveSection(sections.map(s => s.id));
  return <aside className="lesson-toc" aria-label="On this page">
    <div className="lesson-toc-title">On this page</div>
    <ul>{sections.map(s => <li key={s.id}><a className={active === s.id ? 'active' : ''} href={`#${s.id}`} onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }); }}>{s.title}</a></li>)}</ul>
  </aside>;
}

function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => { const h = document.documentElement; setP(Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - innerHeight))); };
    on(); addEventListener('scroll', on, { passive: true }); return () => removeEventListener('scroll', on);
  }, []);
  return <div className="reading-progress" aria-hidden="true"><span style={{ transform: `scaleX(${p})` }}/></div>;
}

// Deterministic shuffle so a retry shows options in a new order.
function shuffled(n, seed) {
  const idx = [...Array(n).keys()]; let s = seed * 9301 + 49297;
  for (let i = n - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor((s / 233280) * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx;
}

function Quiz({ id, quiz, nextId }) {
  const { recordScore, scores, completed } = useApp();
  const [attempt, setAttempt] = useState(0);
  const [picks, setPicks] = useState({});
  const [submitted, setSubmitted] = useState(false);
  // Options are always shuffled (stable per lesson and attempt), so the stored
  // answer position never gives the answer away.
  const seed = useMemo(() => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 100003, 7), [id]);
  const orders = useMemo(() => quiz.map((q, i) => shuffled(q.options.length, seed + attempt * 7919 + i * 131)), [attempt, quiz, seed]);
  const score = quiz.reduce((s, q, i) => s + (picks[i] === q.answer ? 1 : 0), 0);
  const passed = submitted && score >= PASS_MARK;
  const answered = Object.keys(picks).length;
  const submit = () => { setSubmitted(true); recordScore(id, score); setTimeout(() => document.getElementById('quiz-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50); };
  const retry = () => { setPicks({}); setSubmitted(false); setAttempt(a => a + 1); document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' }); };
  const already = completed.includes(id);
  return <div className="quiz">
    <div className="quiz-intro">
      <p>Answer all {quiz.length} questions, then submit. Score <b>{PASS_MARK} or more</b> to pass{LOCKS ? ' and unlock the next lesson' : ''}.</p>
      {(scores[id] !== undefined || already) && <span className={'quiz-badge' + (already ? ' ok' : '')}>{already ? '✓ Passed' : 'Not passed yet'}{scores[id] !== undefined ? ` · best ${scores[id]}/${quiz.length}` : ''}</span>}
    </div>
    <ol className="quiz-list">{quiz.map((q, qi) => {
      const pick = picks[qi], right = pick === q.answer;
      return <li key={qi} className={'quiz-q' + (submitted ? (right ? ' right' : ' wrong') : '')}>
        <p className="quiz-question"><span className="quiz-num">Q{qi + 1}</span><Rich text={q.q}/></p>
        <div className="quiz-options" role="radiogroup" aria-label={`Question ${qi + 1}`}>{orders[qi].map((oi, pos) => {
          const cls = pick === oi ? 'selected' : '';
          const mark = submitted ? (oi === q.answer ? ' correct' : pick === oi ? ' incorrect' : ' faded') : '';
          return <button key={oi} role="radio" aria-checked={pick === oi} className={cls + mark} disabled={submitted} onClick={() => setPicks(p => ({ ...p, [qi]: oi }))}>
            <span className="quiz-letter">{String.fromCharCode(65 + pos)}</span><span><Rich text={q.options[oi]}/></span>
            {submitted && oi === q.answer && <span className="quiz-tick" aria-label="correct answer">✓</span>}
          </button>;
        })}</div>
        {submitted && <div className="quiz-explain"><strong>{right ? 'Correct.' : pick === undefined ? 'Not answered.' : 'Not quite.'}</strong> <Rich text={q.explain}/></div>}
      </li>;
    })}</ol>
    {!submitted
      ? <div className="quiz-submit"><span>{answered} of {quiz.length} answered</span><button className="button primary" disabled={answered < quiz.length} onClick={submit}>Submit Answers</button></div>
      : <div id="quiz-result" className={'quiz-result ' + (passed ? 'pass' : 'fail')} role="status">
          <div className="quiz-score"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.9" className="track"/><circle cx="18" cy="18" r="15.9" className="fill" style={{ strokeDasharray: `${(score / quiz.length) * 100} 100` }}/></svg><b>{score}/{quiz.length}</b></div>
          <div>
            <strong>{passed ? (score === quiz.length ? 'Perfect score! Lesson passed.' : 'Lesson passed!') : `You scored ${score}. You need ${PASS_MARK} to pass.`}</strong>
            <p>{passed ? (nextId ? (LOCKS ? 'The next lesson is now unlocked.' : 'Carry on to the next lesson when you are ready.') : 'That was the last lesson. The final exam is the next step.') : 'Read the explanations above, revisit the sections they point to, then try again. The options will be shuffled.'}</p>
            <div className="quiz-actions">
              {passed && nextId && <Link className="button primary" to={`/lesson/${nextId}`}>Next Lesson →</Link>}
              {passed && !nextId && <Link className="button primary" to="/exam">Take The Final Exam →</Link>}
              <button className={'button ' + (passed ? 'ghost' : 'primary')} onClick={retry}>{passed ? 'Retake Quiz' : '↺ Try Again'}</button>
            </div>
          </div>
          {passed && <div className="confetti" aria-hidden="true">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ '--i': i }}/>)}</div>}
        </div>}
  </div>;
}

function Locked({ lesson, mod }) {
  const { nextLesson } = useApp();
  const prevId = lessonIds[lessonIds.indexOf(lesson.id) - 1], prev = lessonById[prevId];
  return <main className="page container narrow locked-page" style={{ '--track': mod.accent }}>
    <div className="lock-icon" aria-hidden="true">🔒</div>
    <div className="eyebrow">Module {mod.number} · Lesson {lesson.num}</div>
    <h1>{lesson.title}</h1>
    <p className="dek">This lesson unlocks when you pass the quiz for <b>{prev.num} {prev.title}</b> with at least {PASS_MARK} of 5 correct answers. Each lesson builds on the one before it.</p>
    {lesson.covers?.length > 0 && <div className="card"><h3>What you’ll learn here</h3><ul className="check-list">{lesson.covers.map(c => <li key={c}>{c}</li>)}</ul></div>}
    <div className="locked-actions">
      <Link className="button primary" to={`/lesson/${nextLesson}`}>Continue Where You Left Off →</Link>
      <Link className="button ghost" to={`/module/${mod.id}`}>Module Overview</Link>
    </div>
  </main>;
}

export default function LessonPage() {
  const { id } = useParams();
  const meta = lessonById[id], mod = moduleOf(id);
  const body = useLessonBody(id);
  useEffect(() => { if (body?.summary) setDescription(body.summary); }, [body]);
  const { isUnlocked, completed } = useApp();
  useEffect(() => { window.scrollTo(0, 0); }, [id]);
  if (!meta || !mod) return <NotFound/>;
  if (!isUnlocked(id)) return <Locked lesson={meta} mod={mod}/>;
  const at = lessonIds.indexOf(id), prevId = lessonIds[at - 1], nextId = lessonIds[at + 1];
  const passed = completed.includes(id);

  const sections = body ? [
    ...body.sections,
    ...(body.terms?.length ? [{ id: 'key-terms', title: 'Key terms', terms: true }] : []),
    { id: 'quiz', title: 'Quiz: check your understanding', quiz: true },
    { id: 'takeaways', title: 'Key takeaways', summary: true },
  ] : [];

  return <main className="page lesson-page" style={{ '--track': mod.accent }}>
    <ReadingProgress/>
    <div className="lesson-layout">
      <LessonNav mod={mod} currentId={id}/>
      <article className="lesson-article">
        <header className="lesson-header">
          <nav className="crumbs" aria-label="Breadcrumb"><Link to="/curriculum">Curriculum</Link><span>/</span><Link to={`/module/${mod.id}`}>Module {mod.number}: {mod.short}</Link></nav>
          <div className="eyebrow">Lesson {meta.num} · {mod.lessons.findIndex(l => l.id === id) + 1} of {mod.lessons.length} in this module</div>
          <h1>{meta.title}</h1>
          {body && <p className="dek">{body.hook}</p>}
          <div className="meta">
            {body && <span>⏱ {body.minutes} min</span>}
            {body && <span>{body.sections.length} sections</span>}
            <span>5-question quiz</span>
            <span className={passed ? 'ok' : ''}>{passed ? '✓ Passed' : `Pass mark ${PASS_MARK}/5`}</span>
          </div>
          <ol className="unit-rail" aria-hidden="true">{mod.lessons.map((l, i) => <li key={l.id} className={completed.includes(l.id) ? 'past' : l.id === id ? 'now' : ''}/>)}</ol>
        </header>
        {body === undefined && <div className="lesson-loading"><span/><span/><span/></div>}
        {body === null && <div className="card lesson-pending"><h3>This lesson is being prepared</h3><p>The outline is below. Check back soon.</p><ul className="check-list">{meta.covers.map(c => <li key={c}>{c}</li>)}</ul></div>}
        {body && <div className="prose">
          <div className="in-short"><span>In short</span><p><Rich text={body.summary}/></p></div>
          {meta.covers?.length > 0 && <details className="covers" open><summary>What we will cover ({meta.covers.length})</summary><ul>{meta.covers.map(c => <li key={c}>{c}</li>)}</ul></details>}
          {sections.map((s, n) => <section key={s.id} id={s.id} className={'lesson-section' + (s.summary ? ' summary' : '') + (s.quiz ? ' quiz-section' : '')}>
            <h2><span className="section-num">{pad(n + 1)}</span>{s.title}</h2>
            {s.blocks?.map((b, i) => <Block key={i} block={b}/>)}
            {s.terms && <dl className="b-terms">{body.terms.map(t => <div key={t.term}><dt>{t.term}</dt><dd><Rich text={t.def}/></dd></div>)}</dl>}
            {s.quiz && <Quiz key={id} id={id} quiz={body.quiz} nextId={nextId}/>}
            {s.summary && <ul className="b-list takeaways">{body.takeaways.map((t, i) => <li key={i}><Rich text={t}/></li>)}</ul>}
          </section>)}
          <p className="lesson-credit">Modern AI Engineering: interactive lessons from the AI Engineer Bootcamp. Each lesson is written to be self-contained: definitions, code, visuals, and a quiz all on one page.</p>
        </div>}
        <nav className="pager" aria-label="Lesson navigation">
          {prevId ? <Link className="pager-card prev" to={`/lesson/${prevId}`}><small>← Previous · {lessonById[prevId].num}</small><strong>{lessonById[prevId].title}</strong></Link> : <span/>}
          {nextId
            ? (passed || !LOCKS ? <Link className="pager-card next" to={`/lesson/${nextId}`}><small>Next · {lessonById[nextId].num} →</small><strong>{lessonById[nextId].title}</strong></Link>
              : <a className="pager-card next locked" href="#quiz" onClick={e => { e.preventDefault(); document.getElementById('quiz')?.scrollIntoView({ behavior: 'smooth' }); }}><small>🔒 Pass the quiz to unlock</small><strong>{lessonById[nextId].title}</strong></a>)
            : <Link className="pager-card next" to="/exam"><small>Lessons complete →</small><strong>Take the final exam</strong></Link>}
        </nav>
      </article>
      {body && <Toc sections={sections}/>}
    </div>
  </main>;
}
