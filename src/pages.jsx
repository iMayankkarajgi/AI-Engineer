import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { modules, allLessons, lessonById } from './course/curriculum';
import { guide, glossary, faqs } from './course/reference';
import { useApp, ACCOUNTS, CLOUD, PASS_MARK, LOCKS } from './app';
import { Avatar, GoogleMark, SignOutButton } from './Profile';
import Modal from './Modal';
import LabIcon from './labIcons';
import { resources } from './course/resources';
import { EXAM_PASS, examQuestions } from './course/exam';
import { TrackPicker, useTrack } from './Tracks';
import { tracks, trackById, labTrack, labUnlocked, FREE_LABS } from './course/tracks';
import { ThemeToggle, useTheme } from './theme';
import { useInView } from './LessonBlocks';
import { Viz } from './viz';
import { VIZ } from './course/vizNames';
import { vizUsage } from './course/vizUsage';

const Universe = React.lazy(() => import('./Universe'));
const TOTAL = allLessons.length;

export function Logo() {
  return <Link className="logo" to="/" aria-label="AI Atlas home"><span className="logo-symbol">✳</span><span>AI Atlas</span></Link>;
}

export function Header() {
  const { user, nextLesson } = useApp();
  const [menu, setMenu] = useState(false);
  const close = () => setMenu(false);
  return <header className="site-header"><div className="header-inner">
    <Logo/>
    <nav className={menu ? 'menu-open' : ''} aria-label="Main navigation">
      <NavLink onClick={close} to="/curriculum">Curriculum</NavLink>
      <NavLink onClick={close} to="/guide">Course guide</NavLink>
      <NavLink onClick={close} to="/lab">Lab</NavLink>
      <NavLink onClick={close} to="/pricing">Pricing</NavLink>
      <NavLink onClick={close} to="/practice">Practice</NavLink>
      <NavLink onClick={close} to="/glossary">Glossary</NavLink>
      <NavLink onClick={close} to="/faq">FAQ</NavLink>
      <NavLink onClick={close} to="/resources">Useful links</NavLink>
      <NavLink onClick={close} to="/dashboard">My learning</NavLink>
      {ACCOUNTS && (user ? <NavLink className="nav-account" onClick={close} to="/profile">Your profile</NavLink>
        : <><Link className="nav-account" onClick={close} to="/account?mode=signup">Sign up (new here)</Link><Link className="nav-account plain" onClick={close} to="/account?mode=login">Sign in</Link></>)}
    </nav>
    <div className="header-actions">
      <ThemeToggle/>
      {user && <Link className="avatar-link" to="/profile" aria-label="Your profile" title={user.name}><Avatar user={user} size={34}/></Link>}
      {!ACCOUNTS || user
        ? <Link className="button primary small continue" to={`/lesson/${nextLesson}`}>Continue</Link>
        : <><Link className="button ghost small signin" to="/account?mode=login">Sign In</Link><Link className="button primary small" to="/account?mode=signup">Sign Up</Link></>}
      <button className="menu-toggle" aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? '×' : '☰'}</button>
    </div>
  </div></header>;
}

export function Footer() {
  return <footer className="site-footer"><div className="footer-inner">
    <div><Logo/><p>Understand AI engineering from the inside out.</p></div>
    <div className="footer-links"><Link to="/curriculum">Curriculum</Link><Link to="/guide">Course guide</Link><Link to="/pricing">Pricing</Link><Link to="/practice">Practice</Link><Link to="/glossary">Glossary</Link><Link to="/faq">FAQ</Link><Link to="/resources">Useful links</Link><Link to="/dashboard">Your progress</Link></div>
    <small>Lessons and interactives © {new Date().getFullYear()} AI Atlas. All lesson text, code, and quizzes are original content.</small>
  </div></footer>;
}

