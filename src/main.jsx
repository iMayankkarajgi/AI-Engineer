import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './theme';
import { AppProvider, STATIC, useApp, takeAfterLogin } from './app';
import { Header, Footer, Curriculum, Module, Guide, Glossary, Faq, Dashboard, Account, NotFound, Lab } from './pages';
import LessonPage from './LessonPage';
import Profile from './Profile';
import './tokens.css';
import './site.css';
import './lesson.css';
import './blocks.css';
import './viz/viz.css';
import './cinematic.css';

const CinematicHome = React.lazy(() => import('./CinematicHome'));
// The editor is sizeable, so it loads only when the Practice page is opened.
const Practice = React.lazy(() => import('./practice/Practice'));
// The static build (a single shareable page) cannot rewrite URLs on the server,
// so it routes with the URL hash instead.
const Router = STATIC ? HashRouter : BrowserRouter;

// The home page and account page carry their own footer treatment.
function SiteFooter() {
  const { pathname } = useLocation();
  return pathname === '/' || pathname === '/account' ? null : <Footer/>;
}
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// Google sends the browser back to the app's entry URL. Once the session is
// loaded, continue to the page the learner was heading for; if Google or
// Supabase reported a problem instead, show it on the sign-in page.
function AfterLogin() {
  const { user } = useApp(), nav = useNavigate();
  useEffect(() => {
    const problem = new URLSearchParams(location.search).get('error_description');
    if (problem) { takeAfterLogin(); history.replaceState(null, '', location.pathname + location.hash); nav('/account', { replace: true, state: { error: problem } }); }
  }, []);
  useEffect(() => { if (user) { const to = takeAfterLogin(); if (to) nav(to, { replace: true }); } }, [user]);
  return null;
}

function App() {
  return <ThemeProvider><AppProvider><Router>
    <ScrollTop/>
    <AfterLogin/>
    <Header/>
    <React.Suspense fallback={<main className="page container"><div className="eyebrow">Loading…</div></main>}>
      <Routes>
        <Route path="/" element={<CinematicHome/>}/>
        <Route path="/curriculum" element={<Curriculum/>}/>
        <Route path="/roadmap" element={<Navigate to="/curriculum" replace/>}/>
        <Route path="/module/:id" element={<Module/>}/>
        <Route path="/lesson/:id" element={<LessonPage/>}/>
        <Route path="/guide" element={<Guide/>}/>
        <Route path="/lab" element={<Lab/>}/>
        <Route path="/practice" element={<Practice/>}/>
        <Route path="/glossary" element={<Glossary/>}/>
        <Route path="/faq" element={<Faq/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/account" element={<Account/>}/>
        <Route path="/profile" element={<Profile/>}/>
        <Route path="*" element={<NotFound/>}/>
      </Routes>
    </React.Suspense>
    <SiteFooter/>
  </Router></AppProvider></ThemeProvider>;
}

createRoot(document.getElementById('root')).render(<App/>);
