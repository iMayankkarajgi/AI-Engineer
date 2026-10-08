import React from 'react';

// The Modern AI Engineering mark: an "M" drawn as a network of nodes, with a
// spark of intelligence rising between its two peaks. It takes the theme's
// accent colour, so it always matches the Sign In button.
export default function LogoMark({ className = 'logo-mark', size }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <rect width="64" height="64" rx="15" fill="var(--accent)"/>
    <g fill="var(--accent-ink)">
      <path d="M14 49V22l18 22 18-22v27" fill="none" stroke="var(--accent-ink)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="14" cy="22" r="4.6"/><circle cx="50" cy="22" r="4.6"/><circle cx="32" cy="44" r="4.6"/>
      <path d="M32 7l2.6 9.4L44 19l-9.4 2.6L32 31l-2.6-9.4L20 19l9.4-2.6z"/>
    </g>
  </svg>;
}