// Soft orbiting dots for the account page; colors follow the theme.
export function ParticleField() {
  const ref = useRef(null), { theme } = useTheme();
  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d'), count = 140;
    const rgb = theme === 'light' ? '40,70,190' : '205,225,255';
    let w, h, raf, t = 0;
    const pts = Array.from({ length: count }, (_, i) => ({ a: i * 2.39996, r: Math.sqrt(i / count), z: Math.random(), s: Math.random() * .7 + .3 }));
    const size = () => { const b = canvas.getBoundingClientRect(); w = canvas.width = b.width * devicePixelRatio; h = canvas.height = b.height * devicePixelRatio; };
    size();
    const ro = new ResizeObserver(size); ro.observe(canvas);
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const cx = w * .5, cy = h * .53, R = Math.min(w, h) * .39;
      t += reduce ? 0 : .003;
      pts.forEach(p => {
        const a = p.a + t * (p.z - .4), v = p.r * R;
        const x = cx + Math.cos(a) * v * (1 + .13 * Math.sin(t * 3 + p.a)), y = cy + Math.sin(a) * v * .76;
        ctx.beginPath(); ctx.arc(x, y, Math.max(.3, p.s * 1.3 + (.5 - p.r) * 1.4) * devicePixelRatio, 0, 7);
        ctx.fillStyle = `rgba(${rgb},${.1 + .65 * (1 - p.r) * p.s})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [theme]);
  return <canvas className="particle-field" ref={ref} aria-hidden="true"/>;
}

function PageIntro({ eyebrow, title, children }) {
  return <div className="page-intro"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{children && <p className="dek">{children}</p>}</div>;
}

const modDone = (m, completed) => m.lessons.filter(l => completed.includes(l.id)).length;

// Animated vertical learning path: one node per module, filled by progress.
export function LearningPath({ mods = modules }) {
  const { completed, isUnlocked } = useApp();
  const [ref, seen] = useInView({ threshold: 0.05 });
  return <ol ref={ref} className={'learning-path' + (seen ? ' in-view' : '')}>{mods.map((m, i) => {
    const done = modDone(m, completed), open = isUnlocked(m.lessons[0].id), full = done === m.lessons.length;
    return <li key={m.id} style={{ '--track': m.accent, '--d': `${i * 70}ms`, '--p': done / m.lessons.length }} className={(full ? 'full ' : '') + (open ? 'open' : 'locked')}>
      <Link to={`/module/${m.id}`}>
        <span className="lp-node"><span>{full ? '✓' : m.icon}</span></span>
        <span className="lp-copy"><small>Module {m.number} · {m.stage}</small><strong>{m.title}</strong><span className="lp-meter"><i/></span><small>{done}/{m.lessons.length} lessons passed</small></span>
      </Link>
    </li>;
  })}</ol>;
}

export function Curriculum() {
  const { completed, isUnlocked } = useApp();
  const [track, setTrack] = useTrack();
  const passed = track.lessons.filter(l => completed.includes(l.id)).length;
  const next = track.lessons.find(l => !completed.includes(l.id) && isUnlocked(l.id)) || track.lessons.find(l => !completed.includes(l.id)) || track.lessons[0];
  return <main className="page container">
    <PageIntro eyebrow="Curriculum" title="Choose your learning track">
      Learn machine learning and deep learning, generative AI engineering, or the complete path with career preparation. Every lesson ends with a 5-question quiz; score {PASS_MARK}/5 to pass it{LOCKS ? ' and unlock the next one' : ''}.
    </PageIntro>
    <TrackPicker value={track.id} onChange={setTrack}/>

    <div className="track-detail-head" style={{ '--track': track.accent }}>
      <div><div className="eyebrow">{track.modules.length} modules · {track.lessons.length} lessons · {track.labs.length} labs</div><h2>{track.name}</h2><p>{track.blurb}</p></div>
      <div className="track-detail-actions">
        <Link className="button primary" to={`/lesson/${next.id}`}>{passed ? 'Continue This Track' : 'Start This Track'} →</Link>
        <Link className="button ghost" to="/pricing">See Pricing</Link>
      </div>
    </div>
    <div className="overall card"><div><small>Your progress in this track</small><strong>{passed}<span> / {track.lessons.length} lessons</span></strong></div><div className="meter large"><span style={{ width: `${(passed / track.lessons.length) * 100}%` }}/></div></div>
    <div className="module-grid">{track.modules.map(m => {
      const done = modDone(m, completed), open = isUnlocked(m.lessons[0].id);
      return <Link key={m.id} to={`/module/${m.id}`} className={'module-card' + (open ? '' : ' locked')} style={{ '--track': m.accent }}>
        <div className="module-card-top"><span className="course-icon">{m.icon}</span><span>Module {m.number}</span><span className="module-stage">{open ? m.stage : '🔒 Locked'}</span></div>
        <h3>{m.title}</h3>
        <p>{m.intro[0]}</p>
        <ul className="module-card-lessons">{m.lessons.slice(0, 4).map(l => <li key={l.id} className={completed.includes(l.id) ? 'done' : ''}>{l.num} {l.title}</li>)}{m.lessons.length > 4 && <li className="more">+ {m.lessons.length - 4} more</li>}</ul>
        <div className="course-card-foot"><span>{m.lessons.length} lesson{m.lessons.length > 1 ? 's' : ''}</span><span>{done ? `${done}/${m.lessons.length} passed` : open ? 'Start →' : 'Finish earlier modules'}</span></div>
        <div className="meter"><span style={{ width: `${(done / m.lessons.length) * 100}%` }}/></div>
      </Link>;
    })}</div>
    <div className="card track-labs">
      <div><small>Hands-on</small><h3>{track.labs.length} interactive labs in this track</h3><p>Simulations you can drag, step through and break, each tied to the lesson that explains it.</p></div>
      <Link className="button ghost" to={`/lab?track=${track.id}`}>Open The Labs →</Link>
    </div>
    <section><h2 className="section-title">The learning path</h2><p className="section-dek">Each module builds on the one before it. Follow the line from top to bottom.</p><LearningPath mods={track.modules}/></section>
  </main>;
}

export function Module() {
  const { id } = useParams(), m = modules.find(x => x.id === id);
  const { completed, isUnlocked, scores } = useApp();
  if (!m) return <NotFound/>;
  const done = modDone(m, completed);
  const next = m.lessons.find(l => !completed.includes(l.id)) || m.lessons[0];
  const idx = modules.indexOf(m), prev = modules[idx - 1], after = modules[idx + 1];
  const open = isUnlocked(m.lessons[0].id);
  return <main className="page course-page" style={{ '--track': m.accent }}>
    <section className="course-hero"><div className="container">
      <React.Suspense fallback={null}><Universe progress={idx / (modules.length - 1)} className="course-universe"/></React.Suspense>
      <div className="course-hero-copy">
        <nav className="crumbs" aria-label="Breadcrumb"><Link to="/curriculum">Curriculum</Link><span>/</span><span>Module {m.number}</span></nav>
        <div className="eyebrow">Module {m.number} · {m.stage}</div>
        <h1>{m.title}</h1>
        {m.intro.map((p, i) => <p key={i} className={i ? 'dek small' : 'dek'}>{p}</p>)}
        <div className="meta"><span>{m.lessons.length} lessons</span><span>5 quiz questions each</span><span>{done} of {m.lessons.length} passed</span></div>
        <div className="meter large"><span style={{ width: `${(done / m.lessons.length) * 100}%` }}/></div>
        {open ? <Link className="button primary" to={`/lesson/${next.id}`}>{done ? 'Continue' : 'Start the module'} →</Link>
          : <p className="locked-note">🔒 Finish Module {prev?.number} to unlock this module. <Link to={`/module/${prev?.id}`}>Go to Module {prev?.number} →</Link></p>}
      </div>
    </div></section>
    <div className="container course-body">
      <section aria-labelledby="lessons-heading">
        <h2 id="lessons-heading">Lessons</h2>
        <ol className="lesson-list">{m.lessons.map(l => {
          const isDone = completed.includes(l.id), can = isUnlocked(l.id);
          return <li key={l.id}><Link to={`/lesson/${l.id}`} className={(isDone ? 'done' : '') + (can ? '' : ' locked')}>
            <span className="nav-index">{isDone ? '✓' : can ? l.num : '🔒'}</span>
            <span className="lesson-list-copy"><strong>{l.title}</strong>{l.covers?.length > 0 && <small>{l.covers.slice(0, 4).join(' · ')}{l.covers.length > 4 ? ' …' : ''}</small>}</span>
            <span className="lesson-list-time">{scores[l.id] !== undefined ? `${scores[l.id]}/5` : can ? 'Open' : ''}</span>
          </Link></li>;
        })}</ol>
        <nav className="pager">
          {prev ? <Link className="pager-card prev" to={`/module/${prev.id}`}><small>← Module {prev.number}</small><strong>{prev.title}</strong></Link> : <span/>}
          {after && <Link className="pager-card next" to={`/module/${after.id}`}><small>Module {after.number} →</small><strong>{after.title}</strong></Link>}
        </nav>
      </section>
      <aside className="course-aside">
        <div className="card"><h3>How each lesson works</h3><ul className="check-list">
          <li>Intuition and an analogy first</li><li>Animated diagrams and step-by-step flows</li><li>Interactive widgets you can drag and play</li><li>Real code with walkthrough and real output</li><li>Side-by-side comparisons</li><li>A 5-question quiz: score {PASS_MARK}+ to {LOCKS ? 'unlock the next lesson' : 'pass the lesson'}</li>
        </ul></div>
        <div className="card"><h3>Module outcome</h3><p>{m.intro[1] || m.intro[0]}</p></div>
      </aside>
    </div>
  </main>;
}

export function Guide() {
  const g = guide;
  const toc = [['about', g.about.title], ['what-is', g.whatIs.title], ['audience', g.audience.title], ['learn', 'What will we learn?'], ['prerequisites', g.prerequisites.title], ['how-to', g.howTo.title], ['glance', 'Curriculum at a glance'], ['path', 'Learning path']];
  return <main className="page container guide-page">
    <PageIntro eyebrow="Course guide" title="Everything you need before lesson one">{g.about.lead}</PageIntro>
    <nav className="guide-toc" aria-label="Guide sections">{toc.map(([id, t], i) => <a key={id} href={`#${id}`} onClick={e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); }}><span>{String(i + 1).padStart(2, '0')}</span>{t}</a>)}</nav>
    <section id="about" className="guide-section"><h2>{g.about.title}</h2>{g.about.body.map((p, i) => <p key={i}>{p}</p>)}
      <div className="guide-points">{g.about.points.map(([t, d]) => <div key={t} className="card"><strong>{t}</strong><p>{d}</p></div>)}</div></section>
    <section id="what-is" className="guide-section"><h2>{g.whatIs.title}</h2><p className="lead">{g.whatIs.lead}</p>{g.whatIs.body.map((p, i) => <p key={i}>{p}</p>)}
      <div className="equation"><span className="eq-label">AI engineering =</span>{g.whatIs.equation.map((e, i) => <React.Fragment key={e}>{i > 0 && <span className="eq-plus">+</span>}<span className="eq-term" style={{ '--d': `${i * 200}ms` }}>{e}</span></React.Fragment>)}</div></section>
    <section id="audience" className="guide-section"><h2>{g.audience.title}</h2><ul className="audience">{g.audience.items.map(([a, b]) => <li key={a}><strong>{a}</strong> {b}</li>)}</ul></section>
    <section id="learn" className="guide-section"><h2>What will we learn?</h2>
      <div className="learn-grid">{modules.map(m => <Link key={m.id} to={`/module/${m.id}`} style={{ '--track': m.accent }}><span className="course-icon">{m.icon}</span><div><small>Module {m.number}</small><strong>{m.short}</strong><p>{m.lessons.map(l => l.title.replace(/^(What (is|are) |How (does|do|to) )/, '').replace(/\?.*$/, '')).slice(0, 6).join(' · ')}{m.lessons.length > 6 ? ' …' : ''}</p></div></Link>)}</div></section>
    <section id="prerequisites" className="guide-section"><h2>{g.prerequisites.title}</h2><div className="guide-points">{g.prerequisites.items.map(([t, d]) => <div key={t} className="card"><strong>{t}</strong><p>{d}</p></div>)}</div></section>
    <section id="how-to" className="guide-section"><h2>{g.howTo.title}</h2><ol className="b-list how-to">{g.howTo.items.map(t => <li key={t}>{t}</li>)}</ol></section>
    <section id="glance" className="guide-section"><h2>Curriculum at a glance</h2><div className="b-table"><table><thead><tr><th>Module</th><th>Topic</th><th>Lessons</th></tr></thead>
      <tbody>{modules.map(m => <tr key={m.id}><td>{m.number}</td><td><Link to={`/module/${m.id}`}>{m.title}</Link></td><td>{m.lessons.length}</td></tr>)}</tbody></table></div></section>
    <section id="path" className="guide-section"><h2>Learning path</h2><LearningPath/></section>
    <div className="guide-cta"><Link className="button primary" to={`/lesson/${allLessons[0].id}`}>Start Lesson {allLessons[0].num} →</Link></div>
  </main>;
}

export function Glossary() {
  const [query, setQuery] = useState('');
  const entries = glossary.filter(e => (e.term + ' ' + e.def).toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.term.localeCompare(b.term));
  const letters = [...new Set(entries.map(e => e.term[0].toUpperCase()))];
  return <main className="page container narrow">
    <PageIntro eyebrow="Reference" title="AI engineering glossary">Quick definitions of the most important terms. Each links to the lesson that teaches it in depth.</PageIntro>
    <label className="search-box"><span aria-hidden="true">⌕</span><input placeholder="Search a concept…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search the glossary"/><small>{entries.length} terms</small></label>
    {letters.map(L => <section key={L} className="glossary-group"><h2>{L}</h2><dl className="glossary-list">{entries.filter(e => e.term[0].toUpperCase() === L).map(e =>
      <div key={e.term}><dt>{e.term}</dt><dd>{e.def}{e.lesson && lessonById[e.lesson] && <Link className="glossary-link" to={`/lesson/${e.lesson}`}>Lesson {lessonById[e.lesson].num} →</Link>}</dd></div>)}</dl></section>)}
    <p className="lesson-credit">AI Atlas glossary — {entries.length} key terms, each linked to the lesson that teaches it.</p>
  </main>;
}

export function Faq() {
  const [open, setOpen] = useState(0);
  return <main className="page container narrow">
    <PageIntro eyebrow="Questions" title="AI engineering course FAQs"/>
    <div className="faq">{faqs.map(([q, a], i) => <div key={q} className={'faq-item' + (open === i ? ' open' : '')}>
      <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}><span>{q}</span><i aria-hidden="true">+</i></button>
      <div className="faq-a"><div><p>{a}</p></div></div>
    </div>)}</div>
  </main>;
}

export function Dashboard() {
  const { user, completed, scores, resetGuest, nextLesson, exam } = useApp();
  const next = lessonById[nextLesson];
  const nextMod = modules.find(m => m.lessons.some(l => l.id === nextLesson));
  const attempted = Object.keys(scores).length;
  const avg = attempted ? (Object.values(scores).reduce((a, b) => a + b, 0) / attempted).toFixed(1) : '–';
  return <main className="page container">
    <PageIntro eyebrow="Your learning" title={user ? `Welcome back, ${user.name.split(' ')[0]}.` : completed.length ? 'Keep going.' : 'Your journey starts here.'}>
      {!ACCOUNTS ? 'Your progress is saved in this browser.' : user ? 'Your progress is synced to your account.' : 'Guest progress is saved in this browser. Create an account to sync it across devices.'}
    </PageIntro>
    <div className="dashboard-top">
      <div className="card stat"><small>Lessons passed</small><strong>{completed.length}<span> / {TOTAL}</span></strong><div className="meter large"><span style={{ width: `${(completed.length / TOTAL) * 100}%` }}/></div></div>
      <div className="card stat"><small>Average best quiz score</small><strong>{avg}<span> / 5</span></strong><p>{attempted} quiz{attempted === 1 ? '' : 'zes'} attempted</p></div>
      <div className="card"><small>Continue learning · Module {nextMod.number}</small><h3>{next.num} {next.title}</h3><Link className="button primary" to={`/lesson/${nextLesson}`}>Open Lesson →</Link></div>
    </div>
    <div className="card exam-card">
      <div><small>Final exam</small><h3>{exam !== null && exam >= EXAM_PASS ? `Passed with ${exam} / ${examQuestions.length}` : completed.length < TOTAL ? 'Opens when every lesson is passed' : exam !== null ? `Best score ${exam} / ${examQuestions.length}` : 'Ready when you are'}</h3><p>{examQuestions.length} mixed questions. Score {EXAM_PASS} or more to earn the certificate.</p></div>
      <Link className={'button ' + (completed.length < TOTAL ? 'ghost' : 'primary')} to="/exam">{completed.length < TOTAL ? 'About The Exam' : exam !== null && exam >= EXAM_PASS ? 'Retake The Exam' : 'Take The Final Exam'} →</Link>
    </div>
    <h2 className="section-title">Your modules</h2>
    <ul className="dashboard-tracks">{modules.map(m => {
      const done = modDone(m, completed);
      return <li key={m.id} style={{ '--track': m.accent }}><Link to={`/module/${m.id}`}>
        <span className="course-icon">{m.icon}</span><strong>{m.number}. {m.short}</strong>
        <span className="meter"><span style={{ width: `${(done / m.lessons.length) * 100}%` }}/></span>
        <small>{done} / {m.lessons.length}</small>
      </Link></li>;
    })}</ul>
    <div className="account-link">{user ? <><Link className="button ghost" to="/profile">Your Profile</Link><SignOutButton/></>
      : <>{ACCOUNTS && <Link className="button ghost" to="/account">Create An Account To Sync Progress</Link>}{completed.length > 0 && <ResetButton onReset={resetGuest}/>}</>}</div>
  </main>;
}

// Two-step reset: the first click asks, the second resets.
function ResetButton({ onReset }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return; const t = setTimeout(() => setArmed(false), 5000); return () => clearTimeout(t); }, [armed]);
  return armed
    ? <span className="reset-confirm">Reset all progress and quiz scores in this browser? <button className="text-button danger" onClick={() => { onReset(); setArmed(false); }}>Yes, reset</button><button className="text-button" onClick={() => setArmed(false)}>Cancel</button></span>
    : <button className="text-button" onClick={() => setArmed(true)}>Reset Progress</button>;
}

