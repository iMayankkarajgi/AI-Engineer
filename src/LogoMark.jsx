import React from 'react';

// The Modern AI Engineering mark: an "M" drawn as a network of nodes, with a
// spark of intelligence rising between its two peaks.
export default function LogoMark({ className = 'logo-mark', size }) {
  const id = React.useId().replace(/:/g, '');
  return <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2a1670"/><stop offset="1" stopColor="#0f0a2e"/></linearGradient>
      <linearGradient id={`${id}m`} x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#8f6bff"/><stop offset="1" stopColor="#5ee7ff"/></linearGradient>
      <radialGradient id={`${id}g`} cx=".5" cy=".28" r=".6"><stop offset="0" stopColor="#7a4df0" stopOpacity=".55"/><stop offset="1" stopColor="#7a4df0" stopOpacity="0"/></radialGradient>
    </defs>
    <rect width="64" height="64" rx="15" fill={`url(#${id}t)`}/>
    <rect width="64" height="64" rx="15" fill={`url(#${id}g)`}/>
    <path d="M14 49V22l18 22 18-22v27" fill="none" stroke={`url(#${id}m)`} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="14" cy="22" r="4.6" fill="#fff"/><circle cx="50" cy="22" r="4.6" fill="#fff"/><circle cx="32" cy="44" r="4.6" fill="#5ee7ff"/>
    <path d="M32 7l2.6 9.4L44 19l-9.4 2.6L32 31l-2.6-9.4L20 19l9.4-2.6z" fill="#fff"/>
  </svg>;
}
