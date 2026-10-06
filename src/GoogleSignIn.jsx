import React, { useEffect, useRef } from 'react';
import { useApp } from './app';
import { useTheme } from './theme';

// Google's own sign-in button, run from this site instead of through Supabase's
// redirect, so the Google screen shows this site's name and not the Supabase
// address. The Google token is handed to Supabase, which creates the same
// account and session as before. Switched on by VITE_GOOGLE_CLIENT_ID; the
// client id is public by design. The site's address must be listed under
// "Authorized JavaScript origins" for that OAuth client in Google Cloud.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

let script;
const loadScript = () => script ||= new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) return resolve();
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client'; s.async = true;
  s.onload = resolve; s.onerror = () => { script = null; reject(new Error('Google sign-in could not load. Check your connection and try again.')); };
  document.head.appendChild(s);
});

const sha256Hex = async text => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)))].map(b => b.toString(16).padStart(2, '0')).join('');

export default function GoogleButton({ onError }) {
  const ref = useRef(null), { signInWithGoogleToken } = useApp(), { theme } = useTheme();
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        await loadScript();
        // Google signs the hash of this value into its token; Supabase checks the original.
        const nonce = crypto.randomUUID(), hashed = await sha256Hex(nonce);
        if (!live || !ref.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID, nonce: hashed, use_fedcm_for_prompt: true,
          callback: r => signInWithGoogleToken(r.credential, nonce).catch(e => onError(e.message)),
        });
        ref.current.replaceChildren();
        window.google.accounts.id.renderButton(ref.current, { type: 'standard', theme: theme === 'dark' ? 'filled_black' : 'outline', size: 'large', text: 'continue_with', shape: 'pill', logo_alignment: 'center', width: Math.min(400, Math.round(ref.current.getBoundingClientRect().width)) || 320 });
      } catch (e) { if (live) onError(e.message); }
    })();
    return () => { live = false; };
  }, [theme]);
  return <div ref={ref} className="google-gis" aria-label="Continue with Google"/>;
}