export function Account() {
  const { user, auth, signInWithGoogle } = useApp(), nav = useNavigate(), { state } = useLocation();
  const [params] = useSearchParams(), asked = params.get('mode') === 'login' ? 'login' : 'signup';
  const [mode, setMode] = useState(asked), [error, setError] = useState(state?.error || ''), [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  useEffect(() => { if (user) nav(CLOUD ? '/profile' : '/dashboard'); else if (!ACCOUNTS) nav('/dashboard'); }, [user, nav]);
  // The header links choose a tab: ?mode=signup or ?mode=login.
  useEffect(() => { setMode(asked); setError(''); setNotice(''); }, [asked]);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const d = await auth(mode, Object.fromEntries(new FormData(e.currentTarget)));
      if (d.confirm) setNotice('Almost there. Check your inbox and confirm your email address to finish signing up.');
    }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  // Leaves the page for Google; the session is picked up when the browser returns.
  async function google() {
    setBusy(true); setError('');
    try { await signInWithGoogle('/profile'); }
    catch (err) { setError(err.message); setBusy(false); }
  }
  return <main className="account-page">
    <div className="account-aside"><ParticleField/><div className="account-aside-copy"><div className="eyebrow">Build your understanding</div><h2>Every concept connects.</h2><p>Track your path from your first lesson to real AI systems.</p></div></div>
    <div className="account-form-wrap"><div className="account-form">
      <div className="period-toggle account-tabs" role="tablist" aria-label="Sign up or sign in">
        <button role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setError(''); }}>Sign Up</button>
        <button role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(''); }}>Sign In</button>
      </div>
      <h1>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
      <p className="dek">{mode === 'signup' ? 'Keep your progress across devices.' : 'Pick up where you left off.'}</p>
      {CLOUD && <><button type="button" className="button ghost google-button" disabled={busy} onClick={google}><GoogleMark/>Continue With Google</button><div className="form-divider"><span>or use your email</span></div></>}
      <form onSubmit={submit}>
        {mode === 'signup' && <label>Your name<input name="name" required maxLength="80" autoComplete="name"/></label>}
        <label>Email address<input type="email" name="email" required autoComplete="email"/></label>
        <label>Password<input type="password" name="password" minLength="10" required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}/></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        {notice && <div className="form-ok" role="status">{notice}</div>}
        <button className="button primary" disabled={busy}>{busy ? 'One moment…' : mode === 'signup' ? 'Create Account' : 'Sign In'}</button>
      </form>
      <button className="text-button" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}>{mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}</button>
      <Link className="text-button" to="/curriculum">Explore As A Guest →</Link>
    </div></div>
  </main>;
}

