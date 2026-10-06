import React from 'react';

// The Modern AI Engineering mark: an "M" drawn as a small network of connected nodes.
export default function LogoMark({ className = 'logo-mark', size }) {
  const id = React.useId();
  return <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7a4df0"/><stop offset="1" stopColor="#3a22a0"/></linearGradient></defs>
    <rect width="64" height="64" rx="15" fill={`url(#${id})`}/>
    <path d="M15 47V17l17 19 17-19v30" fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="15" cy="17" r="5" fill="#fff"/><circle cx="49" cy="17" r="5" fill="#fff"/><circle cx="32" cy="36" r="5.5" fill="#d9ccff"/>
  </svg>;
}
