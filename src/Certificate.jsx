import React, { useEffect, useState } from 'react';
import { modules, allLessons } from './course/curriculum';
import { CLOUD } from './app';
import { examQuestions } from './course/exam';
import { supabase } from './supabase';
import Modal from './Modal';
import { BRAND, PROGRAM } from './brand';

const longDate = d => d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

// Completion date: when the last quiz was passed, if the database knows it.
function useCompletionDate(user, open) {
  const [date, setDate] = useState(() => new Date());
  useEffect(() => {
    if (!open || !CLOUD) return;
    let live = true;
    supabase.from('lesson_progress').select('updated_at').eq('user_id', user.id).eq('passed', true).order('updated_at', { ascending: false }).limit(1)
      .then(({ data }) => { if (live && data?.[0]?.updated_at) setDate(new Date(data[0].updated_at)); });
    return () => { live = false; };
  }, [open, user.id]);
  return date;
}

export default function Certificate({ user, exam, open, onClose }) {
  const date = useCompletionDate(user, open);
  const id = `MAE-${date.getFullYear()}-${String(user.id).replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase()}`;
  return <Modal open={open} onClose={onClose} label="Certificate of completion" className="modal-wide cert-modal">
    <div className="cert-scroll" tabIndex="0"><div className="cert" role="img" aria-label={`Certificate of completion awarded to ${user.name} by ${BRAND} for the ${PROGRAM}, ${longDate(date)}`}>
      <div className="cert-frame">
        <div className="cert-brand"><span>✳</span> {BRAND}</div>
        <div className="cert-kicker">Certificate of Completion</div>
        <p className="cert-lead">This certifies that</p>
        <div className="cert-name">{user.name}</div>
        <div className="cert-rule"/>
        <p className="cert-text">has successfully completed the <b>{PROGRAM}</b>, passing all {allLessons.length} lessons across {modules.length} modules and the final examination, from machine-learning foundations to production AI systems.</p>
        <div className="cert-foot">
          <div><strong>{longDate(date)}</strong><small>Date of completion</small></div>
          <svg className="cert-seal" viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" strokeWidth=".8" strokeDasharray="2 3"/>
            <circle cx="60" cy="60" r="38" fill="currentColor" opacity=".1"/>
            <path d="M60 30 L64 52 L84 44 L68 60 L84 76 L64 68 L60 90 L56 68 L36 76 L52 60 L36 44 L56 52 Z" fill="currentColor"/>
          </svg>
          <div><strong>{id}</strong><small>Certificate ID</small></div>
        </div>
        <div className="cert-note">Final examination score: {exam} out of {examQuestions.length}. Issued by {BRAND} · modernaiengineering.com</div>
      </div>
    </div></div>
    <p className="cert-hint">Swipe sideways to see the whole certificate.</p>
    <div className="cert-actions">
      <button className="button primary" onClick={() => window.print()}>Print Or Save As PDF</button>
      <button className="button ghost" onClick={onClose}>Close</button>
    </div>
  </Modal>;
}