// Every external reference in one place; lessons themselves do not link out.
export function Resources() {
  return <main className="page container narrow">
    <PageIntro eyebrow="Useful links" title="Papers, documentation and standards">The original sources and reference manuals behind the course, gathered in one place. Links open in a new tab.</PageIntro>
    {resources.map(g => <section key={g.group} className="resource-group">
      <h2 className="section-title">{g.group}</h2>
      <p className="section-dek">{g.note}</p>
      <ul className="resource-list">{g.items.map(r => <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer">
        <strong>{r.title} <span aria-hidden="true">↗</span></strong>
        {r.by && <small>{r.by}</small>}
        <span>{r.about}</span>
        <em>{r.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</em>
      </a></li>)}</ul>
    </section>)}
  </main>;
}

export function NotFound() {
  return <main className="page container narrow not-found"><PageIntro eyebrow="404" title="We couldn’t find that page."/><Link className="button primary" to="/curriculum">Browse The Curriculum →</Link></main>;
}

// Every interactive widget in one place, each linked to a lesson that uses it.
export function Lab() {
  const { user, plans } = useApp();
  const [filter, setFilter] = useState(''), [open, setOpen] = useState(null);
  const [params] = useSearchParams();
  const can = n => labUnlocked(n, plans);
  const unlockedCount = Object.keys(VIZ).filter(can).length;
  const [group, setGroup] = useState(() => ['ml', 'ai'].includes(params.get('track')) ? params.get('track') : 'all');
  const usedIn = vizUsage;
  const all = Object.keys(VIZ);
  const names = all.filter(n => (group === 'all' || labTrack(n) === group) && (n + ' ' + VIZ[n]).toLowerCase().includes(filter.toLowerCase()));
  const groups = [['all', 'All Labs', all.length], ...tracks.filter(t => t.id !== 'complete').map(t => [t.id, t.name, t.labs.length])];
  const label = n => n.replace(/-/g, ' ');
  const lessonsFor = n => (usedIn[n] || []).filter(id => lessonById[id]);
  // A link such as /lab#temperature opens that interactive straight away.
  useEffect(() => { const n = decodeURIComponent(location.hash.slice(1)); if (VIZ[n]) setOpen(n); }, []);
  return <main className="page container">
    <PageIntro eyebrow="Interactive lab" title="Play with every idea">{all.length} hands-on simulations from across the course. Pick a card to open it, then drag, step and break things; each one links to the lesson that explains it.</PageIntro>
    {unlockedCount < all.length && <div className="card lab-plan"><div><small>Lab access</small><h3>{unlockedCount} of {all.length} labs open</h3><p>{plans.length ? 'Your plan covers the labs in its track. Upgrade to the Complete track to open every lab.' : 'The Temperature lab is free to try. The others open when you buy a plan that includes them.'}</p></div><Link className="button primary" to="/pricing">See Plans →</Link></div>}
    <label className="search-box"><span aria-hidden="true">⌕</span><input placeholder="Find an interactive…" value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter interactives"/><small>{names.length} shown</small></label>
    <div className="chips lab-chips" role="group" aria-label="Filter labs by track">{groups.map(([id, name, n]) => <button key={id} className={group === id ? 'active' : ''} aria-pressed={group === id} onClick={() => setGroup(id)}>{name} <span>{n}</span></button>)}</div>
    {names.length === 0 && <p className="lab-empty">No lab matches your search in this group.</p>}
    <ul className="lab-grid">{names.map(n => {
      const lessons = lessonsFor(n);
      const ok = can(n);
      return <li key={n}><button className={'lab-card' + (ok ? '' : ' locked')} id={n} onClick={() => setOpen(n)} aria-haspopup="dialog">
        <span className="lab-card-top"><span className="lab-card-icon" style={{ '--h': (all.indexOf(n) * 47) % 360, '--delay': `${(all.indexOf(n) % 7) * -0.5}s` }}><LabIcon name={n}/></span><span className="lab-card-index">{String(all.indexOf(n) + 1).padStart(2, '0')}</span>{lessons[0] && <span className="lab-card-lesson">{labTrack(n) === 'ml' ? 'ML / DL' : 'AI'} · Lesson {lessonById[lessons[0]].num}</span>}</span>
        <strong>{label(n)}</strong>
        <span className="lab-card-desc">{VIZ[n]}</span>
        <span className="lab-card-open">{ok ? <>{FREE_LABS.includes(n) && !plans.length && <span className="lab-free">Free</span>}Open Interactive <span aria-hidden="true">→</span></> : <>🔒 Unlock With A Plan</>}</span>
      </button></li>;
    })}</ul>
    <Modal open={!!open} onClose={() => setOpen(null)} label={open ? label(open) : 'Interactive'} className="modal-wide lab-modal">
      {open && <>
        <div className="eyebrow">Interactive {String(all.indexOf(open) + 1).padStart(2, '0')} of {all.length}</div>
        <h2><span className="lab-card-icon" style={{ '--h': (all.indexOf(open) * 47) % 360 }}><LabIcon name={open}/></span>{label(open)}</h2>
        <p className="lab-modal-desc">{VIZ[open]}</p>
        {can(open) ? <Viz name={open}/> : <div className="lab-locked">
          <div className="lock-icon" aria-hidden="true">🔒</div>
          <h3>This lab is part of a paid plan</h3>
          <p>It opens with the <b>{trackById[labTrack(open)].name}</b> track or the <b>{trackById.complete.name}</b> track.{!user && ' If you already have a plan, sign in to use it.'}</p>
          <div className="cert-actions"><Link className="button primary" to="/pricing">See Plans</Link>{!user && ACCOUNTS && <Link className="button ghost" to="/account?mode=login">Sign In</Link>}<button className="button ghost" onClick={() => setOpen('temperature')}>Try The Free Lab</button></div>
        </div>}
        {lessonsFor(open).length > 0 && <div className="lab-used">Used in: {lessonsFor(open).slice(0, 4).map(id => <Link key={id} to={`/lesson/${id}`}>{lessonById[id].num} {lessonById[id].title}</Link>)}</div>}
      </>}
    </Modal>
  </main>;
}
