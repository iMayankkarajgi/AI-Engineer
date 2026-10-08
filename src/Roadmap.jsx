import React from 'react';
import { Link } from 'react-router-dom';
import { roadmapSteps, roadmapTotals, roadmapText } from './course/roadmap';
import { allLessons } from './course/curriculum';
import { PROGRAM } from './brand';

export default function Roadmap() {
  return <main className="page container narrow roadmap-page">
    <div className="page-intro">
      <div className="eyebrow">{PROGRAM} · Roadmap</div>
      <h1>{roadmapText.title}</h1>
      <p className="dek">{roadmapText.intro}</p>
    </div>
    <section className="legal-section"><h2>What does an AI engineer do?</h2>{roadmapText.what.map((t, i) => <p key={i}>{t}</p>)}<p>{roadmapText.versus}</p></section>
    <section className="legal-section"><h2>The skills an AI engineer needs</h2><p>{roadmapText.skills}</p></section>
    <section className="legal-section"><h2>The roadmap, step by step</h2>
      <ol className="roadmap-steps">{roadmapSteps.map((s, i) => <li key={i}>
        <h3><span>Step {i + 1}</span>{s.stage}</h3>
        {s.modules.map(m => <div key={m.id} className="card roadmap-module">
          <div className="roadmap-module-head"><Link to={`/module/${m.id}`}><strong>Module {m.number}: {m.title}</strong></Link><small>{m.lessons.length} lessons · about {m.hours} h</small></div>
          <p>{m.intro}</p>
          <ul>{m.lessons.map(l => <li key={l.id}><Link to={`/lesson/${l.id}`}>{l.num} {l.title}</Link></li>)}</ul>
        </div>)}
      </li>)}</ol>
    </section>
    <section className="legal-section"><h2>How long does it take to become an AI engineer?</h2>
      <p>The lessons, labs and quizzes on this roadmap add up to about {roadmapTotals.hours} hours of study. How long that takes depends on your pace:</p>
      <ul>{roadmapText.pace.map(([label, weeks]) => <li key={label}>At <b>{label}</b>: about <b>{weeks} weeks</b>.</li>)}</ul>
      <p>Building two or three projects of your own alongside the lessons adds time, and is what turns the knowledge into a skill you can show.</p>
    </section>
    <div className="guide-cta"><Link className="button primary" to={`/lesson/${allLessons[0].id}`}>Start With Lesson {allLessons[0].num} →</Link><Link className="button ghost" to="/curriculum">See The Full Curriculum</Link></div>
  </main>;
}
