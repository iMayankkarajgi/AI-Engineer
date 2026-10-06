import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { modules, allLessons, lessonById, moduleOf } from './course/curriculum';
import { useApp } from './app';
import Modal from './Modal';

// A pop-up with every lesson in the course, grouped by module, so a learner can
// open any lesson at any time instead of working back through the list.
export default function LessonPicker() {
  const { pickerOpen, setPickerOpen, completed, resumeLesson } = useApp();
  const { pathname } = useLocation();
  const [query, setQuery] = useState('');
  const current = pathname.startsWith('/lesson/') ? pathname.split('/')[2] : null;
  const close = () => setPickerOpen(false);
  useEffect(() => { if (!pickerOpen) setQuery(''); }, [pickerOpen]);
  useEffect(() => {
    if (!pickerOpen) return;
    const t = setTimeout(() => document.querySelector('.picker-modal li.current')?.scrollIntoView({ block: 'center' }), 60);
    return () => clearTimeout(t);
  }, [pickerOpen]);

  const term = query.trim().toLowerCase();
  const groups = modules.map(m => ({ m, lessons: m.lessons.filter(l => !term || `${l.num} ${l.title} ${(l.covers || []).join(' ')}`.toLowerCase().includes(term)) })).filter(g => g.lessons.length);
  const shown = groups.reduce((n, g) => n + g.lessons.length, 0);
  const focusModule = moduleOf(current || resumeLesson)?.id;
  const resume = lessonById[resumeLesson];

  return <Modal open={pickerOpen} onClose={close} label="All lessons" className="modal-wide picker-modal">
    <div className="eyebrow">Jump to any lesson</div>
    <h2>All {allLessons.length} lessons</h2>
    <p className="picker-dek">Every lesson is open. Read them in any order, and go back to any earlier lesson whenever you like. Your progress is kept either way.</p>
    {resume && <Link className="button primary picker-resume" to={`/lesson/${resumeLesson}`} onClick={close}>Continue: {resume.num} {resume.title} →</Link>}
    <label className="search-box"><span aria-hidden="true">⌕</span><input placeholder="Search lessons and topics…" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search lessons"/><small>{shown} lessons</small></label>
    <div className="picker-list">
      {groups.length === 0 && <p className="lab-empty">No lesson matches that search.</p>}
      {groups.map(({ m, lessons }) => {
        const done = m.lessons.filter(l => completed.includes(l.id)).length;
        return <details key={m.id} className="picker-module" open={!!term || m.id === focusModule} style={{ '--track': m.accent }}>
          <summary><span className="course-icon">{m.icon}</span><span className="picker-module-name"><small>Module {m.number}</small><strong>{m.title}</strong></span><span className="picker-count">{done}/{m.lessons.length}</span></summary>
          <ol>{lessons.map(l => <li key={l.id} className={(l.id === current ? 'current ' : '') + (completed.includes(l.id) ? 'done' : '')}>
            <Link to={`/lesson/${l.id}`} onClick={close} aria-current={l.id === current ? 'page' : undefined}>
              <span className="nav-index">{completed.includes(l.id) ? '✓' : l.num}</span><span>{l.title}</span>
            </Link>
          </li>)}</ol>
        </details>;
      })}
    </div>
  </Modal>;
}
