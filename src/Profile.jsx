import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { modules, allLessons, lessonById } from './course/curriculum';
import { useApp, ACCOUNTS, CLOUD } from './app';
import Certificate from './Certificate';

const initials = name => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';

// Profile picture, falling back to initials when there is none or it fails to load.
export function Avatar({ user, size = 36 }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => { setBroken(false); }, [user.avatar]);
  return <span className="avatar" style={{ '--size': `${size}px` }} aria-hidden="true">
    {user.avatar && !broken ? <img src={user.avatar} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)}/> : initials(user.name)}
  </span>;
}

export function GoogleMark() {
  return <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.96 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33z"/>
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"/>
  </svg>;
}

export default function Profile() {
  const { user, ready, completed, scores, nextLesson, updateProfile, logout, syncError } = useApp(), nav = useNavigate();
  const [editing, setEditing] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState(false), [cert, setCert] = useState(false);
  useEffect(() => { if (ready && !user) nav(ACCOUNTS ? '/account' : '/dashboard', { replace: true }); }, [ready, user, nav]);
  if (!user) return <main className="page container narrow"><div className="eyebrow">Loading…</div></main>;

  const attempted = Object.keys(scores).length;
  const avg = attempted ? (Object.values(scores).reduce((a, b) => a + b, 0) / attempted).toFixed(1) : '–';
  const modulesDone = modules.filter(m => m.lessons.every(l => completed.includes(l.id))).length;
  const next = lessonById[nextLesson];
  const finished = allLessons.every(l => completed.includes(l.id));
  const joined = user.joined ? new Date(user.joined).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  async function save(e) {
    e.preventDefault(); setBusy(true); setError('');
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try { await updateProfile({ name: f.name.trim(), bio: f.bio.trim() }); setEditing(false); setSaved(true); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return <main className="page container narrow profile-page">
    <section className="card profile-card">
      <Avatar user={user} size={88}/>
      <div className="profile-id">
        <div className="eyebrow">Your profile</div>
        <h1>{user.name}</h1>
        <p className="profile-email">{user.email}</p>
        {user.bio && <p className="profile-bio">{user.bio}</p>}
        <div className="profile-tags">
          {user.provider === 'google' && <span className="profile-tag"><GoogleMark/>Signed in with Google</span>}
          {joined && <span className="profile-tag">Joined {joined}</span>}
          {CLOUD && <span className={'profile-tag ' + (syncError ? 'bad' : 'ok')} role="status">{syncError ? '⚠ Not synced' : '✓ Synced to your account'}</span>}
        </div>
      </div>
      {CLOUD && !editing && <button className="button ghost small" onClick={() => { setEditing(true); setSaved(false); }}>Edit Profile</button>}
    </section>
    {syncError && <div className="form-error" role="alert">{syncError}</div>}
    {saved && !editing && <div className="form-ok" role="status">Profile saved.</div>}

    {editing && <form className="card profile-form" onSubmit={save}>
      <h3>Edit profile</h3>
      <label>Display name<input name="name" defaultValue={user.name} required maxLength="80" autoComplete="name"/></label>
      <label>About you<textarea name="bio" defaultValue={user.bio} maxLength="280" rows="3" placeholder="What are you learning AI engineering for?"/></label>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="profile-form-actions">
        <button className="button primary" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
        <button type="button" className="button ghost" onClick={() => { setEditing(false); setError(''); }}>Cancel</button>
      </div>
    </form>}

    <div className="profile-stats">
      <div className="card stat"><small>Lessons passed</small><strong>{completed.length}<span> / {allLessons.length}</span></strong><div className="meter large"><span style={{ width: `${(completed.length / allLessons.length) * 100}%` }}/></div></div>
      <div className="card stat"><small>Modules finished</small><strong>{modulesDone}<span> / {modules.length}</span></strong><div className="meter large"><span style={{ width: `${(modulesDone / modules.length) * 100}%` }}/></div></div>
      <div className="card stat"><small>Average best score</small><strong>{avg}<span> / 5</span></strong><p>{attempted} quiz{attempted === 1 ? '' : 'zes'} attempted</p></div>
    </div>

    <section className="card profile-next">
      <div><small>Continue learning</small><h3>{next.num} {next.title}</h3></div>
      <Link className="button primary" to={`/lesson/${nextLesson}`}>Open Lesson →</Link>
    </section>

    <section className="card profile-cert">
      <div><small>Course certificate</small><h3>{finished ? 'You completed the course.' : 'Certificate Of Completion'}</h3>
        <p>{finished ? 'Your certificate is ready, with your name on it.' : `Pass all ${allLessons.length} lessons to unlock it. ${allLessons.length - completed.length} to go.`}</p></div>
      <button className={'button ' + (finished ? 'primary' : 'ghost')} disabled={!finished} onClick={() => setCert(true)}>{finished ? 'View Certificate' : '🔒 Certificate Locked'}</button>
    </section>
    {finished && <Certificate user={user} open={cert} onClose={() => setCert(false)}/>}

    <div className="account-link">
      <Link className="button ghost" to="/dashboard">My Learning</Link>
      <button className="button ghost" onClick={async () => { await logout(); nav('/'); }}>Sign Out</button>
    </div>
  </main>;
}
